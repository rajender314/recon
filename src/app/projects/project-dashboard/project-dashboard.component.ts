import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonService } from '@app/common/common.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
var APP: any = window['APP'];
@Component({
	selector: 'app-project-dashboard',
	templateUrl: './project-dashboard.component.html',
	styleUrls: ['./project-dashboard.component.scss'],
	animations: [
		trigger('projectsSubMenu', [
			transition(':enter', [
				style({ transform: 'translateX(-100%)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 0 }),
					animate('50ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(-100%)' }))
			])
		])
	]
})
export class ProjectDashboardComponent implements OnInit {

	routerEvent: any;
	recentSubscriber: Subscription;
	state = {
		showView: false,
		activeState: {},
		tabsList: [
			{ id: 1, key: 'favorites', name: "Favorites", icon: "icon-favorites", add: true, search: true, show: true, route: '/projects/favorites' },
			{ id: 2, key: 'my', name: "My Projects", icon: "icon-pn-projects", add: true, search: true, show: true, route: '/projects/my' },
			{ id: 3, key: 'all', name: "All Projects", icon: "icon-pn-projects", add: true, search: true, show: (APP.permissions.system_access.all_jobs=='yes'?true:false), route: '/projects/all' }
		],
		recentJobs: []
	}

	constructor(
		private router: Router,
		private _commonService: CommonService
	) {
		this.routerEvent = router.events.subscribe(val => {
			if (val instanceof NavigationEnd) {
				const url = val.urlAfterRedirects.split('/projects/')[1];
				if (url == 'favorites') {
					this.state.activeState = { title: 'Favorites', flag: 'favorites' }
				} else if (url == 'my') {
					this.state.activeState = { title: 'My Projects', flag: 'my' }
				} else {
					this.state.activeState = { title: 'All Projects', flag: 'all' }
				}
			}
		})
		this.recentSubscriber = _commonService.onUpdate().subscribe(obj => {
			if(obj.type == 'recentJobs') {
				this.state.recentJobs = obj.list || [];
			}
		})
		_commonService.afterChange().subscribe(() => {
			this.changeMasterView();
		})
	}

	ngOnInit() { }

	ngOnDestroy() {
		this.recentSubscriber.unsubscribe();
		this.routerEvent.unsubscribe();
	}

	changeMasterView() {
		this.state.showView = !this.state.showView;
	}

}
