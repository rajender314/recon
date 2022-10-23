import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormFieldBase, toFormGroup, toApiCalls, ApiCallBase } from '@app/shared/utility/config';
import { FormGroup, FormBuilder, FormControl, FormArray, Validators } from '@angular/forms';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { clearFormArray } from '@app/shared/utility/dummyJson';
import { clearFormGroup, objectToArray } from '@app/admin/admin.config';

@Component({
	selector: 'app-create-task',
	templateUrl: './create-task.component.html',
	styleUrls: ['./create-task.component.scss']
})
export class CreateTaskComponent implements OnInit {

	minDate = new Date();
	dueMaxDate = null;
	showDateInput: boolean = false;
	isGlobal: boolean = false;
	submitted: boolean = false;

	formFields: Array<FormFieldBase> = [
		{ key: 'task_type_id', label: 'Task Type', updateKey: 'task_type_name', displayName: 'display_name', type: 'select', multi: false, options: 'taskTypes', settings: { required: true }, default: '' },
		{ key: 'start_date', label: 'Start Date', type: 'date', settings: { required: true }, default: new Date() },
		{ key: 'due_date', label: 'End Date', type: 'date', settings: { required: true }, default: null },
		{ key: 'task_id', label: 'Task', updateKey: 'task_name', type: 'select', multi: false, options: 'tasksList', settings: { required: true }, default: '' },
		{ key: 'jobs_id', label: 'Project', type: 'select', multi: false, options: 'jobsList', settings: { required: true }, default: '' },
		{ key: 'assignee_type', label: 'Assignee', type: 'radio', options: [{ id: 1, key: 'internal', label: 'Internal' }, { id: 2, key: 'group', label: 'Group' }, { id: 3, key: 'external', label: 'External' }], settings: { required: true }, default: '1' },
		{ key: 'assignee_id', label: 'Assignee', updateKey: 'assignee_name', type: 'select', multi: false, options: 'assigneeList', settings: { required: true }, default: '' },
		{ key: 'estimate_hrs', label: 'Estimated Hrs', type: 'text', default: '' },
		{ key: 'note', label: 'Estimated Hrs', type: 'textarea', default: '' },
	];
	dateFields = ['start_date', 'due_date'];
	extraFields: Array<FormFieldBase> = [
		{ key: 'id', label: 'Id', type: 'none', default: null },
		{ key: 'task_name', label: 'Task Name', type: 'none', default: null },
		{ key: 'assignee_name', label: 'Assignee Name', type: 'none', default: null },
		{ key: 'task_type_name', label: 'Task Type Name', type: 'none', default: null },
		{ key: 'billing_type_id', label: 'Billing Type Id', type: 'none', default: null }
	];
	apiCalls: Array<ApiCallBase> = [
		{ key: 'taskTypes', url: 'getTaskTypes', method: 'get', params: { type: 'dropdown' } }
		// { key: 'jobsList', url: 'jobLists', method: 'post', responseKey: 'list', params: {} },
		// { key: 'tasksList', url: 'getTasks', method: 'get', responseKey: 'items', params: { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1 } },
	]
	taskFormGroup: FormGroup;
	forms: FormGroup;
	dropdowns = {
		taskTypes: [],
		tasksList: [],
		jobsList: [],
		assigneeList: {
			1: [],
			2: [],
			3: []
		}
	};
	products = {
		isLoading: true,
		displayText: {
			product: '',
			service: ''
		},
		list: []
	}
	dynamicForm = {
		spec_ids: [],
		defaults: [],
		status_ids: []
	}

	constructor(
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<CreateTaskComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if (this.data.dropdowns) this.dropdowns = { ...this.dropdowns, ...this.data.dropdowns };
		if(this.data.selectedRow) this.dueMaxDate = this.data.selectedRow.due_date ? new Date(this.data.selectedRow.due_date) : null;
	}

	ngOnInit() {
		if (!this.data.jobs_id)
			this.apiCalls.push({ key: 'jobsList', url: 'jobLists', method: 'post', responseKey: 'list', params: {} });
		else
			this.dropdowns.jobsList = [{ id: this.data.jobs_id, job_title: this.data.jobs_name }];
		this.getApiCalls(this.apiCalls);
		this.createForm();
		this.getProductsServices();
	}

	createForm() {
		const fields = [...this.formFields, ...this.extraFields];
		this.taskFormGroup = this._fb.group(toFormGroup(fields));
		this.taskFormGroup.controls.estimate_hrs.setValidators([Validators.pattern(/^([0-9][0-9])(:|.| )[0-5][0-9]$/)]);
		this.taskFormGroup.controls['estimate_hrs'].disable();
		/*if(!this.isGlobal) this.taskFormGroup.controls.jobs_id.disable();
		else this.taskFormGroup.controls.jobs_id.enable();*/
		this.changeAssigneType({ target: { value: 1 } });
	}

	setForm(keys, data) {
		let controls = {};
		keys.map(o => {
			controls[o] = data[o]
		});

		this.taskFormGroup.patchValue(controls, { emitEvent: false });
	}

	getApiCalls(arr: Array<ApiCallBase>) {
		let apiCalls = [];
		arr.map(api => {
			if (api.method == 'get') apiCalls.push(this._commonService.getApi(api.url, api.params))
			else if (api.method == 'post') apiCalls.push(this._commonService.saveApi(api.url, api.params))
			else if (api.method == 'delete') apiCalls.push(this._commonService.deleteApi(api.url, api.params))
		});

		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					if (arr[i].responseKey) this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
					else this.dropdowns[arr[i].key] = [...o['result'].data] || [];
				})
				if (!this.isGlobal) this.setForm(['jobs_id'], { jobs_id: this.data.jobs_id });
			})
	}

	getProductsServices() {
		this.products.isLoading = true;
		this._commonService.getApi('getVendorProdServices', { jobs_id: this.data.jobs_id, type: 'task' })
			.then(res => {
				this.products.isLoading = false;
				if (res['result'].success) {
					this.products.list = res['result'].data || [];
					this.generateText(this.products.list);
				}
			})
	}

	checkAllServices(product: any, status: any): void {
		product.services.map((service) => {
			service.selected = status;
		});
	}

	checkService(product: any, status: any): void {
		if (status) {
			product.selected = status;
		} else {
			product.services.filter((service) => {
				return service.selected;
			}).length ? product.selected = true : product.selected = false;
		}
	}

	getServiceCount() {
		let services = [];
		this.products.list.map(p => {
			if (p.selected && p.services.length) {
				p.services.map(s => {
					if (s.selected) services.push(s);
				})
			}
		});
		return services;
	}

	generateText(products = []) {
		/*if (this.data.selectedRow) {
			products.map(p => {
				p.services.map(s => {
					if (this.data.selectedRow.selected.indexOf(s.jsr_id) > -1) {
						p.selected = true;
						s.selected = true;
					}
				})
			});
		}*/
		const product = products.filter(p => p.selected);
		if (product.length == 1) {
			const service = this.getServiceCount();
			this.products.displayText.product = product[0].name;
			if (service.length == 1) this.products.displayText.service = service[0].name;
			else this.products.displayText.service = '( ' + service.length + ' Services )';
		}
		else {
			if (product.length) {
				this.products.displayText.product = product.length + ' Products';
				this.products.displayText.service = '( ' + this.getServiceCount().length + ' Services )';
			} else {
				this.products.displayText.product = '';
				this.products.displayText.service = '';
			}
		}
	}

	changeAssigneType(ev) {
		let org_type = 0;
		this.taskFormGroup.patchValue({
			assignee_id: ''
		}, { emitEvent: false })
		if (ev.target.value == 1) org_type = 1;
		else if (ev.target.value == 3) org_type = 3;
		if (org_type) {
			if (!this.dropdowns.assigneeList[org_type].length)
				this._commonService.getApi('getOrgUser', { org_type: org_type })
					.then(res => {
						if (res['result'].success) {
							this.dropdowns.assigneeList[org_type] = res['result'].data || [];
						}
					})
		} else {
			if (!this.dropdowns.assigneeList[2].length)
				this._commonService.getApi('getGroups', { from: 'tasks',page: 1, pageSize: 5000, status: true })
					.then(res => {
						if (res['result'].success) {
							this.dropdowns.assigneeList[2] = res['result'].data.groups || [];
						}
					})
		}
	}

	get ids() {
		return this.forms.get('spec_ids') as FormArray;
	}

	get defaults() {
		return this.forms.get('defaults') as FormGroup;
	}

	createDynamicForm() {
		this.forms = this._fb.group({
			spec_ids: this._fb.array([]),
			defaults: this._fb.group({})
		})
	}

	selectionChange(val, option, key, updateKey) {
		let selected: any;
		if (key != 'assignee_id') selected = _.find(this.dropdowns[option], ['id', val]);
		else selected = _.find(this.dropdowns[option][this.taskFormGroup.controls.assignee_type.value], ['id', val]);
		if (key == 'task_id') {
			if (typeof val == 'string' && val.includes('new*#*')) {
				this.taskFormGroup.patchValue({
					[key]: 0
				}, { emitEvent: false })
			}
		} else if (key == 'task_type_id') {
			this.taskFormGroup.patchValue({
				billing_type_id: selected.billing_type_id
			}, { emitEvent: false });
			if (selected.billing_type_id == 1) {
				this.taskFormGroup.controls['estimate_hrs'].setValidators([Validators.required])
				this.taskFormGroup.controls['estimate_hrs'].enable();
			}
			else {
				this.taskFormGroup.controls['estimate_hrs'].clearValidators();
				this.taskFormGroup.controls['estimate_hrs'].disable();
			}
			if (selected.extra_columns) {
				this.dynamicForm.spec_ids = selected.spec_ids || [];
				this.dynamicForm.defaults = selected.specDt || [];
				this.dynamicForm.status_ids = selected.status_ids || [];
				this.createDynamicForm();
				selected.specDt.map((val, i) => {
					this.ids.setControl(i, new FormControl(val.id));
					this.defaults.setControl(val.id, this._fb.group(this.createFormBuilder(val)));
				});
			} else {
				if (this.forms) {
					clearFormArray(this.ids); clearFormGroup(this.defaults);
				}
				this.dynamicForm.spec_ids = [];
				this.dynamicForm.defaults = [];
			}
		}
		if (selected)
			this.taskFormGroup.patchValue({
				[updateKey]: selected['display_name'] || selected['name']
			}, { emitEvent: false });

	}

	createFormBuilder(spec) {
		let controls = {
			id: spec.id,
			layout: spec.layout || 1
		};

		const settings: any = {};
		if (spec.settings) {
			Object.keys(spec.settings).map(key => {
				settings[key] = spec.settings[key] || false;
			})
		}
		controls['settings'] = this._fb.group(settings);

		if (spec.key == 'checkboxes') {
			const group = {};
			spec.options.map(option => {
				group[option.id] = Object.keys(spec.value).length ? spec.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
			});
			controls['value'] = this._fb.group(group);
		} else if (spec.key == 'group') {
			const groupControls = [];
			spec.options.map((option, i) => {
				const res = _.find(spec.value, ['id', option.id]);
				if (res) groupControls.push(this._fb.group((this.createFormBuilder(option))));
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
					groupControls.push(this._fb.group((this.createFormBuilder(option))));
				}
			})
			controls['value'] = this._fb.array(groupControls);
		} else {
			controls['value'] = spec.template_id == 3 ? [spec.value] || [spec.value] : spec.value || spec.value;
		}
		if (spec.template_id == 3 || spec.key == 'dropdown') spec.options.map(opt => { opt.name = opt.value; })
		return controls;
	}


	addStartDate() {
		this.showDateInput = true;
	}

	close() {
		this._dialogRef.close();
	}

	addTask(form: FormGroup) {
		this.submitted = true;
		let params = form.value;
		params.jobs_id = this.data.jobs_id;
		if (form.valid) {
			this.submitted = false;
			this.dateFields.map(key => {
				params[key] = _moment(params[key]).format('YYYY-MM-DD HH:mm:ss');
			});
			let services = [], products = {};
			this.products.list.map(p => {
				if (p.selected) {
					products[p.id] = [];
					p.services.map(s => {
						if (s.selected) {
							products[p.id].push(s.jsr_id);
							services.push(s.jsr_id);
						}
					})
				}
			})
			if(services.length){
				params.associate_products = services;
				params.products = products;
			}
			if (this.dynamicForm.spec_ids.length) {
				params.form_data = {
					form_save_values: objectToArray(this.ids.value, this.defaults.value),
					spec_ids: this.ids.value
				}
			}
			if (this.data.selectedRow) params.parent_id = this.data.selectedRow.id;
			params.status_ids = this.dynamicForm.status_ids;
			this._commonService.saveApi('saveJobsTask', params)
				.then(res => {
					if (res['result'].success) {
						this._dialogRef.close({ success: true, data: res['result'].data });
					}
				})
		}
	}

}
