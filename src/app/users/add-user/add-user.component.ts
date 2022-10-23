import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { UsersService } from '@app/users/users.service';

@Component({
	selector: 'app-add-user',
	templateUrl: './add-user.component.html',
	styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: string = '';

	constructor(
		private fb: FormBuilder,
		private userService: UsersService,
		private dialogRef: MatDialogRef<AddUserComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
	}

	createForm = () => {
		this.createFormGroup = this.fb.group({
			name: ['', Validators.required],
			status: true
		})
	}

	// getter
	get f() { return this.createFormGroup.controls; }

	closeDialog = () => {
		this.dialogRef.close();
	}

	saveDetails = (form) => {
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			this.userService.saveUserRole(form.value)
				.then(response => {
					if (response.result.success)
						this.dialogRef.close({ success: true, data: response.result.data });
					else
						this.duplicateError = response.result.data;
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
