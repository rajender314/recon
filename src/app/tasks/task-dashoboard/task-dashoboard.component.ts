import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

var APP: any = window['APP'];

@Component({
	selector: 'app-task-dashoboard',
	templateUrl: './task-dashoboard.component.html',
	styleUrls: ['./task-dashoboard.component.scss']
})
export class TaskDashoboardComponent implements OnInit, OnDestroy {

	routerEvent: Subscription;
	state = {
		showView: false,
		activeState: {},
		tabsList: [
			{ id: 1, key: 'my', name: "My Tasks", icon: "icon-task-fill", add: true, search: true, show:true, route: '/tasks/my/list' },
			// { id: 2, key: 'vendor', name: "Vendor Tasks", icon: "icon-task-fill", add: true, search: true, route: '/tasks/vendor' },
			{ id: 3, key: 'group', name: "My Groups", icon: "icon-task-fill", add: true, search: true, show:true, route: '/tasks/group/list' },
			{ id: 0, key: 'all', name: "All Tasks", icon: "icon-task-fill", add: true, search: true, show:true, route: '/tasks/all/list' },
			{ id: 4, key: 'department', name: "Department Tasks", icon: "icon-task-fill", add: true, search: true, 
			show:(APP.permissions.system_access.department_in_global_schedule == 'yes') ? true : false,  route: '/tasks/department/list' }
		], 
		recentTasks: []
	}

	constructor(
		private router: Router,
		private _activeRoute: ActivatedRoute
	) {
		this.routerEvent = router.events.subscribe(val => {
			if (val instanceof NavigationEnd) {
				this.state.activeState = _activeRoute.snapshot.firstChild.data;
			}
		})
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.routerEvent.unsubscribe();
	}

	changeMasterView() {
		this.state.showView = !this.state.showView;
	}

}
