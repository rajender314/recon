import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { CommonService } from '@app/common/common.service';

var APP: any = window['APP'];

@Component({
	selector: 'app-upload-invoice',
	templateUrl: './upload-invoice.component.html',
	styleUrls: ['./upload-invoice.component.scss']
})
export class UploadInvoiceComponent implements OnInit {

	isButtonEnable: boolean = false;
	isUploaded: boolean = false;
	serverMsg: string = '';
	files: Array<any> = [];
	uploadUrl = APP.api_url + 'uploadAttachments?container=po';
	uploader: FileUploader = new FileUploader({
		isHTML5: true,
		url: this.uploadUrl,
		// allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		// queueLimit: 5,
		maxFileSize: 18 * 1024 * 1024,
		autoUpload: false,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<UploadInvoiceComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {

		this.uploader.onAfterAddingFile = (item: FileItem) => {
			item['customType'] = item.file.name.split('.').pop();
			this.isButtonEnable = true;
			this.serverMsg = '';
		}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					let type = obj.result.data.original_name.split('.').pop();
					this.files.push({ ...obj.result.data, ...{ type: type } });
				}
			}

		this.uploader.onCompleteAll = () => {
			this.isButtonEnable = false;
			this.uploadInvoice();
		}
	}

	ngOnInit() {}

	getTotalSize(queue) {
		let total = 0;
		queue.map((item: FileItem) => {
			total += (item.file.size / 1024);
		})
		return total.toFixed(2);
	}

	uploadInvoice() {
		let attachments = [];
		this.files.map(file => {
			if (!file.isUpload) attachments.push({ filename: file.filename, original_name: file.original_name });
		});
		this._commonService.saveApi('savePoAttach', {
			attachments: attachments,
			jobs_po_id: this.data.jobs_po_id
		})
			.then(res => {
				if (res['result'].success) {
					this.isUploaded = true;
					this.files.map(file => {
						file.isUpload = true;
					});
					if (res['result'].data) this.serverMsg = 'Successfully Uploaded';
				} else {
					this.serverMsg = 'Unable to upload Invoices to this PO';
				}
			})
	}

	close() {
		this._dialogRef.close({ success: this.isUploaded });
	}

}
