import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '@app/common/common.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddVendorComponent } from '@app/projects/project-details/bid-schedule/add-vendor/add-vendor.component';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { Subscription } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';

var APP: any = window['APP'];

@Component({
	selector: 'app-bid-schedule',
	templateUrl: './bid-schedule.component.html',
	styleUrls: ['./bid-schedule.component.scss']
})
export class BidScheduleComponent implements OnInit, OnDestroy {
	APP = APP;

	@ViewChild('scrollElement') scrollElement: ElementRef;

	state = {
		isLoading: true,
		projectID: null,
		title: 'Bid Schedule',
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
			/* { label: 'Bid Schedule', type: 'text' }, */
		],
		minDate: new Date(),
		maxDate: null,
		bidDeadLines: [],
		cloneBidDeadLines: [],
		milestoneList: [],
		milestones: [],
		vendorTemplates: [],
		searchValue: '',
		showFooter: false,
		bidDeadline: null,
		inactiveMilestones: []
	}

	sortOptions: any = {
		handle: '.handle',
		onUpdate: (event: any) => {
			this.showFooter = true;
			this.state.milestoneList.map((o, i) => {
				o.order = i + 1
			});
		}
	}

	subscription: Subscription;
	routerSubscription: Subscription;

	constructor(
		private _route: Router,
		private _router: ActivatedRoute,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _commonService: CommonService
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			this.getProductServices();
			this.getJobMilestones();
		});

		this.subscription = _commonService.onUpdate().subscribe(obj => {
			if (obj.type == 'projectName' && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
			}
		})
	}

	ngOnInit() {
		this.getMilestones();
		this.getVendorTemplates();
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.routerSubscription.unsubscribe();
	}

	getProductServices() {
		this.state.isLoading = true;
		this._commonService.saveApi('getVendorServicesBidDeadline', {
			job_id: this.state.projectID,
			added_from: true
		})
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.bidDeadLines = res['result'].data.products || [];
					this.state.cloneBidDeadLines = _.cloneDeep(this.state.bidDeadLines);
				}
			})
	}

	getMilestones() {
		this.state.inactiveMilestones = []
		this._commonService.getApi('getTasks', { page: 1, pageSize: 10000, sort: 'asc', status: true, is_milestone: 2, milestone_type: 2, department_id: APP.recon_user[0].departments_id })
			.then(res => {
				if (res['result'].success) {
					this.state.milestones = res['result'].data.items || [];
					this.state.milestones.map(o => {
						if(o.org_type_id && o.org_type_id.Ivie == 1) this.state.inactiveMilestones.push(o.id);
					})
				}
			})
	}

	getVendorTemplates() {
		this._commonService.getApi('departmentsVendTemp', { department_id: APP.recon_user[0].departments_id })
			.then(res => {
				if (res['result'].success) {
					this.state.vendorTemplates = res['result'].data || [];
				}
			})
	}

	addVendor() {
		this._dialog.open(AddVendorComponent, {
			panelClass: ['full-width-modal', 'full-modal-box-ui'],
			maxWidth: '100vw',
			width: '100vw',
			height: '100vh',
			data: {
				title: 'Add Vendors',
				bidDeadLines: this.state.bidDeadLines,
				jobs_id: this.state.projectID,
				breadcrumbs: [...this.state.breadcrumbs]
				//, ...[{ label: 'Bid Schedule', type: 'link', route: '/projects/' + this.state.projectID + '/bid-schedule' }]
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) setTimeout(() => {
					this._route.navigate(['/projects/' + this.state.projectID + '/vendor-queue']);
				}, 500);
			})
	}

	DOMSearch(val) {
		this.state.searchValue = val;
		this.state.bidDeadLines = _.cloneDeep(this.state.cloneBidDeadLines);
		if (val) {
			val = val.toLowerCase();
			let products = [];
			this.state.bidDeadLines.map(p => {
				const arr = [];
				p.services.map(s => {
					if (s.name.toLowerCase().includes(val)) {
						arr.push(s);
					}
				});
				if (arr.length) {
					products.push(
						{ ...p, ...{ services: arr } }
					)
				} else {
					if (p.name.toLowerCase().includes(val)) {
						products.push({ ...p });
					}
				}
			})
			this.state.bidDeadLines = products;
		}
	}

	changeGlobal(event): void {
		this.state.showFooter = true;
		_.map(this.state.bidDeadLines, (value) => {
			if (value.services && value.services.length) {
				_.map(value.services, (service) => {
					service['bid_deadline'] = event.value;
				});
			}
		});
	}

	changeServiceDate(event, service): void {
		this.state.showFooter = true;
		service['bid_deadline'] = event.value;
	}

	cancelBidDeadlines(): void {
		this.state.showFooter = false;
		this.getProductServices();
	}

	saveBidDeadlines(): void {
		let params = [];
		_.map(this.state.bidDeadLines, (value) => {
			if (value.services && value.services.length) {
				_.map(value.services, (service) => {
					params.push({
						job_revisions_id: service.job_service_revisions_id,
						bid_deadline: (service.bid_deadline != '') ? _moment(service.bid_deadline).format("YYYY-MM-DD HH:mm:ss") : ""
					});
				});
			}
		});
		this.state.showFooter = false;
		this._commonService.update({ type: 'overlay', action: 'start' });
		this._commonService.saveApi('saveVendorServicesBidDeadline', { services: params })
			.then(res => {
				if (res['result'] && res['result'].success) {
					// this.state.bidDeadlines = res['result'].data.products
					this.openSnackBar({ status: 'success', msg: 'Bid Deadlines Updated Successfully' });
				}
				this._commonService.update({ type: 'overlay', action: 'stop' });
			}).catch(err =>{
				this._commonService.update({ type: 'overlay', action: 'stop' });
			});
	}

	openSnackBar(obj) {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

	/* Milestone */
	isAdd: boolean = false;
	inProgress: boolean = true;
	saveMilestonePromise: any = undefined;
	applyPromise: any = undefined;
	selectedMilestone: any = null;
	showFooter: boolean = false;
	checkValidation: boolean = false;
	taskNameControl = new FormControl('', Validators.required);
	getJobMilestones() {
		this.inProgress = true;
		this._commonService.getApi('getVendorMilestone', { jobs_id: this.state.projectID })
			.then(res => {
				this.inProgress = false;
				if (res['result'].success) {
					this.state.milestoneList = res['result'].data || [];
				}
			})
	}
	performActions(key, item?, indx?) {
		if (key == 'add') {
			if (!this.isAdd) {
				this.state.milestoneList.push({
					id: null, name: '', start_date: null, milestone_id: null, is_new: true
				})
				this.isAdd = true;
				setTimeout(() => {
					this.scrollElement.nativeElement.scrollTop = this.scrollElement.nativeElement.scrollHeight;
				}, 20);
			} else {
				this.checkValidation = true;
				const last = this.state.milestoneList[this.state.milestoneList.length - 1];
				if (last.milestone_id) {
					this.checkValidation = false;
					this.state.milestoneList.push({
						id: null, name: '', start_date: null, milestone_id: null, is_new: true
					})
					setTimeout(() => {
						this.scrollElement.nativeElement.scrollTop = this.scrollElement.nativeElement.scrollHeight;
					}, 20);
				}
			}
		} else if (key == 'delete') {
			if (item.is_new) {
				this.state.milestoneList.splice(indx, 1);
			} else {
				this.deleteMilestone(item, () => {
					this.state.milestoneList.splice(indx, 1);
				})
			}
		} else if (key == 'apply') {
			if (!this.applyPromise) {
				this._commonService.update({ type: 'overlay', action: 'start' });
				this.applyPromise = this._commonService.saveApi('saveTempVendMilestones', { id: this.selectedMilestone, jobs_id: this.state.projectID })
					.then(res => {
						this.applyPromise = undefined;
						if (res['result'].success) {
							this.selectedMilestone = '';
							this.openSnackBar({ status: 'success', msg: 'Milestone Imported Successfully' });
							this.getJobMilestones();
							this.resetForm();
						}
						this._commonService.update({ type: 'overlay', action: 'stop' });
					})
					.catch(err => {
						this.applyPromise = undefined;
						this._commonService.update({ type: 'overlay', action: 'stop' });
					})
			}
		}
	}
	milestoneChange(val, i) {
		if (val) {
			this.showFooter = true;
			this.state.milestoneList[i].name = this.getMilestoneName(val);
		}
	}
	getMilestoneName(id) {
		const data = _.find(this.state.milestones, ['id', id]);
		if (data) return data.name;
		else return null;
	}
	cancelMilestones() {
		this.getJobMilestones();
		this.resetForm();
	}
	deleteMilestone(data, cb?) {
		this._commonService.update({ type: 'overlay', action: 'start' });
		const locals = {
			title: 'Delete Milestone',
			url: 'delVendorMilestones',
			method: 'delete',
			params: {
				id: data.id,
			},
			content: `<div class="po-dialog">
						<div class="">
							<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
						</div>
						<div class="">
							<p>Are you sure, you want to delete this Milestone?</p>
						</div>
					</div>`,
			buttonText: 'Delete'
		}

		this._commonService.deleteApi('delVendorMilestones', locals.params)
		.then(res => {
			this._commonService.update({ type: 'overlay', action: 'stop' });
			if(res['result'].success) {
				this.openSnackBar({ status: 'success', msg: 'Milestone Deleted Successfully' });
				if (cb) cb();
			}
		}).catch(err =>{
			this._commonService.update({ type: 'overlay', action: 'stop' });
		})
		return;
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'recon-dialog',
			width: '570px',
			data: { ...locals }
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.openSnackBar({ status: 'success', msg: 'Milestone Deleted Successfully' });
					if (cb) cb();
				}
			})
	}
	resetForm() {
		this.showFooter = false;
		this.isAdd = false;
		this.checkValidation = false;
	}
	saveMilestones() {
		if (!this.saveMilestonePromise) {
			const params = []; let valid = true;
			this.state.milestoneList.map((o, i) => {
				params.push({
					id: o.id,
					name: o.name,
					milestone_id: o.milestone_id,
					start_date: o.start_date ? _moment(o.start_date).format('YYYY-MM-DD HH:mm:ss') : null,
					order: o.order ? o.order : (i + 1)
				});
				if (!o.milestone_id) {
					valid = false;
					this.checkValidation = true;
				}
			})
			if (valid) {
				this.saveMilestonePromise = this._commonService.saveApi('saveVendorMilestones', { milestones: params, jobs_id: this.state.projectID })
					.then(res => {
						this.saveMilestonePromise = undefined;
						if (res['result'].success) {
							this.getJobMilestones();
							this.resetForm();
							this.openSnackBar({ status: 'success', msg: 'Milestone Updated Successfully' });
						}
					})
					.catch(err => {
						this.saveMilestonePromise = undefined;
					})
			}
		}
	}

}
