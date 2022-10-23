import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import timelinePlugin from '@fullcalendar/timeline';
import interaction from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import * as _moment from 'moment';
import { CommonService } from '@app/common/common.service';
import { ExtendedEventSourceInput } from '@fullcalendar/core/structs/event-source';
import { MatDialog } from '@angular/material';
import { AddTrackTimeComponent } from '../add-track-time/add-track-time.component';
import { EventApi } from '@fullcalendar/core';

var APP = window['APP'];

@Component({
	selector: 'app-track-time-view',
	templateUrl: './track-time-view.component.html',
	styleUrls: ['./track-time-view.component.scss']
})
export class TrackTimeViewComponent implements OnInit, AfterViewInit {

	@ViewChild('calendar') calendarComponent: FullCalendarComponent;

	trackConfig = {
		isProject: false,
		disableProject: false,
		disableTaskType: false,
		disableDate: false,
		needResponse: true,
		isChange: false,
		allowAdd: false,
		allowEdit: false,
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
		tasksList: [],
		url: 'saveTrackTime'
	}

	showSidenav: boolean = false;
	disableOutSideClick: boolean = true;
	showView: boolean = false;
	calendarViews = [
		// { value: 'list', label: 'List' },
		{ value: 'timeGridDay', label: 'Day' },
		{ value: 'timeGridWeek', label: 'Week' },
		// { value: 'dayGridMonth', label: 'Month' }
	];
	selectedView: string = 'timeGridDay';
	tasksList = []; /*ExtendedEventSourceInput = {
		events: [
			// { id: 1, title: 'Academy Omni Offer', date: '2019-05-08', start: '2019-05-08 02:50:00', end: '2019-05-08 04:50:00', job_id: 1, job_name: 'Academy Omni Offer', task_id: 2, task_name: 'Project time line' },
			// { id: 2, title: 'Sams Goat', date: '2019-05-08', start: '2019-05-08 03:05:00', end: '2019-05-08 05:05:00', job_id: 1, job_name: 'Sams Goat', task_id: 2, task_name: 'Information Architecture' },
			// { id: 3, title: 'Academy Omni Offer', date: '2019-05-08', start: '2019-05-08 02:50:00', end: '2019-05-08 04:50:00', job_id: 1, job_name: 'Academy Omni Offer', task_id: 2, task_name: 'Project time line' },
			// { id: 4, title: 'Sams Goat', date: '2019-05-08', start: '2019-05-08 03:05:00', end: '2019-05-08 05:05:00', job_id: 1, job_name: 'Sams Goat', task_id: 2, task_name: 'Information Architecture' },
			// { id: 5, title: 'Academy Omni Offer', date: '2019-05-08', start: '2019-05-08 02:50:00', end: '2019-05-08 04:50:00', job_id: 1, job_name: 'Academy Omni Offer', task_id: 2, task_name: 'Project time line' },
			// { id: 6, title: 'Sams Goat', date: '2019-05-08', start: '2019-05-08 03:05:00', end: '2019-05-08 05:05:00', job_id: 1, job_name: 'Sams Goat', task_id: 2, task_name: 'Information Architecture' },
			// { id: 7, title: 'Version List', date: '2019-05-16', start: '2019-05-16 06:50:00', end: '2019-05-16 08:50:00', job_id: 1, job_name: 'Version List', task_id: 2, task_name: 'Project time line' },
			// { id: 8, title: 'Recon 2.O', date: '2019-05-16', start: '2019-05-16 08:05:00', end: '2019-05-16 09:05:00', job_id: 1, job_name: 'Recon 2.O', task_id: 2, task_name: '' }
		]
	}*/
	totalDuration = '00h 00m';

	colorPicker = [
		{ backgroundColor: '#FFF1F3', borderColor: '#ECD3D7', textColor: '#BF606D', className: 'picker-1' },
		{ backgroundColor: '#DEE9FF', borderColor: '#BFCEEC', textColor: '#1E4F96', className: 'picker-2' },
		{ backgroundColor: '#E6FAEF', borderColor: '#BFDFCD', textColor: '#0F6343', className: 'picker-3' },
		{ backgroundColor: '#F9EBFB', borderColor: '#E2C8E5', textColor: '#912C7A', className: 'picker-4' },
		{ backgroundColor: '#FFEFC7', borderColor: '#E7D5A7', textColor: '#C4884E', className: 'picker-5' },
		{ backgroundColor: '#D0ECF4', borderColor: '#AAD1DC', textColor: '#4E95AA', className: 'picker-6' },
		{ backgroundColor: '#E5DCF8', borderColor: '#C3B8DC', textColor: '#68588D', className: 'picker-7' },
		{ backgroundColor: '#F1F2CC', borderColor: '#D9DAA6', textColor: '#9D9B3A', className: 'picker-8' },
		{ backgroundColor: '#FFE2EF', borderColor: '#EAC5D6', textColor: '#B36A8B', className: 'picker-9' },
		{ backgroundColor: '#D0F0FF', borderColor: '#B9DBEB', textColor: '#5091AF', className: 'picker-10' }
	]
	colorKeys = ['backgroundColor', 'borderColor', 'textColor'];
	// className

	datePikerControl: FormControl = new FormControl(new Date());
	weekPickerControl: FormControl = new FormControl(null);
	taskParams: any = {
		type: 'day',
		date: _moment(this.datePikerControl.value).format('YYYY-MM-DD'),
		day_no: _moment(this.datePikerControl.value).day()
	}
	weekNoList = []

	calendarConfig: any = {
		header: false,
		nowIndicator: true,
		weekNumbers: true,
		editable: false,
		height: window.innerHeight - 64,
		eventLimit: 3,
		plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interaction], /** interaction - for drag & drop features */
		columnHeaderFormat: { weekday: 'long' },
		eventRender: (info) => {
			const data = _.find(this.tasksList, ['id', Number(info.event.id)]);
			if (this.selectedView == 'list') {
				/** list view */
			} else {
				/** day, week, month view */
				let element = info.el.querySelector('.fc-title');
				if (element) {
					element.innerHTML = '';
					let projectTitle = document.createElement('div');
					projectTitle.className = "fc-job-name";
					projectTitle.appendChild(document.createTextNode(data.jobs_name));
					element.appendChild(projectTitle);
					let taskTitle = document.createElement('div');
					taskTitle.className = "fc-tasks-name";
					taskTitle.appendChild(document.createTextNode(data.jobs_tasks_name));
					element.appendChild(taskTitle);
				}
			}
		}
	}

	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog
	) {
		let counter = 1;
		this.weekNoList = _.times(52, () => {
			let obj = { week_no: counter, week_name: 'Week ' + counter };
			counter++;
			return obj;
		});

		this.datePikerControl.valueChanges.subscribe(val => {
			this.onSelection(val, false);
		});
		//APP.permissions.system_access.enable_time_tracking == 'edit'
		this.trackConfig.allowAdd = APP.permissions.system_access.new_time_entry == 'yes';
		this.trackConfig.allowEdit = ['everyone', 'self'].includes(APP.permissions.system_access.edit_time_entries_done_by);
	}

	ngOnInit() {
		this.getTasks(this.taskParams);
	}

	ngAfterViewInit() {
		setTimeout(() => {
			this.showView = true;
		}, 20);
	}

	isEnable(): boolean {
		if (this.calendarComponent && this.calendarComponent.getApi()) {
			const calendarDate = _moment(this.calendarComponent.getApi().getDate()).format('YYYY-MM-DD');
			const today = _moment(new Date()).format('YYYY-MM-DD');
			return calendarDate == today ? true : false;
		} else {
			return true;
		}
	}

	today() {
		this.calendarComponent.getApi().today();
		this.updateControls(true);
	}

	goToPrev() {
		this.calendarComponent.getApi().prev();
		this.updateControls(true);
	}

	onWeekChange(val) {
		this.onSelection(val, false);
	}

	goToNext() {
		this.calendarComponent.getApi().next();
		this.updateControls(true);
	}

	updateControls(isChange = true) {
		if (this.selectedView == 'timeGridDay' || this.selectedView == 'list') {
			this.datePikerControl.patchValue(this.calendarComponent.getApi().getDate(), { emitEvent: false });
			this.onSelection(this.datePikerControl.value, isChange);
		}
		else if (this.selectedView == 'timeGridWeek') {
			this.weekPickerControl.patchValue(_moment(this.calendarComponent.getApi().getDate()).week(), { emitEvent: false });
			if (!isChange) this.onSelection(this.weekPickerControl.value, isChange);
		}
	}

	changeView(view) {
		this.selectedView = view;
		this.updateControls(false);
		this.calendarComponent.getApi().changeView(view);
	}

	showFilter(flag) {
		if (flag == 'show') {
			this.showSidenav = !this.showSidenav;
			if (!this.showSidenav) this.onSelection(this.datePikerControl.value, false);
		}
	}

	onSelection(val, isChange = true) {
		const params: any = {};
		switch (this.selectedView) {
			case 'list':
				params.type = 'list';
				break;
			case 'timeGridDay':
				this.calendarConfig.columnHeaderFormat = { weekday: 'long' };
				params.type = 'day';
				params.day_no = _moment(this.datePikerControl.value).day()
				params.date = _moment(val).format('YYYY-MM-DD');
				break;
			case 'timeGridWeek':
				params.type = 'week';
				params.week_no = val; //_moment(val).week();
				params.date = _moment(_moment().day("Sunday").week(val)['_d']).format('YYYY-MM-DD');
				this.calendarConfig.columnHeaderFormat = { weekday: 'short', month: 'short', day: 'numeric' };
				break;
			case 'dayGridMonth':
				params.type = 'month';
				params.month_no = _moment(val).month();
				this.calendarConfig.columnHeaderFormat = { weekday: 'short' }
				break;
			default:
				break;
		}
		if (!isChange) {
			const date = (this.selectedView == 'timeGridDay' || this.selectedView == 'list') ? val : _moment().day("Sunday").week(val)['_d'];
			this.calendarComponent.getApi().gotoDate(date);
		}
		this.getTasks(params);
	}

	sum(arr) {
		return arr.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
	}

	getTasks(params) {
		this._commonService.saveApi('getTrackTime', params)
			.then(res => {
				if (res['result'].success) {
					this.tasksList = res['result'].data || [];
					let minutesArr = [];
					this.tasksList.map((task, i) => {
						task.title = task.jobs_name;
						var startTime = _moment(task.start, "YYYY-MM-DD HH:mm:ss");
						var endTime = _moment(task.end, "YYYY-MM-DD HH:mm:ss");
						var duration = _moment.duration(endTime.diff(startTime));
						var hours = parseInt((<any>duration.asHours()));
						var minutes = parseInt((<any>duration.asMinutes())) - hours * 60;
						task.duration = (hours + ':' + minutes);
						task.minutes = duration.asMinutes();
						minutesArr.push(task.minutes);
						const color = this.colorPicker[String(i).slice(-1)];
						this.colorKeys.map(prop => {
							task[prop] = color[prop];
						});
						task['className'] = 'picker-type-' + task.jobs_tasks_type_id;
						task.editable = task.jobs_tasks_status != 5 ? true : false;
					});
					let duration = _moment.duration({ 'minutes': this.sum(minutesArr) });
					this.totalDuration = (<any>duration)._data.hours + 'h ' + (<any>duration)._data.minutes + 'm';

				}
			})
	}

	onAfterClose(ev) {
		this.calendarComponent.getApi().unselect();
		if (ev) {
			if (!ev.isCancel) this.getTasks(this.taskParams);
		}
		this.showFilter('show');
	}

	addTask() {
		this.trackConfig.disableProject = false;
		this.trackConfig.disableTaskType = false;
		this.trackConfig.jobsList = [];
		this.trackConfig.tasksList = [];
		this.trackConfig.defaultValues.id = '';
		this.trackConfig.defaultValues.jobs_id = '';
		this.trackConfig.defaultValues.jobs_tasks_id = '';
		this.trackConfig.defaultValues.date = null;
		this.trackConfig.defaultValues.range = [9, 12];
		this.trackConfig.defaultValues.track_time = '3:00 h';
		this.trackConfig = { ...this.trackConfig };

		this.showFilter('show');
	}

	updateTrackConfig(data) {
		var startTime = [], endTime = [];
		if (data.start) {
			startTime.push(_moment(data.start).hour());
			if (_moment(data.start).minute()) startTime.push(_moment(data.start).minute());
			this.trackConfig.defaultValues.range[0] = Number(startTime.join('.'));
		}
		if (data.end) {
			endTime.push(_moment(data.end).hour());
			if (_moment(data.end).minute()) endTime.push(_moment(data.end).minute());
			this.trackConfig.defaultValues.range[1] = Number(endTime.join('.'));
		}
		this.trackConfig.defaultValues.track_time = this.setRangeTime(this.trackConfig.defaultValues.range);
		if (data.selected) {
			this.trackConfig.disableProject = true;
			this.trackConfig.disableTaskType = true;
			this.trackConfig.jobsList = [{ id: data.selected.jobs_id, name: data.selected.job_no + ' - ' + data.selected.jobs_name }];
			this.trackConfig.tasksList = [{ id: data.selected.jobs_tasks_id, task_name: data.selected.jobs_tasks_name }];
			this.trackConfig.defaultValues.id = data.selected.id;
			this.trackConfig.defaultValues.jobs_id = data.selected.jobs_id;
			this.trackConfig.defaultValues.jobs_tasks_id = data.selected.jobs_tasks_id;
			this.trackConfig.defaultValues.date = new Date(data.selected.date);
		} else {
			this.trackConfig.disableProject = false;
			this.trackConfig.disableTaskType = false;
			this.trackConfig.jobsList = [];
			this.trackConfig.tasksList = [];
			this.trackConfig.defaultValues.id = '';
			this.trackConfig.defaultValues.jobs_id = '';
			this.trackConfig.defaultValues.jobs_tasks_id = '';
			this.trackConfig.defaultValues.date = data.start;
		}
		this.trackConfig = { ...this.trackConfig };
	}

	dateTimeSelection(ev) {
		if (this.trackConfig.allowAdd) {
			const data = {
				title: 'Track Time',
				selected: null,
				start: ev.start,
				end: ev.end,
				type: 'cl-add'
			}
			this.updateTrackConfig(data);
			this.showFilter('show');
		}
		/*this._dialog.open(AddTrackTimeComponent, {
			panelClass: ['add-track-time', 'recon-dialog'],
			width: '300px',
			disableClose: true,
			data: {
				title: 'Track Time',
				selected: null,
				start: ev.start,
				end: ev.end,
				type: 'cl-add'
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					this.calendarComponent.getApi().unselect();
					if (res.success) this.getTasks(this.taskParams);
				}
			})*/
	}

	setRangeTime(range) {
		var startTime = _moment(range[0], "HH:mm:ss");
		var endTime = _moment(range[1], "HH:mm:ss");
		var duration = _moment.duration(endTime.diff(startTime));
		var hours = parseInt((<any>duration.asHours()));
		var minutes = parseInt((<any>duration.asMinutes())) - hours * 60;
		return (hours.toString().length > 1 ? hours : '0' + hours) + ':' + (minutes.toString().length > 1 ? minutes : minutes + '0');
	}

	onEventDrop(ev) {
		const task = _.find(this.tasksList, ['id', Number(ev.event.id)]);
		if (task) {
			const params = {
				id: task.id,
				jobs_id: task.jobs_id,
				jobs_tasks_id: task.jobs_tasks_id,
				date: _moment(ev.event.start).format('YYYY-MM-DD'),
				range: task.range,
				track_time: '3:00 h',
				description: '',
				start: _moment(ev.event.start).format('YYYY-MM-DD HH:MM:SS'),
				end: _moment(ev.event.end).format('YYYY-MM-DD HH:MM:SS')
			}
			if (ev.event.start) params.range[0] = _moment(ev.event.start).hour();
			if (ev.event.end) params.range[1] = _moment(ev.event.end).hour();
			params.track_time = this.setRangeTime(params.range);
			this._commonService.saveApi('saveTasksLogs', params)
				.then(res => {
					if (res['result'].success) {
						// success
					} else {
						(<EventApi>ev.event).setDates(ev.oldEvent.start, ev.oldEvent.end);
					}
				})
		}
	}

	onEventClick(ev) {
		const task = _.find(this.tasksList, ['id', Number(ev.event.id)]);
		if (task && task.jobs_tasks_status != 5 && this.trackConfig.allowEdit) {
			const data = {
				title: 'Track Time',
				selected: task ? task : null,
				start: ev.event.start,
				end: ev.event.end,
				type: 'cl-edit'
			}
			this.updateTrackConfig(data);
			this.showFilter('show');
			/*this._dialog.open(AddTrackTimeComponent, {
				panelClass: ['add-track-time', 'recon-dialog'],
				width: '300px',
				disableClose: true,
				data: {
					title: 'Track Time',
					selected: task ? task : null,
					start: ev.event.start,
					end: ev.event.end,
					type: 'cl-edit'
				}
			})
				.afterClosed()
				.subscribe(res => {
					if (res) {
						this.calendarComponent.getApi().unselect();
						if (res.success) this.getTasks(this.taskParams);
					}
				})*/
		}
	}

}
