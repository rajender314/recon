import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
	selector: 'app-confirmation',
	templateUrl: './confirmation.component.html',
	styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent implements OnInit {

	promise: any;
	buttons = {
		yes: '',
		no: 'cancel'
	};
	loader = false;
	constructor(
		private commonService: CommonService,
		private dialogRef: MatDialogRef<ConfirmationComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.buttons.yes = data.title;
		if (data.hasOwnProperty('buttons')) {
			this.buttons = { ...data.buttons };
		}
	}

	ngOnInit() {
	}

	remove(params?) {
		if (this.data.url) {
			if (!this.promise) {
				this.loader = true;
				if (this.data.method == 'post')
					this.promise = this.commonService.saveApi(this.data.url, params ? { ...this.data.params, ...params } : this.data.params);
				else if (this.data.method == 'get')
				    this.promise = this.commonService.getApi(this.data.url, params ? { ...this.data.params, ...params } : this.data.params);
			    else
					this.promise = this.commonService.deleteApi(this.data.url, params ? { ...this.data.params, ...params } : this.data.params);

				this.promise
					.then(res => {
						if (res['result'].success) {
							this.dialogRef.close({ success: true, data: { from: params ? 'no' : 'yes', result: res['result'].data } });
						} else {
							this.promise = undefined;
						}
						this.loader = false;
					}) 
					.catch(err => {
						this.promise = undefined;
						this.loader = false;
					})
			}
		} else {
			this.dialogRef.close({ success: true });
		}
	}

	closeDialog() {
		if (this.data.hasOwnProperty('cancelAction')) {
			this.remove({
				type: this.data.type = 'single'
			})
		} else
			this.dialogRef.close({ success: false });
	}

}
