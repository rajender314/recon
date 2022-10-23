import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatAutocompleteSelectedEvent } from '@angular/material';

import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
@Component({
  selector: 'app-create-capability-category',
  templateUrl: './create-capability-category.component.html',
  styleUrls: ['./create-capability-category.component.scss']
})
export class CreateCapabilityCategoryComponent implements OnInit {
  @ViewChild('addUserInput') addUserInput: ElementRef;

	createFormGroup: FormGroup;
	submitted: boolean = false;
  duplicateError: string = '';
  
  constructor(
    private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<CreateCapabilityCategoryComponent>,
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
  
  get f() { return this.createFormGroup.controls; }
  
  closeDialog = () => {
    this.dialogRef.close();
  }

  saveDetails = form => {
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			this.adminService.saveApi('saveCapabilityCatg', form.value)
				.then(response => {
					if (response.result.success) {
						this.dialogRef.close({ success: true, data: response.result.data })
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
