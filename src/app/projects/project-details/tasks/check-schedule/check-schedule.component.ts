import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
	selector: 'app-check-schedule',
	templateUrl: './check-schedule.component.html',
	styleUrls: ['./check-schedule.component.scss']
})
export class CheckScheduleComponent implements OnInit {

	list: Array<any> = []

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<CheckScheduleComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if (data.list) this.list = [...this.data.list];
	}

	ngOnInit() {
	}

	save() {
		this._commonService.saveApi('updateTaskDueDate', this.data.params)
			.then(res => {
				if (res['result'].success) {
					this._dialogRef.close({ success: true, data: res['result'].data })
				}
			})
	}

	closeDialog() {
		this._dialogRef.close();
	}

}
