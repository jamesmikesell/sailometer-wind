import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FontSizeService {
  private readonly FONT_SIZE = "font-size";

  private _fontSize: number;

  get fontSize(): number { return this._fontSize; }
  set fontSize(val: number) {
    this._fontSize = val;
    localStorage.setItem(this.FONT_SIZE, "" + val);
  }

  constructor() {
    this._fontSize = Number(localStorage.getItem(this.FONT_SIZE) ?? 4.5);
  }
}
