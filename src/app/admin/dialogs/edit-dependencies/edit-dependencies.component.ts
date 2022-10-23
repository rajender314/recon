import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-edit-dependencies',
  templateUrl: './edit-dependencies.component.html',
  styleUrls: ['./edit-dependencies.component.scss']
})
export class EditDependenciesComponent implements OnInit {

  public dependencies = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private dialogRef: MatDialogRef<EditDependenciesComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.getcheckedDependecies();
  }

  close = () => {
    this.dialogRef.close();
  }

  checkDependencies() {
    let checkDependencies = _.filter(this.data.tasks, (value) => {
      if (value.checked) {
        return true;
      }
      return false;
    });
    return (checkDependencies.length >= 2 ? true : false);
  }

  getcheckedDependecies() {
    _.map(this.data.tasks, (value) => {
      _.map(this.data.task.dependencies, (item) => {
        if (value.task_id == item.id) {
          value.checked = true;          
        }
      }
      )
    });
  } 

  save = () => {
    let task_ids = []; 
    _.map(this.data.tasks, (value) => {
      if (value.checked) {
        task_ids.push(value.task_id);
      }
    });
    this.adminService.saveApi('saveScheduleDependencies', Object.assign({ task_ids: task_ids }, this.data.params))
      .then(response => {
        if (response.result.success) {
          this.dialogRef.close({ success: true, data: response.result.data });
        }
      });
  }

}
