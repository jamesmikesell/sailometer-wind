import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TitleService {

  private _title: string;

  set title(title: string) {
    setTimeout(() => {
      this._title = title;
    }, 0);
  }
  get title(): string {
    return this._title;
  }

  constructor() { }
}
