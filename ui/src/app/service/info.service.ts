import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InfoService {

  private serviceId = "e912fa38-f062-4609-b318-9a1fcf116a16";
  private characteristicId = "20beae71-b0f1-48e4-91c4-594339b68a2b";
  private decoder = new TextDecoder();
  private groundSpeed: number;
  private unadjustedSensorAngle: number;


  connection = new BehaviorSubject<boolean>(false);
  windInfo = new Subject<WindInfo>();
  positionInfo = new Subject<PositionInfo>();
  aMax = 2600;
  aMin = 1280;
  bMax = this.aMax;
  bMin = this.aMin;
  aMaxObserved = 0;
  aMinObserved = Number.MAX_VALUE;
  bMaxObserved = 0;
  bMinObserved = Number.MAX_VALUE;
  angleOffset = 15.4;


  constructor() { }


  async init(): Promise<void> {
    if (this.connection.value)
      return;

    await this.initBt();
    this.initGps();
  }


  setCenterWindAngle(): void {
    this.angleOffset = this.unadjustedSensorAngle;
  }

  private handleBluetoothNotification(event: Event): void {
    let windInfo = new WindInfo();
    let value: DataView = (event.target as any).value;

    let message = this.decoder.decode(value);
    let parts = message.split("\t");

    let rotationInterval = Number(parts[1]);
    let rotationSensorA = Number(parts[2]);
    let rotationSensorB = Number(parts[3]);

    this.aMaxObserved = Math.max(rotationSensorA, this.aMaxObserved);
    this.bMaxObserved = Math.max(rotationSensorB, this.bMaxObserved);
    this.aMinObserved = Math.min(rotationSensorA, this.aMinObserved);
    this.bMinObserved = Math.min(rotationSensorB, this.bMinObserved);

    let angleRaw = this.analogSensorToDegrees(rotationSensorA, rotationSensorB);

    this.unadjustedSensorAngle = ((angleRaw / 1000) * 360 - 180);
    let apparentWindAngle = this.unadjustedSensorAngle - this.angleOffset;
    windInfo.apparentWindAngleDegrees = apparentWindAngle;


    let rpm = 0;
    if (rotationInterval)
      rpm = 1 / (rotationInterval / 60000);

    let rpmPerKnot = 22.7375;
    let apparentWindSpeed = (rpm / rpmPerKnot);
    windInfo.apparentWindSpeedKnots = apparentWindSpeed;



    if (this.groundSpeed != null) {
      let trueWind = TrueWindCalculations.calculateTrueWind(apparentWindSpeed, apparentWindAngle, this.groundSpeed);
      if (!isNaN(trueWind.trueWindSpeed)) {
        windInfo.trueWindSpeedKnots = trueWind.trueWindSpeed;
        windInfo.trueWindAngleDegrees = trueWind.trueWindAngle;
      }
    }

    this.windInfo.next(windInfo);
  }

  private analogSensorToDegrees(a: number, b: number): number {
    let aMid = (this.aMax + this.aMin) / 2;
    let bMid = (this.bMax + this.bMin) / 2;
    let aAmplitude = this.aMax - aMid;
    let bAmplitude = this.bMax - bMid;

    a = (a - aMid) / aAmplitude;
    b = (b - bMid) / bAmplitude;

    let radians = Math.atan(a / b) / Math.PI;

    let angle: number;
    // Quadrants
    // 4 1
    // 3 2
    if (b >= 0) {
      //quad 1 or 4
      if (a >= 0) {
        //quad 1
        angle = radians;
      }
      else {
        //quad 4
        angle = 2 + radians;
      }
    }
    else {
      //quad 2 or 3
      angle = 1 + radians;
    }

    return (angle * 1000 / 2);
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
      this.connection.next(true);
      let device = await navigator.bluetooth.requestDevice(config);
      device.addEventListener("gattserverdisconnected", event => this.bluetoothDisconnected(event));
      console.log('Connecting to GATT Server...');
      let server = await device.gatt.connect();
      console.log('Getting Service...');
      let service = await server.getPrimaryService(this.serviceId);
      console.log('Getting Characteristic...');
      let characteristic = await service.getCharacteristic(this.characteristicId);
      await characteristic.startNotifications();
      console.log('> Notifications started');
      characteristic.addEventListener('characteristicvaluechanged', event => this.handleBluetoothNotification(event));
    } catch (error) {
      this.connection.next(false);
      console.log(error);
    }
  }


  private initGps(): void {
    let options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0
    };

    navigator.geolocation.watchPosition(position => this.handlePosition(position), undefined, options);
  }


  private bluetoothDisconnected(event: Event): void {
    this.connection.next(false);
  }


  private handlePosition(position: GeolocationPosition): void {
    let knotsPerMeterPerSecond = 1.94384;
    this.groundSpeed = position.coords.speed * knotsPerMeterPerSecond;

    let positionInfo = new PositionInfo(this.groundSpeed, position.coords.heading);
    this.positionInfo.next(positionInfo);
  }
}



export class WindInfo {
  constructor(
    public apparentWindAngleDegrees?: number,
    public apparentWindSpeedKnots?: number,
    public trueWindAngleDegrees?: number,
    public trueWindSpeedKnots?: number,
  ) { }
}



export class PositionInfo {
  constructor(
    public speedOverGroundKnots?: number,
    public headingDegrees?: number,
  ) { }
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
     * valid, however this would be how it's calculated
     *
     * let trueWindSpeed2 = (aws / Math.sin(awa)) * Math.sin(Math.asin(sog * Math.sin(awa) / aws) - awa);
     */

    let trueWindAngle = (Math.asin(Math.sin(awa) / aws * sog) / Math.PI * 180) + Math.abs(apparentWindAngle);
    if (apparentWindAngle < 0)
      trueWindAngle = trueWindAngle * -1;

    return new TrueWind(trueWindSpeed, trueWindAngle);
  }
}
