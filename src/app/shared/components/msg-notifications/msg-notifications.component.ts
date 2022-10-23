import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatMenuTrigger } from '@angular/material';
import { WopNotificationsComponent } from '@app/dialogs/wop-notifications/wop-notifications.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-msg-notifications',
  templateUrl: './msg-notifications.component.html',
  styleUrls: ['./msg-notifications.component.scss']
})
export class MsgNotificationsComponent implements OnInit {

  @Input() msg;
  @Input() thread;
  @Output() onUpdate = new EventEmitter<any>();

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit() {}

  editPrepress(){
    this.dialog.open(WopNotificationsComponent, {
      width: '700px',
      data: {
        title: 'Work Order Prepress',
        selectedMsg: _.cloneDeep(this.msg),
        thread: this.thread
      }
    })
    .afterClosed().subscribe(result => {
      if (result && result.success) {
        this.onUpdate.emit(result);
      }
    });
  }

}
