import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';

@Component({
	selector: 'app-delete',
	templateUrl: './delete.component.html',
	styleUrls: ['./delete.component.scss']
})
export class DeleteComponent implements OnInit {

	constructor(
		public adminService: AdminService,
		public dialogRef: MatDialogRef<DeleteComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
	}

	save() {
		this.adminService.saveApi(this.data.url, this.data.params)
			.then(res => {
				if (res.result.success) {
					this.dialogRef.close({ success: true, data: null })
				}
			})
	}

}
