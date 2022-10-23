import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';

@Component({
	selector: 'app-add-task',
	templateUrl: './add-task.component.html',
	styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent implements OnInit {

	public formGroup: FormGroup;
	public submitted = false;
	public duplicateError = '';

	public state = {
		taskTypes: [
			{ id: 1, label: "Task", key: 'tasks' },
			{ id: 2, label: "Milestone", key: 'milestones' }
		],
		userTypes: [
			{ id: 1, label: "Group", key: 'group' },
			{ id: 3, label: "Job Specific", key: 'job_specific' },
			{ id: 2, label: "User", key: 'user' }
		],
		selectedTask: { id: 1, label: "Task", key: 'tasks' },
		selectedUser: { id: 1, label: "Group", key: 'group' },
		tasksList: {
			tasks: [],
			milestones: []
		},
		usersList: {
			group: [],
			job_specific: [{ id: 1, name: 'The person adding Template' }, { id: 2, name: 'Job Coordinator' }],
			user: []
		}
	};

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<AddTaskComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { 
		if(data.task) {
			const task = _.find(this.state.taskTypes, ['id', data.task.task_type]);
			if(task) this.state.selectedTask = task;
			const user = _.find(this.state.userTypes, ['id', data.task.user_type]);
			if(user) this.state.selectedUser = user;
		}
	}

	ngOnInit() {
		this.getFormData();
		this.createForm();
		if (this.data.task) {
			this.setForm(this.data.task);
		}
	}

	setForm(data) {
		this.formGroup.patchValue({
			task_id: data.task_id,
			user_id: data.user_id
		});
		_.map(this.state.taskTypes, (type) => {
			if (data.task_type == type.id) {
				this.state.selectedTask = type;
			}
		});
		_.map(this.state.userTypes, (type) => {
			if (data.user_type == type.id) {
				this.state.selectedUser = type;
			}
		});
	}

	getFormData() {
		forkJoin(
			this.adminService.getApi('tasklist', { status: true }),
			this.adminService.getApi('scheduleTemplateUsers', { status: true })
		).subscribe(data => {
			this.state.taskTypes.map(o => {
				this.state.tasksList[o.key] = data[0].result.data.items.filter(p => {
					if (p.type == o.id) {
						if (p.type == 2) {
							if (p.milestone_type == 1) return true;
							else return false;
						} else {
							return true;
						}
					}
					return false;
				})
			})
			this.state.usersList.group = data[1].result.data.groups || [];
			this.state.usersList.user = data[1].result.data.users || [];
			// this.state.userTypes.map(u => {
			// 	if (u.id != 3)
			// 		this.state.usersList[u.key] = data[1].result.data.filter(o => {
			// 			if (o.type == u.id) return true;
			// 			else return false;
			// 		})
			// })
		});
	}

	createForm() {
		this.formGroup = this.fb.group({
			task_id: ['', Validators.required],
			user_id: ''
		});
	}

	close = () => {
		this.dialogRef.close();
	}

	save = form => {
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.adminService.saveApi('saveScheduleTemplateTasks',
				{
					...this.data.params,
					...form.value,
					...{ task_type: this.state.selectedTask.id, user_type: this.state.selectedUser.id }
				}).then(response => {
					if (response.result.success) {
						this.dialogRef.close({ success: true, data: response.result.data });
					} else {
						this.duplicateError = response.result.data.trim();
					}
				});
		}
	}

	changeTaskType(type) {
		this.state.selectedTask = type;
	}

	changeUserType(type) {
		this.state.selectedUser = type;
	}

}
