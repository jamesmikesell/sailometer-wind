import { Component, OnInit } from '@angular/core';
import { WIND_METER_CONFIG } from './meter-config';

@Component({
  selector: 'app-meter',
  templateUrl: './meter.component.html',
  styleUrls: ['./meter.component.scss']
})
export class MeterComponent implements OnInit {

  private serviceId = "e912fa38-f062-4609-b318-9a1fcf116a16";
  private characteristicId = "20beae71-b0f1-48e4-91c4-594339b68a2b";
  private decoder = new TextDecoder();
  private angleOffset = 15.4;
  private rpmPerKnot = 22.7375;
  private groundSpeed: number;
  private dial: Gauge;
  private trueWindMarker = {
    from: -2.5,
    to: 2.5,
    color: "rgba(255, 255, 0, 1)"
  };
  private highlights = [
    {
      from: -45,
      to: 0,
      color: "rgba(255, 0, 0, .3)"
    }, {
      from: 0,
      to: 45,
      color: "rgba(0, 255, 0, .3)"
    },
    this.trueWindMarker
  ];

  groundSpeedDisplay = "---";
  headingDisplay = "---";
  trueWindSpeedDisplay = "---";
  apparentWindSpeedDisplay = "---";

  constructor() { }

  ngOnInit(): void {
    let config = WIND_METER_CONFIG;
    config.valueText = "Click to Pair";
    config.highlights = this.highlights;

    this.dial = new RadialGauge(config).draw();
  }

  async init(): Promise<void> {
    await this.initBt();
    this.initGps();
    navigator.wakeLock.request("screen");
  }

  private initGps(): void {
    let options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0
    };

    navigator.geolocation.watchPosition(position => this.handlePosition(position), undefined, options);
  }

  private handlePosition(position: Position): void {
    let knotsPerMeterPerSecond = 1.94384;
    this.groundSpeed = position.coords.speed * knotsPerMeterPerSecond;
    this.groundSpeedDisplay = this.groundSpeed.toFixed(1);
    if (position.coords.heading != null)
      this.headingDisplay = position.coords.heading.toFixed(0);
    else
      this.headingDisplay = "---";
  }

  private async initBt(): Promise<void> {
    let config: RequestDeviceOptions = {
      filters: [
        {
          namePrefix: "Sailometer Wind"
        }
      ],
      optionalServices: [this.serviceId]
    };


    try {
      let device = await navigator.bluetooth.requestDevice(config);
      this.dial.update({ valueBox: false });
      device.addEventListener("gattserverdisconnected", event => this.bluetoothDisconnected(event));
      this.log('Connecting to GATT Server...');
      let server = await device.gatt.connect();
      this.log('Getting Service...');
      let service = await server.getPrimaryService(this.serviceId);
      this.log('Getting Characteristic...');
      let characteristic = await service.getCharacteristic(this.characteristicId);
      await characteristic.startNotifications();
      this.log('> Notifications started');
      characteristic.addEventListener('characteristicvaluechanged', event => this.handleBluetoothNotification(event));
    } catch (error) {
      this.dial.update({ valueBox: true });
      this.log(error);
    }
  }

  private log(message: string): void {
    console.log(message);
  }

  private bluetoothDisconnected(event: Event): void {
    this.trueWindSpeedDisplay = "---";
    this.apparentWindSpeedDisplay = "---";
    this.dial.value = 0;
    this.dial.update({ valueBox: true });
    this.clearTrueWindAngle();
  }

  private handleBluetoothNotification(event: Event): void {
    let value: DataView = (event.target as any).value;

    let message = this.decoder.decode(value);
    let parts = message.split("\t");

    let rotationInterval = Number(parts[1]);
    let angleRaw = Number(parts[2]);

    let apparentWindAngle = ((angleRaw / 1000) * 360 - 180) - this.angleOffset;
    this.dial.value = apparentWindAngle;

    let rpm = 0;
    if (rotationInterval)
      rpm = 1 / (rotationInterval / 60000);

    let apparentWindSpeed = (rpm / this.rpmPerKnot);
    this.apparentWindSpeedDisplay = apparentWindSpeed.toFixed(1);


    if (this.groundSpeed != null) {
      let trueWind = TrueWindCalculations.calculateTrueWind(apparentWindSpeed, apparentWindAngle, this.groundSpeed);
      if (!isNaN(trueWind.trueWindSpeed)) {
        this.trueWindSpeedDisplay = trueWind.trueWindSpeed.toFixed(1);
        let a = trueWind.trueWindAngle - 2.5;
        let b = trueWind.trueWindAngle + 2.5;
        this.trueWindMarker.from = Math.round(Math.min(a, b));
        this.trueWindMarker.to = Math.round(Math.max(a, b));
        this.dial.update({
          highlights: this.highlights
        });
      } else {
        this.clearTrueWindAngle();
      }
    } else {
      this.clearTrueWindAngle();
    }
  }

  private clearTrueWindAngle(): void {
    this.trueWindSpeedDisplay = "---";
    this.trueWindMarker.from = 0;
    this.trueWindMarker.to = 0;
    this.dial.update({ highlights: this.highlights });
  }
}

class TrueWind {
  constructor(
    public trueWindSpeed: number,
    public trueWindAngle: number
  ) { }
}

class TrueWindCalculations {
  static calculateTrueWind(apparentWindSpeed: number, apparentWindAngle: number, groundSpeed: number): TrueWind {
    if (apparentWindAngle === 0) {
      let trueWindSpeed = apparentWindSpeed - groundSpeed;
      let trueWindAngle = 0;
      return new TrueWind(trueWindSpeed, trueWindAngle);
    }
    if (Math.abs(apparentWindAngle) === 180) {
      let trueWindSpeed = apparentWindSpeed + groundSpeed;
      let trueWindAngle = 180;
      return new TrueWind(trueWindSpeed, trueWindAngle);
    }

    let aws = apparentWindSpeed;
    let awa = (180 - Math.abs(apparentWindAngle)) * Math.PI / 180;
    let sog = groundSpeed;
    let trueWindSpeed = (aws / Math.sin(awa)) * Math.sin(Math.PI - awa - Math.asin(sog * Math.sin(awa) / aws));
    /**
     * Solving for true wind in certain circumstances can result in 2 plausible speeds... I don't think the second value is
     * value, however this would be how it's calculated
     *
     * let trueWindSpeed2 = (aws / Math.sin(awa)) * Math.sin(Math.asin(sog * Math.sin(awa) / aws) - awa);
     */

    let trueWindAngle = (Math.asin(Math.sin(awa) / aws * sog) / Math.PI * 180) + Math.abs(apparentWindAngle);
    if (apparentWindAngle < 0)
      trueWindAngle = trueWindAngle * -1;

    return new TrueWind(trueWindSpeed, trueWindAngle);
  }
}
