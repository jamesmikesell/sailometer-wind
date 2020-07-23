import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-meter',
  templateUrl: './meter.component.html',
  styleUrls: ['./meter.component.scss']
})
export class MeterComponent implements OnInit {

  private serviceId = "e912fa38-f062-4609-b318-9a1fcf116a16";
  private characteristicId = "20beae71-b0f1-48e4-91c4-594339b68a2b";
  private decoder = new TextDecoder();
  turn = 0;

  constructor() { }

  ngOnInit(): void {
  }

  async initBt(): Promise<void> {
    let config: RequestDeviceOptions = {
      filters: [
        {
          namePrefix: "Sailometer Wind"
        }
      ]
    };


    try {
      let device = await navigator.bluetooth.requestDevice(config);
      console.log('Connecting to GATT Server...');
      let server = await device.gatt.connect();
      console.log('Getting Service...');
      let service = await server.getPrimaryService(this.serviceId);
      console.log('Getting Characteristic...');
      let characteristic = await service.getCharacteristic(this.characteristicId);
      await characteristic.startNotifications();
      console.log('> Notifications started');
      characteristic.addEventListener('characteristicvaluechanged', event => this.handleNotifications(event));
    } catch (error) {
      console.error(error);
    }
  }


  handleNotifications(event: Event): void {
    let value: DataView = (event.target as any).value;

    let message = this.decoder.decode(value);
    let parts = message.split("\t");

    let data = new SensorData();
    data.revolutions = Number(parts[1]);
    data.time = Number(parts[2]);
    data.angle = Number(parts[3]);

    this.turn = data.angle / 1000;
  }
}

class SensorData {
  revolutions: number;
  time: number;
  angle: number;
}
