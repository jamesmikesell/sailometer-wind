import { Component, OnInit } from '@angular/core';
import { InfoService } from 'src/app/service/info.service';
import { TitleService } from 'src/app/service/title.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  // eslint-disable-next-line id-blacklist
  Number = Number;

  constructor(
    public infoService: InfoService,
    private titleService: TitleService
  ) { }

  ngOnInit(): void {
    this.titleService.title = "Configuration";
  }

  center(): void {
    this.infoService.setCenterWindAngle();
  }

  useObserved(): void {
    this.infoService.aMax = this.infoService.aMaxObserved;
    this.infoService.bMax = this.infoService.bMaxObserved;
    this.infoService.aMin = this.infoService.aMinObserved;
    this.infoService.bMin = this.infoService.bMinObserved;
  }

  clearSettings(): void {
    localStorage.clear();
  }
}
