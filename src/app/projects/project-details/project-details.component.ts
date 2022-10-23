import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ScrollToConfigOptions, ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import * as moment from 'moment';
import PerfectScrollbar from 'perfect-scrollbar';
import { MatDialog } from '@angular/material';
import { UploadInsertionOrderComponent } from '@app/dialogs/upload-insertion-order/upload-insertion-order.component';
import { trigger, transition, style, stagger, animate, query } from '@angular/animations';
import { ProjectDetailsService } from './project-details.service';
import { perfectScrollBarReset } from '@app/shared/utility/config';
import * as _ from 'lodash';
import { JobMessagingComponent } from './job-messaging/job-messaging.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
var APP = window['APP'];
@Component({
	selector: 'app-project-details',
	templateUrl: './project-details.component.html',
	styleUrls: ['./project-details.component.scss'],
	animations: [
		trigger('projectsSubMenu', [
			transition(':enter', [
				style({ transform: 'translateX(100%)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 0 }),
				animate('50ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(100%)' }))
			])
		]),
		trigger('projectsSubMenuLeft', [
			transition(':enter', [
				style({ transform: 'translateX(-100%)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 0 }),
				animate('50ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(-100%)' }))
			])
		]),
		trigger('projectsSubMenuRight', [
			transition(':enter', [
				style({ transform: 'translateX(100%)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 0 }),
				animate('50ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(100%)' }))
			])
		]),
		trigger('projectsMainMenu', [
			transition(':enter', [
				style({ transform: 'translateX(300px)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			// transition(':leave', [
			// 		animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(-100%)' }))
			// ])
		]),
		trigger('InLeft', [
			transition(':enter', [
				style({ transform: 'translateX(-100px)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 0 }),
				animate('50ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(-100px)' }))
			])
		])
	]
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
	APP = APP;
	displayFilter = false;
	panelOpenState = false;
	public tabCount = {
		job_distributions: 0,
		job_estimates: 0,
		job_files: 0,
		job_invoices: 0,
		job_pos: 0,
		job_products: 0,
		job_tasks: 0
	};
	@ViewChild('scroll') scroll: VirtualScrollerComponent;
	parentState: string = '';
	public state = {
		showView: false,
		projectID: null,
		sections: [
			{
				children: [
					// { id: "stories", route: "/projects/222/overview", show: true, icon: "icon-overview", name: "Job Stories" },
					{ id: "overview", route: "/projects/222/overview", show: true, icon: "icon-overview", name: "Overview" },
					{ id: "project-info", route: "/projects/222/project-info", show: true, icon: "icon-project-info-fill", name: "Project Info" },
					{ id: "products", count: "job_products", route: "/projects/222/products", show: true, icon: "icon-products", name: "Products" },
					{ id: "tasks", count: "job_tasks", route: "/projects/222/tasks", show: (APP.permissions.job_access.schedule == 'yes') ? true : false, icon: "icon-task-fill", name: "Tasks" },
					{ id: "files", count: (APP.permissions.job_access.access_private_files == 'yes') ? "job_files" : "job_public_files", route: "/projects/222/files", show: (APP.permissions.job_access.files == 'yes') ? true : false, icon: "icon-files", name: "Files" },
					{ id: "distribution-list", count: "job_distributions", route: "/projects/222/distribution-list", show: (APP.permissions.job_access.distribution_lists == 'yes') ? true : false, icon: "icon-distribution-types", name: "Distribution List" },
				]
			}, {
				children: [
					{ id: "bid-schedule", route: "/projects/222/bid-schedule", show: true, icon: "icon-post-bids", name: "Bids Schedule" },
					{ id: "vendor-queue", route: "/projects/222/vendor-queue", show: (APP.permissions.job_access.vendor_queue != 'none') ? true : false, icon: "icon-vendor-shape", name: "Vendor Queue" },
					{ id: "analyze-bids", route: "/projects/222/analyze-bids", show: true, icon: "icon-post-bids", name: "Analyze Bids" },
				]
			}, {
				children: [
					{ id: "cost-analysis", route: "/projects/222/cost-analysis", show: (APP.permissions.job_access.internal_estimation == 'yes') ? true : false, icon: "icon-cost-analysis", name: "Cost Analysis" },
					{ id: "estimates", count: "job_estimates", route: "/projects/222/estimates", show: (APP.permissions.job_access.estimates != 'none') ? true : false, icon: "icon-pn-estimates", name: "Estimates" },
					{ id: "invoices", count: "job_invoices", route: "/projects/222/invoices", show: (APP.permissions.job_access.invoice == 'yes') ? true : false, icon: "icon-invoices", name: "Invoices", hasEvent: false },
					{ id: "purchase-orders", count: "job_pos", route: "/projects/222/purchase-orders", show: (APP.permissions.job_access.purchase_order != 'none') ? true : false, icon: "icon-po-fill", name: "Purchase Orders" },
					{ id: "prepress", route: "/projects/222/prepress", show: (APP.permissions.job_access.prepress != 'none') ? true : false, icon: "icon-prepress", name: "Prepress" }
				]
			}
		],
		subNav: {
			show: false,
			list: []
		},
		get: 'getJobInfo',
		projectDetails: {
			job_title: '',
			job_no: '',
			delivery_due_date_format: null,
			status_name: ''
		}
	};
	showFilter(flag) {
		if (flag == 'show') {
			this.displayFilter = !this.displayFilter;
			this.resetLogForm();
		}
	}
	ps: any;

	subscription: Subscription;
	navBarSubscription: Subscription;
	jobStausSubscription: Subscription;

	trackConfig = {
		isProject: false,
		disableProject: true,
		isChange: false,
		defaultValues: {
			id: '',
			jobs_id: '',
			jobs_tasks_id: '',
			date: null,
			range: [9, 12],
			track_time: '3:00 h',
			description: ''
		},
		jobsList: [],
		url: 'saveTasksLogs'
	}

	constructor(
		private _router: Router,
		private activedRoute: ActivatedRoute,
		private _scrollToService: ScrollToService,
		private _commonService: CommonService,
		private _projectDetailService: ProjectDetailsService,
		private _dialog: MatDialog
	) {

		this.parentState = _commonService.projectState;
		this.subscription = _router.events.subscribe(val => {
			if (val instanceof NavigationEnd) {
				if (val.url.includes('estimates') || val.url.includes('invoices') || val.url.includes('purchase-orders')) {
				} else {
					this.resetSideNav();
				}
				_commonService.update({ type: 'projectName', data: this.state.projectDetails });
			}
		})

		activedRoute.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : '';
			this.trackConfig.defaultValues.jobs_id = this.state.projectID;
			this.getProjectDetails();
		});

		_commonService.afterChange().subscribe(() => {
			this.changeMasterView();
		})

		this.navBarSubscription = _commonService.onUpdate().subscribe(ev => {
			if (ev.type == 'sub-nav' && ev.data.list.length > 0) {
				this.state.subNav = { ...ev.data };
				this.state.subNav.show = true;
				if (this.ps) {
					if (this.state.subNav['selectedItem']) setTimeout(() => {
						this.triggerScroll(this.state.subNav['selectedItem'][this.state.subNav['idKey']]);
					}, 200);
					else perfectScrollBarReset(this.ps);
				}
			} else if (ev.type == 'grid-view') {

			} else if (ev.type == 'projectName' && Object.keys(ev.data).length) {
				this.state.projectDetails['job_title'] = ev.data.job_title;
			} else if (ev.type == 'back-to-projects') {
				setTimeout(() => {
					this.state.subNav.show = false;
				}, 20);
			} else if (ev.type == 'left-nav-count') {
				this.getLeftNavCount();
			}
		})

		this.jobStausSubscription = _projectDetailService.onUpdate().subscribe(ev => {
			if (ev.type == 'job_status') {
				this.state.projectDetails = { ...this.state.projectDetails, ...ev.data };
			} else if (ev.type == 'subnav-status') {
				const id = this.state.subNav['idKey'];
				const selected = _.find(this.state.subNav.list, [id, ev.data.selected[id]]);
				if (selected) {
					selected[this.state.subNav['statusIdKey']] = ev.data.selected[this.state.subNav['statusIdKey']];
					selected[this.state.subNav['statusNameKey']] = ev.data.selected[this.state.subNav['statusNameKey']];
				}
			} else if (ev.type == 'subnav-value') {
				const id = this.state.subNav['idKey'];
				const selected = _.find(this.state.subNav.list, [id, ev.data.selected[id]]);
				if (selected) {
					selected[this.state.subNav['costKey']] = ev.data.selected[this.state.subNav['costKey']];
				}
			}
		})
	}

	ngOnInit() {
		setTimeout(() => {
			this.ps = new PerfectScrollbar('.recon-scroll');
		});
	}

	resetSideNav() {
		this.state.subNav = {
			show: false,
			list: []
		}
	}

	formatNumber(number) {
		let x = number.toString().split('.');
		let x1 = x[0];
		x1 = isNaN(x1) ? "0" : Number(x1);
		x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
		return x1 + x2;
	}

	getProjectDetails() {
		this._commonService.getApi(this.state.get, { id: this.state.projectID })
			.then(res => {
				if (res['result'].success) {
					this.getLeftNavCount();
					this.state.projectDetails = res['result'].data;
					this.trackConfig.jobsList = [{ id: this.state.projectID, name: this.state.projectDetails.job_no + ' - ' + this.state.projectDetails.job_title }];
					//projectDetails
					this.state.projectDetails['delivery_due_date_format'] = moment(this.state.projectDetails['delivery_due_date']).format('MMM DD, YYYY');
					this._commonService.update({ type: 'projectName', data: this.state.projectDetails });
					this._commonService.is_related_to_project = this.state.projectDetails['is_related_to_project'] || false;
					this._commonService.job_status_id = this.state.projectDetails['job_status_id'] || 0;
				}
			});
	}

	getLeftNavCount() {
		this._commonService.getApi('getProjectCounts', { jobs_id: this.state.projectID })
			.then(res => {
				if (res['result'].success) {
					this.tabCount = res['result'].data;
				}
			});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.navBarSubscription.unsubscribe();
		this.jobStausSubscription.unsubscribe();
	}

	exportMedia(type) {
		location.href = APP.api_url + 'exportMediaInsertion?jobs_id=' + this.state.projectID + '&media_type=' + type + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
	}

	uploadInsertionOrder() {
		const locals = {
			title: 'Upload Insertion Order',
			label: 'Upload Insertion Order',
			name: '',
			apiCall: 'importDistTemTable',
			dropdowns: {},
			formFields: 1,
			flag: 1,
			job_title: this.state.projectDetails['job_title']
		}
		locals['apiCalls'] = [
			{ key: 'productList', url: 'getDistProducts', params: { jobs_id: this.state.projectID } },
			{ key: 'jobFiles', url: '', params: {} }
		];
		locals['jobs_id'] = this.state.projectID;
		this._dialog.open(UploadInsertionOrderComponent, {
			panelClass: ['my-dialog', 'upload-insertion-order', 'full-modal-box-ui'],
			width: '100vw',
			maxWidth: '100vw',
			height: '100vh',
			disableClose: false,
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this._commonService.update({ type: 'distroRefresh', data: {} });
				}
			})
	}

	changeMasterView() {
		this.state.showView = !this.state.showView;
	}

	onSelectSection(item) {
		if (item.hasEvent) this.state.subNav.show = true;
	}

	backToProjects() {
		this.state.subNav.show = false;
		this._commonService.update({ type: 'grid-view', data: { isActive: false } });
	}

	showAll() {
		this._commonService.update({ type: 'grid-view', data: { isActive: true } });
		this.state.subNav['selectedItem'] = null;
	}

	onSelect(flag, data) {
		this.state.subNav['selectedItem'] = data;
		this._commonService.update({ type: 'preview', data: data });
		if (this.ps) {
			if (this.state.subNav['selectedItem']) setTimeout(() => {
				this.triggerScroll(this.state.subNav['selectedItem'][this.state.subNav['idKey']]);
			}, 200);
			else perfectScrollBarReset(this.ps);
		}
	}

	dropdownTrigger = (ev, ele, i) => {
		if (ev) ev.stopPropagation();
		if (ele.children && ele.children.length) {
			this.resetDropdown(ele);
			if (ele.children.length) {
				ele.isOpen = !ele.isOpen;
				setTimeout(() => {
					this.triggerScroll(i);
				}, 20);
			}
		} else {
			setTimeout(() => {
				this.triggerScroll(i);
			}, 20);
		}
	}

	resetDropdown = (data?) => {
		this.state.subNav.list.map(ele => {
			if (data) {
				if (data.name != ele.name) delete ele.isOpen;
			} else {
				delete ele.isOpen;
			}
		})
	}

	triggerScroll(indx) {
		let leftNavIndex = 0;
		this.state.subNav.list.map((prop, i) => {
			if (prop[this.state.subNav['idKey']] == indx) {
				leftNavIndex = i;
			}
		});
		this.scroll.scrollToIndex(leftNavIndex);
		const config: ScrollToConfigOptions = {
			target: 'sub_nav_' + indx
		};

		this._scrollToService.scrollTo(config);
	}

	resetLogForm() {
		this.trackConfig.isChange = !this.trackConfig.isChange;
		this.trackConfig = { ...this.trackConfig };
	}

	onAfterClose(ev) {
	}

	/* Messaging */
	jobMessaging() {
		this._dialog.open(JobMessagingComponent, {
			panelClass: ['messaging-dialog', 'my-dialog', 'full-modal-box-ui'],
			width: '100vw',
			maxWidth: '100vw',
			height: '100vh',
			disableClose: false,
			data: {
				title: 'Job Messaging',
				jobs_id: this.state.projectID,
				breadcrumbs: [
					{ label: 'Projects', type: 'link', route: '/projects' },
					{ label: this.state.projectDetails['job_title'], type: 'text' }
				]
			}
		})
			.afterClosed()
			.subscribe(res => {
			})
	}
	cancelProject(type) {
		let dialogContent = '';
		if(type==1){
			dialogContent = '<p class="error-content"><i class="pixel-icons icon-exclamation"></i><span>Are you sure, you want to change the Project Status from <b>'+this.state.projectDetails.status_name+'</b> to <b>Cancelled</b>?<br>A Project once <b>Cancelled</b> cannot be <b>Reopened</b>.</span></p>';
		}else{
			dialogContent = '<p class="error-content"><i class="pixel-icons icon-exclamation"></i><span>All the tasks in this project will get completed and job status will be changed to <b>Complete</b>. <br>Are you sure, you want to Complete this Project?</span></p>'
		}
		this._dialog.open(ConfirmationComponent, {
			panelClass: ["recon-dialog", "confirmation-dialog"],
			width: '500px',
			// height: '400px',
			data: {
				title: (type == 1) ? 'Cancel Project' : 'Complete Project',
				content: dialogContent,
				url: 'cancelProject',
				method: 'get',
				params: {
					id: this.state.projectID,
					type: type
				}
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.state.projectDetails['status_name'] = (type == 1) ? "Cancelled" : "Completed";
					this.state.projectDetails['job_status_id'] = (type == 1) ? 5 : 8;
					this._commonService.update({ type: 'job_status', data: this.state.projectDetails, flag: type == 1 ? 'cancel' : 'complete' });
				}
			})
	}
}
