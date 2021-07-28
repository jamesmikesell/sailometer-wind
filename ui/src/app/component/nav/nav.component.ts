import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AppVersion } from 'src/app/app-version';
import { TitleService } from 'src/app/service/title.service';
import { FontSizeService } from 'src/app/service/font-size.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

  private breakpoints = [Breakpoints.Handset];
  version = AppVersion.VERSION;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(this.breakpoints)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    public fontService: FontSizeService,
    public titleService: TitleService
  ) { }

  closeIfMobile(drawer: any): void {
    if (this.breakpointObserver.isMatched(this.breakpoints))
      drawer.toggle();
  }

  increaseFont(amount: number): void {
    this.fontService.fontSize = Math.max(this.fontService.fontSize + amount, .1);
  }

}
