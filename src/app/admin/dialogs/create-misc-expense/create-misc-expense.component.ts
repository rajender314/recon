import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { AdminService } from "@app/admin/admin.service";

@Component({
	selector: 'app-create-misc-expense',
	templateUrl: './create-misc-expense.component.html',
	styleUrls: ['./create-misc-expense.component.scss']
})
export class CreateMiscExpenseComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateMiscExpenseComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
	}

	createForm = () => {
		this.createFormGroup = this.fb.group({
			name: ['', Validators.required],
			costcode_id: ['', Validators.required],
			status: true,
			types: 'Markup',
			rate: 0
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
			this.adminService.saveApi('saveMiscExpenses', form.value)
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
