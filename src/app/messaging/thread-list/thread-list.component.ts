import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { MessagingService } from '@app/messaging/messaging.service';
import { CommonService } from '@app/common/common.service';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
  selector: 'app-thread-list',
  templateUrl: './thread-list.component.html',
  styleUrls: ['./thread-list.component.scss']
})
export class ThreadListComponent implements OnInit, OnDestroy {

  @Input() thread: any;
  @Input() threadActionName: string;

  @Output() onSelect = new EventEmitter;
  @Output() onTabSelect = new EventEmitter;
  @Output() onThreadSelect = new EventEmitter;

  tabs: any[] = [
    { name: "Messages", type: "inbox" },
    //{name: "Internal Survey", type: "internal_survey" },
    // { name: "Notifications", type: "notification" },
    { name: "Archive", type: "archive" },
    // { name: "Archive Notifications", type: "notification", archive: true },
    { name: "Old Recon Notifications", type: "notifications_old" },
  ];
  selectedTab: any = this.tabs[0];
  inProgress: boolean = true;
  list: any[] = [];
  selectedListItem: any;

  search: any = '';
  sort: any = 'date';
  sortList: any = [
    { label: 'Date', value: 'date' },
    { label: 'Subject', value: 'subject' },
    { label: 'Job No Ascending', value: 'asc' },
    { label: 'Job No Descending', value: 'desc' }
  ];
  flag: boolean = false;
  unread: boolean = false;
  reload: boolean = false;
  noItems: boolean = false;
  page: number = 1;
  pageSize: number = 50;
  totalPages: number = 0;
  totalCount: number = 0;
  isScroll: boolean = false;
  subscription: Subscription;
  flagtooltop: string = "satish";
  public state = {
    loader: true
  }
  selectedThreads: Array<string> = [];
  selectAll: boolean;
  constructor(
    private messagingService: MessagingService,
    private _commonService: CommonService,
    private dialog: MatDialog,
    private _snackbar: MatSnackBar
  ) {

  }

  ngOnInit() {
    /*this.list = Array(100).fill(0).map((val, i) => {
      return {title: "Title " + i, subTitle: "Sub Title " + i, message: "This is the subject for the thread" + i + ""}
    });*/

    this.getList();
    this.onTabSelect.emit(this.selectedTab);
    this.subscription = this._commonService.onUpdate().subscribe(ev => {
      if (ev.type == 'message') {
        if (ev.data.length && ev.data[0].thread_id) {
          this.list.unshift(ev.data[0]);
          this.selectListItem(ev.data[0]);
        }
      }
    })
  }

  ngOnChanges() {
    if (this.thread) {
      if (this.selectedListItem.is_archive != this.thread.is_archive) {
        this.getList();
      } else {
        this.onThreadChange(this.thread);
      }
    }
    if (this.threadActionName) {
      this.threadAction(this.threadActionName);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  createDiscussion() {
    this.dialog.open(CreateThreadComponent, {
      width: '700px',
      data: {}
    })
      .afterClosed().subscribe(result => {
        if (result && result.success) {
          // this.openSnackBar({ status: 'success', msg: 'Message Saved Successfully' });
          //this.onUpdate.emit(result);
        }
      });
  }

  getList(search?, sort?, flag?, unread?) {
    if (!this.isScroll) {
      this.inProgress = true;
      this.state.loader = true;
    }
    let params = {
      type: 'inbox', //this.selectedTab.type,
      search: this.search,
      sort: this.sort,
      flag: this.flag,
      read: this.unread,
      page: this.page,
      pageSize: this.pageSize
    };
    if (this.selectedTab.type == 'archive') {
      params = Object.assign({ ...params, ...{ archive: true } })
    } else if (this.selectedTab.archive) {
      params = Object.assign({ ...params, ...{ is_archive: true } })
    }
    if (this.selectedTab.type == 'notification') {
      this.selectListItem({});
      //getNotificationsList
      // this._commonService.getApi('getJobInfo', { id: this.state.projectID, type: 'status' })
      // .then(res => {
      // 	if (res['result'].success) {
      // 		this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
      // 	}
      // })
      this._commonService.getApi('getNotificationsList', params)
        .then(response => {
          if (response['result'].success) {
            if (!response['result'].data.length) {
              this.noItems = true;
              this.selectListItem({});
            } else {
              this.totalCount = response['result'].data.length;
              if (this.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.pageSize);
              this.noItems = false;
              if (this.isScroll) this.list = [...this.list, ...response['result'].data];
              else {
                this.list = response['result'].data;
                // this.selectListItem(this.list[0]);
                this.selectListItem({});
              }
            }
          }
          else {
            this.noItems = true;
            this.selectListItem({});
          }
          this.inProgress = false;
          this.state.loader = false;
        })
    } else if (this.selectedTab.type == 'notifications_old') {
      this.selectListItem({});
      let sort_by = 1;
      if (this.sort == 'data') {
        sort_by = 1;
      } else if (this.sort == 'subject') {
        sort_by = 3;
      } else if (this.sort == 'asc') {
        sort_by = 4;
      } else if (this.sort == 'desc') {
        sort_by = 5;
      }
      this._commonService.getApi('getOldNotificationsList', { ...params, ...{ count: (this.page == 1) ? 0 : this.list.length, sort_by: sort_by } })
        .then(response => {
          if (response['result'].success) {
            if (!response['result'].data.messages.length) {
              this.noItems = true;
              this.selectListItem({});
            } else {
              this.totalCount = response['result'].data.tot_count;
              if (this.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / 20);
              this.noItems = false;
              if (this.isScroll) this.list = [...this.list, ...response['result'].data.messages];
              else {
                this.list = response['result'].data.messages;
                this.selectListItem({});
              }
            }
          }
          else {
            this.noItems = true;
            this.selectListItem({});
          }
          this.inProgress = false;
          this.state.loader = false;
        })
    } else {
      this.selectListItem({});
      this.messagingService.getThreadList(params)
        .subscribe(response => {
          if (response.result.success) {
            if (!response.result.data.message.length) {
              this.noItems = true;
              this.selectListItem({});
            } else {
              this.totalCount = response.result.data.total;
              if (this.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.pageSize);
              this.noItems = false;
              if (this.isScroll) this.list = [...this.list, ...response.result.data.message];
              else {
                this.list = response.result.data.message;
                // this.selectListItem(this.list[0]);
                this.selectListItem({});
              }
              this.selectedThreads = [];
              this.onThreadSelect.emit(this.selectedThreads.length);
              if (this.selectAll) {
                this.onSelectAll();
              }

            }
          }
          else {
            this.noItems = true;
            this.selectListItem({});
          }
          this.inProgress = false;
          this.state.loader = false;
        })
    }
  }

  selectListItem(item) {
    this.selectedListItem = item;
    this.onSelect.emit(this.selectedListItem);
  }

  onThreadChange(item) {
    this.selectedListItem = item;
  }

  selectTab(tab) {
    this.selectedTab = tab;
    this.isScroll = false;
    this.page = 1;
    this.getList();
    this.onTabSelect.emit(this.selectedTab);
  }

  onSearch(event) {
    this.search = event;
    this.isScroll = false;
    this.page = 1;
    this.getList(this.search);
  }

  onSort(event) {
    this.sort = event;
    this.isScroll = false;
    this.page = 1;
    this.getList(this.sort);
  }

  onFlag() {
    this.flag = !this.flag;
    this.isScroll = false;
    this.page = 1;
    this.getList();
  }

  onUnread() {
    this.unread = !this.unread;
    this.isScroll = false;
    this.page = 1;
    this.getList();
  }

  onReload() {
    this.reload = true;
    setTimeout(() => {
      this.reload = false;
    }, 300);
    this.isScroll = false;
    this.page = 1;
    this.getList();
  }

  onScroll = () => {
    if (this.page < this.totalPages && this.totalPages != 0) {
      this.page++;
      this.isScroll = true;
      this.getList()
    }
  }

  onSelectThread(event, item) {
    if (event) {
      this.selectedThreads.push(item.thread_id);
    } else {
      this.selectedThreads.splice(this.selectedThreads.indexOf(item.thread_id), 1);
    }
    this.selectAll = this.selectedThreads.length == this.list.length;
    this.onThreadSelect.emit(this.selectedThreads.length);
  }

  threadAction(event) {
    if (this.selectedThreads.length) {
      this._commonService.saveApi('saveThreadInfo', {
        thread_ids: this.selectedThreads,
        type: event
      }).then(resp => {
        if (resp['result'].success) {
          this._snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Message(s) Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right',
            panelClass: 'success'
          });
          this.isScroll = false;
          this.threadActionName = null;
          this.page = 1;
          this.getList();
        }
      }).catch(err => {

      })
    }
  }

  onSelectAll() {
    if (this.selectAll) {
      this.selectedThreads = this.list.map(item => {
        item['selected'] = true;
        return item.thread_id
      });
    } else {
      this.list.map(item => item['selected'] = false);
      this.selectedThreads = [];
    }
    this.onThreadSelect.emit(this.selectedThreads.length);
  }

}
