import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { CreateTaskComponent } from '@app/dialogs/create-task/create-task.component';
import { CommonService } from '@app/common/common.service';
import { TasksService } from '../tasks.service';

var APP: any = window['APP'];

@Component({
	selector: 'app-task-list',
	templateUrl: './task-list.component.html',
	styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {

	user_id = APP.recon_user[0].id;

	state = {
		loader: false,
		searchVal: null,
		displayFilter: false,
		tabs: [
			{ id: 1, key: 'list', label: 'Task List', disable: false, link: '/tasks/all/list' },
			// { id: 2, label: 'Board', disable: true },
			// { id: 3, label: 'Calendar', disable: true },
			// { id: 4, label: 'Gant', disable: true }
		],
		activeTab: 1,
		activeState: { title: '', flag: '' },
		filters: {
			expansionPanel: {
				phases: false,
				groups: false,
				users: false,
				departments: false,
				vendors: false,
				status: false
			},
			selectAll: {
				phases: false,
				groups: false,
				users: false,
				departments: false,
				vendors: false,
				status: false
			},
			modelValues: {
				phases: {},
				groups: {},
				users: {},
				departments: {},
				vendors: {},
				status: {}
			},
			tabs: [
				{ key: 'phases', label: 'All Phases', type: 'checkbox' },
				{ key: 'groups', label: 'All Groups', type: 'checkbox' },
				{ key: 'users', label: 'All Users', type: 'select', multi: true },
				{ key: 'departments', label: 'All Departments', type: 'select', multi: true },
				{ key: 'vendors', label: 'All Vendors', type: 'select', multi: true },
				{ key: 'status', label: 'All Status', type: 'checkbox' }
			]
		},
		dropdowns: {
			phases: [],
			groups: [],
			users: [],
			departments: [],
			vendors: [],
			status: []
		},
		hasFilter: false
	}

	constructor(
		private activeRoute: ActivatedRoute,
		private _dialog: MatDialog,
		private _taskService: TasksService
	) {
		activeRoute.data.subscribe((data: { title: string, flag: string }) => {
			this.state.activeState = data;
			this.state.tabs.map(o => {
				o.link = '/tasks/' + data.flag + '/' + o.key;
			});
		})
	}

	ngOnInit() { }

	searchList(val: string) {
		this.state.searchVal = val;
		this._taskService.update({ type: 'search', data: this.state.searchVal });
	}

	showFilter(flag) {
		if (flag == 'show') {
			this.state.displayFilter = !this.state.displayFilter;
		}
	}

	menuOpened(prop) {
		this.state.filters.expansionPanel[prop] = true;
	}

	menuClosed(prop) {
		this.state.filters.expansionPanel[prop] = false;
	}

	menuActions(flag, prop) {
		// if (flag == 'clear') {
		// 	if (prop == 'company_filter') {
		// 		this.state.dropdowns[prop].map(o => {
		// 			delete this.state.filters[prop].parent[o.id];
		// 			o.children.map(p => {
		// 				delete this.state.filters[prop].child[p.id];
		// 			})
		// 		})
		// 	} else if (prop == 'clients_filter') {
		// 		this.clearChecked(this.clientsGridApi);
		// 	} else if (prop == 'forms_filter') {
		// 		this.clearChecked(this.formsGridApi);
		// 	} else {
		// 		this.state.dropdowns[prop].map(o => {
		// 			delete this.state.filters[prop][o.id];
		// 		})
		// 	}

		// 	this.state.filters.selectAll[prop] = false;
		// 	// if ((this.state.pagination[prop] ? this.state.pagination[prop].length : false || this.state.savedFilters[prop].length))
		// 	// 	setTimeout(() => {
		// 	// 		this.saveFilter(prop);
		// 	// 	}, 200);
		// }
	}

	selectAll(prop) {
		// if (prop == 'company_filter') {
		// 	this.state.dropdowns[prop].map(o => {
		// 		this.state.filters[prop].parent[o.id] = this.state.filters.selectAll[prop];
		// 		o.children.map(p => {
		// 			this.state.filters[prop].child[p.id] = this.state.filters.selectAll[prop];
		// 		})
		// 	})
		// } else {
		// 	this.state.dropdowns[prop].map(o => {
		// 		this.state.filters[prop][o.id] = this.state.filters.selectAll[prop];
		// 	})
		// }
	}

	createTask() {
		this._dialog.open(CreateTaskComponent, {
			panelClass: 'my-dialog',
			width: '700px',
			data: {
				title: 'Create New Task',
				jobs_id: null,
				jobs_name: null,
				selectedRow: null
			}
		})
	}

	// isFilter(): boolean {
	// 	let hasFilter = false;
	// 	['clients_filter', 'company_filter', 'forms_filter', 'status_filter'].map(prop => {
	// 		if (this.state.tasksDetails.user_filters[prop].length) hasFilter = true;
	// 	})
	// 	return hasFilter;
	// }

	// gridActions(action) {
	// 	if (action.flag == 'details') {
	// 		this.state.selectedTask = action.data;
	// 	}
	// }

	// detailActions(action) {
	// 	if(action.flag == 'back') {
	// 		this.state.selectedTask = null;
	// 	}
	// }

}
