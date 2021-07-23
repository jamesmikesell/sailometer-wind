import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MeterComponent } from './component/meter/meter.component';

const routes: Routes = [
  {
    path: "**",
    component: MeterComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
