import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { SuperAdminComponent } from './super-admin.component';
import { AgGridModule } from 'ag-grid-angular';
import { PixelKitModule } from 'pixel-kit';
import { MaterialModule } from '@app/shared/material/material.module';
import { DetailViewComponent } from './detail-view/detail-view.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SuperAdminComponent, DetailViewComponent],
  imports: [
    CommonModule,
    SuperAdminRoutingModule,
    AgGridModule.withComponents([]),
    PixelKitModule,
    MaterialModule,
    ReactiveFormsModule
  ]
})
export class SuperAdminModule { }
