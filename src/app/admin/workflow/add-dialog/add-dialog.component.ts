import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { buildForm } from '@app/admin/admin.config';

@Component({
	selector: 'app-add-dialog',
	templateUrl: './add-dialog.component.html',
	styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent implements OnInit {

	submitted: boolean = false;
	dropdowns: any = {};
	addFormGroup: FormGroup

	constructor(
		private _commonService: CommonService,
		private _fb: FormBuilder,
		public dialogRef: MatDialogRef<AddDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.dropdowns = { ...this.dropdowns, ...data.dropdowns };
		this.createForm();
	}

	ngOnInit() {
		if (this.data.apiCalls) {
			this.createObject();
			this.getApiCalls();
		}
	}

	createForm() {
		this.addFormGroup = this._fb.group(buildForm(this.data.formFields));
	}

	createObject() {
		this.data.apiCalls.map(api => {
			this.dropdowns[api.key] = [];
		})
	}

	setDropDownDefaults() {
		this.data.formFields.map(o => {
			if (o.type == 'select') {
				this.addFormGroup.patchValue({
					[o.key]: this.dropdowns[o.options].length ? this.dropdowns[o.options][0].id : this.addFormGroup.controls[o.key].value 
				}, { emitEvent: false });
			}
		});
		this.addFormGroup.markAsPristine();
	}


	getApiCalls() {
		let apiCalls = [];
		this.data.apiCalls.map(api => {
			apiCalls.push(this._commonService.getApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					this.dropdowns[this.data.apiCalls[i].key] = o['result'].data;
				});
				if (!this.data.selectedRow)
					this.setDropDownDefaults();
			})
	}

	save(form) {
		this.submitted = true;
		if (form.valid) {
			this.submitted = false;
			if (this.data.url) {
				this._commonService.saveApi(this.data.url, { task_types: [form.value], type: 'add' })
					.then(res => {
						if (res['result'].success) {
							this.dialogRef.close({ success: true, data: res['result'].data });
						}
					})
			}
		}
	}

}
