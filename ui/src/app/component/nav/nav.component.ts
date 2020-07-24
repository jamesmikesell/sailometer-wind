import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

  private breakpoints = [Breakpoints.Handset];
  version = environment.version

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(this.breakpoints)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver) { }

  closeIfMobile(drawer: any): void {
    if (this.breakpointObserver.isMatched(this.breakpoints))
      drawer.toggle();
  }

}
