import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericFormsComponent } from './generic-forms.component';
import { SharedModule } from '@app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SortablejsModule } from 'angular-sortablejs';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    SortablejsModule.forRoot({ animation: 150 })
  ],
  declarations: [GenericFormsComponent]
}) 
export class GenericFormsModule { }
