import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MatSnackBar, MatDialog } from '@angular/material';
import { GenericForms } from '@app/shared/utility/dummyJson';
import { AdminInterface } from '@app/admin/admin-interface';
import { AdminService } from '@app/admin/admin.service';

import * as _ from 'lodash';
import { objectToArray, FormFieldType, clearFormArray, clearFormGroup, checkedLength } from '@app/admin/admin.config';
import { AddSpecDialogComponent } from '@app/dialogs/add-spec-dialog/add-spec-dialog.component';
var APP = window['APP'];
@Component({
	selector: 'app-generic-forms',
	templateUrl: './generic-forms.component.html',
	styleUrls: ['../admin.component.scss', './generic-forms.component.scss']
})
export class GenericFormsComponent extends AdminInterface implements OnInit {
	APP = APP;
	tabSpinner: boolean = false;
	activeTab: number = 0;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Generic Forms', type: 'text' },
	];

	addFormFields: Array<FormFieldType> = [
		{ key: 'parent_id', label: 'Parent', type: 'select', multi: false, options: 'parent', default: 1 },
		{ key: 'name', label: 'Generic Form Name', type: 'text', validations: { required: true }, default: '' },
		{ key: 'status', label: 'Status', type: 'none', default: true },
		{ key: 'created_by', label: 'Status', type: 'none', default: true },
		{ key: 'created_date', label: 'Status', type: 'none', default: true },
		{ key: 'last_modified_by', label: 'Status', type: 'none', default: true },
		{ key: 'last_modified_date', label: 'Status', type: 'none', default: true }
	];

	specsForm: FormGroup;
	orderSpecs: Array<any> = [];
	copyDefaults: any = {};

	sortOptions: any = {
		handle: '.handle',
		onUpdate: (event: any) => {
			this.listSorted(this.orderSpecs);
		}
	}

	state = {
		tabs: [
		  { label: 'Details', type: 'details' },
		  { label: 'Specs', type: 'specs' }
		]
	  }

	constructor(
		fb: FormBuilder,
		dialog: MatDialog,
		snackbar: MatSnackBar,
		adminService: AdminService
	) {
		super({ title: 'Generic Form', prop: 'items', export: '', get: 'genericForms', save: 'addGenericForms' }, adminService, fb, snackbar, dialog);
		this.getConfig(this.addFormFields);
	}

	get ids() { return this.specsForm.get('spec_ids') as FormArray }

	get defaults() { return this.specsForm.get('defaults') as FormGroup }

	ngOnInit() {
		this.createForm();
		this.createSpecsForm();
		this.getList();
		this.dropdowns.parent = [{ id: 1, name: 'Bid Submission' }]
	}

	createSpecsForm() {
		this.specsForm = this.fb.group({
			generic_id: '',
			spec_ids: this.fb.array([]),
			defaults: this.fb.group({})
		})
	}

	onSelectItem = item => {
		this.selectedDetails = item;
		clearFormArray(this.ids);
		clearFormGroup(this.defaults);
		this.onTabChange(this.activeTab);
	}

	addSpecs() {
		this.dialog.open(AddSpecDialogComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: { title: 'Add Generic Specs', type: 3, id: this.selectedDetails.id, url: 'saveGenericSpecs' }
		})
			.afterClosed()
			.subscribe(res => {
				if (res.success) {
					const length = this.selectedDetails.specData.specs.length;
					this.selectedDetails.specData.specs = [...this.selectedDetails.specData.specs, ...res.data.specs];
					this.orderSpecs = [...this.orderSpecs, ...res.data.specs];
					res.data.specs.map((spec, i) => {
						this.ids.setControl((length + i), new FormControl(spec.id));
						const defaultValue = _.find(res.data.values, ['id', spec.id]);
						this.defaults.setControl(spec.id, this.fb.group(this.createFormBuilder(defaultValue, spec)));
					});
					this.defaults.disable();
					this.copyDefaults = { ...this.copyDefaults, ...this.defaults.value };
				}
			})
	}

	onTabChange = (tabIndex) => {
		this.activeTab = tabIndex;
		if (this.activeTab == 0) {
			this.getDetails(this.selectedDetails);
		} else if (this.activeTab == 1) {
			this.tabSpinner = true;
			this.getSpecs(this.selectedDetails.id);
		}
	}

	getDetails(item) {
		this.adminService.getApi('genericForms', { id: item.id })
			.then(res => {
				if (res.result.success) {
					this.duplicateError = '';
					this.selectedDetails = res.result.data[0];
					this.setForm(this.selectedDetails);
					this.adminForm.markAsPristine();
				}
			})
	}

	getSpecs(id) {
		this.adminService.getApi('genericSpecs', { 'generic_id': id })
			.then(res => {
				this.specsForm.get('generic_id').setValue(id);
				this.tabSpinner = false;
				if (res.result.success) {
					this.selectedDetails.specData = res.result.data;
					this.orderSpecs = [];
					/*this.selectedDetails.specData.spec_ids.map((id, i) => {
						const specData = _.find(this.selectedDetails.specData.specs, ['id', id]);
						if (specData) {
							this.orderSpecs.push(specData);
							this.ids.setControl(i, new FormControl(id));
							const defaultValue = _.find(this.selectedDetails.specData.values, ['id', id]);
							this.defaults.setControl(id, this.fb.group(this.createFormBuilder(defaultValue, specData)));
						}
					});*/
					this.orderSpecs = [...[], ...this.selectedDetails.specData.specs];
					this.selectedDetails.specData.specs.map((val, i) => {
						this.ids.setControl(i, new FormControl(val.id));
						this.defaults.setControl(val.id, this.fb.group(this.createFormBuilder(val.form_save_values, val)));
					})
					this.defaults.disable();
					this.copyDefaults = { ...this.copyDefaults, ...this.defaults.getRawValue() };
				}
			})
	}

	createFormBuilder(data, spec) {
		let controls = {
			id: data.id
		};

		const settings: any = {};
		if (spec.settings) {
			Object.keys(spec.settings).map(key => {
				settings[key] = data.settings[key] || false;
			})
		}
		controls['settings'] = this.fb.group(settings);

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
			controls['value'] = this.fb.group(group);
		} else if (spec.key == 'group') {
			const groupControls = [];
			spec.options.map((option, i) => {
				const res = _.find(data.value, ['id', option.id]);
				if (res) groupControls.push(this.fb.group((this.createFormBuilder(res, option))));
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
					groupControls.push(this.fb.group((this.createFormBuilder(defaultValues, option))));
				}
			})
			controls['value'] = this.fb.array(groupControls);
		} else if (spec.template_id == 1) {
			controls['value'] = data.value ? (Array.isArray(data.value) ? (data.value.length ? data.value[0] : '') : data.value) : (Array.isArray(spec.value) ? (spec.value.length ? spec.value[0] : '') : spec.value);
		} else {
			controls['value'] = spec.template_id == 3 ? [data.value] || [spec.value] : data.value || spec.value;
		}
		if (spec.template_id == 3 || spec.key == 'dropdown') spec.options.map(opt => { opt.name = opt.value; })
		return controls;
	}

	listSorted = sortedArr => {
		let ids = [];
		sortedArr.map(spec => {
			ids.push(spec.id);
		});
		this.ids.patchValue(ids);
		this.specsForm.markAsDirty();
	}

	perfomAction = (spec, controlName, value, i?) => {
		// return;
		if (controlName == 'mandatory') {
			this.defaults.controls[spec.id].patchValue({
				settings: {
					[controlName]: !this.defaults.controls[spec.id].value.settings.mandatory
				}
			});
		} else if (controlName == 'delete') {
			this.orderSpecs.splice(i, 1);
			this.ids.removeAt(i);
			this.defaults.removeControl(spec.id);
		} else if (controlName == 'set') {
			if(APP.permissions.system_access.generic_forms=='edit')
				this.defaults.controls[spec.id].enable();
			if(spec.template_id == 3) {
				// if(spec.settings.is_lookup)
				// this.adminService.getApi(spec.settings.lookup, {})
				// .then(res => {
				// 	if(res['result'].success) spec.options = res.result.data.items || [];
				// })
			}
		} else if (controlName == 'unset') {
			let resetValue: any;
			if (spec.key == 'checkboxes') {
				resetValue = {};
			} else {
				resetValue = spec.template_id == 3 ? [] : '';
			}
			this.defaults.controls[spec.id].patchValue({ value: resetValue });
		}
		this.defaults.markAsDirty();
	}

	updateSpecs(specForm) {
		specForm.value.values = objectToArray(this.ids.value, this.defaults.getRawValue());
		specForm.value.values.map(o => {
			const spec = _.find(this.selectedDetails.specData.specs, ['id', o.id]);
			if (spec && spec.template_id == 1) {
				if (spec.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
				else o.value = o.value ? [o.value] : [];
			}
		})
		delete specForm.value.defaults;
		this.adminService.saveApi('saveGenericSpecs', specForm.value)
			.then(res => {
				if (res.result.success) {
					this.specsForm.markAsPristine();
					this.defaults.disable();
				}
			})
	}

	resetSpecs(specsCopy) {
		this.specsForm.markAsPristine();
		this.ids.patchValue(this.selectedDetails.specData.spec_ids);
		this.defaults.patchValue(this.copyDefaults);
		this.orderSpecs = [...this.selectedDetails.specData.specs];
		this.defaults.disable();
	}

	dropdownTrigger = (ev, ele) => {
		if (ev) ev.stopPropagation();
		this.resetDropdown(ele);
		ele.isOpen = !ele.isOpen;
	}

	resetDropdown = (data?) => {
		this.adminList.map(ele => {
			if (data) {
				if (data.name != ele.name) delete ele.isOpen;
			} else {
				delete ele.isOpen;
			}
		})
	}

}
