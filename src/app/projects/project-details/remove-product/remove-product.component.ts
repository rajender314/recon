import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
	selector: 'app-remove-product',
	templateUrl: './remove-product.component.html',
	styleUrls: ['./remove-product.component.scss']
})
export class RemoveProductComponent implements OnInit {

	promise: any;

	constructor(
		private commonService: CommonService,
		private dialogRef: MatDialogRef<RemoveProductComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
	}

	remove() {
		if (this.data.url) {
			if (!this.promise) {
				this.promise = this.commonService.saveApi(this.data.url, this.data.params)
					.then(res => {
						if (res['result'].success) {
							this.dialogRef.close({ success: true });
						} else {
							this.promise = undefined;
						}
					})
					.catch(err => {
						this.promise = undefined;
					})
			}
		} else {
			this.dialogRef.close({ success: true });
		}
	}

	closeDialog() {
		this.dialogRef.close({ success: false });
	}

}
