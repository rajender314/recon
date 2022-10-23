import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { buildForm } from '@app/admin/admin.config';

@Component({
	selector: 'app-create-form',
	templateUrl: './create-form.component.html',
	styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	serverError: String = '';

	formConfig: Array<any> = [
		{ label: 'Product', key: 'products_id', type: 'select', multi: false, options: 'products', validations: { required: true }, default: '' },
		{ label: 'Service', key: 'services_id', type: 'select', multi: false, options: 'services', validations: { required: true }, default: '' },
		{ label: 'Cost Code', key: 'costcode_id', type: 'select', multi: false, options: 'costCodes', validations: { required: true }, default: '' },
		{ label: 'Status', key: 'status', type: 'none', default: true },
		{ label: 'Is Allow', key: 'is_allow', type: 'none', default: true }
	]

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateFormComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
	}

	createForm = () => {
		this.createFormGroup = this.fb.group(buildForm(this.formConfig))
	}

	// getter
	get f() { return this.createFormGroup.controls; }

	closeDialog = () => {
		this.dialogRef.close();
	}

	saveDetails = form => {
		this.submitted = true;
		this.serverError = '';
		if (form.valid) {
			this.submitted = false;
			if(this.data.flag) form.value = {...form.value, ...{form_duplicate: this.data.obj}};
			this.adminService.saveApi('saveForms', form.value)
				.then(response => {
					if (response.result.success) {
						if (response.result.data.status) {
							this.dialogRef.close({ success: true, data: response.result.data });
						}else {
							if(!response.result.data.status){
								this.serverError = response.result.data.message.trim();
							}
						}
					} else {
						this.serverError = response.result.data.trim();
					}
				})
		}
	}

	setForm = name => {
		this.createFormGroup.patchValue({
			name: name
		});
		this.createFormGroup.markAsDirty();
	}

}
