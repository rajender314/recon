import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { DesignationsComponent } from '@app/admin/designations/designations.component';

import { SharedModule } from '@app/shared/shared.module';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SharedModule
  ],
  declarations: [DesignationsComponent]
})
export class DesignationsModule { }
