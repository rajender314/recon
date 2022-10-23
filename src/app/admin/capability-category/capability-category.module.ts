import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapabilityCategoryComponent } from './capability-category.component';
import { ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SharedModule
  ],
  declarations: [CapabilityCategoryComponent]
})
export class CapabilityCategoryModule { }
