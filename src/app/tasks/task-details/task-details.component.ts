import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from '@app/common/common.service';
import { ApiCallBase, isDate, DateValidator, TimeValidators, TimeValidation } from '@app/shared/utility/config';
import { forkJoin } from 'rxjs';
import { buildForm, updateForm } from '@app/admin/admin.config';
import { MatMenuTrigger, MatDialog, MatSnackBar } from '@angular/material';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { TasksService } from '../tasks.service';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { CheckScheduleComponent } from '@app/projects/project-details/tasks/check-schedule/check-schedule.component';

import * as _ from 'lodash';
import * as _moment from 'moment';

var APP: any = window['APP'];

@Component({
	selector: 'app-task-details',
	templateUrl: './task-details.component.html',
	styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
	@ViewChild('logTimeTrigger') trigger: MatMenuTrigger;
	@ViewChild('messageListSection') private messageListContainer: ElementRef;
	@ViewChild('focusElement') private logTimeField: ElementRef;

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
		{ showView: true, can_edit: true, key: 'start_date', error_label: 'Start Date', label: 'Start Date', type: 'date', min: new Date(), max: null, validations: { required: true }, default: new Date() },
		{ showView: true, can_edit: true, key: 'due_date', error_label: 'Due Date', label: 'Due Date', min: new Date(), max: null, type: 'date', validations: { required: true }, default: null },
		{ showView: true, can_edit: true, key: 'assignee_type', display_name: 'assignee_type_name', label: 'Assignee Type', type: 'select', multi: false, options: 'assigneeTypes', settings: { required: true }, default: '1' },
		{ showView: true, can_edit: true, key: 'assignee_id', display_name: 'assignee_name', minLength: 0, label: 'Assignee', type: 'select', multi: false, options: 'assigneeList', validations: { required: true }, default: '' },
	];
	extraFileds = [
		{ key: 'id', label: 'ID', type: 'none', default: '' },
		{ key: 'status', label: 'Status', type: 'none', default: '' },
		{ key: 'status_name', label: 'Status Name', type: 'none', default: '' },
		{ key: 'task_name', label: 'Task Name', type: 'none', default: null },
		{ can_edit: true, key: 'note', label: 'Note', type: 'textarea', default: '' },
		{ key: 'estimate_hrs', label: 'Estimate Hrs', type: 'none', default: null }
	];

	apiCalls: Array<ApiCallBase> = [
		// { key: 'taskStatuses', url: 'getTaskStatuses', method: 'get', params: { status: true, search: '' } },
		// { key: 'tasksList', url: 'getTasks', method: 'get', responseKey: 'items', params: { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1 } },
	];

	productControl = new FormControl();
	serviceControl = new FormControl();

	state = {
		type: 'all',
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

	constructor(
		private _fb: FormBuilder,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _commonService: CommonService,
		private _router: Router,
		private _activeRoute: ActivatedRoute,
		private _taskService: TasksService
	) {
		_activeRoute.parent.parent.data.subscribe(data => {
			if (data) this.state.type = data.flag;
		})
		_activeRoute.params.subscribe(param => {
			this.state.taskId = param.id ? param.id : null;
			this.trackConfig.defaultValues.jobs_tasks_id = this.state.taskId;
			if (this.state.taskId) this.getTaskDetails(this.state.taskId);
		})
		_taskService.onUpdate().subscribe(ev => {
			if (ev.type == 'task-ag-status-change') {
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
	}

	ngOnInit() {
		if (this.apiCalls.length) this.getApiCalls(this.apiCalls);
		this.createForm();
		this.createLogForm();
	}

	goToProject(id) {
		this._router.navigate(['/projects/' + id + '/overview']);
	}

	getApiCalls(arr) {
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

					this.trackConfig.defaultValues.jobs_id = this.state.selectedTask.jobs_id;

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
					if(this.state.selectedTask.estimate_hrs) this.state.selectedTask.estimate_hrs = Math.floor(this.state.selectedTask.estimate_hrs / 60) + ':' + Math.floor(this.state.selectedTask.estimate_hrs % 60);
					const api = [];
					const asigneeControl = _.find(this.formFields, ['key', 'assignee_id']);
					const taskControl = _.find(this.formFields, ['key', 'task_id']);
					if (this.state.selectedTask.hasOwnProperty('assignee_type')) {
						if(!this.state.selectedTask.is_milestones) this.changeAssigneType(this.state.selectedTask.assignee_type, this.state.selectedTask.assignee_id);
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
					asigneeControl.label = label;
					if (api.length) this.getApiCalls(api);
					this.updateDates();
					this.setForm(this.state.selectedTask);
					if (this.state.selectedTask.job_default_task == 0) this.getMessages();
					if (this.state.accordian.products.isOpen) {
						this.getProductsServices();
					}
					this.showView(['assignee_id', 'assignee_type'], true);
					this.setValidators(['due_date']);
					if (this.state.selectedTask.job_default_task == 1) {
						if(this.state.selectedTask.is_milestones) this.clearValidators(['task_type_id', 'start_date', 'assignee_id', 'assignee_type']);
						else this.clearValidators(['task_type_id', 'start_date']);
						this.showView(['assignee_id', 'assignee_type'], !this.state.selectedTask.is_milestones);
					}
					else if (this.state.selectedTask.is_milestones) {
						this.clearValidators(['start_date', 'assignee_id', 'assignee_type']);
						this.showView(['assignee_id', 'assignee_type'], false);
					}
					else {
						this.setValidators(['task_type_id', 'start_date', 'due_date', 'assignee_id', 'assignee_type']);
					}

					if(this.state.selectedTask.task_type_id == 1) this.taskForm.controls.estimate_hrs.setValidators([Validators.required, TimeValidators(/^([0-9]|[0-9][0-9]):[0-5][0-9]$/)])
					else this.taskForm.controls.estimate_hrs.clearValidators();
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
		this.taskForm.patchValue(updateForm([...this.formFields, ...this.extraFileds], data), { emitEvent: false });
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

	transitionChange(trans) {console.log('selected task', this.state.selectedTask)
		this._commonService.saveApi('taskFlow', { id: this.state.selectedTask.id, status_id: trans.id, key: trans.key, jobs_id: this.state.selectedTask.jobs_id, task_id: this.state.selectedTask.task_id, task_type_id: this.state.selectedTask.task_type_id })
			.then(res => {
				if (res['result'].success) {
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
		})
		this.infoConfig = {...this.infoConfig};
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
					jobs_id: this.state.selectedTask.jobs_id,
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
					this.state.selectedTask.due_date = _moment(new Date(this.state.selectedTask.due_date)).add(data.interval, 'day').format('MMM DD, YYYY HH:MM a');
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
					jobs_id: this.state.selectedTask.jobs_id,
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
					this._taskService.update({ type: 'check-schedule', data: data });
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
			jobs_id: this.state.selectedTask.jobs_id,
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
		this.dateFields.map(o => {
			if (form.value[o]) form.value[o] = _moment(form.value[o]).format('YYYY-MM-DD HH:mm:ss');
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
			form.value.associate_products = services;
			form.value.products = products;
		} else {
			form.value.associate_products = services = this.state.selectedTask.associate_products;
			form.value.products = products = this.state.selectedTask.products || {};
		}

		this.formFields.map(field => {
			if (field.type == 'select') {
				let getValue: any;
				if (field.multi) {

				} else {
					if(field.key == 'assignee_id')
						getValue = _.find(this.dropdowns[field.options][form.value.assignee_type], ['id', this.taskForm.controls[field.key].value]);
					else
						getValue = _.find(this.dropdowns[field.options], ['id', this.taskForm.controls[field.key].value]);
					if (getValue) form.value[field.display_name] = field['nameKey'] ? getValue[field['nameKey']] : getValue.name;
				}
			}
		})
		form.type = 'normal';
		form.value.is_milestone = this.state.selectedTask.is_milestones;
		form.value.slug = this.state.selectedTask.slug;
		form.value.jobs_id = this.state.selectedTask.jobs_id;

		if (form.estimate_hrs) {
			if(form.estimate_hrs.split(/[.|:]+/).length == 1) form.estimate_hrs = form.estimate_hrs.concat(':00');
			else if(form.estimate_hrs.split('.').length > 1) form.estimate_hrs = form.estimate_hrs.split('.').join(':');
		}

		this._commonService.saveApi('updateJobsTasks', form.value)
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
								} else if(field.key == 'assignee_id') {
									getValue = _.find(this.dropdowns[field.options][form.value.assignee_type], ['id', this.taskForm.controls[field.key].value]);
								} else {
									getValue = _.find(this.dropdowns[field.options], ['id', this.taskForm.controls[field.key].value]);
								}
								if (getValue) this.state.selectedTask[field.display_name] = field['nameKey'] ? getValue[field['nameKey']] : getValue.name;
							}
						}
					})

					this.state.selectedTask.associate_products = form.value.associate_products;
					this.state.selectedTask.products = form.value.products;
					this.state.selectedTask.note = form.value.note;
					this.state.selectedTask.note_description = this.state.selectedTask.note ? this.state.selectedTask.note.replace(/\n/g, '<br/>') : '';
					this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res['result'].data);
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

	deleteLog(log, indx) {
		this._commonService.deleteApi('removeTasksLogs', {
			id: log.log_id,
			jobs_tasks_id: this.state.selectedTask.id,
			type: 'single'
		})
			.then(res => {
				if (res['result'].success) {
					this.snackbarModal('success', false, 'Log Time Deleted Successfully');
					this.state.selectedTask.log.splice(indx, 1);
				}
			})
	}

	saveLogTime() {
		this.state.accordian.time.submitted = true;
		if (this.logForm.valid) {
			this.state.accordian.time.submitted = false;
			this._commonService.saveApi('saveTasksLogs', this.logForm.value)
				.then(res => {
					if (res['result'].success) {
						/* change after json update */
						res['result'].data.created_on = res['result'].data.created_on.date;
						this.state.selectedTask.log.push(res['result'].data);
						this.trigger.closeMenu();
					}
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
			this.state.selectedTask.log.push(ev.data);
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
			// const row: RowNode = this.gridApi.getRowNode(this.state.selectedTask.id);
			// if (row) {
			// 	row.setData({ ...row.data, ...{ track_time_total: this.totalDuration } });
			// }
		}
		this.trigger.closeMenu();
	}

	getProductsServices() {
		if (!this.state.accordian.products.list.length) {
			this.state.accordian.products.isLoading = true;
			this._commonService.getApi('getVendorProdServices', { jobs_id: this.state.selectedTask.jobs_id, type: 'task' })
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
		this._router.navigate(['/tasks/' + this.state.type + '/list/' + id]);
	}

	showView(fields, bol) {	
		fields.map(o => {		
			const field = _.find(this.formFields, ['key', o]);		
			if(field) field.showView = bol;		
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
			this._router.navigate(['/tasks/' + this.state.type + '/list']);
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
		// // if (data) rowIndex = this.gridApi.getRowNode(data.id).rowIndex + 1;
		// this._dialog.open(CreateTaskComponent, {
		// 	panelClass: 'recon-dialog',
		// 	width: '780px',
		// 	data: {
		// 		title: type == 'sub' ? 'Add Sub Task' : 'Create New Task',
		// 		jobs_id: this.state.selectedTask.jobs_id,
		// 		// jobs_name: this.state.breadcrumbs[1]['job_no'],
		// 		selectedRow: (type == 'sub' || type == 'dup') ? data : null,
		// 		type: type
		// 	}
		// })
		// 	.afterClosed()
		// 	.subscribe(res => {
		// 		if (res && res.success) {
		// 			if (res.data) {
		// 				res.data.is_enable = true;
		// 				// const taskHierarchy = type == 'sub' ? [res.data.parent_id, res.data.id] : [res.data.id];
		// 				// if (this.state.list.length) {
		// 				// 	setTimeout(() => {
		// 				// 		if (rowIndex)
		// 				// 			this.gridApi.updateRowData({ add: [{ ...res.data, ...{ taskHierarchy: taskHierarchy, parent_name: res.data.parent_name } }], addIndex: rowIndex });
		// 				// 		else
		// 				// 			this.gridApi.updateRowData({ add: [{ ...res.data, ...{ taskHierarchy: taskHierarchy, parent_name: res.data.parent_name } }] });
		// 				// 		this.gridApi.redrawRows();
		// 				// 	}, 20);
		// 				// 	this.state.selectedTask = res.data;
		// 				// 	this.trackConfig.defaultValues.jobs_tasks_id = this.state.selectedTask.id;
		// 				// 	this.state.selectedRow = res.data;
		// 				// 	this.getTaskDetails(this.state.selectedTask.id);

		// 				// 	if (!this.state.isSplit) {
		// 				// 		this.state.isSplit = true;
		// 				// 		this.generateColumns('half');
		// 				// 	}
		// 				// }
		// 				// if (type == 'sub') {
		// 				// 	const parentIndx = _.findIndex(this.state.list, ['id', res.data.parent_id]);
		// 				// 	if (this.state.list[parentIndx].hasOwnProperty('child')) this.state.list[parentIndx].child.push(res.data);
		// 				// 	else this.state.list[parentIndx].child = [res.data];
		// 				// } else {
		// 				// 	this.state.list.push(res.data);
		// 				// }
		// 				// if (this.state.selectedTask.parent_id == 0) {
		// 				// 	this.state.selectedRow = this.state.selectedTask;
		// 				// } else {
		// 				// 	const row = _.find(this.state.list, ['id', this.state.selectedTask.parent_id]);
		// 				// 	if (row) this.state.selectedRow = row;
		// 				// }
		// 				// this.state.framedList.push({ ...res.data, ...{ taskHierarchy: taskHierarchy } });
		// 			}
		// 			this.snackbarModal();
		// 		}
		// 	})
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
				jobs_id: this.state.selectedTask.jobs_id,
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
				this.getMessageList(obj.data.threadId);
			} else {
				this.messages.inProgress = false;
				// this.messages.isNew = true;
				this.messages.isNew = false;
				this.messages.noData = true;
			}
		});

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
			params['jobs_id'] = this.state.selectedTask.jobs_id;
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

}
