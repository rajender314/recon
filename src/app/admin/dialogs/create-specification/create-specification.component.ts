import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
	selector: 'app-create-specification',
	templateUrl: './create-specification.component.html',
	styleUrls: ['./create-specification.component.scss']
})
export class CreateSpecificationComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateSpecificationComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
	}

	createForm = () => {
		let controls = {};
		if(this.data.flag == 'auto_suggest') {
			controls['spec_id'] = this.data.spec_id;
			controls['id'] = '';
			controls['label'] = ['', Validators.required];
		}else {
			controls['label'] = ['', Validators.required];
			controls['ui_element_id'] = this.data.dropdowns ? this.data.dropdowns.UIElements[0].id : ''
		}
		controls['status'] = true;
		this.createFormGroup = this.fb.group(controls)
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
			form.value.type = this.data.specType;
			this.adminService.saveApi(this.data.api, form.value)
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
			label: name
		});
		this.createFormGroup.markAsDirty();
	}

}
