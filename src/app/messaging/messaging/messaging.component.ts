import { Component, OnInit } from '@angular/core';
import { MessagingService } from '../messaging.service';
import { CommonService } from '@app/common/common.service';
import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss']
})
export class MessagingComponent implements OnInit {

  selectedThread: any;
  selectedTab: any = { name: "Messages", type: "inbox" };
  selectedThreadCount: number = 0;
  threadActionName: string;
  constructor(private _commonService: CommonService,
    private _snackbar: MatSnackBar) { }

  ngOnInit() {
  }

  onThreadSelect(thread) {
    setTimeout(() => {
      this.selectedThread = thread;
    }, 20);
  }

  onTabSelect(tab) {
    setTimeout(() => {
      this.selectedTab = tab;
    }, 20);
  }

  onThreadChange(thread) {
    setTimeout(() => {
      this.selectedThread = thread;
    }, 20);
  }

  onMultiThreadSelection(event) {
    this.selectedThreadCount = event;
  }

  threadAction(event) {
    this.threadActionName = event;
  }
}
