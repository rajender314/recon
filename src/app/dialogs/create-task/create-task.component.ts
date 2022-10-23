import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormFieldBase, toFormGroup, ApiCallBase, TimeValidation, isDate, DateValidator, TimeValidators } from '@app/shared/utility/config';
import { FormGroup, FormBuilder, FormControl, FormArray, Validators } from '@angular/forms';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { clearFormArray, checkedLength } from '@app/shared/utility/dummyJson';
import { clearFormGroup, objectToArray, buildForm, updateForm } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
    selector: 'app-create-task',
    templateUrl: './create-task.component.html',
    styleUrls: ['./create-task.component.scss']
})
export class CreateTaskComponent implements OnInit {

    start_date = {
        min: new Date(),
        max: null
    }
    due_date = {
        min: new Date(),
        max: null
    }
    minDate = new Date();
    dueMaxDate = null;
    showDateInput: boolean = false;
    isGlobal: boolean = false;
    submitted: boolean = false;
    isAjaxProcess: boolean = false;

    validators = ['assignee_type', 'assignee_id', 'assignee_name', 'start_date'];
    taskControls = ['task_id', 'task_name', 'task_type_id', 'task_type_name', 'billing_type_id', 'note', 'assignee_id', 'assignee_name', 'assignee_type'];
    milestoneControls = ['task_id', 'task_name', 'task_type_id', 'task_type_name', 'billing_type_id', 'note'];
    dateControls = ['start_date', 'due_date'];
    formFields: Array<FormFieldBase> = [
        { key: 'task_type_id', label: 'Task Type', updateKey: 'task_type_name', displayName: 'display_name', type: 'select', multi: false, options: 'taskTypes', settings: { required: true }, default: '' },
        { key: 'start_date', label: 'Start Date', type: 'date', settings: { required: true }, default: new Date() },
        { key: 'due_date', label: 'Due Date', type: 'date', settings: { required: true }, default: null },
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
    ]
    taskFormGroup: FormGroup;
    forms: FormGroup;
    dropdowns = {
        taskTypes: [],
        tasksList: {
            tasks: [],
            milestones: [],
            wop: []
        },
        jobsList: [],
        assigneeList: {
            1: [],
            2: [],
            3: []
        },
        countries: [],
        states: [],
        inactiveOptions: {
            assigneeList: []
        }
    };
    products = {
        jobs_id: null,
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
        status_ids: [],
        is_milestone: false,
        wop: false
    }

    countryName: string = '';
    stateName: string = '';
    addressForm = [
        { key: 'id', label: '', type: 'none', default: '' },
        { key: 'address1', label: '', type: 'text', default: '' },
        { key: 'address2', label: '', type: 'text', default: '' },
        { key: 'city', label: '', type: 'text', default: '' },
        { key: 'state_id', label: '', type: 'select', multi: false, options: 'states', default: '' },
        { key: 'postal_code', label: '', type: 'text', default: '' },
        { key: 'country_id', label: '', type: 'select', multi: false, options: 'countries', default: '' }
    ];
    editAddressForm: FormGroup;

    productControl = new FormControl();
    serviceControl = new FormControl();

    constructor(
        private _fb: FormBuilder,
        private _commonService: CommonService,
        private _dialogRef: MatDialogRef<CreateTaskComponent>,
        @Inject(MAT_DIALOG_DATA) public data
    ) {
        if (this.data.type == 'sub') {
            this.dueMaxDate = this.data.selectedRow.due_date ? new Date(this.data.selectedRow.due_date) : null;
            this.dateControls.map(o => {
                this[o].max = this.dueMaxDate;
            })
        }
        if (this.data.jobs_id) this.isGlobal = false;
        else this.isGlobal = true;
    }

    ngOnInit() {
        if (!this.data.jobs_id) {
            this.apiCalls.push({ key: 'jobsList', url: 'jobLists', method: 'post', responseKey: 'list', params: {} });
        }
        else {
            this.dropdowns.jobsList = [{ id: this.data.jobs_id, job_title: this.data.jobs_name }];
            this.getProductsServices(this.data.jobs_id);
        }
        this.getApiCalls(this.apiCalls, true);
        this.createForm();
    }

    changeDetection = [
        { option: 'taskTypes', key: 'task_type_id', display: 'task_type_name' },
        { option: 'tasksList', key: 'task_id', display: 'task_name' },
        { option: 'assigneeList', key: 'assignee_id', display: 'assignee_name' }
    ];

    valueChanges(controls) {
        controls.map(o => {
            this.taskFormGroup.controls[o.key].valueChanges.subscribe(val => {
                this.selectionChange(val, o.option, o.key, o.display);
            })
        })
    }

    createForm() {

        const date = _moment().format('YYYY-MM-DD');
        const time = '15:00:00';
        var diffInMinutes = _moment(date + ' ' + time).diff(_moment(), 'minutes');

        const fields = [...this.formFields, ...this.extraFields];
        this.taskFormGroup = this._fb.group(toFormGroup(fields));
        this.valueChanges(this.changeDetection);
        this.taskFormGroup.controls['estimate_hrs'].disable();
        if (this.data.type == 'dup') {
            this.changeAssigneType({ target: { value: this.data.selectedRow.assignee_type || 1 } });
        } else {
            this.changeAssigneType({ target: { value: 1 } });
        }
        this.taskFormGroup.controls.jobs_id.valueChanges.subscribe(val => {
            this.getProductsServices(val);
        });
        if (this.data.type == 'dup') {
            const startDate = _moment(_moment(this.data.selectedRow.start_date).format('MM-DD-YYYY')).diff(_moment(_moment(new Date()).format('MM-DD-YYYY')), 'days');
            const endDate = _moment(_moment(this.data.selectedRow.due_date).format('MM-DD-YYYY')).diff(_moment(_moment(new Date()).format('MM-DD-YYYY')), 'days');
            this.start_date.min = startDate <= 0 ? new Date(this.data.selectedRow.start_date) : new Date();
            // this.due_date.min = endDate <= 0 ? new Date(this.data.selectedRow.due_date) : new Date();
            // this.due_date.min = endDate <= 0 ? new Date(this.data.selectedRow.due_date) : diffInMinutes > 0 ? new Date(date + ' ' + time) : new Date();
            this.due_date.min = endDate <= 0 ? new Date(this.data.selectedRow.due_date) : diffInMinutes > 0 ? new Date(date + ' ' + time) : new Date(date + ' ' + time);
            if (this.data.selectedRow.is_milestones) this.setForm([...this.milestoneControls, ...[this.dateControls[0]]], this.data.selectedRow, false);
            else this.setForm([...this.taskControls, ...[this.dateControls[0]]], this.data.selectedRow, false);
            const dur = _moment.duration(_moment(this.taskFormGroup.controls.start_date.value).diff(_moment(this.due_date.min)));
            if (dur.asDays() > 0) this.due_date.min = this.taskFormGroup.controls.start_date.value;
        } else if (this.data.type == 'sub') {
            if (!this.data.selectedRow.is_milestones){
                const startDate = _moment(_moment(this.data.selectedRow.start_date).format('MM-DD-YYYY')).diff(_moment(_moment(new Date()).format('MM-DD-YYYY')), 'days');
                this.start_date.min = startDate <= 0 ? new Date(this.data.selectedRow.start_date) : new Date();
                const lessDays = _moment(_moment(new Date()).format('MM-DD-YYYY')).diff(_moment(_moment(this.data.selectedRow.start_date).format('MM-DD-YYYY')), 'days');
                if (lessDays > 0) {
                } else {
                    this.setForm([this.dateControls[0]], this.data.selectedRow, false);
                }
            }
            const dur = _moment.duration(_moment(this.taskFormGroup.controls.start_date.value).diff(_moment(this.due_date.min)));
            if (dur.asDays() > 0) this.due_date.min = this.taskFormGroup.controls.start_date.value;
        } else {
            // this.due_date.min = diffInMinutes > 0 ? new Date(date + ' ' + time) : new Date();
            this.due_date.min = diffInMinutes > 0 ? new Date(date + ' ' + time) : new Date(date + ' ' + time);
        }
        this.dateFields.map(control => {
            this.taskFormGroup.controls[control].setValidators([Validators.required, DateValidator('MM-DD-YYYY HH:MM', this[control].min, this[control].max)]);
        });
    }

    onStartDateChange(val) {
        const dur = _moment.duration(_moment(this.taskFormGroup.controls.start_date.value).diff(_moment(this.taskFormGroup.controls.due_date.value)));
        if (dur.asMilliseconds() > 0) this.taskFormGroup.controls.due_date.setValue(null, { eventEmit: false });
        this.due_date.min = val.value._d;
    }

    setForm(keys, data, emit = false) {
        let controls = {};
        keys.map(o => {
            controls[o] = this.dateFields.indexOf(o) > -1 ? new Date(data[o]) : o == 'assignee_type' ? String(data[o]) : data[o];
        });
        this.taskFormGroup.patchValue(controls, { emitEvent: emit });
    }

    getApiCalls(arr: Array<ApiCallBase>, canEnter = false) {
        let apiCalls = [];
        arr.map(api => {
            if (api.method == 'get') apiCalls.push(this._commonService.getApi(api.url, api.params))
            else if (api.method == 'post') apiCalls.push(this._commonService.saveApi(api.url, api.params))
            else if (api.method == 'delete') apiCalls.push(this._commonService.deleteApi(api.url, api.params))
        });

        forkJoin(apiCalls).pipe(
            finalize(() => {
                if (this.dropdowns.taskTypes.length &&
                    (!(APP.permissions.job_access.milestones[this._commonService.is_related_to_project ? 'job_specific_user' : 'job_specific_others'] == 'edit')
                        || this.data.type == 'sub')) {
                    let index = _.findIndex(this.dropdowns.taskTypes, ['id', 39]);
                    this.dropdowns.taskTypes.splice(index, 1);
                }
                if (this.data.type == 'add' || this.data.type == 'sub') {
                    this.taskFormGroup.patchValue({
                        'task_type_id': 2
                    });
                }
            })
        ).subscribe(data => {
            data.map((o, i) => {
                if (arr[i].responseKey) this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
                else this.dropdowns[arr[i].key] = [...o['result'].data] || [];
            })
            if (!this.isGlobal) this.setForm(['jobs_id'], { jobs_id: this.data.jobs_id });
            if (this.data.selectedRow && this.data.type == 'dup' && this.data.selectedRow.task_type_id && canEnter) this.selectionChange(this.data.selectedRow.task_type_id, 'taskTypes', 'task_type_id', 'task_type_name', this.data.type);
        })
    }

    getProductsServices(id) {
        this.products.isLoading = true;
        this.products.jobs_id = id;
        this._commonService.getApi('getVendorProdServices', { jobs_id: id, type: 'task' })
            .then(res => {
                this.products.isLoading = false;
                if (res['result'].success) {
                    this.products.list = res['result'].data || [];
                    this.generateText(this.products.list, 'init');
                }
            })
    }

    resetProductSelection() {
        this.productControl.setValue('');
        this.serviceControl.setValue('');
        this.updateSelection();
    }

    checkAllServices(product: any, status: any): void {
        // product.services.map((service) => {
        // 	service.selected = status;
        // });
        this.serviceControl.setValue(product.services[0].jsr_id);
        this.updateSelection();
    }

    checkService(product: any, status: any): void {
        this.productControl.setValue(product.id);
        this.updateSelection();
		/*if (status) {
			product.selected = status;
		} else {
			product.services.filter((service) => {
				return service.selected;
			}).length ? product.selected = true : product.selected = false;
		}*/
    }

    updateSelection() {
        this.products.list.map(p => {
            if (p.id == this.productControl.value) {
                p.selected = true;
                p.services.map(s => {
                    if (s.jsr_id == this.serviceControl.value) {
                        s.selected = true;
                    } else {
                        s.selected = false;
                    }
                })
            } else {
                p.selected = false;
            }
        });
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

    generateText(products = [], flag = 'change') {
        if (this.data.type == 'dup') {
            products.map(p => {
                p.services.map(s => {
                    if (flag == 'init') {
                        if (this.data.selectedRow.associate_products && JSON.parse(this.data.selectedRow.associate_products).indexOf(s.jsr_id) > -1) {
                            p.selected = true;
                            s.selected = true;
                            /* test */
                            this.productControl.setValue(p.id);
                            this.serviceControl.setValue(s.jsr_id);
                        }
                    } else {
                        if (this.serviceControl.value == s.jsr_id) {
                            p.selected = true;
                            s.selected = true;
                        }
                    }
                })
            });
        }
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
        this.dropdowns.inactiveOptions.assigneeList = [];
        let org_type = 0;
        this.taskFormGroup.patchValue({
            assignee_id: ''
        }, { emitEvent: false })
        if (ev.target.value == 1) org_type = 1;
        else if (ev.target.value == 3) org_type = 3;
        if (org_type) {
            if (!this.dropdowns.assigneeList[org_type].length)
                this._commonService.getApi('getOrgUser', { org_type: org_type, status: true })
                    .then(res => {
                        if (res['result'].success) {
                            this.dropdowns.assigneeList[org_type] = res['result'].data || [];
                        }
                    })
        } else {
            if (!this.dropdowns.assigneeList[2].length)
                this._commonService.getApi('getGroups', { from: 'tasks', page: 1, pageSize: 5000, status: true })
                    .then(res => {
                        if (res['result'].success) {
                            this.dropdowns.assigneeList[2] = res['result'].data.groups || [];
                            // this.dropdowns.assigneeList[2].map(o => {
                            // 	if(!o.users_id || !o.users_id.length) this.dropdowns.inactiveOptions.assigneeList.push(o.id);
                            // 	else if(o.users_id.indexOf(APP.recon_user[0].id) == -1) this.dropdowns.inactiveOptions.assigneeList.push(o.id);
                            // })
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

    checkTimeValidation() {
        if (!TimeValidation(this.taskFormGroup.controls.estimate_hrs.value))
            this.taskFormGroup.controls.estimate_hrs.setValue('');
        else {
            if (!isNaN(this.taskFormGroup.controls.estimate_hrs.value)) {
                if (this.taskFormGroup.controls.estimate_hrs.value.length > 2)
                    if (this.taskFormGroup.controls.estimate_hrs.value.charAt(0) == 0) this.taskFormGroup.controls.estimate_hrs.setValue(this.taskFormGroup.controls.estimate_hrs.value.substr(1));
            }
        }
    }

    checkDateValidation(prop) {
        if (!_moment(this.taskFormGroup.controls[prop].value).isValid()) this.taskFormGroup.controls[prop].setValue(null);
    }

    createDynamicForm() {
        this.forms = this._fb.group({
            spec_ids: this._fb.array([]),
            defaults: this._fb.group({})
        })
    }

    selectionChange(val, option, key, updateKey, type?) {
        let selected: any;
        if (key == 'task_id') selected = _.find(this.dropdowns[option][this.dynamicForm.is_milestone ? 'milestones' : (this.dynamicForm.wop ? 'wop' : 'tasks')], ['id', val]);
        else if (key == 'assignee_id') selected = _.find(this.dropdowns[option][this.taskFormGroup.controls.assignee_type.value], ['id', val]);
        else selected = _.find(this.dropdowns[option], ['id', val]);
        if (key == 'task_id') {
            if (typeof val == 'string' && val.includes('new*#*')) {
                // this.taskFormGroup.patchValue({
                // 	[key]: 0
                // }, { emitEvent: false })
            }
        } else if (key == 'task_type_id') {
            this.taskFormGroup.patchValue({
                billing_type_id: selected.billing_type_id
            }, { emitEvent: false });
            if (selected.billing_type_id == 1) {
                this.taskFormGroup.controls['estimate_hrs'].setValidators([Validators.required, TimeValidators(/^([0-9]|[0-9][0-9]):[0-5][0-9]$/)]);
                this.taskFormGroup.controls['estimate_hrs'].enable();
            }
            else {
                this.taskFormGroup.controls['estimate_hrs'].clearValidators();
                this.taskFormGroup.controls['estimate_hrs'].disable();
            }
            if (selected.extra_columns) {
                this.dynamicForm.spec_ids = selected.spec_ids || [];
                this.dynamicForm.defaults = selected.specDt || [];
                this.editAddress();
                this.createDynamicForm();
                selected.specDt.map((val, i) => {
                    this.ids.setControl(i, new FormControl(val.id));
                    this.defaults.setControl(val.id, this._fb.group(this.createFormBuilder(val)));
                });
                this.fileTypeChange();
            } else {
                if (this.forms) {
                    clearFormArray(this.ids); clearFormGroup(this.defaults);
                }
                this.dynamicForm.spec_ids = [];
                this.dynamicForm.defaults = [];
            }
            this.dynamicForm.status_ids = selected.status_ids || [];
            this.dynamicForm.is_milestone = selected.is_milestone;
            this.dynamicForm.wop = selected.is_workorderprepress;
            if (selected.is_milestone) {
                this.validators.map(o => {
                    if (o != 'assignee_name') this.taskFormGroup.controls[o].clearValidators();
                    this.taskFormGroup.controls[o].disable();
                });
                if (!type)
                    this.taskFormGroup.controls.task_id.reset();
                this.taskFormGroup.controls.assignee_id.reset();
                if (!this.dropdowns.tasksList.milestones.length) {
                    this._commonService.getApi('getTasks', { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 2, milestone_type: 1, department_id: APP.recon_user[0].departments_id })
                        .then(res => {
                            if (res['result'].success) {
                                this.dropdowns.tasksList.milestones = res['result'].data.items || [];
                            }
                        })
                }
            } else {
                this.validators.map(o => {
                    if (o != 'assignee_name') this.taskFormGroup.controls[o].setValidators([Validators.required]);
                    this.taskFormGroup.controls[o].enable();
                })
                if (selected.is_workorderprepress) {
                    if (!this.dropdowns.tasksList.wop.length) {
                        this._commonService.getApi('getTasks', { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1, is_workorderprepress: selected.is_workorderprepress, department_id: APP.recon_user[0].departments_id })
                            .then(res => {
                                if (res['result'].success) {
                                    this.dropdowns.tasksList.wop = res['result'].data.items || [];
                                }
                            })
                    }
                } else {
                    if (!this.dropdowns.tasksList.tasks.length) {
                        this._commonService.getApi('getTasks', { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1, department_id: APP.recon_user[0].departments_id })
                            .then(res => {
                                if (res['result'].success) {
                                    this.dropdowns.tasksList.tasks = res['result'].data.items || [];
                                }
                            })
                    }
                }
            }
        }
        if (selected) {
            this.data.title = this.data.type == 'dup' ? (selected.is_milestone ? 'Create Duplicate Milestone' : 'Create Duplicate Task') : (selected.is_milestone ? 'Create New Milestone' : (type == 'sub' ? 'Add Sub Task' : 'Create New Task'));
            this.taskFormGroup.patchValue({
                [updateKey]: selected['display_name'] || selected['name']
            }, { emitEvent: false });
        }

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
                let indx = -1;
                if (spec.value && Array.isArray(spec.value)) {
                    indx = spec.value.indexOf(option.id);
                    if (indx > -1) group[option.id] = true;
                    else group[option.id] = false;
                } else {
                    group[option.id] = Object.keys(spec.value).length ? spec.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
                }
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
        } else if (spec.template_id == 1) {
            controls['value'] = (Array.isArray(spec.value) ? (spec.value.length ? spec.value[0] : '') : spec.value);
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
        if (this.data.type == 'dup') {
            params.id = '';
            delete params.parent_id;
        }
        if (this.data.jobs_id)
            params.jobs_id = this.data.jobs_id;
        const isValid = this.taskFormGroup.controls.billing_type_id.value == 1 ? !!this.products.displayText.product && form.valid : form.valid;
        if (isValid) {
            this.submitted = false;
            this._commonService.update({ type: 'overlay', action: 'start' });
            this.isAjaxProcess = true;
            this.dateFields.map(key => {
                if (this.dynamicForm.is_milestone) {
                    if (key != 'start_date') {
                        params[key] = _moment(params[key]).format('YYYY-MM-DD HH:mm:ss');
                    }
                } else params[key] = _moment(params[key]).format('YYYY-MM-DD HH:mm:ss');
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
            if (services.length) {
                params.associate_products = services;
                params.products = products;
            }
            if (this.dynamicForm.spec_ids.length) {
                params.form_data = {
                    form_save_values: objectToArray(this.ids.value, this.defaults.value),
                    spec_ids: this.ids.value,
                    address: { ...this.editAddressForm.value, ...{ country_name: this.countryName, state_name: this.stateName } }
                }
                params.form_data.form_save_values.map(o => {
                    const spec = _.find(this.dynamicForm.defaults, ['id', o.id]);
                    if (spec && spec.template_id == 1) {
                        if (spec.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
                        else o.value = o.value ? [o.value] : [];
                    }
                })
            }
            if (this.data.type == 'sub') params.parent_id = this.data.selectedRow.id;
            if (this.data.type == 'dup' && this.data.selectedRow.parent_id != 0) params.parent_id = this.data.selectedRow.parent_id;
            if (params.estimate_hrs) {
                if (params.estimate_hrs.split(/[.|:]+/).length == 1) params.estimate_hrs = params.estimate_hrs.concat(':00');
                else if (params.estimate_hrs.split('.').length > 1) params.estimate_hrs = params.estimate_hrs.split('.').join(':');
            }
            params.status_ids = this.dynamicForm.status_ids;
            params.is_milestone = this.dynamicForm.is_milestone;
            this._commonService.saveApi('saveJobsTask', params)
                .then(res => {
                    this.isAjaxProcess = false;
                    if (res['result'].success) {
                        res['result'].data.billing_type_id = params.billing_type_id;
                        this._dialogRef.close({ success: true, data: { ...res['result'].data, ...{ parent_name: (this.data.type == 'sub' || (this.data.type == 'dup' && this.data.selectedRow.parent_id != 0)) ? this.data.selectedRow.task_name : null } }, dropdowns: this.dropdowns.tasksList });
                    }
                    this._commonService.update({ type: 'overlay', action: 'stop' });
                })
                .catch(ERR => {
                    this.isAjaxProcess = true;
                    this._commonService.update({ type: 'overlay', action: 'stop' });
                })
        }
    }

    addressApiCalls = [
        { key: 'countries', url: 'getCountries', method: 'get', responseKey: '', params: {} }
    ];

    fileTypeChange() {
        (<FormGroup>this.defaults.controls['5d0cb34d4ada357ac0096c25']).controls.value.valueChanges.subscribe(val => {
            const specData = _.find(this.dynamicForm.defaults, ['id', '5d0cb34d4ada357ac0096c25']);
            if (specData) {
                const option = _.find(specData.options, ['id', val]);
                if (option) {
                    const spec = _.find(this.dynamicForm.defaults, ['id', '5d0cb9364ada351f225a6462']);
                    if (spec) {
                        let label = '', value = '';
                        if (val == 1) label = 'Previous Project Number';
                        else if (val == 2) {
                            label = 'RapidRemark Job Name';
                            if (this.data.jobs_id)
                                value = this.data.jobs_name;
                        }
                        else if (val == 3) label = 'Box Link';
                        spec.label = label;
                        this.defaults.controls['5d0cb9364ada351f225a6462'].patchValue({
                            value: value
                        });
                        // spec.label = option.label;
                    }
                }
            }
        })
    }

    setAddress(data) {
        this.editAddressForm.patchValue(updateForm(this.addressForm, data), { emitEvent: false });
    }

    getJobAddress() {
        this._commonService.getApi('getJobInfo', { id: this.data.jobs_id, type: 'tasks' })
            .then(res => {
                if (res['result'].success) {
                    const address = res['result'].data;
                    address.id = '';
                    if (Object.keys(address).length) {
                        if (address.country_id) this.getCountryState(address.country_id);
                        this.setAddress(address);
                    }
                }
            })
    }

    editAddress(address: any = {}) {
        this.editAddressForm = this._fb.group(buildForm(this.addressForm));

        this.editAddressForm.controls.country_id.valueChanges.subscribe(val => {
            this.countryName = this.getCountryName('countries', val);
            this.getCountryState(val);
        })
        this.editAddressForm.controls.state_id.valueChanges.subscribe(val => {
            this.stateName = this.getCountryName('states', val);
        })
        if (this.data.jobs_id)
            this.getJobAddress();

        // this.getAddressDropdowns(this.addressApiCalls);
    }

    getAddressDropdowns(arr) {
        this.getApiCalls(arr);
    }

    getCountryState(id) {
        this._commonService.getApi('getStates/' + id, {})
            .then(res => {
                if (res['result'].success) {
                    this.dropdowns.states = res['result'].data || []
                }
            })
    }

    getCountryName(prop, id) {
        const country = _.find(this.dropdowns[prop], ['id', id])
        if (country) return country.name;
        else return '';
    }

}
