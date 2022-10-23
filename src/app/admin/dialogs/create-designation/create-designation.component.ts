import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { AdminService } from "@app/admin/admin.service";

@Component({
	selector: 'app-create-designation',
	templateUrl: './create-designation.component.html',
	styleUrls: ['./create-designation.component.scss']
})
export class CreateDesignationComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';

	priceConfig: any = {
		prefix: '$',
		limit: 3,
		centsLimit: 2
	}

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateDesignationComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
	}

	createForm = () => {
		this.createFormGroup = this.fb.group({
			name: ['', Validators.required],
			status: [true, Validators.required],
			description: '',
			bill_rate: ['0.00', Validators.required],
			org_type: Number(this.data.org_type)
		})
	}

	// getter
	get f() { return this.createFormGroup.controls; }

	closeDialog = () => {
		this.dialogRef.close();
	}

	saveDetails = form => {

		this.submitted = true;
		this.duplicateError = '';

		if (form.valid) {
			this.submitted = false;
			form.value.bill_rate = form.value.bill_rate.replace('$', '');
			this.adminService.saveApi('addDesignations', form.value)
				.then(response => {
					if (response.result.success) {
						this.dialogRef.close({ success: true, data: response.result.data });
					} else {
						this.duplicateError = response.result.data;
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
