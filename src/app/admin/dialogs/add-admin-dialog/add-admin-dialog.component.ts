import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MAX_ALIASES } from '@app/shared/utility/dummyJson';
import { buildForm } from '@app/admin/admin.config';

@Component({
	selector: 'app-add-admin-dialog',
	templateUrl: './add-admin-dialog.component.html',
	styleUrls: ['./add-admin-dialog.component.scss']
})
export class AddAdminDialogComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';
	serverError: String = '';
	maxAliases = MAX_ALIASES;
	aliasValidation: any = {};

	promise: any;

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<AddAdminDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
	}

	createForm = () => {
		this.createFormGroup = this.fb.group(buildForm(this.data.formFields));

		if (this.data.org_type)
			this.createFormGroup.addControl('org_type', new FormControl(Number(this.data.org_type)));

		if (this.data.flag == 'services')
			this.createDepartmentGroup(2);

		if (this.data.flag == 'products')
			this.createFormGroup.addControl('alias', this.fb.array([this.createAlias(this.randomId())]))

		if (this.data.flag == 'departments')
			this.createDepartmentGroup(false);
	}

	// getter
	get f() { return this.createFormGroup.controls; }

	get aliases() { return this.createFormGroup.get('alias') as FormArray }

	closeDialog = () => {
		this.dialogRef.close();
	}

	saveDetails = form => {
		this.submitted = true;
		this.duplicateError = '';
		let arr = [];
		if (this.data.flag == 'products') {
			form.value.alias.map((alias, indx) => {
				if (alias.name && alias.name.length)
					arr.push(alias);
			});
			form.value.alias = arr;
		}
		if (form.valid) {
			this.submitted = false;
			if (!this.promise) {
				this.promise = this.adminService.saveApi(this.data.apiCall, form.value)
					.then(response => {
						this.promise = undefined;
						if (response.result.success) {
							if (this.data.flag == 'products') {
								if (response.result.data.status) {
									this.dialogRef.close({ success: true, data: response.result.data.items });
								} else {
									this.aliasValidation = {};
									this.aliasValidation[response.result.data.items.id] = response.result.data.items.error_msg;
								}
							} else {
								this.dialogRef.close({ success: true, data: response.result.data });
							}
						} else {
							if (response.result.status_code == 401) {
								this.duplicateError = response.result.data;

							} else {
								this.serverError = response.result.data.trim();

							}

						}
					})
					.catch(err => {
						this.promise = undefined;
					})
			}
		}
	}

	setForm = name => {
		this.createFormGroup.patchValue({
			name: name
		});
		this.createFormGroup.markAsDirty();
	}

	createDepartmentGroup = (val) => {
		const controls = {};
		this.data.dropdowns.departments.map(dept => {
			controls[dept.id] = val
			
		})
		this.createFormGroup.setControl(
			'departments', this.fb.group(controls)
		);
	}

	createAlias = (data?) => {
		return this.fb.group({
			id: data.id || '',
			name: [data ? data.name : ''],
			status: [data ? data.status : true]
		})
	}

	clearAlias = () => {
		while (this.aliases.length != 0) {
			this.aliases.removeAt(0)
		}
	}

	randomId = () => {
		let rand = Math.random().toString().substr(5);
		let obj = {
			id: 'new_' + rand,
			name: '',
			status: true
		};
		return obj;
	}

	addControl = () => {

		if (this.aliases.length < MAX_ALIASES)
			this.aliases.push(this.createAlias(this.randomId()));
	}

	removeControl = indx => {
		if (this.aliases.length > 1)
			this.aliases.removeAt(indx);
	}

}
