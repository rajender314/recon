import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import * as _moment from 'moment';
import { range } from 'rxjs';

@Component({
  selector: 'app-add-track-time',
  templateUrl: './add-track-time.component.html',
  styleUrls: ['./add-track-time.component.scss']
})
export class AddTrackTimeComponent implements OnInit {

  trackConfig = {
    isProject: false,
    disableProject: false,
    disableTaskType: false,
    disableDate: true,
    needResponse: true,
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
    tasksList: [],
    url: 'saveTasksLogs'
  }

  dailogCloseData = {
    success: false,
    data: null
  }

  constructor(
    private _dialogRef: MatDialogRef<AddTrackTimeComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    if (this.data.start) this.trackConfig.defaultValues.range[0] = _moment(this.data.start).hour();
    if (this.data.end) this.trackConfig.defaultValues.range[1] = _moment(this.data.end).hour();
    this.trackConfig.defaultValues.track_time = this.setRangeTime(this.trackConfig.defaultValues.range);
    if (this.data.selected) {
      this.trackConfig.disableProject = true;
      this.trackConfig.disableTaskType = true;
      this.trackConfig.jobsList = [{ id: this.data.selected.jobs_id, job_no: this.data.selected.jobs_name }];
      this.trackConfig.tasksList = [{ id: this.data.selected.jobs_tasks_id, task_name: this.data.selected.jobs_tasks_name }];
      this.trackConfig.defaultValues.id = this.data.selected.id;
      this.trackConfig.defaultValues.jobs_id = this.data.selected.jobs_id;
      this.trackConfig.defaultValues.jobs_tasks_id = this.data.selected.jobs_tasks_id;
      this.trackConfig.defaultValues.date = new Date(this.data.selected.date);
    } else {
      this.trackConfig.defaultValues.date = this.data.start;
    }
    this.trackConfig = { ...this.trackConfig };
  }

  setRangeTime(range) {
    var startTime = _moment(range[0], "HH:mm:ss");
    var endTime = _moment(range[1], "HH:mm:ss");
    var duration = _moment.duration(endTime.diff(startTime));
    var hours = parseInt((<any>duration.asHours()));
    var minutes = parseInt((<any>duration.asMinutes())) - hours * 60;
    return (hours.toString().length > 1 ? hours : '0' + hours) + ':' + (minutes.toString().length > 1 ? minutes : minutes + '0') + ' h';
  }

  onAfterClosed(ev) {
    if (ev) {
      if (!ev.isCancel) this._dialogRef.close({ success: true, data: null });
      else this._dialogRef.close(this.dailogCloseData);
    }
  }

}
