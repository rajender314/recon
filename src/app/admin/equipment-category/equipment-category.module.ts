import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '@app/shared/shared.module';

import { EquipmentCategoryComponent } from '@app/admin/equipment-category/equipment-category.component';
import { SortablejsModule } from 'angular-sortablejs';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SharedModule,
    SortablejsModule.forRoot({ animation: 150 })
  ],
  declarations: [EquipmentCategoryComponent]
})
export class EquipmentCategoryModule { }
