import { Component, OnInit } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import { SortFilter, StatusFilter, Statuses, buildParam } from '@app/shared/utility/dummyJson';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { CreateFormComponent } from '@app/admin/dialogs/create-form/create-form.component';
import { AdminDashboard, clearFormArray, clearFormGroup, objectToArray, checkedLength } from '@app/admin/admin.config';

import { forkJoin } from 'rxjs';
import * as _ from "lodash";
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { DescriptionRendererComponent } from '@app/shared/components/ag-grid/cell-renderers/description-renderer/description-renderer.component';
import { DeleteComponent } from '@app/admin/dialogs/delete/delete.component';
import { ScrollToService, ScrollToConfigOptions } from '@nicky-lenaers/ngx-scroll-to';
import { GridOptions } from 'ag-grid-community';

var APP: any = window['APP'];

@Component({
	selector: 'app-forms',
	templateUrl: './forms.component.html',
	styleUrls: ['../admin.component.scss', './forms.component.scss']
})
export class FormsComponent implements OnInit {
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
	showEdit: boolean = false;
	formSpinner: boolean = false;
	duplicateError: string = '';
	activeTab: number = 0;
	formList: Array<any> = [];
	totalCount: number = 0;
	totalPages: number = 0;
	selectedService: any;
	recentSpecs: Array<any> = [];
	selectedSpecs: Array<any> = [];
	selectedLayout: any;

	formLayout: Array<Array<any>> = [];
	deletedIds: Array<number> = [];

	formsGroup: FormGroup;
	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		status: Statuses,
		addOns: []
	}

	adminDashboard = AdminDashboard;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Forms', type: 'action' },
	];

	sortOptions: any = {
		handle: '.handle',
		onUpdate: (event: any) => {
			this.listSorted(this.formLayout);
		}
	}


	gridOptions: GridOptions = {
		rowHeight: 35,
		columnDefs: [
			{ headerName: "Distribution", field: "name" },
			{
				headerName: "Code", field: "tax_code", editable: (APP.permissions.system_access.forms == 'edit') ? true : false,
				cellRenderer: (param) => {
					return param.value ? param.value : '---'
				}/*,
				cellEditor: 'numericEditor'*/
			},
			{
				headerName: "Description", field: "description", editable: (APP.permissions.system_access.forms == 'edit') ? true : false,
				cellEditor: 'agLargeTextCellEditor',
				cellRenderer: 'description',
				cellEditorParams: {
					maxLength: '300',
					cols: '50',
					rows: '6'
				}
			}
		],
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		frameworkComponents: {
			numericEditor: NumericCellEditorComponent,
			description: DescriptionRendererComponent
		},
		rowData: [],

		defaultColDef: {
			resizable: true
		},

		onGridReady: (params) => {
			params.api.sizeColumnsToFit();
		},
		onCellValueChanged: (gridApi) => {
			let params = {
				id: this.selectedService.id,
				distribution_ids: []
			}
			if (gridApi.oldValue != gridApi.newValue) {
				params.distribution_ids.push(gridApi.data);
				this.saveDistributionForms(params)
			}
		}
	}

	originalLayout: Array<any> = [];
	copyDefaults: any = {};
	copyOrderSpecs: Array<any> = [];
	state = {
		tabs: [
		  { label: 'Configuration', type: 'configuration' },
		  { label: 'Distribution Types', type: 'distributionTypes' }
		]
	  }
	constructor(
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService,
		private _scrollToService: ScrollToService
	) { }

	ngOnInit() {
		this.createForm();
		this.loadApiCalls();
		this.getList();
	}

	get f() { return this.formsGroup.controls; }

	get ids() { return this.formsGroup.get('form').get('spec_ids') as FormArray }

	get defaults() { return this.formsGroup.get('form').get('defaults') as FormGroup }

	/*export = () => {
		let url = APP.api_url + 'exportCstCds?' + buildParam(this.param);
		window.location.href = url;
	}*/

	loadApiCalls = () => {
		forkJoin(
			this.adminService.getApi('products', { status: 'true' }),
			this.adminService.getApi('services', { status: 'true' }),
			this.adminService.getApi('getCostCodes', { status: 'true' })
		)
			.subscribe(data => {
				this.dropdowns['products'] = [];
				this.dropdowns['services'] = [];
				this.dropdowns['costCodes'] = [];
				if (data[0].result.success) {
					this.dropdowns['products'] = data[0].result.data.items.map((prod) => {
						return { id: prod.id, name: prod.name };
					});
				}
				if (data[1].result.success) {
					this.dropdowns['services'] = data[1].result.data.items.map((prod) => {
						return { id: prod.id, name: prod.name };
					});
				}
				if (data[2].result.success) {
					this.dropdowns['costCodes'] = data[2].result.data.items.map((cc) => {
						return { id: cc.id, name: cc.name };
					})
				}
			})
	}

	getList(flag?) {
		if (!flag) this.isLoading = true;
		this.adminService
			.getApi('formList', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.totalCount = res.result.data.total;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination') {
						this.formList = [...this.formList, ...res.result.data.items];
					} else {
						this.formList = res.result.data.items;
						if (this.formList.length) {
							this.formList[0].isOpen = true;
							this.onSelectItem(this.formList[0].children[0]);
						}
					}
				}
			})
	}

	createForm() {
		this.formsGroup = this.fb.group({
			details: this.fb.group({
				id: '',
				bid_submission_id: '',
				status: '',
				is_allow: '',
				costcode_id: ''
			}),
			form: this.fb.group({
				form_id: '',
				spec_ids: this.fb.array([]),
				defaults: this.fb.group({}),
				layout: ''
			})
		});
	}

	setForm(prop, data) {
		if (prop == 'details') {
			this.formsGroup.patchValue({
				[prop]: {
					id: data.id,
					bid_submission_id: data.bid_submission_id || 0,
					status: data.status,
					is_allow: data.is_allow,
					costcode_id: data.costcode_id
				}
			});
		} else {
			this.formsGroup.patchValue({
				[prop]: {
					form_id: data.form_id || data.id,
					layout: data.layout || 1
				}
			});
		}
	}

	resetForm(data) {
		this.formsGroup.reset({
			details: {
				id: data.id,
				bid_submission_id: data.bid_submission_id || 0,
				status: data.status,
				is_allow: data.is_allow,
				costcode_id: data.costcode_id
			},
			form: {
				form_id: data.form_id || data.id,
				layout: data.layout || 1
			}
		});
		this.formsGroup.get('details').markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	createFormBuilder(data, spec) {
		let controls = {
			id: data.id,
			layout: data.layout || 1
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

	openAddDialog(data?, flag?) {
		let locals = {
			title: flag ? 'Duplicate Form' : 'Add New Form',
			dropdowns: this.dropdowns,
			name: data ? data : '',
			flag: flag
		}
		if (flag) locals['obj'] = {
			layout: this.formsGroup.get('form').value.layout,
			spec_ids: this.ids.value,
			values: objectToArray(this.ids.value, this.defaults.value)
		}
		this.dialog
			.open(CreateFormComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: locals
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.openSnackBar({ status: 'success', msg: 'Form ' + (flag ? 'Duplicated' : 'Added') + ' Successfully' });
					this.param.page = 1;
					this.getList();
				}
			})
	}

	changeMasterView() {
		this.showView = !this.showView;
	}

	onSelectItem(item) {
		this.duplicateError = '';
		this.selectedService = item;
		this.formLayout = [];
		this.deletedIds = [];
		this.onTabChange(this.activeTab);
	}

	triggerScroll(indx) {
		const config: ScrollToConfigOptions = {
			target: 'product_' + indx
		};

		this._scrollToService.scrollTo(config);
	}

	onTabChange = (ev) => {
		this.activeTab = ev;
		if (this.activeTab == 0) {
			this.getFormDetails(this.selectedService.id, () => {
				this.formsGroup.markAsPristine();
			});
		} else if (this.activeTab == 1) {
			this.getDistributionTypes(this.selectedService.id);
		} else {
		}
	}

	getFormDetails = (id, cb?) => {
		this.formSpinner = true;
		this.adminService.getApi('formsDetails', { id: id })
			.then(res => {
				if (res.result.success) {
					this.selectedService.details = res.result.data.items[0];
					this.dropdowns.addOns = res.result.data.bid_submission;
					this.setForm('details', this.selectedService.details);
					if (cb) cb();
					this.adminService.getApi('formsSpec', { form_id: this.selectedService.details.id })
						.then(res => {
							this.formSpinner = false;
							if (res.result.success) {
								this.selectedService.details.specs = [];
								this.selectedService.details.values = [];
								this.selectedService.details.spec_ids = [];
								this.selectedService.details = { ...this.selectedService.details, ...res.result.data };
								clearFormArray(this.ids); clearFormGroup(this.defaults);
								this.selectedService.details.specs.map((val, i) => {
									this.ids.setControl(i, new FormControl(val.id));
									this.defaults.setControl(val.id, this.fb.group(this.createFormBuilder(val.form_save_values, val)));
								})
								/*let orderSpecs = [];
								this.selectedService.details.spec_ids.map((val, i) => {
									const spec = _.find(this.selectedService.details.specs, ['id', val]);
									if (spec) {
										orderSpecs.push(spec);
										const specsData = _.find(this.selectedService.details.values, ['id', val]);
										this.ids.setControl(i, new FormControl(val));
										this.defaults.setControl(val, this.fb.group(this.createFormBuilder(specsData, spec)));
									}
								});*/
								this.setForm('form', this.selectedService.details);
								this.defaults.disable();
								this.copyDefaults = { ...this.copyDefaults, ...this.defaults.value };
								// this.selectedService.details.specs = [...orderSpecs];
								// this.copyOrderSpecs = [...this.selectedService.details.specs];
								this.formLayout = this.frameLayout();
								this.originalLayout = [...this.formLayout];
							}
						})
				}
			});
	}

	frameLayout = () => {
		let arr = [];

		for (let i = 0; i < this.selectedService.details.specs.length; i++) {
			const spec = this.selectedService.details.specs[i];
			const defaultSpec = spec ? this.defaults.controls[spec.id].value : {};
			const nextSpec = this.selectedService.details.specs[i + 1];
			const nextDefaultSpec = nextSpec ? this.defaults.controls[nextSpec.id].value : {};
			if (spec) {
				if (this.selectedService.details.layout == 1 || this.selectedService.details.layout == 3) {
					if (defaultSpec.layout == 1 || defaultSpec.layout == '') {
						arr.push([spec]);
					} else {
						if (nextDefaultSpec && nextDefaultSpec.layout == 2) {
							arr.push([spec, nextSpec]);
							i++;
						} else {
							arr.push([spec, null])
						}
					}
				} else if (this.selectedService.details.layout == 2) {
					if (defaultSpec.layout == 1) {
						arr.push([spec]);
					} else {
						if (nextDefaultSpec && nextDefaultSpec.layout == 2) {
							arr.push([spec, nextSpec]);
							i++;
						} else {
							arr.push([spec, null])
						}
					}
				}
			}
		}
		return arr;
	}

	updateLayout = (type) => {
		let arr = [];
		/*this.selectedService.details.specs.map((spec, i) => {
			if (type == 1 || type == 3) {
				arr.push([spec])
			} else if (type == 2) {
				const nxt = this.selectedService.details.specs[i + 1] ? this.selectedService.details.specs[i + 1] : null;
				arr.push([spec, nxt]);
			}
		});*/
		for (let i = 0; i < this.selectedService.details.specs.length; i++) {
			/* Updating all fields layout */
			this.defaults.controls[this.selectedService.details.specs[i].id].patchValue({
				layout: type
			});
			if (type == 1 || type == 3) {
				arr.push([this.selectedService.details.specs[i]])
			} else if (type == 2) {
				const nxt = this.selectedService.details.specs[i + 1] ? this.selectedService.details.specs[i + 1] : null;
				arr.push([this.selectedService.details.specs[i], nxt]);

				if (this.selectedService.details.specs[i + 1]) {
					this.defaults.controls[this.selectedService.details.specs[i + 1].id].patchValue({
						layout: type
					});
					i++;
				}
			}
		}
		return arr;
	}

	editForm = () => {
		this.showEdit = !this.showEdit;
		if (this.showEdit) {
			this.perfomAction(null, 'layout', this.formsGroup.get('form').value.layout, 'init');
			this.formsGroup.get('form').markAsPristine();
			this.getSpecs();
		}
	}

	getSpecs = (search = '') => {
		this.isLoading = true;
		this.adminService.getApi('getSpecsDropDown', { status: true, search: search, recent: true, form_id: this.selectedService.details.id, type: 1 })
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.recentSpecs = res.result.data;
				}
			})
	}

	addSpecs = (data, i) => {
		const obj = {
			type: 'add',
			form_id: this.selectedService.id,
			spec_ids: [data.id],
			layout: this.formsGroup.get('form').value.layout,
			values: [{
				id: data.id,
				layout: this.formsGroup.get('form').value.layout,
				settings: { ...data.settings }
			}]
		}
		if (data.key == 'checkboxes') {
			obj.values[0]['value'] = data.value ? data.value : [];
		} else if (data.key == 'group') {
			obj.values[0]['value'] = data.value ? data.value : [];
		} else {
			obj.values[0]['value'] = (data.template_id == 3 || data.template_id == 1) ? data.value || [] : data.value || '';
		}
		this.adminService.saveApi('saveFormSpec', obj)
			.then(res => {
				if (res.result.success) {
					this.ids.setControl(this.ids.length, new FormControl(data.id));
					this.selectedService.details.specs = [...this.selectedService.details.specs, ...res.result.data];
					this.defaults.setControl(data.id, this.fb.group(this.createFormBuilder(obj.values[0], res.result.data[0])));
					this.recentSpecs.splice(i, 1);
					this.defaults.disable();
					if (this.formsGroup.get('form').value.layout == 1 || this.formsGroup.get('form').value.layout == 3) {
						this.formLayout.push([...res.result.data]);
					} else {
						this.formLayout.push([...res.result.data, null]);
					}
					this.formsGroup.get('form').markAsPending();
					this.originalLayout.push([...this.formLayout[this.formLayout.length - 1]]);
					this.openSnackBar({ status: 'success', msg: 'Form Spec Added Successfully' });
				}
			})
	}

	listSorted = sortedArr => {
		let arr = [], ids = [];
		sortedArr.map(parent => {
			parent.map(list => {
				if (list) {
					ids.push(list.id);
					arr.push(list);
				}
			})
		});

		this.selectedService.details.specs = arr;
		this.formsGroup.get('form').patchValue({
			spec_ids: ids
		})
		this.formsGroup.get('form').markAsDirty();
	}

	previewForm = () => {
		this.showEdit = false;
		this.formLayout = [...this.originalLayout];
		this.ids.patchValue(this.copyOrderSpecs.map(o => o.id));
		this.defaults.patchValue(this.copyDefaults);
		this.defaults.disable();
	}

	updateForm = (form) => {
		let obj = form.getRawValue();
		obj.values = objectToArray(this.ids.value, obj.defaults);
		obj.values.map(o => {
			const spec = _.find(this.selectedService.details.specs, ['id', o.id]);
			if (spec && spec.template_id == 1) {
				if (spec.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
				else o.value = o.value ? [o.value] : [];
			}
		})
		delete obj.defaults;
		this.adminService.saveApi('saveFormSpec', { ...obj, ...{ deleted_ids: this.deletedIds } })
			.then(res => {
				if (res.result.success) {
					this.copyDefaults = { ...this.defaults.value };
					this.copyOrderSpecs = [...this.selectedService.details.specs];
					this.originalLayout = [...this.formLayout];
					this.previewForm();
				}
			})
	}

	deleteSpec(data, indx) {
		const ids = data.map(val => {
			return val.id
		})
		const locals = {
			title: 'Remove Form Spec',
			buttons: { save: 'Save', cancel: 'Cancel' },
			name: data[0].label,
			params: {
				type: 'delete',
				form_id: this.selectedService.id,
				delete_spec_ids: ids
			},
			url: 'saveFormSpec'
		};
		this.dialog.open(DeleteComponent, {
			panelClass: 'recon-dialog',
			width: '500px',
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.formLayout.splice(indx, 1);
					data.map(val => {
						if (val) {
							this.deletedIds.push(val.id);
							this.ids.removeAt(indx);
							this.defaults.removeControl(val.id);
							this.selectedService.details.specs.splice(indx, 1);
						}
					})
					this.openSnackBar({ status: 'success', msg: 'Form Spec Deleted Successfully' });
					this.copyDefaults = { ...this.defaults.value };
					this.copyOrderSpecs = [...this.selectedService.details.specs];
					this.originalLayout = [...this.formLayout];
				}
				this.formsGroup.get('form').markAsPristine();
			})

	}

	perfomAction = (spec, controlName, value, i?) => {
		if (!spec) {
			if (controlName == 'layout') {
				this.selectedLayout = {
					text: value != 3 ? 'Labels on Top' : 'Labels on Left',
					value: value
				}
				if (!i) this.formLayout = this.updateLayout(value);
			}
			this.formsGroup.get('form').patchValue({
				[controlName]: value
			})
			this.selectedService.details[controlName] = value;
		} else {
			if (controlName == 'delete') {
				this.deleteSpec(spec, i);
			} else if (controlName == 'layout') {
				spec.map(sp => {
					this.defaults.controls[sp.id].patchValue({
						[controlName]: value
					});
				});
				if (value == 1) {
					let updateArr = [[spec[0]]]
					if (spec[1]) updateArr.push([spec[1]]);
					this.formLayout.splice.apply(this.formLayout, [i, 1].concat(updateArr));
				} else {
					const prev = this.formLayout[i - 1], nxt = this.formLayout[i + 1];
					let updateArr = [];
					if (prev && prev.length > 1 && prev[1] == undefined) {
						updateArr.push([prev[0], spec[0]]);
						this.formLayout.splice.apply(this.formLayout, [i - 1, 2].concat(updateArr));
					} else if (nxt && nxt.length > 1 && nxt[1] == undefined) {
						updateArr.push([spec[0], nxt[0]]);
						this.formLayout.splice.apply(this.formLayout, [i, 2].concat(updateArr));
					} else {
						updateArr.push([spec[0], null]);
						this.formLayout.splice.apply(this.formLayout, [i, 1].concat(updateArr));
					}
				}
			} else {
				spec.map(val => {
					if (val) {
						const indx = _.findIndex(this.selectedService.details.specs, { id: val.id });
						if (indx > -1) {
							if (controlName == 'mandatory') {
								this.defaults.controls[val.id].patchValue({
									settings: {
										[controlName]: !this.defaults.controls[val.id].value.settings.mandatory
									}
								});
							} /*else if (controlName == 'delete') {
								this.deletedIds.push(val.id);
								this.ids.removeAt(indx);
								this.defaults.removeControl(val.id);
								this.selectedService.details.specs.splice(indx, 1);
							}*/ else if (controlName == 'set' || controlName == 'unset') {
								let resetValue: any;
								if (spec.key == 'checkboxes') {
									resetValue = {};
								} else {
									resetValue = spec.template_id == 3 ? [] : '';
								}
								if (controlName == 'set') {
									this.defaults.controls[val.id].enable();
								}
								else this.defaults.controls[val.id].patchValue({ value: resetValue });
							} else {
								this.defaults.controls[val.id].patchValue({
									[controlName]: value
								});
							}
						}
					}
				});
			}

		}
		if (controlName != 'delete') this.defaults.markAsDirty();
	}

	getDistributionTypes = (id) => {
		this.formSpinner = true;
		this.adminService.getApi('formDistributions', { id: id })
			.then(res => {
				this.formSpinner = false;
				if (res.result.success) {
					this.gridOptions.rowData = res.result.data.items;
				}
			})
	}

	saveDistributionForms(param) {
		this.adminService.saveApi('updateFmDstrb', param)
			.then(res => {
				if (res.result.success) {
					this.openSnackBar({ status: 'success', msg: 'Form Updated Successfully' });
				}
			})
	}

	onSearch(val, flag?) {
		if (!flag) {
			this.param.page = 1;
			if (val) this.param.search = val;
			else delete this.param.search;
			this.getList();
		} else {
			this.getSpecs(val);
		}
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getList();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getList();
			}
		}
	}

	saveDetails(form) {
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			this.adminService.saveApi('saveForms', form.value.details)
				.then(res => {
					if (res.result.success) {
						this.openSnackBar({ status: 'success', msg: 'Form Updated Successfully' });
						if (this.statusBy == '' || (JSON.parse(form.value.details.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.details.status) && this.statusBy == 'Inactive')) {
							this.selectedService.details = { ...this.selectedService.details, ...form.value.details };
							this.formsGroup.markAsPristine();
						} else {
							let parentIndx = _.findIndex(this.formList, ['id', this.selectedService.parent_id]);
							if (parentIndx > -1) {
								let childIndx = _.findIndex(this.formList[parentIndx].children, ['id', this.selectedService.id]);
								if (childIndx > -1) {
									this.formList[parentIndx].children.splice(childIndx, 1);
									this.totalCount--;
								}
								if (this.formList[parentIndx].children.length) {
									this.onSelectItem(this.formList[parentIndx].children[0]);
								} else {
									this.formList.splice(parentIndx, 1);
									if (this.formList.length) {
										this.formList[0].isOpen = true;
										this.onSelectItem(this.formList[0].children[0]);
									}
								}
							}
						}

					} else {
						this.duplicateError = res.result.data;
					}
				})
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

	dropdownTrigger = (ev, ele, i) => {
		if (ev) ev.stopPropagation();
		this.resetDropdown(ele);
		ele.isOpen = !ele.isOpen;
		setTimeout(() => {
			this.triggerScroll(i);
		}, 20);
	}

	resetDropdown = (data?) => {
		this.formList.map(ele => {
			if (data) {
				if (data.name != ele.name) delete ele.isOpen;
			} else {
				delete ele.isOpen;
			}
		})
	}

	goTo(val) {
		this.previewForm();
	}

	toggleChildCompanyCodes(code: any, event: any): void {
		event.stopImmediatePropagation();
		code['showChildren'] = !code['showChildren'];
	}
}
