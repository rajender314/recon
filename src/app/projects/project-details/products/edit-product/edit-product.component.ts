import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

import { AddOptionComponent } from '@app/projects/project-products/add-option/add-option.component';
import { AddSpecDialogComponent } from '@app/dialogs/add-spec-dialog/add-spec-dialog.component';

import * as _ from 'lodash';
import { objectToArray } from '@app/admin/admin.config';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { ReorderServicesComponent } from '@app/projects/project-details/products/reorder-services/reorder-services.component';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { ChangeDetectionComponent } from '@app/dialogs/change-detection/change-detection.component';
import { checkedLength } from '@app/shared/utility/dummyJson';


@Component({
	selector: 'app-edit-product',
	templateUrl: './edit-product.component.html',
	styleUrls: ['./edit-product.component.scss']
})
export class EditProductComponent implements OnInit {

	serviceForm: FormGroup;
	selectedTabOptions = [];
	selectedTabOption = null;
	state = {
		submitted: false,
		fetchingSpecs: true,
		productList: [],
		selectedService: {
			service_revision_no: 0,
			options: [],
			form_status_id: 1
		},
		showView1: false,
		formLayout: [],
		selectedIndex: 0,
		selectedRevision: null,
		productIndex: 0,
		serviceIndex: 0,
		refresh: false,
		dummySelectedService: {
			serv: {},
			prodIndx: null,
			servIndx: null,
			revision: null
		}
	}
	promise: any;

	constructor(
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _dialogRef: MatDialogRef<EditProductComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.state.productList = [...data.productList];
	}

	ngOnInit() {
		this.createForm();
		if (this.data.service) this.onSelectService(this.data.service, this.data.indexes.prod, this.data.indexes.serv);
	}

	createForm() {
		this.serviceForm = this._fb.group({
			jsr_id: '',
			name: '',
			options: this._fb.group({})
		})
	}

	get optionsGroup() {
		return this.serviceForm.get('options') as FormGroup;
	}

	getRevisions(val) {
		return _.range(val + 1);
	}

	changeRevision(rev) {
		if (this.state.selectedRevision != rev) {
			this.state.dummySelectedService.revision = rev;
			if (this.optionsGroup.pristine) {
				this.state.selectedRevision = rev;
				Object.keys(this.optionsGroup.value).map(key => {
					this.optionsGroup.removeControl(key);
				});
				this.onRevisionChange(this.state.selectedService, rev);
			} else {
				this.changeDetection({}, (status) => {
					if (status == 'discard') {
						this.optionsGroup.markAsPristine();
						this.state.selectedIndex = 0;
						this.changeRevision(this.state.dummySelectedService.revision)
					} else if (status == 'review') {
					}
				})
			}
		}
	}

	// Perform Action
	performActions(flag, key) {
		const locals: any = {
			title: '',
			jobs_id: this.data.jobs_id
		}
		switch (key) {
			case 'edit':
				locals.title = 'Edit Spec Order - ' + this.state.selectedService['services_name'];
				const selectedIndex = this.state.selectedIndex || 0;
				locals.specs = this.state.selectedService['options'][selectedIndex];
				break;

			case 'removeService':
			case 'cancelService':
				const stext = key == 'removeService' ? 'remove' : 'cancel';
				locals.title = stext + ' Service';
				locals.action = stext;
				locals.tab = 'Service';
				locals.url = 'delJobPrdtSrv';
				locals.params = {
					id: this.state.selectedService['jobs_service_revisions_id'],
					type: 'service'
				};
				locals.content = 'Are you sure, you want to ' + stext + ' this Service'
				break;

			default:
				break;
		}

		if (flag == 'remove') this.confirmDialog(locals, key);
		else if (flag == 'edit') this.editServiceOrder(locals);

	}

	confirmDialog(locals, key) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (key == 'removeService') {
						this.state.productList[this.state.productIndex].services.splice(this.state.serviceIndex, 1);
						let isEnter = false;
						this.state.productList.map((p, i) => {
							if (p.services.length && !isEnter) {
								isEnter = true;
								this.onSelectService(p.services[0], i, 0);
							}
						})
						if (!isEnter) this.closeDialog();
					}
				}
			})
	}

	editServiceOrder(locals) {
		this._dialog.open(ReorderServicesComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
			})
	}




	onSelectService(serv, prodIndx, servIndx) {
		this.state.dummySelectedService = {
			serv: serv,
			prodIndx: prodIndx,
			servIndx: servIndx,
			revision: null
		}
		if (this.optionsGroup.pristine) {
			this.state.productIndex = prodIndx;
			this.state.serviceIndex = servIndx;
			this.serviceForm.patchValue({
				jsr_id: serv.jobs_service_revisions_id,
				name: serv.services_name
			}, { emitEvent: false })
			this.state.selectedService = { ...serv };
			Object.keys(this.optionsGroup.value).map(key => {
				this.optionsGroup.removeControl(key);
			});
			// this.onTabChange(this.state.selectedService, 0);
			this.onRevisionChange(this.state.selectedService);
			this.state.showView1 = !this.state.showView1;
		} else {
			this.changeDetection({}, (status) => {
				if (status == 'discard') {
					this.optionsGroup.markAsPristine();
					const obj = { ...this.state.dummySelectedService };
					this.state.selectedIndex = 0;
					this.onSelectService(obj.serv, obj.prodIndx, obj.servIndx);
				} else if (status == 'review') {
				}
			})
		}
	}

	onRevisionChange(serv, revNo = null, canChangeTab = true) {
		this.state.fetchingSpecs = true;
		this.state.selectedRevision = revNo == null ? serv.service_revision_no : revNo;
		this._commonService.getApi('jobPrdSpecs', { jsr_id: this.serviceForm.value.jsr_id, revision_no: this.state.selectedRevision })
			.then(res => {
				this.state.fetchingSpecs = false;
				if (res['result'].success) {
					serv.options = res['result'].data;
					serv.options.map((o, i) => {
						this.createSpecsControls(o, i);
					});
					if (canChangeTab) this.onTabChange(0);
					else this.onTabChange(this.state.selectedIndex);
				}
			})
	}

	onTabChange(indx) {
		// if (this.state.selectedIndex != indx) {
		this.state.selectedIndex = indx;
		this.state.formLayout = this.generateLayout(indx);
		// }
	}

	backToList() {
		this.state.showView1 = !this.state.showView1;
	}

	/*onTabChange(serv, tabIndex) {
		serv.selectedIndex = tabIndex;
		this.state.fetchingSpecs = true;
		this._commonService.getApi('jobPrdSpecs', { id: serv.options[tabIndex].id, option_no: serv.options[tabIndex].option_no, revision_no: 0 })
			.then(res => {
				this.state.fetchingSpecs = false;
				if (res['result'].success) {
					serv.options[tabIndex] = { ...serv.options[tabIndex], ...res['result'].data[0] };
					this.createSpecsControls(serv.options[tabIndex]);
					this.state.formLayout = this.generateLayout();
				}
			})
	}*/

	createSpecsControls(option, optionIndx) {
		let controls = this._fb.group({
			id: option.id,
			jobs_service_revisions_id: option.jobs_service_revisions_id,
			option_no: option.option_no,
			form_save_values: this._fb.array([]),
			spec_ids: this._fb.array(option.spec_ids || [])
		});
		option.specs.map(spec => {
			const is_adhoc = spec.form_save_values.is_adhoc || false;
			(<FormArray>controls.controls.form_save_values).push(this._fb.group(this.createFormBuilder(spec.form_save_values, spec, is_adhoc, optionIndx)))
		});
		this.optionsGroup.addControl(option.id, controls);
	}

	createFormBuilder(data, spec, isNew = false, optionIndx = this.state.selectedIndex) {
		const changedValues = this.state.selectedService['options'][optionIndx].changed_attributes || [];
		let controls = {
			id: data.id,
			layout: data.layout || 1
		};

		const indx = changedValues.indexOf(Number(data.id));
		if (indx > -1) controls['has_change'] = true;

		if (isNew) controls['is_adhoc'] = true;

		const settings: any = {};
		if (spec.settings) {
			Object.keys(spec.settings).map(key => {
				settings[key] = data.settings[key] || false;
			})
		}
		controls['settings'] = this._fb.group(settings);

		if (spec.key == 'checkboxes') {
			const group = {};
			spec.options.map(option => {
				let indx = -1;
				if (data.value && Array.isArray(data.value)) {
					indx = data.value.indexOf(option.id);
					if (indx > -1) group[option.id] = true;
					else group[option.id] = false;
				} else if (spec.value && Array.isArray(spec.value)) {
					indx = spec.value.indexOf(option.id);
					if (indx > -1) group[option.id] = true;
					else group[option.id] = false;
				} else {
					group[option.id] = Object.keys(data.value).length ? data.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
				}
			});
			controls['value'] = this._fb.group(group);
		} else if (spec.key == 'group') {
			const groupControls = [];
			spec.options.map((option, i) => {
				const res = _.find(data.value, ['id', option.id]);
				if (res) groupControls.push(this._fb.group((this.createFormBuilder(res, option))));
				else {
					const defaultValues = {
						id: option.id,
						layout: 1,
						settings: {},
						value: spec.key == 'auto_suggest' ? [] : spec.key == 'checkboxes' ? {} : ''
					}
					if (option.settings) {
						Object.keys(option.settings).map(key => {
							defaultValues.settings[key] = false;
						})
					}
					groupControls.push(this._fb.group((this.createFormBuilder(defaultValues, option))));
				}
			})
			controls['value'] = this._fb.array(groupControls);
		} else {
			const validators = [];
			if (settings.mandatory) validators.push(Validators.required);
			controls['value'] = spec.template_id == 3 ? new FormControl(data.value, validators) || new FormControl(spec.value, validators) : new FormControl(data.value, validators) || new FormControl(spec.value, validators);
		}
		if (spec.template_id == 3 || spec.key == 'dropdown') spec.options.map(opt => { opt.name = opt.value; })
		return controls;
	}

	generateLayout(indx) {
		let arr = [];
		const selectedOption: any = this.state.selectedService['options'][indx];
		if (selectedOption.hasOwnProperty('specs')) {
			const selectedControl: FormArray = (<FormArray>(<FormGroup>this.optionsGroup.controls[selectedOption.id]).controls['form_save_values']);
			for (let i = 0; i < selectedOption['specs'].length; i++) {
				const spec = selectedOption['specs'][i];
				if (spec) spec.index = i;
				const defaultSpec = spec ? selectedControl.controls[i].value : {};
				const nextSpec = selectedOption['specs'][i + 1];
				if (nextSpec) nextSpec.index = i + 1;
				const nextDefaultSpec = nextSpec ? selectedControl.controls[i + 1].value : {};
				if (spec) {
					if (selectedOption.form_layout == 1 || selectedOption.form_layout == 3) {
						if (spec.form_save_values.layout == 1 || spec.form_save_values.layout == '') {
							arr.push([spec]);
						} else {
							if (nextSpec) {
								if (nextSpec.form_save_values && nextSpec.form_save_values.layout == 2) {
									arr.push([spec, nextSpec]);
									i++;
								} else {
									arr.push([spec, null])
								}
							}
						}
					} else if (selectedOption.form_layout == 2) {
						if (spec.form_save_values.layout == 1) {
							arr.push([spec]);
						} else {
							if (nextSpec) {
								if (nextSpec.form_save_values && nextSpec.form_save_values.layout == 2) {
									arr.push([spec, nextSpec]);
									i++;
								} else {
									arr.push([spec, null])
								}
							}
						}
					}
				}
			}
		}
		return arr;
	}

	updateFormLayout(arr) {
		const selectedOption: any = this.state.selectedService['options'][this.state.selectedIndex];
		for (let i = 0; i < arr.length; i++) {
			if (selectedOption.form_layout == 1 || selectedOption.form_layout == 3) {
				if (arr[i].form_save_values.layout == 1 || arr[i].form_save_values.layout == '' || arr[i].form_save_values.layout == 3) {
					this.state.formLayout.push([arr[i]])
				} else {
					if (arr[i + 1]) {
						if (arr[i + 1].form_save_values && arr[i + 1].form_save_values == 2) {
							this.state.formLayout.push([arr[i], arr[i + 1]]);
							i++;
						} else {
							this.state.formLayout.push([arr[i], null])
						}
					}
				}
			} else if (selectedOption.form_layout == 2) {
				if (arr[i].form_save_values.layout == 1) {
					this.state.formLayout.push([arr[i]]);
				} else {
					if (arr[i + 1]) {
						if (arr[i + 1].form_save_values && arr[i + 1].form_save_values.layout == 2) {
							this.state.formLayout.push([arr[i], arr[i + 1]]);
							i++;
						} else {
							this.state.formLayout.push([arr[i], null])
						}
					} else {
						if (arr[i].form_save_values.layout == 1 || arr[i].form_save_values.layout == '' || arr[i].form_save_values.layout == 3) {
							this.state.formLayout.push([arr[i]])
						} else {
							this.state.formLayout.push([arr[i], null])
						}
					}
				}
			}
		}
	}

	get randomId(): string {
		let rand = Math.random().toString().substr(5);
		return 'new_' + rand;
	}

	addOption() {
		const options = [];
		this.state.selectedService['options'].map((o, i) => {
			options.push({ id: i, name: i + 1 });
		})
		this._dialog.open(AddOptionComponent, {
			panelClass: ['my-dialog', 'add-options'],
			width: '600px',
			data: {
				title: 'Add Options',
				options: options
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (typeof res != 'undefined' && typeof res != 'string') {
					// const option = _.find(this.state.selectedService['options'], ['id', res]) || {};
					const option = this.state.selectedService['options'][res] || {};
					let newOption: any = { ...option };
					newOption.id = this.randomId;
					newOption.option_no = this.state.selectedService['options'].length + 1;
					if (this.state.refresh) {
						newOption.specs.map((o, i) => {
							o.form_save_values = { ...(<FormArray>(<FormGroup>this.optionsGroup.controls[option.id]).controls.form_save_values).controls[i].value };
						})
					}
					this.state.selectedService['options'].push(newOption);
					this.state.selectedIndex = this.state.selectedService['options'].length - 1;
					this.createSpecsControls(this.state.selectedService['options'][this.state.selectedIndex], this.state.selectedIndex);
					this.optionsGroup.markAsDirty();
				}
			})
	}
	prePareOption() {
		this.selectedTabOptions = []
		this.state.selectedService['options'].map((o, i) => {
			this.selectedTabOptions.push({ id: i, name: i + 1 });
		})
		this.selectedTabOption = this.selectedTabOptions[this.selectedTabOptions.length - 1].id;
	}
	addOptionTab() {

		if (typeof this.selectedTabOption != 'undefined' && typeof this.selectedTabOption != 'string') {
			// const option = _.find(this.state.selectedService['options'], ['id', res]) || {};
			const option = this.state.selectedService['options'][this.selectedTabOption] || {};
			let newOption: any = { ...option };
			newOption.id = this.randomId;
			newOption.option_no = this.state.selectedService['options'].length + 1;
			if (this.state.refresh) {
				newOption.specs.map((o, i) => {
					o.form_save_values = { ...(<FormArray>(<FormGroup>this.optionsGroup.controls[option.id]).controls.form_save_values).controls[i].value };
				})
			}
			this.state.selectedService['options'].push(newOption);
			this.state.selectedIndex = this.state.selectedService['options'].length - 1;
			this.createSpecsControls(this.state.selectedService['options'][this.state.selectedIndex], this.state.selectedIndex);
			this.optionsGroup.markAsDirty();
		}
	}

	addSpecs(serv) {
		this._dialog.open(AddSpecDialogComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: { title: 'Add Form Specs', type: 1, id: '', url: '', total: serv.options[this.state.selectedIndex].specs.length, layout: serv.options[this.state.selectedIndex].form_layout }
		})
			.afterClosed()
			.subscribe(res => {
				if (res.success) {
					serv.options[this.state.selectedIndex].spec_ids = [...serv.options[this.state.selectedIndex].spec_ids, ...res.data.spec_ids];
					res.data.specs.map(spec => {
						(<FormArray>(<FormGroup>this.optionsGroup.controls[serv.options[this.state.selectedIndex].id]).controls.spec_ids).push(new FormControl(spec.id));
						(<FormArray>(<FormGroup>this.optionsGroup.controls[serv.options[this.state.selectedIndex].id]).controls.form_save_values).push(this._fb.group(this.createFormBuilder(spec.form_save_values, spec, true)));
					})
					serv.options[this.state.selectedIndex].specs = [...serv.options[this.state.selectedIndex].specs, ...res.data.specs];
					this.updateFormLayout(res.data.specs);
					this.optionsGroup.markAsDirty();
				}
			})
	}

	deleteAdhocSpec(layout, layoutIdx) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: {
				title: 'Delete Spec',
				content: 'Are you sure you want to delete this spec?'
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.state.selectedService['options'][this.state.selectedIndex]['specs'].splice(layout.index, 1);
					this.state.formLayout = this.generateLayout(this.state.selectedIndex);
					(<FormArray>(<FormGroup>this.optionsGroup.controls[this.state.selectedService['options'][this.state.selectedIndex].id]).controls.spec_ids).removeAt(layout.index);
					(<FormArray>(<FormGroup>this.optionsGroup.controls[this.state.selectedService['options'][this.state.selectedIndex].id]).controls.form_save_values).removeAt(layout.index);
				}
			});
		// this.state.selectedService['options'][this.state.selectedIndex]['specs'].splice(layout.index, 1);
		// this.state.formLayout = this.generateLayout(this.state.selectedIndex);
		// (<FormArray>(<FormGroup>this.optionsGroup.controls[this.state.selectedService['options'][this.state.selectedIndex].id]).controls.spec_ids).removeAt(layout.index);
		// (<FormArray>(<FormGroup>this.optionsGroup.controls[this.state.selectedService['options'][this.state.selectedIndex].id]).controls.form_save_values).removeAt(layout.index);
	}

	closeDialog() {
		this._dialogRef.close({ canRefresh: this.state.refresh });
	}

	saveSpecs(submit = false) {
		this.state.submitted = true;
		if (this.optionsGroup.valid) {
			if (!this.promise) {
				this.state.submitted = false;
				const options = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options)
				const params = _.find(options, ['id', this.state.selectedService['options'][this.state.selectedIndex].id]);
				let values = {
					jsr_id: this.state.selectedService['jobs_service_revisions_id'],
					revision_no: this.state.selectedRevision,
					options: options
				}
				options.map(p => {
                    let option = _.find(this.state.selectedService['options'], ['id', p.id]);
                    p.form_save_values.map(o => {
                        const spec = _.find(option.specs, ['form_save_values.id', o.id]);
                        if (spec && spec.template_id == 1) {
                            if (spec.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
                            else o.value = o.value ? [o.value] : [];
                        }
                    })
                })
				if (submit) values['form_submit'] = submit;
				this.promise = this._commonService.saveApi('saveJobFormSpecDetails', values)
					.then(res => {
						this.promise = undefined;
						if (res['result'].success) {
							// if (submit) {
							// 	this.state.selectedService['form_status'] = 'Submitted';
							// 	this.state.selectedService['form_status_id'] = 2;
							// 	this.state.selectedService['form_submit'] = true;
							// }
							this.state.selectedService['form_status'] = res['result'].data.form_status;
							this.state.selectedService['form_status_id'] = res['result'].data.form_status_id;
							this.state.selectedService['form_submit'] = true;
							this.state.refresh = true;
							this.openSnackBar({ status: 'success', msg: 'Specs Updated Successfully' });
							Object.keys(this.optionsGroup.value).map(key => {
								this.optionsGroup.removeControl(key);
							});
							this.onRevisionChange(this.state.selectedService, this.state.selectedRevision, false);
							this.serviceForm.markAsPristine();
							this._dialogRef.close({ canRefresh: this.state.refresh });
						}
					})
					.catch(err => {
						this.promise = undefined;
					})
			}
		} else {
			const optionIds = Object.keys(this.optionsGroup.value);
			let isEnter = true, counter = 0;
			while (counter < optionIds.length && isEnter) {
				if (!this.optionsGroup.controls[optionIds[counter]].valid) {
					let invalid: Array<FormControl> = [];
					(<FormArray>(<FormGroup>this.optionsGroup.controls[optionIds[counter]]).controls.form_save_values).controls.map((o: FormGroup) => {
						if (!o.controls.value.valid) invalid.push((<FormControl>o.controls.value));
					})
					isEnter = false;
					const indx = _.findIndex(this.state.selectedService['options'], ['id', Number(optionIds[counter]) ? Number(optionIds[counter]) : optionIds[counter]]);
					if (indx > -1) {
						if (this.state.selectedIndex != indx)
							this.onTabChange(indx);
					}
				}
				counter++;
			}
			if (!isEnter) {
				this.openSnackBar({ status: 'error', msg: 'Please fill all Mandatory fields' });
			}
		}
	}

	saveToNewRevision(revSubmit = false) {
		if (!this.promise) {
			const params = { ...this.serviceForm.value };
			params['options'] = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options);
			params['is_revision'] = true;
			if (revSubmit) params['revision_submit'] = revSubmit;
			this.promise = this._commonService.saveApi('updateJobSrv', params)
				.then(res => {
					this.promise = undefined;
					if (res['result'].success) {
						this.state.refresh = true;
						// if (revSubmit) {
						// 	this.state.selectedService['form_status'] = 'Submitted';
						// 	this.state.selectedService['form_status_id'] = 2;
						// 	this.state.selectedService['form_submit'] = true;
						// }
						this.state.selectedService['form_status'] = res['result'].data.form_status;
						this.state.selectedService['form_status_id'] = res['result'].data.form_status_id;
						this.state.selectedService['form_submit'] = true;
						this.state.selectedService['service_revision_no'] = this.state.selectedService['service_revision_no'] + 1;
						this.openSnackBar({ status: 'success', msg: 'Successfully Added to New Revision' });
						this.serviceForm.markAsPristine();
						this.changeRevision(this.state.selectedService['service_revision_no']);
						this._dialogRef.close({ canRefresh: this.state.refresh });
					}
				})
				.catch(err => {
					this.promise = undefined;
				})
		}
	}


	submitRevision() {
	}

	resetForm() {
		const selectedOption = this.state.selectedService['options'][this.state.selectedIndex];
		const specValues = this.state.selectedService['options'][this.state.selectedIndex].specs.map(o => o.form_save_values);
		if (!this.optionsGroup.controls[selectedOption.id].pristine) {
			this.optionsGroup.controls[selectedOption.id].reset({
				form_save_values: specValues
			})
		}
	}


	changeDetection(config, cb) {
		const locals = {
			title: 'Products',
			tab: 'Product',
			...config
		}
		this._dialog.open(ChangeDetectionComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					if (cb) cb(res.status)
				}
			})
	}


	openSnackBar(obj) {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

}
