import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss']
})
export class DeleteComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DeleteComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

  saveOrganization = () => {
    this.dialogRef.close({ success: true });
	}

}
