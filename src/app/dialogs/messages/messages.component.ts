import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ApiCallBase } from '@app/shared/utility/config';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';
import { buildForm } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
	selector: 'app-messages',
	templateUrl: './messages.component.html',
	styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {

	promise: any;
	submitted: boolean = false;
	buttons = {
		yes: 'save',
		no: 'cancel'
	}

	dropdowns = {
		to: [],
		cc: [],
		jobFiles: []
	};

	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
	allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt'];
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedFileType: this.allowedFileType,
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	uploadData = {
		error: '',
		files: []
	}

	apiCalls: Array<ApiCallBase> = [
		// { key: 'to', url: 'getOrgContacts', method: 'get', params: { org_type: this.data.org_type || 2, org_id: this.data.org_id, is_email: true } },
		{ key: 'to', url: 'getPrePressUsers', method: 'get', params: { org_type: this.data.org_type || 2, org_id: this.data.org_id, jobs_id: this.data.jobs_id } },
		{ key: 'jobFiles', url: 'getFilesLists', responseKey: 'files', method: 'get', params: { jobs_id: this.data.jobs_id } },
		{ key: 'cc', url: 'getDropdownMaster', responseKey: 'users', method: 'get', params: { org_type: this.data.org_type || 2, org_id: this.data.org_id, master_type: 5 } }
	];

	formFields = [
		{ key: 'id', label: 'Id', type: 'none', settings: { required: true }, default: '' },
		{ key: 'to_emails', label: 'To', type: 'select', multi: true, options: 'to', validations: { required: true }, default: this.data.selected.prefill_data?this.data.selected.prefill_data:[] },
		{ key: 'cc', label: 'Cc', type: 'select', multi: true, options: 'to', default: [] },
		{ key: 'subject', label: 'Subject', type: 'text', default: null },
		{ key: 'message', label: 'Message', type: 'text', default: '' },
		{ key: 'file_ids', label: 'Attachments', type: 'select', multi: true, options: 'jobFiles', default: [] }
	];

	formGroup: FormGroup;

	constructor(
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private dialogRef: MatDialogRef<MessagesComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.buttons.yes = data.title;
		if (data.hasOwnProperty('buttons')) {
			this.buttons = { ...data.buttons };
		}

		this.uploader
			.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
				if (item.size >= options.maxFileSize) this.uploadData.error = 'Exceeds Max. Size';
				else this.uploadData.error = 'Invalid File Upload';
			}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					let type = obj.result.data.original_name.split('.').pop();
					this.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
					this.uploadData.error = '';
				}
			}
	}

	ngOnInit() {
		if (this.apiCalls.length) this.getApiCalls(this.apiCalls);
		this.createForm();
	}

	getApiCalls(arr) {
		let apiCalls = [];
		arr.map(api => {
			if (api.method == 'get')
				apiCalls.push(this._commonService.getApi(api.url, api.params))
			else if (api.method == 'post')
				apiCalls.push(this._commonService.saveApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					if (o['result'].success) {
						if (arr[i].responseKey) {
							this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
						} else {
							this.dropdowns[arr[i].key] = o['result'].data || [];
						}
					}
				});
			})
	}

	createForm() {
		this.formGroup = this._fb.group(buildForm(this.formFields));
		if (this.data.selected) this.formGroup.patchValue({
			id: this.data.selected.id
		})
	}

	onSubmit() {
		if (!this.promise) {console.log(this.formGroup, this.formGroup.value.file_ids, this.uploadData.files)
			console.log('check valid',this.formGroup.valid,this.formGroup.value.file_ids.length,this.uploadData.files.length,(this.formGroup.value.message && ((this.formGroup.value.message).trim()).length))
			this.submitted = true;
			if (this.formGroup.valid && (this.formGroup.value.file_ids.length || this.uploadData.files.length || (this.formGroup.value.message && ((this.formGroup.value.message).trim()).length))) {
				console.log('save form')
				// this._commonService.update({ type: 'overlay', action: 'start' });
				// this.submitted = false;
				// this.promise = this._commonService.saveApi('postToVendor', {
				// 	...this.formGroup.value,
				// 	attachment: this.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } }),
				// 	jobs_id: this.data.jobs_id,
				// })
				// 	.then(res => {
				// 		this.promise = undefined;
				// 		this._commonService.update({ type: 'overlay', action: 'stop' });
				// 		if (res['result'].success) this.dialogRef.close({ success: true, data: null });
				// 	})
				// 	.catch(err => {
				// 		this.promise = undefined;
				// 		this._commonService.update({ type: 'overlay', action: 'stop' });
				// 	})
			}
		}
	}

}
