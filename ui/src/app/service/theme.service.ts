import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME = "THEME";

  public darkModeSubscription = new BehaviorSubject<boolean>(null);

  get darkMode(): boolean { return this.darkModeSubscription.value; }
  set darkMode(val: boolean) {
    localStorage.setItem(this.THEME, "" + val);
    this.darkModeSubscription.next(val);
  }


  constructor() {
    this.darkMode = (localStorage.getItem(this.THEME) ?? "true") === "true";
  }
}
