import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as _moment from 'moment';

@Component({
	selector: 'app-request-approval',
	templateUrl: './request-approval.component.html',
	styleUrls: ['./request-approval.component.scss']
})
export class RequestApprovalComponent implements OnInit {

	submitted: boolean = false;
	currentDate = new Date();
	users: Array<any> = [];
	form: FormGroup;

	constructor(
		private _fb: FormBuilder,
		private _dialogRef: MatDialogRef<RequestApprovalComponent>,
		private _commonService: CommonService,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		this.getUsers();
	}

	createForm() {
		this.form = this._fb.group({
			id: this.data.po_id,
			request_id: [this.data.request_id || '', Validators.required],
			request_date: this.data.request_date || null
		})
	}

	getUsers() {
		this._commonService.getApi('desgnUsers', { org_type: 3, type: 'child' }).then(res => {
			this.users = res['result'].data;
		});
	}

	sendApproval(form: FormGroup) {
		this.submitted = true;
		if (form.valid) {
			this.submitted = false;
			form.value.request_date = _moment(form.value.request_date).format('YYYY-MM-DD HH:mm:ss');
			if(this.data.type && this.data.type=='edit'){
				form.value['type'] = 'edit';
			}
			this._commonService.saveApi('requestPoCost', form.value)
				.then(res => {
					if (res['result'].success) {
						this._dialogRef.close({ success: true, data: res['result'].data });
					}
				})
		}
	}

}
