import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { MatMenuTrigger, MatDialog, MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../task.service';
import { ApiCallBase, isDate, DateValidator, TimeValidation, TimeValidators } from '@app/shared/utility/config';
import { Subscription, forkJoin } from 'rxjs';
import { buildForm, updateForm, objectToArray } from '@app/admin/admin.config';
import { ProjectDetailsService } from '../../project-details.service';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { CheckScheduleComponent } from '../check-schedule/check-schedule.component';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { checkedLength } from '@app/shared/utility/dummyJson';

var APP: any = window['APP'];

@Component({
	selector: 'app-detail-view',
	templateUrl: './detail-view.component.html',
	styleUrls: ['./detail-view.component.scss']
})
export class DetailViewComponent implements OnInit, OnDestroy {
	@ViewChild('logTimeTrigger') trigger: MatMenuTrigger;
	@ViewChild('logTimeEditTrigger') editTrigger: MatMenuTrigger;
	@ViewChild('messageListSection') private messageListContainer: ElementRef;
	@ViewChild('focusElement') private logTimeField: ElementRef;
	@ViewChild('allowEdit') public allowEdit;

	trackConfig = {
		isProject: true,
		isChange: false,
		defaultValues: {
			id: '',
			jobs_id: '',
			jobs_tasks_id: '',
			date: new Date(),
			range: [9, 12],
			track_time: '3:00 h',
			description: ''
		},
		url: 'saveTasksLogs'
	}

	infoConfig = {
		last_modified_by: '',
		last_modified_date: '',
		created_date: '',
		created_by: ''
	}

	taskForm: FormGroup;
	logForm: FormGroup;

	dropdowns = {
		taskStatuses: [],
		tasksList: {
			tasks: [],
			milestones: [],
			wop: []
		},
		assigneeTypes: [{ id: 1, key: 'internal', name: 'Internal' }, { id: 2, key: 'group', name: 'Group' }, { id: 3, key: 'external', name: 'External' }],
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
	}

	messages = {
		isNew: true,
		inProgress: true,
		noData: false,
		showButtons: false,
		userName: APP.user.first_name + ' ' + APP.user.last_name,
		uploadData: {
			error: '',
			files: []
		},
		newMessage: '',
		threadId: '',
		thread: {},
		list: []
	}

	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	dateFields = ['start_date', 'due_date'];
	note = { can_edit: true, key: 'note', display_name: 'note_description', label: 'Note', type: 'textarea', default: '' };
	time = { can_edit: true, key: 'estimate_hrs', display_name: 'estimate_hrs', label: 'Estimate Hrs', type: 'text', default: '' };
	milestoneControls = ['task_id', 'due_date'];
	formFields = [
		{ showView: true, can_edit: false, key: 'task_type_id', label: 'Task Type', display_name: 'task_type_name', updateKey: 'task_type_name', displayName: 'display_name', type: 'select', multi: false, options: 'taskTypes', settings: { required: true }, default: '' },
		{ showView: true, can_edit: true, key: 'task_id', display_name: 'task_name', minLength: 0, label: 'Task', type: 'select', multi: false, options: 'tasksList', validations: { required: true }, default: '' },
		{ showView: true, can_edit: true, key: 'start_date', error_label: 'Start Date', label: 'Start Date <em>(MM-DD-YYYY HH:MM)</em>', type: 'date', min: new Date(), max: null, validations: { required: true }, default: new Date() },
		{ showView: true, can_edit: true, key: 'due_date', error_label: 'Due Date', label: 'Due Date <em>(MM-DD-YYYY HH:MM)</em>', min: new Date(), max: null, type: 'date', validations: { required: true }, default: null },
		{ showView: true, can_edit: true, key: 'assignee_type', display_name: 'assignee_type_name', label: 'Assignee Type', type: 'select', multi: false, options: 'assigneeTypes', validations: { required: true }, default: '1' },
		{ showView: true, can_edit: true, key: 'assignee_id', display_name: 'assignee_name', minLength: 0, label: 'Assignee', type: 'select', multi: false, options: 'assigneeList', validations: { required: true }, default: '' },
	];
	extraFileds = [
		{ key: 'id', label: 'ID', type: 'none', default: '' },
		{ key: 'status', label: 'Status', type: 'none', default: '' },
		{ key: 'status_name', label: 'Status Name', type: 'none', default: '' },
		{ key: 'task_name', label: 'Task Name', type: 'none', default: null },
		// { key: 'assignee_name', label: 'Assignee Name', type: 'none', default: null },
		{ can_edit: true, key: 'note', label: 'Note', type: 'textarea', default: '' },
		{ key: 'estimate_hrs', label: 'Estimate Hrs', type: 'none', default: null },
	];

	apiCalls: Array<ApiCallBase> = [
		{ key: 'taskTypes', url: 'getTaskTypes', method: 'get', params: { type: 'dropdown' } }
		// { key: 'taskStatuses', url: 'getTaskStatuses', method: 'get', params: { status: true, search: '' } },
		// { key: 'tasksList', url: 'getTasks', method: 'get', responseKey: 'items', params: { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1 } },
	];

	showDynamicForm: boolean = false;
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

	state = {
		projectID: null,
		job_status_id: null,
		isLoading: true,
		isAjaxProcess: false,
		continue: false,
		taskId: null,
		showButtons: false,
		submitted: false,
		selectedTask: null,
		selectedRow: null,
		accordianList: ['products', 'time'], //, 'billing'
		accordian: {
			products: {
				isLoading: true,
				isOpen: false,
				list: []
			},
			time: {
				submitted: false,
				isLoading: true,
				isOpen: false
			},
			billing: {
				isLoading: true,
				isOpen: false
			}
		}
	}

	activeRouterSubscription: Subscription;
	routerSubscription: Subscription;

	constructor(
		private _fb: FormBuilder,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _commonService: CommonService,
		private _router: Router,
		private _activeRoute: ActivatedRoute,
		private _projectDetailService: ProjectDetailsService,
		private _taskService: TaskService
	) {
		this.routerSubscription = _activeRoute.parent.parent.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			this.trackConfig.defaultValues.jobs_id = this.state.projectID;
		});
		this.activeRouterSubscription = _activeRoute.params.subscribe(param => {
			this.state.taskId = param.id ? param.id : null;
			this.trackConfig.defaultValues.jobs_tasks_id = this.state.taskId;
			if (this.state.taskId) this.getTaskDetails(this.state.taskId);
		})
		this.uploader
			.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
				if (item.size >= options.maxFileSize) this.messages.uploadData.error = 'Exceeds Max. Size';
				else this.messages.uploadData.error = 'Invalid File Upload';
			}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					let type = obj.result.data.original_name.split('.').pop();
					this.messages.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
					this.messages.uploadData.error = '';
				}
			}

		this._taskService.onUpdate().subscribe(ev => {
			if (ev.type == 'update-due-date') {
				this.taskForm.patchValue({
					due_date: new Date(ev.data.due_date)
				});
				this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], ev.data);
				this.updateTaskDetails(this.taskForm);
			} else if (ev.type == 'task-ag-status-change') {
				this.taskForm.patchValue({
					status: ev.data.res.status_id,
					status_name: ev.data.res.status_name
				}, { emitEvent: false });
				this.state.selectedTask.is_enable = ev.data.trans.id == 5 ? false : true;
				this.state.selectedTask.status = ev.data.res.status_id;
				this.state.selectedTask.status_name = ev.data.res.status_name;
				this.state.selectedTask.status_buttons = ev.data.res.status_buttons;
				this.state.selectedTask.status_dropdown = ev.data.res.status_dropdown;
				this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], ev.data.res);
			}
		})
	}

	ngOnInit() {
		if (this.apiCalls.length) this.getApiCalls(this.apiCalls);
		this.createForm();
		this.createLogForm();
	}

	ngOnDestroy() {
		this.routerSubscription.unsubscribe();
		this.activeRouterSubscription.unsubscribe();
	}

	getApiCalls(arr, cb?) {
		let apiCalls = [];
		arr.map(api => {
			if (api.method == 'get')
				apiCalls.push(this._commonService.getApi(api.url, api.params))
			else if (api.method == 'post')
				apiCalls.push(this._commonService.saveApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					if (o['result'].success) {
						if (arr[i].responseKey) {
							// if (arr[i].key == 'tasksList')
							this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
						} else {
							this.dropdowns[arr[i].key] = o['result'].data || [];
						}
					}
				});
				if (cb) cb();
			})
	}

	updateDates() {
		this.dateFields.map(key => {
			this.state.selectedTask[key] = this.state.selectedTask[key] ? new Date(this.state.selectedTask[key]) : null;
		});
		const startDate = _moment(_moment(this.state.selectedTask.start_date).format('MM-DD-YYYY')).diff(_moment(_moment(new Date()).format('MM-DD-YYYY')), 'days');
		const endDate = _moment(_moment(this.state.selectedTask.due_date).format('MM-DD-YYYY')).diff(_moment(_moment(new Date()).format('MM-DD-YYYY')), 'days');
		this.formFields[2].min = startDate <= 0 ? this.state.selectedTask.start_date : new Date();
		this.formFields[3].min = endDate <= 0 ? this.state.selectedTask.due_date : new Date();
	}

	changeAssigneType(val, id = '') {
		this.dropdowns.inactiveOptions.assigneeList = [];
		let org_type = 0;
		this.taskForm.patchValue({
			assignee_id: id
		}, { emitEvent: false })
		if (val == 1) org_type = 1;
		else if (val == 3) org_type = 3;
		const asigneeTypeControl = _.find(this.formFields, ['key', 'assignee_type']);
		const asigneeControl = _.find(this.formFields, ['key', 'assignee_id']);
		let label = 'Assignee';
		if (val == 1) {
			label = 'Assignee (Internal)';
			this.state.selectedTask[asigneeTypeControl.display_name] = 'Internal';
		}
		if (val == 2) {
			label = 'Assignee (Group)';
			this.state.selectedTask[asigneeTypeControl.display_name] = 'Group';
		}
		if (val == 3) {
			label = 'Assignee (External)';
			this.state.selectedTask[asigneeTypeControl.display_name] = 'External';
		}
		if (val == 3) asigneeControl.minLength = 3;
		else asigneeControl.minLength = 0;
		asigneeControl.label = label;
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

	getTaskDetails(id, cb?) {
		this.state.isLoading = true;
		this._commonService.getApi('jobsTasksDetails', { id: id })
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.selectedTask = res['result'].data[0];
					this.resetDetailView();
					this.checkPermissions();
					this.infoConfig = {
						last_modified_by: this.state.selectedTask.last_modified_by,
						last_modified_date: this.state.selectedTask.last_modified_on,
						created_by: this.state.selectedTask.created_by,
						created_date: this.state.selectedTask.created_on
					}
					const due_date = _.find(this.formFields, ['key', 'due_date']);
					if (this.state.selectedTask.parent_id != 0) {
						if (this.state.selectedTask.parent_due_date) due_date.max = new Date(this.state.selectedTask.parent_due_date);
					}
					if (cb) cb();
					this.state.selectedTask.note_description = this.state.selectedTask.note ? this.state.selectedTask.note.replace(/\n/g, '<br/>') : '';
					this.state.selectedTask.product_cnt = Object.keys(this.state.selectedTask.products || {}).length;
					this.state.selectedTask.service_cnt = this.state.selectedTask.associate_products ? this.state.selectedTask.associate_products.length : 0;
					if (this.state.selectedTask.estimate_hrs) {
						const hours = Math.floor(this.state.selectedTask.estimate_hrs / 60);
						const minutes = ('0' + Math.floor(this.state.selectedTask.estimate_hrs % 60)).slice(-2);
						this.state.selectedTask.estimate_hrs = hours + ':' + minutes;
					}
					const api = [];
					const asigneeControl = _.find(this.formFields, ['key', 'assignee_id']);
					const taskControl = _.find(this.formFields, ['key', 'task_id']);
					if (this.state.selectedTask.hasOwnProperty('assignee_type')) {
						if (!this.state.selectedTask.is_milestones) this.changeAssigneType(this.state.selectedTask.assignee_type, this.state.selectedTask.assignee_id);
						// if (this.state.selectedTask.assignee_type == 2) {
						// 	api[0] = { key: 'assigneeList', responseKey: 'groups', url: 'getGroups', method: 'get', params: { page: 1, pageSize: 500, status: true } };
						// } else {
						// 	api[0] = { key: 'assigneeList', url: 'getOrgUser', method: 'get', params: { org_type: this.state.selectedTask.assignee_type, status: true } };
						// }
					}
					const prop = this.state.selectedTask.is_milestones ? 'milestones' : this.state.selectedTask.task_type_id == 33 ? 'wop' : 'tasks';
					const val = this.state.selectedTask.is_milestones ? 2 : 1;
					if (!this.dropdowns.tasksList[prop].length) {
						let params = {
							page: 1,
							pageSize: 1000,
							sort: 'asc',
							status: true,
							is_milestone: val
						}
						if (val == 2) params['milestone_type'] = 1;
						if (this.state.selectedTask.task_type_id == 33) params['is_workorderprepress'] = true;
						this._commonService.getApi('getTasks', params)
							.then(res => {
								if (res['result'].success) {
									this.dropdowns.tasksList[prop] = res['result'].data.items || [];
								}
							})
					}
					let label = 'Assignee';
					if (this.state.selectedTask.assignee_type == 1) label = 'Assignee (Internal)';
					if (this.state.selectedTask.assignee_type == 2) label = 'Assignee (Group)';
					if (this.state.selectedTask.assignee_type == 3) label = 'Assignee (External)';
					if (this.state.selectedTask.assignee_type == 3) asigneeControl.minLength = 3;
					else asigneeControl.minLength = 0;
					if (this.state.selectedTask.is_milestones) taskControl.label = 'Milestone';
					else taskControl.label = 'Task';
					taskControl.can_edit = this.state.selectedTask.jobs_task_type != 2;
					if (this.state.selectedTask.is_milestones && this.state.selectedTask.slug == 'delivery_due_date') {
						taskControl.can_edit = false;
					}
					asigneeControl.label = label;
					if (api.length) this.getApiCalls(api);
					this.updateDates();
					this.setForm(this.state.selectedTask);
					if (this.state.selectedTask.job_default_task == 0) this.getMessages();
					if (this.state.accordian.products.isOpen) {
						this.getProductsServices();
					}
					this.showView(['start_date', 'assignee_id', 'assignee_type'], true);
					this.setValidators(['due_date']);
					if (this.state.selectedTask.job_default_task == 1) {
						if (this.state.selectedTask.is_milestones) this.clearValidators(['task_type_id', 'start_date', 'assignee_id', 'assignee_type']);
						else this.clearValidators(['task_type_id', 'start_date']);
						this.showView(['start_date', 'assignee_id', 'assignee_type'], !this.state.selectedTask.is_milestones);
					}
					else if (this.state.selectedTask.is_milestones) {
						this.clearValidators(['start_date', 'assignee_id', 'assignee_type']);
						this.showView(['start_date', 'assignee_id', 'assignee_type'], false);
					}
					else {
						this.setValidators(['task_type_id', 'start_date', 'due_date', 'assignee_id', 'assignee_type']);
					}

					if (this.state.selectedTask.task_type_id == 1) this.taskForm.controls.estimate_hrs.setValidators([Validators.required, TimeValidators(/^([0-9]|[0-9][0-9]):[0-5][0-9]$/)])
					else this.taskForm.controls.estimate_hrs.clearValidators();

					const isExists = !Array.isArray(this.state.selectedTask.form_data);
					if (isExists && this.state.selectedTask.form_data) {
						this.editAddress(this.state.selectedTask.form_data.address);
						this.createDynamicForm();
						this.state.selectedTask.form_data.specDt.map((val, i) => {
							this.ids.setControl(i, new FormControl(val.spectDt.id));
							this.defaults.setControl(val.spectDt.id, this._fb.group(this.createFormBuilder(val.spectDt, val.form_save_values)));
						});
						this.fileTypeChange(this.state.selectedTask.form_data.specDt);
						this.showDynamicForm = true;
					} else {
						this.showDynamicForm = false;
					}
				}
			})

	}

	createForm() {
		this.taskForm = this._fb.group(buildForm([...this.formFields, ...this.extraFileds]));
		this.taskForm.controls.task_id.valueChanges.subscribe(val => {
			const prop = this.state.selectedTask.is_milestones ? 'milestones' : 'tasks';
			const selected = _.find(this.dropdowns.tasksList[prop], ['id', val]);
			if (selected) this.taskForm.controls.task_name.setValue(selected.name);
		});
	}

	setForm(data) {
		this.taskForm.patchValue(updateForm([...this.formFields, ...this.extraFileds], data), { emitEvent: false, onlySelf: false });
	}

	toggleEdit(bol: boolean) {
		this.state.showButtons = bol;
		const asigneeControl = _.find(this.formFields, ['key', 'assignee_id']);
		const asigneeTypeControl = _.find(this.formFields, ['key', 'assignee_type']);
		this.formFields.map(field => {
			if (field.can_edit) {
				if (field.key == 'due_date') {
					if (this.state.selectedTask && this.state.selectedTask.due_date_edit) field['is_edit'] = bol;
					else field['is_edit'] = false;
					if (field['is_edit']) {
						field.label = 'Due Date <em>(MM-DD-YYYY HH:MM)</em>';
					} else {
						field.label = 'Due Date'
					}
				} else if (field.key == 'start_date') {
					if (this.state.selectedTask && this.state.selectedTask.start_date_edit) field['is_edit'] = bol;
					else field['is_edit'] = false;
					if (field['is_edit']) {
						field.label = 'Start Date <em>(MM-DD-YYYY HH:MM)</em>';
					} else {
						field.label = 'Start Date';
					}
				} else {
					field['is_edit'] = bol;
				}
			}
		});
		if (this.state.selectedTask && this.state.selectedTask.is_milestones) {
			asigneeControl.can_edit = false;
			asigneeTypeControl.can_edit = false;
			this.taskForm.controls.assignee_id.disable();
			this.taskForm.controls.assignee_type.disable();
		}
		else {
			asigneeControl.can_edit = true;
			asigneeTypeControl.can_edit = true;
			this.taskForm.controls.assignee_id.enable();
			this.taskForm.controls.assignee_type.enable();
		}

		this.note['is_edit'] = bol;
		this.time['is_edit'] = bol;
	}

	statusChange(st) {
		this.transitionChange(st);
	}

	transitionChange(trans) {
		this._commonService.saveApi('taskFlow', { id: this.state.selectedTask.id, status_id: trans.id, key: trans.key, jobs_id: this.state.projectID, task_id: this.state.selectedTask.task_id, task_type_id: this.state.selectedTask.task_type_id })
			.then(res => {
				if (res['result'].success) {
					this.updateJobStatus();
					if (res['result'].data.status) {
						this._taskService.update({ type: 'detail-trans', data: { trans: trans, res: res['result'].data, selected: this.state.selectedTask } });
						this.taskForm.patchValue({
							status: res['result'].data.status_id,
							status_name: res['result'].data.status_name
						}, { emitEvent: false });
						this.state.selectedTask.is_enable = trans.id == 5 ? false : true;
						this.state.selectedTask.status = res['result'].data.status_id;
						this.state.selectedTask.status_name = res['result'].data.status_name;
						this.state.selectedTask.status_buttons = res['result'].data.status_buttons;
						this.state.selectedTask.status_dropdown = res['result'].data.status_dropdown;
						this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res['result'].data);
						this.snackbarModal('success', false, 'Task Status Updated Successfully');
					} else {
						this.snackbarModal('error', false, res['result'].data.message);
					}
				}
			})
	}

	updateModifiedUser(row, keys, data) {
		keys.map(prop => {
			row[prop] = data[prop];
			this.infoConfig[prop] = data[prop];
		});
		this.infoConfig = { ...this.infoConfig };
	}

	updateJobStatus() {
		this._commonService.getApi('getJobInfo', { id: this.state.projectID, type: 'status' })
			.then(res => {
				if (res['result'].success) {
					this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
				}
			})
	}

	confirmSchedule(task, params, data, cb?) {
		let oldDate = _moment(params.old_date).format('MMM DD, YYYY');
		this._dialog.open(ConfirmationComponent, {
			panelClass: ['recon-dialog', 'confirmation-dialog'],
			width: '570px',
			data: {
				title: 'Schedule',
				url: 'updateTaskDueDate',
				method: 'post',
				params: {
					id: task.id,
					jobs_id: this.state.projectID,
					interval: data.interval,
					new_date: data.new_date,
					ids: data.ids,
					type: 'all',
					is_default: params.is_default,
					slug: task.slug
				},
				content: `<div class="po-dialog">
									<div class="">
										<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
									</div>
									<div class="">
										<p>Do you want to move all the othertasks due after <br /> ${oldDate} by ${params.interval} Days</p>
									</div>
								</div>`,
				buttons: {
					yes: 'Update All Other Tasks',
					no: 'Don\'t Update Other Tasks'
				},
				cancelAction: true
			}
		})
			.afterClosed()
			.subscribe(res => {
				this.state.isAjaxProcess = false;
				if (res && res.success) {
					this._taskService.update({ type: 'confirm-schedule', data: { selected: data, res: res.data } });
					if (data.interval >= 0) this.state.selectedTask.due_date = _moment(new Date(this.state.selectedTask.due_date)).add(data.interval, 'day').format('MMM DD, YYYY HH:MM');
					else this.state.selectedTask.due_date = _moment(new Date(this.state.selectedTask.due_date)).subtract(Math.abs(data.interval), 'day').format('MMM DD, YYYY HH:MM');
					this.taskForm.patchValue({
						due_date: new Date(this.state.selectedTask.due_date)
					});
					this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res.data.result);
					if (this.state.continue) this.updateTaskDetails(this.taskForm);
				} else {
					if (cb) cb();
				}

			})
	}

	checkSchedule(task, params, data, cb?) {
		this._dialog.open(CheckScheduleComponent, {
			panelClass: 'recon-dialog',
			width: '680px',
			data: {
				title: 'Edit Due Date',
				list: data.list, //list
				params: {
					id: task.id,
					jobs_id: this.state.projectID,
					interval: data.interval,
					new_date: data.new_date,
					ids: data.ids,
					list: data.list,
					is_delivery: true,
					slug: task.slug
				}
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					this._taskService.update({ type: 'check-schedule', data: data, result: res.data });
					this.confirmSchedule(task, params, data);
				} else {
					if (cb) cb();
				}
			})
	}

	updateDueDate(task, oldValue, newValue, isStart = false, cb?) {
		const params = {
			id: task.id,
			old_date: _moment(oldValue).format('YYYY-MM-DD HH:mm:ss'),
			new_date: _moment(newValue).format('YYYY-MM-DD HH:mm:ss'),
			interval: _moment.duration(newValue.diff(oldValue)).days(), // >= 0 ? _moment.duration(newValue.diff(oldValue)).days() + 1 : _moment.duration(newValue.diff(oldValue)).days(),
			jobs_id: this.state.projectID,
			is_delivery: task.is_delivery,
			is_start: isStart,
			slug: task.slug
		}
		this._commonService.saveApi('chkTaskDueDates', params)
			.then(res => {
				if (res['result'].success) {
					if (res['result'].data.action) {
						if (res['result'].data.list.length) {
							params['is_default'] = false;
							this.checkSchedule(task, params, res['result'].data, () => {
								if (cb) cb();
							});
						} else {
							params['is_default'] = true;
							this.confirmSchedule(task, params, res['result'].data, () => {
								if (cb) cb();
							});
						}
					}
				} else {
					if (cb) cb();
				}
			})
	}

	saveTask(form, cb?) {
		this.state.submitted = true;
		if (form.valid) {
			this.state.submitted = false;
			this.state.isAjaxProcess = true;
			let changedDate = _moment(form.value.due_date);
			let oldDate = _moment(this.state.selectedTask.due_date);
			if (!changedDate.isSame(oldDate) && this.state.selectedTask.jobs_task_type == 1) {
				this.state.continue = true;
				this.updateDueDate(this.state.selectedTask, oldDate, changedDate, false, () => {
					this.state.isAjaxProcess = false;
				});
			} else {
				this.updateTaskDetails(form);
			}
		}
	}

	updateTaskDetails(form) {
		/* Date Formating */
		const formValue = _.cloneDeep(form.value);
		this.dateFields.map(o => {
			if (formValue[o]) formValue[o] = _moment(formValue[o]).format('YYYY-MM-DD HH:mm:ss');
		});
		/* Products Formating */
		let services = [], products = {};
		if (this.state.accordian.products.list.length) {
			this.state.accordian.products.list.map(p => {
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
			formValue.associate_products = services;
			formValue.products = products;
		} else {
			formValue.associate_products = services = this.state.selectedTask.associate_products;
			formValue.products = products = this.state.selectedTask.products || {};
		}

		this.formFields.map(field => {
			if (field.type == 'select') {
				let getValue: any;
				if (field.multi) {

				} else {
					if (field.key == 'assignee_id')
						getValue = _.find(this.dropdowns[field.options][formValue.assignee_type], ['id', this.taskForm.controls[field.key].value]);
					else
						getValue = _.find(this.dropdowns[field.options], ['id', this.taskForm.controls[field.key].value]);
					if (getValue) formValue[field.display_name] = field['nameKey'] ? getValue[field['nameKey']] : getValue.name;
				}
			}
		})
		form.type = 'normal';
		formValue.is_milestone = this.state.selectedTask.is_milestones;
		formValue.slug = this.state.selectedTask.slug;
		formValue.jobs_id = this.state.projectID;

		if (formValue.estimate_hrs) {
			if (formValue.estimate_hrs.split(/[.|:]+/).length == 1) formValue.estimate_hrs = formValue.estimate_hrs.concat(':00');
			else if (formValue.estimate_hrs.split('.').length > 1) formValue.estimate_hrs = formValue.estimate_hrs.split('.').join(':');
		}

		if (this.showDynamicForm) {
			formValue.form_data = {
				form_save_values: objectToArray(this.ids.value, this.defaults.value),
				spec_ids: this.ids.value,
				address: { ...this.editAddressForm.value, ...{ country_name: this.state.selectedTask.form_data.address.country_name, state_name: this.state.selectedTask.form_data.address.state_name } }
			}

			formValue.form_data.form_save_values.map(o => {
				const spec = _.find(this.state.selectedTask.form_data.specDt, ['spectDt.id', o.id]);
				if (spec && spec.spectDt.template_id == 1) {
					if (spec.spectDt.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
					else o.value = o.value ? [o.value] : [];
				}
			})
		}
		this._commonService.saveApi('updateJobsTasks', formValue)
			.then(res => {
				this.state.isAjaxProcess = false;
				if (res['result'].success) {
					this.toggleEdit(false);
					this.snackbarModal('success', false);
					this.state.selectedTask.product_cnt = Object.keys(products).length;
					this.state.selectedTask.service_cnt = services.length;
					this.formFields.map(field => {
						if (field.type == 'select') {
							let getValue: any;
							if (field.multi) {

							} else {
								if (field.key == 'task_id') {
									const prop = this.state.selectedTask.is_milestones ? 'milestones' : 'tasks';
									getValue = _.find(this.dropdowns.tasksList[prop], ['id', this.taskForm.controls[field.key].value]);
								} else if (field.key == 'assignee_id') {
									getValue = _.find(this.dropdowns[field.options][formValue.assignee_type], ['id', this.taskForm.controls[field.key].value]);
								} else {
									getValue = _.find(this.dropdowns[field.options], ['id', this.taskForm.controls[field.key].value]);
								}
								if (getValue) this.state.selectedTask[field.display_name] = field['nameKey'] ? getValue[field['nameKey']] : getValue.name;
							}
						}
					})
					if (this.showDynamicForm) {
						this.state.selectedTask.form_data.address = { ...this.state.selectedTask.form_data.address, ...this.editAddressForm.value };
						if (this.state.selectedTask.form_data.address.country_id)
							this.state.selectedTask.form_data.address.country_name = this.getCountryName('countries', this.editAddressForm.value.country_id);
						if (this.state.selectedTask.form_data.address.state_id)
							this.state.selectedTask.form_data.address.state_name = this.getCountryName('states', this.editAddressForm.value.state_id);
					}
					this.state.selectedTask.associate_products = formValue.associate_products;
					this.state.selectedTask.products = formValue.products;
					this.state.selectedTask.note = formValue.note;
					this.state.selectedTask.note_description = this.state.selectedTask.note ? this.state.selectedTask.note.replace(/\n/g, '<br/>') : '';
					if (formValue.estimate_hrs) {
						const time = formValue.estimate_hrs.split(':');
						this.state.selectedTask.estimate_hrs = time[0] + ':' + time[1];
					}
					form.controls.estimate_hrs.setValue(formValue.estimate_hrs);
					// this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res['result'].data);
					if(res['result'].data['assignee_dept']){
						this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on', 'assignee_dept'], res['result'].data);
					}else{
						this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res['result'].data);
					}
					this._taskService.update({ type: 'save-selected', data: { selected: this.state.selectedTask, form: form.value } });

					this.state.continue = false;
				}
			})
			.catch(err => {
				this.state.isAjaxProcess = false;
			})
	}

	cancelTask() {
		this.toggleEdit(false);
		this.taskForm.reset(updateForm([...this.formFields, ...this.extraFileds], this.state.selectedTask), { emitEvent: false });
	}

	createLogForm() {
		this.logForm = this._fb.group({
			id: '',
			log_time: ['', [Validators.required, Validators.pattern(/^([0-9][0-9])(:|.| )[0-5][0-9]$/)]],
			jobs_tasks_id: '',
			description: ''
		})
	}

	resetLogForm() {
		this.trackConfig.isChange = !this.trackConfig.isChange;
		this.trackConfig = { ...this.trackConfig };
	}

	addLog(){
		this.trackConfig.defaultValues = {
			id: '',
			jobs_id: this.state.projectID,
			jobs_tasks_id: this.state.taskId,
			date: new Date(),
			range: [9, 12],
			track_time: '3:00 h',
			description: ''
		};
	}

	editLog(log, indx){
		this.trackConfig.defaultValues = {
			id: log.log_id,
			jobs_id: this.state.projectID,
			jobs_tasks_id: this.state.selectedTask.id,
			date: new Date(log.start),
			range: JSON.parse(log.range),
			track_time: log.log_time,
			description: log.description
		};
	}

	deleteLog(log, indx) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: ["recon-dialog", "confirmation-dialog"],
			width: '600px',
			data: {
				title: 'Remove Task Log',
				action: 'remove',
				url: 'removeTasksLogs',
				params: {
					id: log.log_id,
					jobs_tasks_id: this.state.selectedTask.id,
					type: 'single'
				},
				content: 'Are you sure, you want to remove this Log'
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.snackbarModal('success', false, 'Log Time Deleted Successfully');
					this.state.selectedTask.log.splice(indx, 1);
				}
			})
	}

	saveLogTime() {
		this.state.accordian.time.submitted = true;
		if (this.logForm.valid) {
			this.state.accordian.time.submitted = false;
			this._commonService.update({ type: 'overlay', action: 'start' });
			this._commonService.saveApi('saveTasksLogs', this.logForm.value)
				.then(res => {
					if (res['result'].success) {
						/* change after json update */
						res['result'].data.created_on = res['result'].data.created_on.date;
						this.state.selectedTask.log.push(res['result'].data);
						this.trigger.closeMenu();
					}
					this._commonService.update({ type: 'overlay', action: 'stop' });
				}).catch(err => {
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
		}
	}

	totalDuration = '00h 00m';

	sum(arr) {
		return arr.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
	}

	onAfterClose(ev) {
		if (!ev.isCancel) {
			ev.data.created_on = ev.data.created_on.date;
			if(this.state.selectedTask.log.filter((row, index)=>{
				if(row.log_id==ev.data.log_id){
					this.state.selectedTask.log[index] = ev.data;
					return true;
				}
				return false;
			}).length){

			}else{
				this.state.selectedTask.log.push(ev.data);
			}
			let minutesArr = [];
			this.state.selectedTask.log.map((log, i) => {
				var startTime = _moment(log.start, "YYYY-MM-DD HH:mm:ss");
				var endTime = _moment(log.end, "YYYY-MM-DD HH:mm:ss");
				var duration = _moment.duration(endTime.diff(startTime));
				var hours = parseInt((<any>duration.asHours()));
				var minutes = parseInt((<any>duration.asMinutes())) - hours * 60;
				log.log_time = ((hours < 9 ? '0' + hours : hours) + ' h ' + (minutes < 9 ? '0' + minutes : minutes) + ' m');
				minutesArr.push(duration.asMinutes());
			});
			let duration = _moment.duration({ 'minutes': this.sum(minutesArr) });
			let hours = (<any>duration)._data.hours < 9 ? '0' + (<any>duration)._data.hours : (<any>duration)._data.hours;
			let minutes = (<any>duration)._data.minutes < 9 ? '0' + (<any>duration)._data.minutes : (<any>duration)._data.minutes;
			// this.totalDuration = hours + 'h ' + minutes + 'm';
			this.totalDuration = hours + ':' + minutes + ' h';
			this._taskService.update({ type: 'add-log-time', data: { selected: this.state.selectedTask, duration: this.totalDuration } });
		}
		this.trigger.closeMenu();
		this.editTrigger.closeMenu();
	}

	getProductsServices() {
		if (!this.state.accordian.products.list.length) {
			this.state.accordian.products.isLoading = true;
			this._commonService.getApi('getVendorProdServices', { jobs_id: this.state.projectID, type: 'task' })
				.then(res => {
					this.state.accordian.products.isLoading = false;
					if (res['result'].success) {
						this.state.accordian.products.list = res['result'].data || [];
						this.checkProducts();
					}
				})
		} else {
			this.checkProducts();
		}
	}

	checkProducts() {
		this.state.accordian.products.list.map(p => {
			p.selected = false;
			p.services.map(s => {
				s.selected = this.state.selectedTask.associate_products.indexOf(s.jsr_id) > -1 ? true : false;
				if (s.selected) {
					p.selected = true;
					this.productControl.setValue(p.id);
					this.serviceControl.setValue(s.jsr_id);
				}
			})
		})
	}

	checkAllServices(product: any, status: any): void {
		// product.services.map((service) => {
		// 	service.selected = status;
		// });
		this.serviceControl.setValue(product.services[0].jsr_id);
		this.updateSelection();
	}

	checkService(product: any, status: any): void {
		// if (status) {
		// 	product.selected = status;
		// } else {
		// 	product.services.filter((service) => {
		// 		return service.selected;
		// 	}).length ? product.selected = true : product.selected = false;
		// }
		this.productControl.setValue(product.id);
		this.updateSelection();
	}

	updateSelection() {
		this.state.accordian.products.list.map(p => {
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

	resetDetailView(flag = 'details') {
		this.state.submitted = false;
		this.state.showButtons = false;
		this.toggleEdit(false);
	}

	goToParent(id) {
		this._taskService.update({ type: 'go-to-parent', data: id });
		this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + id]);
	}

	showView(fields, bol) {
		fields.map(o => {
			const field = _.find(this.formFields, ['key', o]);
			if (field) field.showView = bol;
		})
	}

	clearValidators(controls) {
		controls.map(o => {
			this.taskForm.controls[o].clearValidators();
			this.taskForm.controls[o].updateValueAndValidity();
		})
	}

	checkDateValidation(key) {
		if (!isDate((!_moment.isMoment(this.taskForm.controls[key].value) ? this.taskForm.controls[key].value : this.taskForm.controls[key].value._d))) this.taskForm.controls[key].setValue(null);
	}

	checkTimeValidation() {
		if (!TimeValidation(this.taskForm.controls.estimate_hrs.value))
			this.taskForm.controls.estimate_hrs.setValue('');
		else {
			if (!isNaN(this.taskForm.controls.estimate_hrs.value)) {
				if (this.taskForm.controls.estimate_hrs.value.length > 2)
					if (this.taskForm.controls.estimate_hrs.value.charAt(0) == 0) this.taskForm.controls.estimate_hrs.setValue(this.taskForm.controls.estimate_hrs.value.substr(1));
			}
		}
	}

	setValidators(controls) {
		controls.map(o => {
			const field = _.find(this.formFields, ['key', o]);
			if (this.dateFields.indexOf(o) > -1)
				this.taskForm.controls[o].setValidators([Validators.required, DateValidator('MM-DD-YYYY HH:MM', field.min, field.max)]);
			else
				this.taskForm.controls[o].setValidators(Validators.required);
			this.taskForm.controls[o].updateValueAndValidity();
		})
	}

	/**
	 * 
	 * @param isNew newley created task or not
	 * @param msg message to be displayed in snackbar
	 */
	snackbarModal(status = 'success', isNew = true, msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: status, msg: msg ? msg : ('Task ' + (isNew ? 'Created ' : 'Updated ') + ' Successfully') },
			verticalPosition: 'top',
			horizontalPosition: 'right',
			panelClass: status
		});
	}

	detailActions(flag) {
		let locals: any = {};
		if (flag == 'reject') {
			locals = {
				title: 'Reject Task',
				url: '',
				method: 'post',
				params: {},
				content: `<div class="po-dialog">
											<div class="">
												<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
											</div>
											<div class="">
												<p>Are you sure, you want to  Reject this Task ?</p>
											</div>
										</div>`
			};
			this.confirmModal(locals);
		} else if (flag == 'approve') {
			locals = {
				title: 'Approve Task',
				url: '',
				method: 'post',
				params: {},
				content: `<div class="po-dialog">
										<div class="">
											<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
										</div>
										<div class="">
											<p>Are you sure, you want to  Approve this Task ?</p>
										</div>
									</div>`
			};
			this.confirmModal(locals);
		} else if (flag == 'sub-task') {
			this.addTask('sub', this.state.selectedTask);
			this._taskService.update({ type: 'add-sub-task', data: this.state.selectedTask });
		} else if (flag == 'edit') {
			if (this.state.selectedTask.is_enable)
				this.toggleEdit(true);
		} else if (flag == 'change-state') {
			this.resetDetailView();
			this._taskService.update({ type: 'route-change', data: this.state.selectedTask.id });
			this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list']);
		}
	}

	confirmModal(locals, cb?) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'recon-dialog',
			width: '570px',
			data: { ...locals }
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) if (cb) cb();
			})
	}

	addTask(type = 'add', data = null) {
		// let rowIndex = null;
		// if (data) rowIndex = this.gridApi.getRowNode(data.id).rowIndex + 1;
		// this._dialog.open(CreateTaskComponent, {
		// 	panelClass: 'recon-dialog',
		// 	width: '780px',
		// 	data: {
		// 		title: type == 'sub' ? 'Add Sub Task' : 'Create New Task',
		// 		jobs_id: this.state.projectID,
		// 		jobs_name: this.state.breadcrumbs[1]['job_no'],
		// 		selectedRow: (type == 'sub' || type == 'dup') ? data : null,
		// 		type: type
		// 	}
		// })
		// 	.afterClosed()
		// 	.subscribe(res => {
		// 		if (res && res.success) {
		// 			if (res.data) {
		// 				res.data.is_enable = true;
		// 				const taskHierarchy = type == 'sub' ? [res.data.parent_id, res.data.id] : [res.data.id];
		// 				if (this.state.list.length) {
		// 					setTimeout(() => {
		// 						if (rowIndex)
		// 							this.gridApi.updateRowData({ add: [{ ...res.data, ...{ taskHierarchy: taskHierarchy, parent_name: res.data.parent_name } }], addIndex: rowIndex });
		// 						else
		// 							this.gridApi.updateRowData({ add: [{ ...res.data, ...{ taskHierarchy: taskHierarchy, parent_name: res.data.parent_name } }] });
		// 						this.gridApi.redrawRows();
		// 					}, 20);
		// 					this.state.selectedTask = res.data;
		// 					this.trackConfig.defaultValues.jobs_tasks_id = this.state.selectedTask.id;
		// 					this.state.selectedRow = res.data;
		// 					this.getTaskDetails(this.state.selectedTask.id);

		// 					if (!this.state.isSplit) {
		// 						this.state.isSplit = true;
		// 						this.generateColumns('half');
		// 					}
		// 				}
		// 				if (type == 'sub') {
		// 					const parentIndx = _.findIndex(this.state.list, ['id', res.data.parent_id]);
		// 					if (this.state.list[parentIndx].hasOwnProperty('child')) this.state.list[parentIndx].child.push(res.data);
		// 					else this.state.list[parentIndx].child = [res.data];
		// 					const row: RowNode = this.gridApi.getRowNode(res.data.parent_id);
		// 					if(row) {
		// 						row.data = this.state.list[parentIndx];
		// 						row.setData(row.data);
		// 					}
		// 				} else {
		// 					this.state.list.push(res.data);
		// 				}
		// 				if (this.state.selectedTask.parent_id == 0) {
		// 					this.state.selectedRow = this.state.selectedTask;
		// 				} else {
		// 					const row = _.find(this.state.list, ['id', this.state.selectedTask.parent_id]);
		// 					if (row) this.state.selectedRow = row;
		// 				}
		// 				this.state.framedList.push({ ...res.data, ...{ taskHierarchy: taskHierarchy } });
		// 			}
		// 			this.snackbarModal();
		// 		}
		// 	})
	}


	/* Dynamic Form */
	forms: FormGroup;
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
	createFormBuilder(spec, data: any = {}) {
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
				// group[option.id] = Object.keys(spec.value).length ? spec.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
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
			controls['value'] = data.value ? (Array.isArray(data.value) ? (data.value.length ? data.value[0] : '') : data.value) : (Array.isArray(spec.value) ? (spec.value.length ? spec.value[0] : '') : spec.value);
		} else {
			controls['value'] = spec.template_id == 3 ? (data ? [data.value] : [spec.value]) : (data ? data.value : spec.value);
		}
		if (spec.template_id == 3 || spec.key == 'dropdown') {
			spec.options.map(opt => { opt.name = opt.value; });
			if (data) {
				const name = spec.options.filter(o => { return o.id == data.value });
				data.display_name = name.length ? name[0].value : '---';
			} else {
				data.display_name = '---';
			}
		}
		return controls;
	}

	addressApiCalls = [
		{ key: 'countries', url: 'getCountries', method: 'get', responseKey: '', params: {} }
	];
	setAddress(data) {
		this.editAddressForm.patchValue(updateForm(this.addressForm, data), { emitEvent: false });
	}

	fileTypeChange(specDetails) {
		const val = (<FormGroup>this.defaults.controls['5d0cb34d4ada357ac0096c25']).controls.value.value;
		const specData = specDetails.filter(spec => {
			return spec.spectDt.id == '5d0cb34d4ada357ac0096c25';
		});
		const fileSourceSpec = specDetails.filter(spec => {
			return spec.spectDt.id == '5d0cb9364ada351f225a6462';
		});
		if (fileSourceSpec.length) {
			let label = '', value = '';
			if (val == 1) label = 'Previous Project Number';
			else if (val == 2) {
				label = 'RapidRemark Job Name';
				if (this.state.projectID)
					value = specData[0].form_save_values.value || this.state.selectedTask.job_no;
			}
			else if (val == 3) label = 'Box Link';
			fileSourceSpec[0].spectDt.label = label;
			this.defaults.controls['5d0cb9364ada351f225a6462'].patchValue({
				value: fileSourceSpec[0].form_save_values.value || value
			});
		}
		(<FormGroup>this.defaults.controls['5d0cb34d4ada357ac0096c25']).controls.value.valueChanges.subscribe(val => {
			if (specData.length) {
				const option = _.find(specData[0].spectDt.options, ['id', val]);
				if (option) {
					if (fileSourceSpec.length) {
						let label = '', value = '';
						if (val == 1) label = 'Previous Project Number';
						else if (val == 2) {
							label = 'RapidRemark Job Name';
							if (this.state.projectID)
								value = this.state.selectedTask.job_no;
						}
						else if (val == 3) label = 'Box Link';
						fileSourceSpec[0].spectDt.label = label;
						this.defaults.controls['5d0cb9364ada351f225a6462'].patchValue({
							value: value
						});
					}
				}
			}
		})
	}

	getJobAddress() {
		// this._commonService.getApi('getJobInfo', { id: this.data.jobs_id, type: 'tasks' })
		// 	.then(res => {
		// 		if (res['result'].success) {
		// 			const address = res['result'].data;
		// 			address.id = '';
		// 			if (Object.keys(address).length) {
		// 				if (address.country_id) this.getCountryState(address.country_id);
		// 				this.setAddress(address);
		// 			}
		// 		}
		// 	})
	}

	editAddress(address: any = null) {
		this.editAddressForm = this._fb.group(buildForm(this.addressForm));

		this.editAddressForm.controls.country_id.valueChanges.subscribe(val => {
			address.country_name = this.getCountryName('countries', val);
			this.getCountryState(val);
		})
		this.editAddressForm.controls.state_id.valueChanges.subscribe(val => {
			address.state_name = this.getCountryName('states', val);
		})
		if (address) {
			if (address.country_id) this.getCountryState(address.country_id, () => {
				if (address.state_id) address.state_name = this.getCountryName('states', address.state_id);
			});
			this.setAddress(address);
		}

		this.getAddressDropdowns(this.addressApiCalls, () => {
			if (address) {
				if (address.country_id) address.country_name = this.getCountryName('countries', address.country_id);
			}
		});
	}

	getCountryName(prop, id) {
		const country = _.find(this.dropdowns[prop], ['id', id])
		if (country) return country.name;
		else return '';
	}

	getAddressDropdowns(arr, cb) {
		this.getApiCalls(arr, cb);
	}

	getCountryState(id, cb?) {
		this._commonService.getApi('getStates/' + id, {})
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.states = res['result'].data || [];
					if (cb) cb();
				}
			})
	}

	/* Messages */
	resetMessage() {
		this.messages.showButtons = false;
		this.messages.newMessage = '';
		this.messages.uploadData.files = [];
	}

	checkDiscussion(cb?) {
		this._commonService.getApi('checkPoThread', { id: this.state.selectedTask.id, type: 'task' })
			.then(res => {
				if (res['result'].success) {
					if (res['result'].data.threadStatus) {
						if (cb) cb({ success: true, data: res['result'].data });
					} else {
						if (cb) cb({ success: false, data: {} })
					}
				} else {
					this.messages.inProgress = false;
				}
			})
	}

	getMessageList(threadId) {
		this.messages.isNew = false;
		this._commonService.getApi('thread', { thread_id: threadId, type: 'thread' })
			.then((res: any) => {
				if (res.result.success) {
					if (!res.result.data.message.length) this.messages.noData = true;
					else {
						this.messages.noData = false;
						this.messages.list = res.result.data.message[0].message;
						this.messages.thread = res.result.data.message[0].thread;
						this.messages.list.reverse();
						this.messages.list.map(o => {
							o.message = o.message.replace(/\n/g, '<br/>');
						});
						setTimeout(this.scrollToBottom.bind(this), 0);
					}
				} else {
					this.messages.noData = true;
				}
				this.messages.inProgress = false;
			})
	}

	createDiscussion() {
		this._dialog.open(CreateThreadComponent, {
			width: '780px',
			data: {
				jobs_id: this.state.projectID,
				id: this.state.selectedTask.id,
				isNew: false,
				from: 'task',
				breadcrum_type: 3
			}
		})
			.afterClosed()
			.subscribe(result => {
				if (result && result.success) {
					this.messages.inProgress = true;
					this.messages.threadId = result.data.thread_id;
					this.getMessageList(result.data.thread_id);
					this.snackbarModal('success', false, 'Discussion Created Successfully');
				}
			});
	}

	getMessages() {
		this.resetMessage();
		this.messages.inProgress = true;
		this.checkDiscussion(obj => {
			if (obj.success) {
				this.messages.threadId = obj.data.threadId;
				this.getMessageList(obj.data.threadId);
			} else {
				this.messages.inProgress = false;
				// this.messages.isNew = true;
				this.messages.isNew = false;
				this.messages.noData = true;
			}
		});

	}

	onMessageAdd(event) {
		this.messages.list.push((<any>{
			created: event.created,
			message: event.message.replace(/\n/g, '<br />'),
			created_date: _moment().format('MM/DD/YYYY h:mm:ss a'),
			attachment: event.attachment
		}))

		this.resetMessage();

		this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
	}

	createMessage() {
		this.messages.list.push((<any>{
			created: this.messages.userName,
			message: this.messages.newMessage.replace(/\n/g, '<br />'),
			created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
		}))

		let params = {
			message: this.messages.newMessage,
			thread_id: this.messages.thread['thread_id'] || null,
			attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
		}

		if (!params.thread_id) {
			params['from'] = 'task';
			params['jobs_id'] = this.state.projectID;
			params['id'] = this.state.selectedTask.id;
		}

		this._commonService.saveApi('saveMessage', params)
			.then(res => {
				this.messages.list[this.messages.list.length - 1] = res['result'].data[0].message[0];
			});

		this.resetMessage();

		this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
	}

	scrollToBottom(): void {
		try {
			this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
		} catch (err) { }
	}

	onKeydown(e) {

		let key = e.which || e.keyCode,
			shiftKey = !!e.shiftKey;

		if (key === 13) {
			if (shiftKey) {
				setTimeout(this.scrollToBottom.bind(this), 0);
			} else if (this.messages.newMessage) {
				e.preventDefault();

				this.createMessage();

				setTimeout(this.scrollToBottom.bind(this), 0);
			}

		}
	}

	removeAttachment(i) {
		this.messages.uploadData.files.splice(i, 1);
	}

	checkPermissions() {
		let isRelatedToProject = this._commonService.is_related_to_project;
		let isMilestone = this.state.selectedTask.is_milestones;
		let taskKey = isRelatedToProject ? 'tasks_assigned_me' : 'tasks_assigned_others';
		taskKey = isMilestone ? 'milestones' : taskKey;
		let permKey = isRelatedToProject ? 'job_specific_user' : isMilestone ? 'job_specific_others' : 'job_specific_others';
		if (this._commonService.job_status_id == 8 || this._commonService.job_status_id == 10) {
			if (APP.permissions.job_access['post-completion_estimate'] != 'yes') {
				this.allowEdit = false;
				return;
			}
			this.allowEdit = APP.permissions.job_access[taskKey][permKey] == 'edit';
		}
		this.allowEdit = APP.permissions.job_access[taskKey][permKey] == 'edit';
	}
}
