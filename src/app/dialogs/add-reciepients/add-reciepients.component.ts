import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl } from '@angular/forms';
import { MessagingService } from '@app/messaging/messaging.service';

@Component({
  selector: 'app-add-reciepients',
  templateUrl: './add-reciepients.component.html',
  styleUrls: ['./add-reciepients.component.scss']
})
export class AddReciepientsComponent implements OnInit {

  usersList: Array<any> = [];
  usersControl = new FormControl([]);
  textLabels = {
    label: 'Users',
    placeholder: 'Select User',
    nameKey: 'label'
  }

  constructor(
    public _dialogRef: MatDialogRef<AddReciepientsComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private messagingService: MessagingService
  ) {
    if (data.flag == 'members') this.getUsersList();
    else if (data.flag == 'groups') this.getGroupsList();
  }

  ngOnInit() {
  }

  getUsersList() {
    // this.usersControl.patchValue(this.data.selected.user);
    this.textLabels = {
      label: 'Users',
      placeholder: 'Select User',
      nameKey: 'label'
    }
    this.messagingService.getUsers({ master_type: 6, status: true })
      .subscribe(res => {
        if (res['result'].success) {
          this.usersList = res['result'].data.users || [];
        }
      })
  }

  getGroupsList() {
    // this.usersControl.patchValue(this.data.selected.group);
    this.textLabels = {
      label: 'Groups',
      placeholder: 'Select Group',
      nameKey: 'name'
    }
    this.messagingService.getGroups({ status: true, page: 1, pageSize: 10000000 })
      .subscribe(res => {
        if (res['result'].success) {
          this.usersList = res['result'].data.groups || [];
        }
      })
  }

  saveDetails() {
    const params = {
      thread_id: this.data.selected.thread_id,
      type: this.data.flag
    }
    if (this.data.flag == 'members') {
      params['users_id'] = this.usersControl.value;
    }
    if (this.data.flag == 'groups') {
      params['users_id'] = this.usersControl.value;
    }
    this.messagingService.addRecipients('saveThreadUsers', params)
      .subscribe(res => {
        if (res.result.success) {
          this._dialogRef.close({ success: true, data: res.result.data });
        }
      })
  }

}
