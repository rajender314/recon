import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { checkedLength } from '@app/shared/utility/dummyJson';

@Component({
	selector: 'app-create-tasks',
	templateUrl: './create-tasks.component.html',
	styleUrls: ['./create-tasks.component.scss']
})
export class CreateTasksComponent implements OnInit {

	createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: string = '';
	scheduleName: string = '';

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateTasksComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.name) this.setForm(this.data.name);
		if (this.data.is_milestone == 1) this.scheduleName = 'Task';
		else this.scheduleName = this.data.milestone_type == 1 ? 'Project Milestone' : 'Vendor Milestone';
	}

	createForm = () => {
		this.createFormGroup = this.fb.group({
			name: ['', Validators.required],
			status: [true, Validators.required],
			description: '',
			org_type_id: this.fb.group({
				Ivie: [1],
				Client: [0],
				Vendor: [0]
			}),
			department_ids: this.fb.group(this.createDepartmentControls())
		})
	}

	createDepartmentControls = (data?) => {
		let departmentIds = {};
		this.data.dropdowns.departments.map(dept => {
			let indx = data ? data.department_ids.indexOf(dept.id) : -1;
			if (indx > -1) departmentIds[dept.id] = true;
			else departmentIds[dept.id] = false;
		})
		return departmentIds;
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
			form.value.is_milestone = this.data.is_milestone;
			form.value.department_ids = Object.keys(checkedLength(form.value.department_ids));
			if (this.data.is_milestone == 2) form.value.milestone_type = Number(this.data.milestone_type);
			this.adminService.saveApi('saveTasks', form.value)
			.then(response => {
				if (response.result.success) {
					this.dialogRef.close({ success: true, data: response.result.data[0] });
				} else {
					this.duplicateError = response.result.data.trim();
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
