import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsComponent } from './forms.component';
import { SharedModule } from '@app/shared/shared.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'ng2-select';

import { AgGridModule } from 'ag-grid-angular';
// import { NgxSortableModule } from 'ngx-sortable';
import { SortablejsModule } from "angular-sortablejs";
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';

import 'ag-grid-enterprise';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    InfiniteScrollModule,
    ReactiveFormsModule,
    SelectModule,
    AgGridModule.withComponents([]),
    // NgxSortableModule,
    SortablejsModule.forRoot({ animation: 150 }),
    ScrollToModule.forRoot()
  ],
  declarations: [FormsComponent]
})
export class FormsModule { }
