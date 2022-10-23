import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { AdminService } from "@app/admin/admin.service";

@Component({
	selector: 'app-create-dialog',
	templateUrl: './create-dialog.component.html',
	styleUrls: ['./create-dialog.component.scss']
})
export class CreateDialogComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';
	ajaxSpinner: boolean = false;

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateDialogComponent>,
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
			gl_income: '',
			gl_expense: '',
			category_id: this.data.dropdowns.categories[0].id,
			cost_code_type: this.data.dropdowns.types[0].id,
			cost_code_tax_type: '', //this.data.dropdowns.taxTypes[0].id
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
			this.ajaxSpinner = true;
			this.adminService.saveApi('saveCostCodes', form.value)
				.then(response => {
					this.ajaxSpinner = false;
					if (response.result.success) {
						this.dialogRef.close({ success: true, data: response.result.data });
					} else {
						
						this.duplicateError = response.result.data.trim();
					}
				}, () => this.ajaxSpinner = false)
		}
	}

	setForm = name => {
		this.createFormGroup.patchValue({
			name: name
		});
		this.createFormGroup.markAsDirty();
	}

}
