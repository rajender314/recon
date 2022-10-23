import { Component, OnInit, Inject, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { ApiCallBase } from '@app/shared/utility/config';
import { forkJoin } from 'rxjs';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { FormGroup, FormBuilder } from '@angular/forms';
import { buildForm } from '@app/admin/admin.config';

import * as _ from 'lodash';
import * as _moment from 'moment';

var APP: any = window['APP'];
@Component({
	selector: 'app-send-estimate',
	templateUrl: './send-estimate.component.html',
	styleUrls: ['./send-estimate.component.scss']
})
export class SendEstimateComponent implements OnInit {

	@ViewChild('stepper') stepper: ElementRef;

	selectedIndex: Number = 0;
	subject: string = '';
	message: string = '';
	dropdowns = {
		to: [],
		cc: [],
		jobFiles: []
	};
	toIds: Array<any> = [];

	apiCalls: Array<ApiCallBase> = [
		{ key: 'to', url: 'getOrgContacts', method: 'get', params: { org_type: 2, org_id: this.data.job.org_id, is_email: true } },
		{ key: 'jobFiles', url: 'getFilesLists', responseKey: 'files', method: 'get', params: { jobs_id: this.data.jobs_id } },
		{ key: 'cc', url: 'getDropdownMaster', responseKey: 'users', method: 'get', params: { org_type: 2, org_id: this.data.job.org_id, master_type: 5, status: true, company_code: this.data.job.company_code } }
	];

	uploadData = {
		error: '',
		files: []
	}

	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	formFields = [
		{ key: 'id', label: 'Id', type: 'none', settings: { required: true }, default: '' },
		{ key: 'to', label: 'To', type: 'select', multi: true, options: 'to', validations: { required: true }, default: [] },
		{ key: 'cc', label: 'Cc', type: 'select', multi: true, options: 'cc', default: [] },
		{ key: 'subject', label: 'Subject', type: 'text', default: null },
		{ key: 'message', label: 'Message', type: 'text', default: null },
		{ key: 'files', label: 'Attachments', type: 'select', multi: true, options: 'jobFiles', default: [] }
	];

	sendEstimateForm: FormGroup;

	public state = {
		loader: true,
		downloadProgress: false,
		sendMailProgress: false
	}

	constructor(
		private _fb: FormBuilder,
		public dialogRef: MatDialogRef<SendEstimateComponent>,
		public _commonService: CommonService,
		public snackbar: MatSnackBar,
		@Inject(MAT_DIALOG_DATA) public data
	) {
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
		this.state.loader = false;
		if (this.apiCalls.length) this.getApiCalls(this.apiCalls);
		this.createForm();
	}

	close() {
		this.dialogRef.close();
	}

	stepperChange(ev) {
		this.selectedIndex = ev.selectedIndex;
		if(this.selectedIndex == 1) {
			var date = _moment().add(48, 'hours').format('MMM DD YYYY, hh:mm A');
			this.subject = 'Estimate for ' + this.data.job.job_title + ' ('+ this.data.job.job_no + ') - ' + this.data.selectedRevision; // this.data.estimateIds.length;
			this.message = 'Hello,\n\nPlease review the attachment(s) and contact Recon Dev User if you have any questions.You can approve any of the following Estimates within 48hrs (until '+ date +' CST)';
			this.sendEstimateForm.patchValue({
				subject: this.subject,
				message: this.message
			})
		}
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
		this.sendEstimateForm = this._fb.group(buildForm(this.formFields));
	}

	removeAttachment(i) {
		this.uploadData.files.splice(i, 1);
	}

	downloadEstimate() {
		this.state.loader = true;
		this.state.downloadProgress = true;
		this._commonService.saveApi('exportEstimate', {
			ids: this.data.estimateIds,
			jobs_id: this.data.jobs_id,
			type: 'download'
		}).then(res => {
			this.state.loader = false;
			this.state.downloadProgress = false;
			if (res['result'] && res['result'].success) {
				window.location.href = res['result'].link + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
				this.dialogRef.close({ success: true });
			}
		});
	}

	sendEstimate(form) {
		if(form.valid) {
			this.state.loader = true;
			this.state.sendMailProgress = true;
			this.toIds = [];
			const cc_ids = [];
			form.value.to.map(o => {
				const user = _.find(this.dropdowns.to, ['primary_email', o]);
				if(user) this.toIds.push(user.id);
			})
			form.value.cc.map(o => {
				const user = _.find(this.dropdowns.cc, ['primary_email', o]);
				if(user) cc_ids.push(user.id);
			})
			this._commonService.saveApi('exportEstimate', {
				ids: this.data.estimateIds,
				jobs_id: this.data.jobs_id,
				type: 'email',
				message_data: {
					to_ids: this.toIds,
					cc_ids: cc_ids,
					...form.value,
					attachment: this.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
				}
			}).then(res => {
				this.state.loader = false;
				this.state.sendMailProgress = false;
				if (res['result'] && res['result'].success) {
					this.snackbar.openFromComponent(SnackbarComponent, {
						data: { status: 'success', msg: 'Email Sent Successfully' },
						verticalPosition: 'top',
						horizontalPosition: 'right'
					});
					this.dialogRef.close({ success: true });
				}
			})
			.catch(err => {
				this.state.loader = false;
				this.state.sendMailProgress = false;
			})
		}
	}

}
