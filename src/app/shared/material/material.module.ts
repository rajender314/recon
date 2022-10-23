import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatMenuModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatProgressSpinnerModule,
  MatListModule,
  MatSelectModule,
  MatBadgeModule,
  MatDialogModule,
  MatSnackBarModule,
  MatChipsModule,
  MatAutocompleteModule,
  MatCheckboxModule,
  MatRadioModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatCardModule,
  MatDatepickerModule,
  MAT_DATE_FORMATS,
  MatSliderModule,
  MatTooltipModule,
  MatExpansionModule,
  MatStepperModule,
  MatProgressBarModule
} from '@angular/material';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from "@angular/material";
import { SnackbarComponent } from './snackbar/snackbar.component';


import { DateAdapter, NativeDateAdapter } from '@angular/material';
import * as moment from 'moment';

import { DragDropModule } from '@angular/cdk/drag-drop';

import { OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { ScrollDispatchModule } from '@angular/cdk/scrolling';

import { OwlMomentDateTimeModule } from 'ng-pick-datetime-moment';

export class MyDateAdapter extends NativeDateAdapter {

  format(date: Date, displayFormat: Object): string {

    return moment(date).format('MMM Do, YYYY');
  }
}

const MY_DATE_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' }
  },
  display: {
    // dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  }
};

const MY_MOMENT_FORMATS = {
  parseInput: 'll LT',
  fullPickerInput: 'll LT',
  datePickerInput: 'll',
  timePickerInput: 'LT',
  monthYearLabel: 'MMM YYYY',
  dateA11yLabel: 'll',
  monthYearA11yLabel: 'MMMM YYYY',
};

@NgModule({
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatSelectModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCardModule,
    MatDatepickerModule,
    MatSliderModule,
    MatTooltipModule,
    MatExpansionModule,
    MatStepperModule,
    MatProgressBarModule,

    DragDropModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    OwlMomentDateTimeModule,

    ScrollDispatchModule
  ],
  declarations: [SnackbarComponent],
  exports: [
    MatMenuModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatSelectModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCardModule,
    MatDatepickerModule,
    MatSliderModule,
    MatTooltipModule,
    MatExpansionModule,
    MatStepperModule,
    MatProgressBarModule,

    DragDropModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,

    ScrollDispatchModule
  ],
  entryComponents: [SnackbarComponent],
  providers: [
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 1500 } },
    { provide: DateAdapter, useClass: MyDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: OWL_DATE_TIME_FORMATS, useValue: MY_MOMENT_FORMATS },
  ]
})
export class MaterialModule { }
