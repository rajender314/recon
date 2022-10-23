import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '@angular/material';
import { FormControl } from '@angular/forms';
import { CommonService } from '@app/common/common.service';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
var APP: any = window['APP'];

@Component({
	selector: 'app-vendor-schedule',
	templateUrl: './vendor-schedule.component.html',
	styleUrls: ['./vendor-schedule.component.scss']
})
export class VendorScheduleComponent implements OnInit {

	inProgress: boolean = false;
	showFooter: boolean = false;
	minDate = new Date();
	maxDate = null;
	vendorsList: Array<any> = [];
	vendorMilestones: Array<any> = [];
	selectedMilestone: any = null;
	selectedVendor = new FormControl('');
	dropdowns = {
		milestones: [],
		vendorTemplates: []
	}
	public APP = APP;
	isAdd: boolean = false;
	checkValidation: boolean = false;
	applyPromise: any = undefined;
	saveMilestonePromise: any = undefined;
	allowEditable:boolean;
	sortOptions: any = {
		handle: '.handle',
		onUpdate: (event: any) => {
			this.showFooter = true;
			this.vendorMilestones.map((o, i) => {
				o.order = i + 1
			});
		}
	}

	constructor(
		private _snackbar: MatSnackBar,
		private _dialog: MatDialog,
		private _commonService: CommonService,
		private dialogRef: MatDialogRef<VendorScheduleComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.vendorsList = data.vendorsList || [];
		if (this.data.selectedVendor) {
			this.selectedVendor.setValue(this.data.selectedVendor);
			this.getVendorSchedule(this.data.selectedVendor);
		}
	}

	ngOnInit() {
		this.getMilestones();
		this.getVendorTemplates();
		this.allowEditable =  this.checkPermission();
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

	getMilestones() {
		this._commonService.getApi('getTasks', { page: 1, pageSize: 10000, sort: 'asc', status: true, is_milestone: 2, milestone_type: 2 })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.milestones = res['result'].data.items || [];
				}
			})
	}

	getVendorTemplates() {
		this._commonService.getApi('departmentsVendTemp', { department_id: 50 })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.vendorTemplates = res['result'].data || [];
				}
			})
	}

	getVendorSchedule(id) {
		this.inProgress = true;
		this._commonService.getApi('getMultiTempVendMilestones', { vendor_id: id, jobs_id: this.data.jobs_id })
			.then(res => {
				this.inProgress = false;
				if (res['result'].success) {
					this.vendorMilestones = res['result'].data || [];
				}
			})
	}

	changeVendor(id) {
		this.getVendorSchedule(id);
	}

	performActions(key, item?, indx?) {
		if (key == 'add') {
			if (!this.isAdd) {
				this.vendorMilestones.push({
					vendor_id: null,
					name: '',
					vendor_milestone_id: null,
					vendor_name: '',
					due_date: null,
					is_new: true
				})
				this.isAdd = true;
			} else {
				this.checkValidation = true;
				const last = this.vendorMilestones[this.vendorMilestones.length - 1];
				if (last.milestone_id) {
					this.checkValidation = false;
					this.vendorMilestones.push({
						id: null, name: '', start_date: null, milestone_id: null, is_new: true
					})
				}
			}
		} else if (key == 'delete') {
			if (item.is_new) {
				this.vendorMilestones.splice(indx, 1);
			} else {
				this.deleteMilestone(item, () => {
					this.vendorMilestones.splice(indx, 1);
				})
			}
		} else if (key == 'apply') {
			// if (!this.applyPromise) {
			// 	this.applyPromise = this._commonService.saveApi('saveTempVendMilestones', { id: this.selectedMilestone, jobs_id: this.state.projectID })
			// 		.then(res => {
			// 			this.applyPromise = undefined;
			// 			if (res['result'].success) {
			// 				this.selectedMilestone = '';
			// 				this.getJobMilestones();
			// 				this.resetForm();
			// 			}
			// 		})
			// 		.catch(err => {
			// 			this.applyPromise = undefined;
			// 		})
			// }
		}
	}

	milestoneChange(val, i) {
		if (val) {
			this.showFooter = true;
			this.vendorMilestones[i].name = this.getMilestoneName(val);
		}
	}

	getMilestoneName(id) {
		const data = _.find(this.dropdowns.milestones, ['id', id]);
		if (data) return data.name;
		else return null;
	}

	cancelMilestones() {
		this.changeVendor(this.selectedVendor.value);
		this.resetForm();
	}
	deleteMilestone(data, cb?) {
		const locals = {
			title: 'Delete Milestone',
			url: 'delMultiVendorMilestones',
			method: 'delete',
			params: {
				id: data.id
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
			this.vendorMilestones.map((o, i) => {
				params.push({
					vendor_id: o.vendor_id,
					name: o.name,
					id: o.id,
					jobs_id: o.jobs_id,
					vendor_milestone_id: o.vendor_milestone_id,
					vendor_name: o.vendor_name,
					due_date: o.due_date ? _moment(o.due_date).format('YYYY-MM-DD HH:mm:ss') : null,
					order: o.order ? o.order : (i + 1)
				});
				if (!o.vendor_milestone_id) {
					valid = false;
					this.checkValidation = true;
				}
			})
			if (valid) {
				this.saveMilestonePromise = this._commonService.saveApi('saveMultiTempVendMilestones', { milestones: params, jobs_id: this.data.jobs_id, vendor_id: this.selectedVendor.value })
					.then(res => {
						this.saveMilestonePromise = undefined;
						if (res['result'].success) {
							this.getVendorSchedule(this.selectedVendor.value);
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

	checkPermission() {
		if (this._commonService.job_status_id == 8 || this._commonService.job_status_id == 10) {
			if (APP.permissions.job_access['post-completion_estimate'] == 'yes' && APP.permissions.job_access.vendor_queue=='edit') {
				return true;
			}
		}else if(this._commonService.job_status_id == 5){
			if (APP.permissions.job_access['edit_cancelled_jobs'] == 'yes' && APP.permissions.job_access.vendor_queue=='edit') {
				return true;
			}
		}
		return false;
	}
}
