import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-add-option',
  templateUrl: './add-option.component.html',
  styleUrls: ['./add-option.component.scss']
})
export class AddOptionComponent implements OnInit {

  state = {
    selectedOption: null
  }

  constructor(
    private dialogRef: MatDialogRef<AddOptionComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.state.selectedOption = this.data.options[this.data.options.length - 1].id;
  }

}
