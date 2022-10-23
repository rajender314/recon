import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDatepicker } from '@angular/material';
import { AgEditorComponent } from 'ag-grid-angular';

@Component({
  selector: 'app-date-cell-editor',
  template: `<pi-form-field [label]=" " class="date-field">
              <input #dateInput pi-input matInput [min]="minDate"
                [matDatepicker]="picker" (focus)="picker.open()"
                placeholder="Choose a date" readonly>
              <mat-datepicker-toggle matSuffix [for]="picker">
                <i class="pixel-icons icon-calendar"
                    matDatepickerToggleIcon></i>
              </mat-datepicker-toggle>
              <mat-datepicker #picker (selectedChanged)="onSelectChange($event)"></mat-datepicker>
            </pi-form-field>`,
  styles: []
})
export class DateCellEditorComponent implements AgEditorComponent, AfterViewInit {
  @ViewChild('picker', { read: MatDatepicker }) picker: MatDatepicker<Date>;
  params: any;
  value: any;
  minDate = new Date();
  constructor() { }

  ngAfterViewInit() {
    // this.picker.open();
  }

  isPopup(): boolean {
    return false;
  }

  isCancelBeforeStart(): boolean {
    return false;
  }

  isCancelAfterEnd(): boolean {
    return false;
  }

  agInit(params: any): void {
    this.params = params;
    this.value = params.value;
  }

  getValue(): string {
    return this.value;
  }

  onSelectChange(e): void {
    setTimeout(function () {
      this.params.stopEditing();
    }.bind(this));
  }


}
