import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigComponent } from './component/config/config.component';
import { MeterComponent } from './component/meter/meter.component';

const routes: Routes = [
  {
    path: "config",
    component: ConfigComponent
  },
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
