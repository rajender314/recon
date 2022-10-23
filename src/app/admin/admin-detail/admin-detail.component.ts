import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from "@app/shared/material/snackbar/snackbar.component";
import * as _ from 'lodash';

import { AdminService } from "@app/admin/admin.service";
import { SnackBarType } from "@app/shared/utility/types";
import { StatusList } from "@app/shared/utility/dummyJson";
import { Subscription } from 'rxjs';
import { buildForm, updateForm } from '@app/admin/admin.config';

@Component({
	selector: 'app-admin-detail',
	templateUrl: './admin-detail.component.html',
	styleUrls: ['./admin-detail.component.scss']
})
export class AdminDetailComponent implements OnChanges {

	@Input() config: any;
	@Input() isLoading: boolean;
	@Input() selectedItem: any;
	@Output() onUpdate = new EventEmitter();
	@Output() onBack = new EventEmitter();

	submitted: boolean = false;
	duplicateError: string = '';
	form: FormGroup;
	formFields: Array<any> = [];
	statusList: any[] = StatusList;

	subscription: Subscription;

	promise: any;

	constructor(
		private fb: FormBuilder,
		private snackbar: MatSnackBar,
		private adminService: AdminService
	) {
		this.subscription = adminService.onUpdate().subscribe(next => {
			if (next.flag == 'add') {
				this.openSnackBar(next.snackBar)
			}
		})
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	ngOnChanges(changes: SimpleChanges) {
		if(this.form){
			this.reset();
		}else {
			this.formFields = [...this.config.formFields];
			this.createForm();
			this.setForm();
		}
	}

	get f() { return this.form.controls; }

	createForm() {
		this.form = this.fb.group(buildForm(this.formFields));
	}

	setForm() {
		this.form.patchValue(updateForm(this.formFields, this.selectedItem));
	}

	reset() {
		this.form.reset(updateForm(this.formFields, this.selectedItem));
		this.form.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	save() {
		this.submitted = true;
		this.duplicateError = '';
		if (this.form.valid) {
			this.submitted = false;
			if (!this.promise) {
				this.promise = this.adminService.saveApi(this.config.save, this.form.value)
					.then(res => {
						this.promise = undefined;
						if (res.result.success) {
							this.openSnackBar({ status: 'success', msg: this.config.name + ' Updated Successfully' });

							this.form.markAsPristine();
							if(this.selectedItem['status'] != this.form.value['status']){
								this.onUpdate.emit({type: 'reload', data: res.result.data});
							}else{
								this.onUpdate.emit({type: 'data', data: res.result.data});
							}
						} else {
							this.duplicateError = res.result.data;
						}
					})
					.catch(err => {
						this.promise = undefined;
					})
			}
		}
	}

	openSnackBar(obj) {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this.snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

}
