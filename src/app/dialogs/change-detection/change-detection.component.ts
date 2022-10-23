import { Component, OnInit, Inject } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
	selector: 'app-change-detection',
	templateUrl: './change-detection.component.html',
	styleUrls: ['./change-detection.component.scss']
})
export class ChangeDetectionComponent implements OnInit {

	constructor(
		private _commonService: CommonService,
		private dialogRef: MatDialogRef<ChangeDetectionComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
	}


	performAction(flag) {
		this.dialogRef.close({ status: flag });
	}

}
