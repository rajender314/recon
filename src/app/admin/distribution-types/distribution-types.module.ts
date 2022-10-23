import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { SharedModule } from '@app/shared/shared.module';
import { DistributionTypesComponent } from '@app/admin/distribution-types/distribution-types.component';
import { AgGridModule } from 'ag-grid-angular';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SharedModule,
    AgGridModule.withComponents([])
  ],
  declarations: [DistributionTypesComponent]
})
export class DistributionTypesModule { }
