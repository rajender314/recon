import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { trigger, transition, animate, style } from '@angular/animations'; 

@Component({
  selector: 'app-import-project-data',
  templateUrl: './import-project-data.component.html',
  styleUrls: ['./import-project-data.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({transform: 'translateX(100%)'}),
        animate('600ms ease', style({transform: 'translateX(0%)'}))
      ]),
      transition(':leave', [
        animate('600ms ease', style({transform: 'translateX(100%)'}))
      ])
    ])
  ]
})
export class ImportProjectDataComponent implements OnInit {

  isVisible: boolean = false;
  jobNumber = '';

  constructor(
    private dialogRef: MatDialogRef<ImportProjectDataComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {

  }

  goToLink() {
    this.isVisible = true;
  }

  goBack(){
    this.isVisible = false;
  }

}
