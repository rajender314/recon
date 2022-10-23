import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

  @Input() notifications: any;
  @Input() from: string='notification';
  
  @Output() close = new EventEmitter();
  @Output() reload = new EventEmitter();
  selectedIds: Array<string> = [];
  actionList = {
    archive: [
      { label: "Mark as Unarchive", key: "unarchive", icon: 'icon-archive' }
    ],
    notification: [
      { label: "Mark as Read", key: "read", icon: 'icon-flag' },
      { label: "Mark as Unread", key: "unread", icon: 'icon-archive' },
      // { label: "Mark as Flag", key: "flag", icon: 'icon-flag' },
      // { label: "Mark as Unflag", key: "unflag", icon: 'icon-flag' },
      // { label: "Mark as Archive", key: "archive", icon: 'icon-archive' },
    ]
  }
  selectAll: boolean;
  constructor(private commonService: CommonService, private _snackbar: MatSnackBar) { }

  ngOnInit() {
  }

  closeNotifyWindow() {
    this.close.emit();
  }

  onSelectThread(event, item) {
    if (event) {
      this.selectedIds.push(item.notification_id);
    } else {
      this.selectedIds.splice(this.selectedIds.indexOf(item.notification_id), 1);
    }
    this.selectAll = this.selectedIds.length == this.notifications.length;
  }

  onSelectAll(event) {
    if (event) {
      this.selectedIds = this.notifications.map(item => {
        item['selected'] = true;
        return item.notification_id
      });
    } else {
      this.notifications.map(item => item['selected'] = false);
      this.selectedIds = [];
    }
  }

  threadAction(key) {
    if (this.selectedIds.length) {
      this.commonService.update({ type: 'overlay', action: 'start' });
      this.commonService.saveApi('saveNotificationsInfo', {
        notification_ids: this.selectedIds,
        type: key
      }).then(resp => {
        this.commonService.update({ type: 'overlay', action: 'stop' });
        if (resp['result'].success) {
          this._snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Notifications Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right',
            panelClass: 'success'
          });
          this.reload.emit();
        }
      }).catch(err => {
        this.commonService.update({ type: 'overlay', action: 'stop' });
      })
    }
  }
}
