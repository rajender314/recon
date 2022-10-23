import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { NoDataConfig } from '@app/shared/utility/config';
import { Subscription } from 'rxjs';
import { TaskService } from './task.service';

import * as _ from 'lodash';
import * as _moment from 'moment';

var APP: any = window['APP'];

@Component({
	selector: 'app-tasks',
	templateUrl: './tasks.component.html',
	styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {

	noDataConfig: NoDataConfig = {
		isIcon: true,
		iconName: 'icon-task-fill',
		title: 'No Tasks',
		buttonText: 'Add Task'
	}

	state = {
		isLoading: true,
		flag: 'init',
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' }
		],
		searchValue: '',
		tabs: [
			{ id: 1, label: 'Task List', disable: false },
			/*{ id: 2, label: 'Board', disable: true },
			{ id: 3, label: 'Calendar', disable: true },
			{ id: 4, label: 'Gant', disable: true }*/
		],
		filterBy: [
			{ label: "Project Tasks", key: 0, show: (APP.permissions.job_access.vendor_schedule == 'yes') ? true : false },
			{ label: "Vendor Tasks", key: 2, show: (APP.permissions.job_access.vendor_schedule == 'yes') ? true : false },
			{ label: "My Tasks", key: 1, show: true }
		],
		selectedFilter: (APP.permissions.job_access.vendor_schedule == 'yes') ? { label: "All", key: 0 } : { label: "My Tasks", key: 1 },
		sortActions: [
			{ key: 'due_date', label: 'Due Date' },
			{ key: 'assignee_name', label: 'Assignee' },
			{ key: 'task_name', label: 'Task' },
		],
		selectedGroup: { key: 'default', label: 'Default', type: 'group' },
		selectedSort: { key: 'due_date', label: 'Due Date', display: 'Due Date' },
		actions: [
			{
				type: 'group', label: 'Group By', options: [
					{ key: 'default', label: 'Default', type: 'group' }, 
					{ key: 'assignee_name', label: 'Assignee', type: 'group' },
					{ key: 'due_date', label: 'Due Date', type: 'group' },
					// { key: 'section', label: 'Section', type: 'group' },
					// { key: 'outstanding', label: 'OutStanding', type: 'group' }
				]
			},
			{ key: 'search', type: 'search', label: '', options: {} },
			{ key: 'new', type: 'button', label: 'New Task', show: false },
			{ key: 'new-template', type: 'button', label: 'Add from Template', show: false }
		],
		list: [],
		framedList: []
	}

	taskSubscription: Subscription;
	breadcrumbSubscription: Subscription;

	constructor(
		private _commonService: CommonService,
		private _taskService: TaskService
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.taskSubscription = _taskService.onUpdate().subscribe(ev => {
			if (ev.type == 'init') {
				this.state.isLoading = false;
				this.state.flag = ev.flag;
				this.state.list = ev.data.list || [];
			}
		})

		this.breadcrumbSubscription = _commonService.onUpdate().subscribe(obj => {
			if (obj && obj.type == 'projectName' && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
				this.state.breadcrumbs[1]['job_no'] = obj.data.job_no || '---';
				_taskService.breadcrumbData = this.state.breadcrumbs;
				this.state.actions.map(x => {
					if (x.key == 'new') {
						x.show = this.checkPermissions('add_and_assign_tasks', obj.data.job_status_id)
					} else if (x.key == 'new-template') {
						x.show = this.checkPermissions('add_template', obj.data.job_status_id)
					}
				})
			}
		})

	}
	mobile: any;
	ngOnInit() {
		if (window.screen.width < 1100) {
			this.mobile = true;
		}
		else {
			this.mobile = false;
		}
	}

	ngOnDestroy() {
		this.taskSubscription.unsubscribe();
		this.breadcrumbSubscription.unsubscribe();
	}

	addTask() {
		this._taskService.update({ type: 'init-add', data: null });
	}

	addFromTemplate() {
		this._taskService.update({ type: 'init-add-template', data: null });
	}

	performActions(flag, option, value?) {
		if (flag == 'task') {
			if (option.type == 'group') {
				this.state.selectedGroup = option;
				this._taskService.update({ type: 'group', data: option });
			} else {
				switch (option.key) {
					case 'new':
						this.addTask();
						break;
					case 'new-template':
						this.addFromTemplate();
						break;
					case 'search':
						this.state.searchValue = value;
						this._taskService.update({ type: 'search', data: value });
						break;
					default:
						break;
				}
			}
		} else if (flag == 'sort') {
			this.state.selectedSort = option;
			this._taskService.update({ type: 'sort', data: option })
		} else if (flag == 'filter') {
			this.state.selectedFilter = option;
			this._taskService.update({ type: 'filter', data: option })
		}
	}

	checkPermissions(key, status) {
		let perm = APP.permissions.job_access;
		let valid = false;
		if (status == 8 || status == 10) {
			if (perm['post-completion_estimate'] != 'yes') {
				valid = false;
				return;
			}
			valid = (perm[key] == 'yes') || (String(perm[key]) == "true");
		} else if (status == 5) {
			if (perm.edit_cancelled_jobs == 'yes') {
				valid = (perm[key] == 'yes') || (String(perm[key]) == "true");
			}
		} else {
			valid = (perm[key] == 'yes') || (String(perm[key]) == "true");
		}
		return valid;
	}
}
