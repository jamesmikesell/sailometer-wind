import { Component, OnInit, ViewChild } from '@angular/core';
import { RadialGauge } from '@biacsics/ng-canvas-gauges';

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
  private rpmPerKnot = 1;
  private pairMessage = "Click to Pair";

  @ViewChild("uxDial") private dial: RadialGauge;
  speed = this.pairMessage;
  log = "";

  constructor() { }

  ngOnInit(): void {
  }

  async initBt(): Promise<void> {
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
      device.addEventListener("gattserverdisconnected", event => this.disconnected(event));
      this.logToUi('Connecting to GATT Server...');
      let server = await device.gatt.connect();
      this.logToUi('Getting Service...');
      let service = await server.getPrimaryService(this.serviceId);
      this.logToUi('Getting Characteristic...');
      let characteristic = await service.getCharacteristic(this.characteristicId);
      await characteristic.startNotifications();
      this.logToUi('> Notifications started');
      characteristic.addEventListener('characteristicvaluechanged', event => this.handleNotifications(event));
    } catch (error) {
      this.logToUi(error);
    }
  }

  private logToUi(message: string): void {
    console.log(message);
    this.log += message + "\n";
  }

  private disconnected(event: Event): void {
    this.dial.value = 0;
    this.speed = this.pairMessage;
  }

  handleNotifications(event: Event): void {
    let value: DataView = (event.target as any).value;

    let message = this.decoder.decode(value);
    let parts = message.split("\t");

    let data = new SensorData();
    data.rotationInterval = Number(parts[1]);
    data.angle = Number(parts[2]);

    let angle = ((data.angle / 1000) * 360 - 180) - this.angleOffset;
    this.dial.value = angle;

    let rpm = 0;
    if (data.rotationInterval)
      rpm = 1 / (data.rotationInterval / 60000);

    //Having a character is necessary as without it, when speed gets to 0, the gauge will start displaying the wind angle instead
    this.speed = (rpm / this.rpmPerKnot).toFixed(1) + " k";
  }
}

class SensorData {
  angle: number;
  rotationInterval: number;
}
