import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { CostCodesComponent } from '@app/admin/cost-codes/cost-codes.component';

import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SharedModule
  ],
  declarations: [CostCodesComponent]
})
export class CostCodesModule { }
