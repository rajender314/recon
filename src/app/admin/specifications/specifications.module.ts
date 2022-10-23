import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecificationsComponent } from './specifications.component';
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
  declarations: [SpecificationsComponent]
})
export class SpecificationsModule { }
