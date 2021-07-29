import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, HostBinding, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from './service/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

  @HostBinding('class') componentCssClass: any;

  private destroy = new Subject<void>();


  constructor(
    public themeService: ThemeService,
    public overlayContainer: OverlayContainer
  ) {
    this.themeService.darkModeSubscription
      .pipe(takeUntil(this.destroy))
      .subscribe(darkMode => {
        this.setTheme(darkMode ? 'app-dark-theme' : 'app-light-theme');
      });
  }


  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  setTheme(theme: string): void {
    this.overlayContainer.getContainerElement().classList.add(theme);
    this.componentCssClass = theme;
  }
}
