import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges, ViewChildren, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Options, LabelType } from 'ng5-slider';
import { CommonService } from '@app/common/common.service';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material';
import { TimeIntervalSteps, PiSelectFocus } from '@app/shared/utility/config';

@Component({
	selector: 'app-add-time-track',
	templateUrl: './add-time-track.component.html',
	styleUrls: ['./add-time-track.component.scss']
})
export class AddTimeTrackComponent implements OnInit, OnChanges, AfterViewInit {

	@Input() config: any = {
		isProject: false,
		disableProject: false,
		disableTaskType: false,
		disableDate: false,
		needResponse: false,
		defaultValues: {
			id: '',
			jobs_id: '',
			jobs_tasks_id: '',
			date: new Date(),
			range: [9, 12],
			track_time: '3:00 h',
			description: ''
		},
		url: 'saveTrackTime',
		isChange: false
	};
	@Output() onClose = new EventEmitter();
	@ViewChildren('piSelectInput') piSelectInput: any;

	state = {
		submitted: false,
		maxDate: new Date(),
		showRange: false,
		dropdowns: {
			jobs: [],
			tasks: [],
			products: []
		}
	}

	options: Options = {
		floor: 8,
		ceil: 23,
		step: 1,
		noSwitching: true,
		hideLimitLabels: true,
		minRange: 1,
		stepsArray: TimeIntervalSteps,
		translate: (value: number, label: LabelType): string => {
			switch (label) {
				case LabelType.Low:
					return 'From: ' + _.find(this.options.stepsArray, ['value', value]).legend;
				case LabelType.High:
					return 'To: ' + _.find(this.options.stepsArray, ['value', value]).legend;
				default:
					return '';
			}
		}
	};

	trackTimeForm: FormGroup;

	constructor(
		private _fb: FormBuilder,
		private _snackbar: MatSnackBar,
		private _commonService: CommonService
	) { }

	ngOnInit() {
		if (!this.config.isProject && !this.config.disableProject) this.getJobsList();
		this.createForm();
		if (this.config.defaultValues.date) this.trackTimeForm.controls.date.setValue(this.config.defaultValues.date);
		if (this.config.disableProject) {
			this.trackTimeForm.setValue(this.config.defaultValues, { emitEvent: true });
			if (!this.config.isProject && this.config.disableProject) this.state.dropdowns.jobs = this.config.jobsList || [];
			setTimeout(() => {
				this.state.showRange = true;
			}, 200);
		}

		if (this.config.disableTaskType) this.state.dropdowns.tasks = this.config.tasksList || [];
		if (this.config.disableDate) this.trackTimeForm.controls.date.disable();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.config.previousValue) {
			this.trackTimeForm.setValue(changes.config.currentValue.defaultValues, { emitEvent: false });
			if (!this.config.isProject && this.config.disableProject) this.state.dropdowns.jobs = changes.config.currentValue.jobsList || [];
			setTimeout(() => {
				this.state.showRange = true;
			}, 200);

			if (this.config.disableTaskType) this.state.dropdowns.tasks = this.config.tasksList || [];
			if (this.config.disableDate) this.trackTimeForm.controls.date.disable();
		}
	}

	ngAfterViewInit() {
		setTimeout(() => {
			if (!this.config.disableTaskType) {
				const indx = this.config.disableProject ? 1 : 0;
				PiSelectFocus(this.piSelectInput, indx);
			}
		}, 20);
	}

	createForm() {
		this.trackTimeForm = this._fb.group({
			id: '',
			jobs_id: ['', Validators.required],
			jobs_tasks_id: ['', Validators.required],
			date: ['', Validators.required],
			range: [this.config.defaultValues.range],
			track_time: '',
			description: ''
		});

		this.trackTimeForm.controls.jobs_id.valueChanges.subscribe(val => {
			if (!this.config.disableTaskType) this.getJobTasks(val);
			this.getProductService(val);
		})

		this.trackTimeForm.controls.range.valueChanges.subscribe(val => {
			var startTime = _moment(val[0], "HH:mm:ss");
			var endTime = _moment(val[1], "HH:mm:ss");
			var duration = _moment.duration(endTime.diff(startTime));
			var hours = parseInt((<any>duration.asHours()));
			var minutes = parseInt((<any>duration.asMinutes())) - hours * 60;
			this.trackTimeForm.controls.track_time.setValue((hours.toString().length > 1 ? hours : '0' + hours) + ':' + (minutes.toString().length > 1 ? minutes : minutes + '0') + ' h');
		})
	}

	getJobsList() {
		this._commonService.saveApi('userJobList', {})
			.then(res => {
				if (res['result'].success) {
					this.state.dropdowns.jobs = res['result'].data || [];
				}
			})
	}

	getJobTasks(id) {
		this._commonService.saveApi('getAllTasks', { type: 'dropdown', jobs_id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.dropdowns.tasks = res['result'].data || [];
				}
			})
	}

	getProductService(id) {
		this._commonService.saveApi('getVendorServicesBidDeadline', { job_id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.dropdowns.products = res['result'].data.products || [];
				}
			})
	}

	isCheckedAll() {
		let counter = 0, childCounter = 0, canEnter = true, childCond = true, hasSelected = false;
		while (canEnter && counter < this.state.dropdowns.products.length) {
			if (!this.state.dropdowns.products[counter].is_checked) {
				canEnter = false;
			} else {
				hasSelected = true;
				if (this.state.dropdowns.products[counter].services && this.state.dropdowns.products[counter].services.length) {
					while (childCond && childCounter < this.state.dropdowns.products[counter].services.length) {
						if (!this.state.dropdowns.products[counter].services[childCounter].is_checked) {
							childCond = false;
						} else hasSelected = true;
						childCounter++;
					}
					childCounter = 0;
					canEnter = childCond;
				}
			}
			counter++;
		}
		// this.isSelectAll = canEnter;
	}

	checkProduct(item) {
		if (item.services && item.services.length) {
			item.services.map(o => {
				o.is_checked = item.is_checked;
			})
		}
		this.isCheckedAll();
	}

	checkService(item, parent) {
		if (item.is_checked) {
			parent.is_checked = true;
		} else {
			let parentChk = false;
			parent.services.map(o => {
				if (o.is_checked) parentChk = true;
			});

			parent.is_checked = parentChk;
		}

		this.isCheckedAll();
	}

	resetForm() {
		if (this.config.isProject || this.config.disableProject || this.config.needResponse) this.goBack({ isCancel: true });
		else this.trackTimeForm.reset(this.config.defaultValues, { emitEvent: false });
	}

	goBack(obj?) {
		if (obj) this.onClose.emit(obj);
		else this.onClose.emit();
	}

	addTime(form: FormGroup) {
		this.state.submitted = true;
		if (form.valid) {
			this.state.submitted = false;
			form.value.date = _moment(form.value.date).format('YYYY-MM-DD');
			form.value.track_time = form.value.track_time.split(' ')[0];
			const start = form.value.range[0].toFixed(2).split('.');
			let shr = Number(start[0]) * 60 * 60;
			let smn = start.length > 1 ? Number(start[1]) * 60 : 0;
			let startSec = _moment.duration((shr + smn), 'seconds');
			const end = form.value.range[1].toFixed(2).split('.');
			let ehr = Number(end[0]) * 60 * 60;
			let emn = end.length > 1 ? Number(end[1]) * 60 : 0;
			let endSec = _moment.duration((ehr + emn), 'seconds');
			form.value.start = form.value.date.concat(' ' + (Math.floor(startSec.asHours()).toString().length > 1 ? Math.floor(startSec.asHours()) : '0' + Math.floor(startSec.asHours())) + ':' + (startSec.minutes().toString().length > 1 ? startSec.minutes() : '0' + startSec.minutes()) + ':' + (startSec.seconds().toString().length > 1 ? startSec.seconds() : '0' + startSec.seconds()));
			form.value.end = form.value.date.concat(' ' + (Math.floor(endSec.asHours()).toString().length > 1 ? Math.floor(endSec.asHours()) : '0' + Math.floor(endSec.asHours())) + ':' + (endSec.minutes().toString().length > 1 ? endSec.minutes() : '0' + endSec.minutes()) + ':' + (endSec.seconds().toString().length > 1 ? endSec.seconds() : '0' + endSec.seconds()));
			this._commonService.saveApi(this.config.url, form.value)
				.then(res => {
					if (res['result'].success) {
						this.snackbarModal();
						if (this.config.isProject || this.config.disableProject || this.config.needResponse) this.goBack({ isCancel: false, data: res['result'].data });
						else this.goBack();
					}
				})
		}
	}

	snackbarModal(isNew = true, msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: 'success', msg: msg ? msg : ('Log Time ' + (isNew ? 'Added ' : 'Updated ') + ' Successfully') },
			verticalPosition: 'top',
			horizontalPosition: 'right'
		});
	}

}
