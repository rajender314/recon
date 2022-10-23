import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatChipInputEvent } from '@angular/material';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import { buildForm, updateForm } from '@app/admin/admin.config';

import { forkJoin } from 'rxjs';
import { ContactsService } from '@app/contacts/contacts.service';

import * as _ from 'lodash';

@Component({
	selector: 'app-add-dialog',
	templateUrl: './add-dialog.component.html',
	styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent implements OnInit {

	submitted: boolean = false;
	addContactForm: FormGroup;

	dropdowns: any = {};

	selecteAttribute: any = {};
	options: string[] = [];
	separatorKeysCodes: number[] = [186];

	constructor(
		private fb: FormBuilder,
		private contactsService: ContactsService,
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

	add(event: MatChipInputEvent): void {
		const input = event.input;
		const value = event.value;
		if ((value || '').trim()) {
			this.options.push(value.trim());
			this.addContactForm.patchValue({
				value: this.options
			}, { emitEvent: false })
		}
		if (input) {
			input.value = '';
		}
		this.addContactForm.markAsDirty();
	}

	remove(option: string): void {
		const index = this.options.indexOf(option);

		if (index >= 0) {
			this.options.splice(index, 1);
			this.addContactForm.patchValue({
				value: this.options
			}, { emitEvent: false });

			this.addContactForm.markAsDirty();
		}
	}

	createForm() {
		this.addContactForm = this.fb.group(buildForm(this.data.formFields));
		if (this.data.label == 'Custom Attribute') {
			let field = _.find(this.data.formFields, ['key', 'value'])
			this.addContactForm.controls.ui_element_id.valueChanges.subscribe(val => {
				this.options = [];
				if (val == '5b30e1b4c9a82919448c9400') {
					if (field) {
						field.label = 'Choices';
						field.type = 'chips';
						field.default = [];
						this.updateControl('value', field);
					}
				} else {
					if (field) {
						field.label = 'Values';
						field.type = 'text';
						field.default = '';
						this.updateControl('value', field);
					}
				}
			})
		}
		if (this.data.selectedRow) this.setForm(this.data.selectedRow);
	}

	updateControl(key, field) {
		const control = buildForm([field]);
		this.addContactForm.removeControl(key);
		this.addContactForm.addControl(key, new FormControl(control['value'][0]));
		if (this.data.selectedRow) {
			this.addContactForm.patchValue({
				value: this.data.selectedRow.value || []
			}, { emitEvent: false })
			if (typeof field.default == 'object') this.options = this.data.selectedRow.value;
		}
	}

	setForm(data) {
		this.addContactForm.patchValue(updateForm(this.data.formFields, data));
	}

	createObject() {
		this.data.apiCalls.map(api => {
			this.dropdowns[api.key] = [];
		})
	}

	getApiCalls() {
		let apiCalls = [];
		this.data.apiCalls.map(api => {
			apiCalls.push(this.contactsService.getApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					this.dropdowns[this.data.apiCalls[i].key] = o['result'].data.items;
				});
				if (!this.data.selectedRow)
					this.setDropDownDefaults();
			})
	}

	setDropDownDefaults() {
		this.data.formFields.map(o => {
			if (o.type == 'select') {
				this.addContactForm.patchValue({
					[o.key]: this.dropdowns[o.options][0].id
				}, { emitEvent: false });
			}
		});
		this.addContactForm.markAsPristine();
	}

	saveDetails(form) {
		this.submitted = true;
		if (form.valid) {
			form.value = { ...form.value, ...{ id: this.data.selectedRow ? this.data.selectedRow.id : '', org_id: this.data.org_id } };
			if (this.data.hasOwnProperty('order')) form.value.order_id = this.data.order;
			this.submitted = false;
			if (this.data.url) {
				this.contactsService.saveApi(this.data.url, form.value)
					.then(res => {
						if (res.result.success) {
							this.dialogRef.close({ success: true, data: res.result.data });
						}
					})
			} else {
				this.dialogRef.close({ success: true, data: form.value });
			}
		}
	}

}
