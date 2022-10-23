import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { SortFilter, StatusFilter, Statuses, clearFormArray, StatusList, buildParam } from '@app/shared/utility/dummyJson';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { CreateSpecificationComponent } from '@app/admin/dialogs/create-specification/create-specification.component';

import * as _ from "lodash";
import { AdminDashboard, buildForm, updateForm } from '@app/admin/admin.config';
import { ActivatedRoute } from '@angular/router';

var APP = window['APP'];

@Component({
	selector: 'app-specifications',
	templateUrl: './specifications.component.html',
	styleUrls: ['../admin.component.scss', './specifications.component.scss']
})
export class SpecificationsComponent implements OnInit {

	@ViewChild('myInput') myInput: ElementRef;
	// @ViewChild('mySelect') mySelect: ElementRef;
	APP = APP;
	statusBy: string = 'Active';
	sortBy: string = 'A-Z';
	param: Pagination = {
		page: 1,
		pageSize: 50,
		status: 'true',
		sort: 'asc'
	}
	showView: boolean = false;
	isLoading: boolean = false;
	submitted: boolean = false;
	duplicateError: string = '';
	specificationsList: Array<any>;
	totalCount: number = 0;
	totalPages: number = 0;
	selectedSpecification: any;
	selectedSpecType: any;
	UIElement: any;
	availableOptions: number;
	statusValue: any;
	promise: any;
	fetching: boolean = false;

	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		statusList: StatusList,
		status: [
			{ id: true, name: 'Active' },
			{ id: false, name: 'Inactive' }
		],
		UIElements: [],
		cloneUIElements: [],
		specifications: [],
		sizes: [
			{ id: 'small', name: 'Small' },
			{ id: 'medium', name: 'Medium' },
			{ id: 'large', name: 'Large' }
		],
		decimalDigits: [
			{ id: '0', name: '0' },
			{ id: '1', name: '1' },
			{ id: '2', name: '2' },
			{ id: '3', name: '3' },
			{ id: '4', name: '4' },
			{ id: '5', name: '5' }
		],
		specTypes: [
			{ type: 1, pluralName: 'Form Specs', label: 'Form Spec', icon: 'icon-specifications', bgColor: 'gray' },
			{ type: 2, pluralName: 'Equipment Specs', label: 'Equipment Spec', icon: 'icon-equipments', bgColor: 'pink' },
			{ type: 3, pluralName: 'Generic Form Specs', label: 'Generic Form Spec', icon: 'icon-specifications', bgColor: 'gray' }
		]
	}

	specificationForm: FormGroup;
	adminDashboard = AdminDashboard;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Specifications', type: 'text' },
	]

	formConfig: Array<any> = [
		{ label: 'Id', key: 'id', type: 'none', default: '' },
		{ label: 'Label', key: 'label', type: 'text', validations: { required: true }, default: '' },
		{ label: 'Status', key: 'status', type: 'select', multi: false, options: 'status', default: '' },
		{ label: 'Type', key: 'ui_element_id', type: 'select', multi: false, options: 'status', default: '' },
		{ label: 'Predefined Value', key: 'value', type: 'text', default: '' },
		{ label: 'Tooltip', key: 'tooltip', type: 'textarea', default: '' },
		{ label: 'Suggest Value', key: 'suggest_value', type: 'none', default: '' },
		{ label: 'Suggest Status', key: 'suggest_status', type: 'none', default: '' }
	]

	value: any = {
		sortBy: 'a-z'
	}
	status: any = {
		sortBy: 'a-z'
	}
	originalOrder: Array<any> = [];

	priceConfig: any = {
		prefix: '',
		limit: 1000000,
		centsLimit: 0,
		isCancel: false
	}

	constructor(
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService,
		private activeRoute: ActivatedRoute
	) {
		activeRoute.queryParamMap.subscribe(query => {
			let type = query.get('type');
			this.param.page = 1;
			const specType = type ? type : activeRoute.snapshot.data.type;
			this.param['type'] = specType;
			this.selectedSpecType = _.find(this.dropdowns.specTypes, ['type', Number(specType)]);
			this.resetValidations();
			if (type) {
				if (this.breadcrumbs.length > 2) this.breadcrumbs.pop();
				this.breadcrumbs = [...this.breadcrumbs, ...[{ label: this.selectedSpecType.pluralName, type: 'text' }]];
			} else {
				this.breadcrumbs[1] = { label: this.selectedSpecType.pluralName, type: 'text' };
			}
			this.getUIElements(() => {
				this.getSepecifications();
			});
		})
	}

	ngOnInit() {
		this.createForm();
		this.isLoading = true;
		this.adminService.getApi('getSpecsDropDown', { status: 'true' })
			.then(res => {
				if (res.result.success) this.dropdowns.specifications = res.result.data;
				else this.dropdowns.specifications = [];
			})
	}

	export = () => {
		const params = { ...this.param, ...{ token: APP.access_token, jwt: APP.j_token } };
		let url = APP.api_url + 'exportSpecifications?' + buildParam(params);
		window.location.href = url;
	}

	// getter
	get f() { return this.specificationForm.controls; }

	get options() { return this.specificationForm.get('options') as FormArray };

	getUIElements = (cb?) => {
		this.adminService.getApi('uielements', {})
			.then(res => {
				if (res.result.success) {
					this.dropdowns.UIElements = res.result.data.items;
					this.dropdowns.cloneUIElements = _.cloneDeep(this.dropdowns.UIElements);
					if (cb) cb();
				}
			})
	}

	getSepecifications = (flag?) => {
		if (!flag) this.isLoading = true;
		this.adminService
			.getApi('getSpecifications', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.totalCount = res.result.data.total;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination') {
						this.specificationsList = [...this.specificationsList, ...res.result.data.items];
					} else {
						this.specificationsList = res.result.data.items;
						if (this.specificationsList.length) this.onSelectItem(this.specificationsList[0]);
						else this.selectedSpecification = {};
					}
				}
			})
	}

	disableType = tmpId => {
		this.dropdowns.UIElements.map(type => {
			if (type.template_id == tmpId) type.inactive = false;
			else type.inactive = true;
		})
	}

	createForm = () => {
		this.specificationForm = this.fb.group(buildForm(this.formConfig));
		this.specificationForm.addControl('options', new FormArray([]));
		this.specificationForm.addControl('settings', new FormGroup({}));
	}

	setForm = data => {
		this.specificationForm.patchValue(updateForm(this.formConfig, data));
		this.specificationForm.patchValue({
			settings: data.settings || {},
			value: this.UIElement.template_id == 1 ? data.value[0] : data.value
		})
	}

	randomId = () => {
		let rand = Math.random().toString().substr(5);
		return 'new_' + rand;
	}

	createChoice = (data?) => {
		let obj: any = {};
		if (this.UIElement.template_id == 5) {
			obj.spec_id = data && data.spec_id ? [data.spec_id, Validators.required] : ['', Validators.required];
			obj.delimiter = data ? data.delimiter : '';
		} else {
			obj.value = data && data.value ? [data.value, Validators.required] : ['', Validators.required];
		}
		return this.fb.group({
			id: data && data.id ? data.id : this.randomId(),
			status: data ? data.status : true,
			...obj
		})
	}

	addControl = (data = {}) => {
		this.options.push(this.createChoice(data));
	}

	removeControl = indx => {
		if (this.options.length > 1)
			this.options.removeAt(indx);
	}

	removeValidators = (control) => {
		this.specificationForm.get(control).clearValidators();
		this.specificationForm.get(control).updateValueAndValidity();
	}

	focusElement = (control, data) => {
		if (control == 'suggest_value') this.specificationForm.get('suggest_value').setValidators([Validators.required]);
		else this.removeValidators('suggest_value');
		let value = control == 'suggest_value' ? data.value : typeof data.status == 'boolean' ? data.status : (data.status == 1 ? true : false);
		this.specificationForm.get(control).setValue(value);
		setTimeout(() => {
			if (control == 'suggest_value') this.myInput.nativeElement.focus();
			// else this.mySelect.nativeElement.focus();
		}, 200);
	}

	onChangeOption = (flag, ev, data) => {
		if (flag == 'status') {
			data.status = ev;
			setTimeout(() => {
				delete data.showStatus;
			}, 200);
		} else {
			this.removeValidators('suggest_value');
			if (ev.target.value) data.value = ev.target.value;
			delete data.showValue;
		}
	}

	DOMSort = (col, flag) => {
		if (!flag) this[col].sortBy = this[col].sortBy == '' ? 'a-z' : this[col].sortBy == 'a-z' ? 'z-a' : 'a-z';
		if (this[col].sortBy) this.selectedSpecification.options = _.orderBy(this.selectedSpecification.options, [col], [this[col].sortBy == 'a-z' ? 'asc' : 'desc']);
		else this.selectedSpecification.options = [...this.originalOrder];

	}

	DOMSearch = val => {
		if (val) {
			this.selectedSpecification.options = _.filter(this.selectedSpecification.options, (o) => {
				return o.value.toLowerCase().indexOf(val.toLowerCase()) > -1;
			});
		} else {
			this.selectedSpecification.options = [...this.originalOrder];
		}
		if (this.value.sortBy) this.DOMSort('value', 'no-change');
		if (this.status.sortBy) this.DOMSort('status', 'no-change');
	}

	openAddDialog = (data?, flag?) => {
		let locals: any = {
			title: flag ? 'Add New Value - ' + this.selectedSpecification.label : 'Add New ' + this.selectedSpecType.label,
			dropdowns: this.dropdowns,
			name: data ? data : '',
			flag: flag || '',
			label: this.selectedSpecType.label,
			specType: this.selectedSpecType.type,
			api: flag ? 'addAutoSuggestSpecs' : 'saveSpecifications'
		}
		if (flag && this.selectedSpecification) locals.spec_id = this.selectedSpecification.id
		this.dialog
			.open(CreateSpecificationComponent, {
				panelClass: 'recon-dialog',
				width: '500px',
				data: locals
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (flag == 'auto_suggest') {
						this.selectedSpecification.options.push(res.data);
						this.originalOrder = [...this.selectedSpecification.options];
					} else {
						const status = this.param.status ? this.param.status == 'true' : '';
						this.openSnackBar({ status: 'success', msg: 'Specification Added Successfully' });
						this.param.page = 1;
						this.getSepecifications();
					}
				}
			})
	}

	changeMasterView = () => {
		this.showView = !this.showView;
	}

	onSelectItem = item => {
		this.fetching = true;
		this.selectedSpecification = item;
		this.availableOptions = item.options ? item.options.length : 0;
		this.originalOrder = [...item.options];
		clearFormArray(this.options);
		this.UIElement = this.getSelectedType(item.ui_element_id);
		this.createUIFormBuilder(this.UIElement);
		setTimeout(() => {
			this.setForm(item);
			setTimeout(() => {
				this.fetching = false;
			}, 20);
		}, 20);
		this.specificationForm.markAsPristine();
	}

	createUIFormBuilder = ui => {
		let controls = {};
		ui.validations.map(validation => {
			controls[validation.key] = new FormControl();
		});

		if (this.selectedSpecType.type == 3 && ui.template_id == 3) {
			controls['is_lookup'] = new FormControl();
			controls['lookup'] = new FormControl();
			controls['lookup_key'] = new FormControl();
		}

		if (ui.template_id == 2) controls['size'] = new FormControl();
		else if (ui.template_id == 4) controls['decimal'] = new FormControl();

		this.specificationForm.removeControl('settings');
		this.specificationForm.addControl('settings', new FormGroup(controls));

		if (ui.template_id == 1 || ui.template_id == 5) {
			if (this.selectedSpecification.options.length) {
				this.selectedSpecification.options.map(option => {
					this.addControl(option);
				})
			} else {
				this.addControl();
			}
		} else if (ui.template_id == 3) {

		}
		this.disableType(ui.template_id);

		if (ui.template_id == 4) {
			this.specificationForm.get('settings').get('decimal').valueChanges.subscribe(val => {
				this.priceConfig.centsLimit = Number(val);
				this.priceConfig = { ...this.priceConfig };
			})
		}
	}

	getSelectedType = id => {
		const type = _.find(this.dropdowns.UIElements, ['id', id]);
		if (type) {
			return type;
		} else {
			return {}
		}
	}

	onSearch = val => {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getSepecifications();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getSepecifications();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getSepecifications();
			}
		}
	}

	lookupChange(val) {
		const option = _.find(this.UIElement.generic_options, ['key', val]);
		if (option) this.specificationForm.controls.settings.patchValue({ lookup: option.url });
	}

	saveDetails = form => {
		if (!this.promise) {
			this.submitted = true;
			this.duplicateError = '';
			if (form.valid) {
				if(this.UIElement.template_id == 1 || this.UIElement.template_id == 3) {
					form.value.value = form.value.value ? [form.value.value] : [];
				}
				this.submitted = false;
				form.value.type = this.param['type'];
				if (this.UIElement.template_id == 3) {
					if (this.param.type == 3) {
						if (form.value.settings.is_lookup) {
							this.adminService.getApi(form.value.settings.lookup, {})
								.then(res => {
									if (res['result'].success) {
										form.value.options = [];
										res.result.data.items.map(o => {
											form.value.options.push({ id: o.id, value: o.name, name: o.name, status: true });
										})
									}
									this.saveApi(form);
								})
						} else {
							// form.value.options = [...form.value.options, ...this.selectedSpecification.options];
							form.value.options = [...form.value.options, ...this.originalOrder];
							this.saveApi(form);
						}
					} else {
						// form.value.options = [...form.value.options, ...this.selectedSpecification.options];
						form.value.options = [...form.value.options, ...this.originalOrder];
						this.saveApi(form);
					}
				} else {
					this.saveApi(form);
				}
			}
		}
	}

	saveApi(form) {
		this.promise = this.adminService.saveApi('saveSpecifications', form.value)
			.then(res => {
				this.promise = undefined;
				if (res.result.success) {
					this.openSnackBar({ status: 'success', msg: 'Specification Updated Successfully' });
					let indx = _.findIndex(this.specificationsList, { id: form.value.id });
					if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
						this.specificationsList[indx] = { ...res.result.data[0] };
						// this.selectedSpecification = { ...res.result.data[0] };
						// this.specificationForm.markAsPristine();
						this.onSelectItem(this.specificationsList[indx]);
					} else {
						this.specificationsList.splice(indx, 1);
						this.totalCount--;
						if (this.specificationsList.length) this.onSelectItem(this.specificationsList[0]);
					}
					this.specificationForm.markAsPristine();

				} else {
					this.duplicateError = res.result.data;
				}
			})
			.catch(err => {
				this.promise = undefined;
			})
	}

	resetForm = data => {
		this.specificationForm.reset(updateForm(this.formConfig, data));
		this.specificationForm.patchValue({
			options: data.options,
			settings: data.settings || {}
		})
		if (this.UIElement.template_id == 3) data.options = [...this.originalOrder];
		this.resetValidations();
	}

	resetValidations() {
		this.value.sortBy = 'a-z'; this.status.sortBy = 'a-z';
		if (this.specificationForm) this.specificationForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	onScroll = () => {
		if (this.param.page < this.totalPages && this.totalPages != 0) {
			this.param.page++;
			this.getSepecifications('pagination');
		}
	}

	openSnackBar = (obj) => {
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
