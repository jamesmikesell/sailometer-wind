import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InfoService } from 'src/app/service/info.service';
import { WIND_METER_CONFIG } from './meter-config';

@Component({
  selector: 'app-meter',
  templateUrl: './meter.component.html',
  styleUrls: ['./meter.component.scss']
})
export class MeterComponent implements OnInit, OnDestroy {

  private destroy = new Subject<void>();
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

  constructor(
    private infoService: InfoService
  ) { }

  ngOnInit(): void {
    let config = WIND_METER_CONFIG;
    config.valueText = "Click to Pair";
    config.highlights = this.highlights;

    this.dial = new RadialGauge(config).draw();

    this.infoService.connection
      .pipe(takeUntil(this.destroy))
      .subscribe(connected => {
        if (connected) {
          this.dial.update({ valueBox: false });
        } else {
          this.trueWindSpeedDisplay = "---";
          this.apparentWindSpeedDisplay = "---";
          this.dial.value = 0;
          this.dial.update({ valueBox: true });
          this.clearTrueWindAngle();
        }
      });

    this.infoService.windInfo
      .pipe(takeUntil(this.destroy))
      .subscribe(windInfo => {
        this.dial.value = windInfo.apparentWindAngleDegrees;
        this.apparentWindSpeedDisplay = windInfo.apparentWindSpeedKnots.toFixed(1);

        if (windInfo.trueWindSpeedKnots) {
          this.trueWindSpeedDisplay = windInfo.trueWindSpeedKnots.toFixed(1);

          let a = windInfo.trueWindAngleDegrees - 2.5;
          let b = windInfo.trueWindAngleDegrees + 2.5;
          this.trueWindMarker.from = Math.round(Math.min(a, b));
          this.trueWindMarker.to = Math.round(Math.max(a, b));
          this.dial.update({
            highlights: this.highlights
          });
        } else {
          this.clearTrueWindAngle();
        }
      });

    this.infoService.positionInfo
      .pipe(takeUntil(this.destroy))
      .subscribe(positionInfo => {
        this.groundSpeedDisplay = positionInfo.speedOverGroundKnots.toFixed(1);
        if (positionInfo.headingDegrees != null)
          this.headingDisplay = positionInfo.headingDegrees.toFixed(0);
        else
          this.headingDisplay = "---";
      });

  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async init(): Promise<void> {
    navigator.wakeLock.request("screen");
    this.infoService.init();
  }

  private clearTrueWindAngle(): void {
    this.trueWindSpeedDisplay = "---";
    this.trueWindMarker.from = 0;
    this.trueWindMarker.to = 0;
    this.dial.update({ highlights: this.highlights });
  }

}

