import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '@app/shared/shared.module';

import { CapabilitiesComponent } from '@app/admin/capabilities/capabilities.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SharedModule
  ],
  declarations: [CapabilitiesComponent]
})
export class CapabilitiesModule { }
