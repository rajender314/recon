import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { MatDialog, MatSnackBar } from '@angular/material';
import { SnackbarComponent } from "@app/shared/material/snackbar/snackbar.component";

import { SnackBarType } from "@app/shared/utility/types";
import { MessagingService } from '@app/messaging/messaging.service';
import { Subscribable, Subscription } from 'rxjs';
import { LogoutDialogComponent } from '@app/common/header/logout-dialog/logout-dialog.component';
import { CreateProjectComponent } from '@app/projects/create-project/create-project.component';
import { Router } from '@angular/router';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { CreateTaskComponent } from '@app/dialogs/create-task/create-task.component';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FileUploader, FileItem } from 'ng2-file-upload';
import * as _ from 'lodash';

var APP: any = window['APP'];

@Component({
  selector: 'app-header',
  host: {
    'class': 'app-header'
  },
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.15s ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.15s ease', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit {
  @ViewChild('globalSerach') globalSerach: any;
  @ViewChild('firstInput') firstInput: ElementRef;
  public APP = APP;
  navContainers: any[] = [
    { name: "Primary Nav", isActive: false },
    { name: "Action Nav", isActive: false }
  ];
  selectedAction: string = '';
  selectedNavContainer: any;
  animationInProgress: boolean = false;
  groups: any[] = [
    {
      group_name: '1', tabs: [
        { name: "Messages", link: "/messages", iconClass: "pixel-icons icon-messages", show: true, iconBackground: '#a14daf' },
        { name: "Projects", link: "/projects", iconClass: "pixel-icons icon-pn-projects", show: true, iconBackground: '#7d84f0' } /*#7F8C8D*/
      ]
    },
    {
      group_name: '2', tabs: [
        { name: "Tasks", link: "/tasks", iconClass: "pixel-icons icon-task-fill", show: (APP.permissions.system_access.schedule == 'yes') ? true : false, iconBackground: '#ba805d' },
        { name: "Track time", link: "/track-time", iconClass: "pixel-icons icon-pn-track-time", show: (APP.permissions.system_access.enable_time_tracking == 'none') ? false : true, iconBackground: '#ff50b8' }
      ]
    },
    {
      group_name: '3', tabs: [
        { name: "Organizations", link: "/organizations", iconClass: "pixel-icons icon-company-codes", show: (APP.permissions.system_access.contacts == 'yes') ? true : false, iconBackground: '#44c7b0' }, /*#7F8C8D*/
        { name: "Admin", link: "/admin", iconClass: "pixel-icons icon-pn-settings", show: (APP.permissions.system_access.settings == 'yes') ? true : false, iconBackground: '#f84d33' },
        { name: "Users", link: "/users", iconClass: "pixel-icons icon-pn-user", show: (APP.permissions.system_access.users == 'yes') ? true : false, iconBackground: '#a14daf' } /*#8E44AD*/
      ]
    },
    // {
    //   group_name: '4', tabs: [
    //     { name: "Super Admin", link: "/super-admin", iconClass: "pixel-icons icon-company-codes", iconBackground: '#44c7b0', show: true }
    //   ]
    // }
  ];
  logoutUrl: string = APP.sso_url + 'oauthlogout?access_token=' + APP.access_token;
  public dialogRef: any;
  /*@Output() onUpdate = new EventEmitter();
  subscription: Subscription;*/

  userName: string = APP.user.first_name + ' ' + APP.user.last_name;
  userEmail: string = APP.user.email;
  userInfo: string = this.userName + " " + this.userEmail;
  userImage: string = APP.user.image;

  fetchingResults = false;
  searchValue: any = null;
  searchResults = {
    job_pos: [],
    jobs_list: []
  }

  searchConfig = {
    placeHolder: 'Enter Job Name or Number or PO Number',
    value: ''
  }

  notifications = {
    isLoading: true,
    ajaxProgress: false,
    success: false,
    submitted: false,
    dropdowns: {
      issueTypes: [{ id: 'Operational', name: 'Operational' }, { id: 'Technical', name: 'Technical' }]
    },
    data: {},
    files: [],
    tabs: [
      { name: "Notifications", type: "notification", key: "notification" },
      { name: "Archive Notifications", type: "notification", key: "archive", archive: true }
    ]
  }
  selectedTab: any = this.notifications.tabs[0];
  feedback = {
    isLoading: true,
    ajaxProgress: false,
    success: false,
    submitted: false,
    dropdowns: {
      issueTypes: [{ id: 'Operational', name: 'Operational' }, { id: 'Technical', name: 'Technical' }]
    },
    data: {},
    files: []
  }
  feedbackForm: FormGroup;
  uploadUrl = APP.api_url + 'uploadAttachments?container=feedback';
  allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
  allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt'];
  uploader: FileUploader = new FileUploader({
    isHTML5: true,
    allowedFileType: this.allowedFileType,
    url: this.uploadUrl,
    maxFileSize: 3 * 1024 * 1024,
    autoUpload: true,
    queueLimit: 3,
    headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
  });
  notifyData = [];
  notifyLoader = true;
  searchNotifications = {
    value: null
  }
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private _http: HttpClient,
    private _route: Router,
    private _commonService: CommonService,
    private _fb: FormBuilder,
    private messagingService: MessagingService) {
    this.uploader.onAfterAddingFile = (item: FileItem) => {
      item['customType'] = item.file.name.split('.').pop();
    }

    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      let obj = JSON.parse(response);
      if (obj.result.success) {
        let type = obj.result.data.original_name.split('.').pop();
        this.feedback.files.push({ ...obj.result.data, ...{ type: type } });
      }
    }
  }

  ngOnInit() {
  }

  getFeedbackId() {
    // // demo
    // this.feedback.isLoading = false;
    // this.feedback.success = true;
    // this.createFeedbackForm();
    // return;
    this.feedback.isLoading = true;
    this._commonService.saveApi('saveFeedback', { userid: APP.recon_user[0].id })
      .then(res => {
        this.feedback.isLoading = false;
        if (res['result'].success) {
          this.feedback.data = res['result'].data;
          this.createFeedbackForm();
          setTimeout(() => {
            this.feedback.success = true;
            setTimeout(() => {
              this.firstInput.nativeElement.focus();
            }, 20);
          }, 20);
        }
      })
  }

  generateBrowserInfo() {
    const data: any = this.feedback.data;
    let txt = `Os: ${data.os},\nBrowser: ${data.browser},\nIp: ${data.ipaddress},\nUrl: ${window.location.href}`;
    return txt;
  }

  createFeedbackForm() {
    this.feedbackForm = this._fb.group({
      id: '',
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)]],
      phone: ['', Validators.minLength(10)],
      browser_info: '',
      type: ['', Validators.required],
      subject: ['', Validators.required],
      description: ['', Validators.required],
      os: window.navigator.platform,
      browser: '',
      ip: '',
      error_page: window.location.href,
      userid: APP.recon_user[0].id
    });
    this.setFeedbackForm();
  }

  setFeedbackForm() {
    this.feedbackForm.patchValue({
      id: this.feedback.data['id'],
      name: this.userName,
      email: this.userEmail,
      phone: '',
      browser_info: this.generateBrowserInfo(),
      type: '',
      subject: '',
      description: '',
      os: this.feedback.data['os'],
      browser: this.feedback.data['browser'],
      ip: this.feedback.data['ipaddress'],
      error_page: window.location.href,
      userid: APP.recon_user[0].id
    });
  }

  removeFile(item: FileItem) {
    let indx = _.findIndex(this.feedback.files, ['original_name', item._file.name])
    if (indx > -1) this.feedback.files.splice(indx, 1);
    item.remove();
  }

  cancelFeedback() {
    this.setFeedbackForm();
    this.feedback.files = [];
    this.uploader.clearQueue();
  }

  saveFeedback() {
    this.feedback.submitted = true;
    if (this.feedbackForm.valid) {
      this.feedback.submitted = false;
      this.feedback.ajaxProgress = true;
      let value = this.feedbackForm.value;
      let attachments = [];
      if (this.feedback.files.length) {
        this.feedback.files.map(file => {
          attachments.push({ filename: file.filename, original_name: file.original_name });
        });
      }
      value.attachments = attachments;
      this._commonService.saveApi('saveFeedback', value)
        .then(res => {
          this.feedback.ajaxProgress = false;
          if (res['result'].success) {
            this.toggleNavContainer(this.navContainers[1]);
            this.openSnackBar({ status: 'success', msg: 'Feedback Sent Successfully' });
          }
        })
        .catch(err => {
          this.feedback.ajaxProgress = false;
        })
    }
  }

  toggleNavContainer(navContainer, action = '') {
    if (action == 'search') {
      setTimeout(() => {
        this.globalSerach.searchElement.nativeElement.focus();
      }, 20);
      this.searchConfig.value = this.searchValue;
      this.searchList(this.searchValue || '');
    } else if (action == 'feedback') {
      this.feedback.data = {};
      this.feedback.files = [];
      this.uploader.clearQueue();
      this.getFeedbackId();
    } else if (action == 'notifications') {
      this.notifications.data = {};
      this.notifications.files = [];
      this.uploader.clearQueue();
      this.getNotificationsList();
      // this.getNotificationsId();
    }
    this.selectedAction = action;
    if (this.animationInProgress) {
      return false;
    }

    navContainer.isActive = !navContainer.isActive;
    if (navContainer.isActive) {
      this.selectedNavContainer = navContainer;
    } else {
      this.animationInProgress = true;
      setTimeout(() => {
        this.selectedNavContainer = null;
        this.animationInProgress = false;
      }, 150);
    }
  }

  getNotificationsList(tab?) {
    if (tab) {
      this.searchNotifications = { value: '' }
      this.selectedTab = tab;
    }
    this.notifyLoader = true;
    this._commonService.getApi('getNotificationsList', {
      type: 'inbox',
      search: this.searchNotifications.value ? this.searchNotifications.value : '',
      sort: 'date',
      flag: false,
      read: false,
      is_archive: this.selectedTab['archive'] ? true : false,
      page: 1,
      pageSize: 50
    })
      .then(response => {
        if (response['result'].success) {
          this.notifyData = response['result'].data;
        }
        this.notifyLoader = false;
      })
  }

  createMessage() {
    this.toggleNavContainer(this.navContainers[1], 'plus');
    setTimeout(() => {
      this.dialogRef = this.dialog.open(CreateThreadComponent, {
        width: '700px',
        data: {}
      });
      this.dialogRef.afterClosed().subscribe(result => {
        if (result && result.success) {
          this.openSnackBar({ status: 'success', msg: 'Message Saved Successfully' });
          //this.onUpdate.emit(result);
        }
      });
    }, 200);
  }
  globalSearch() {
    this.toggleNavContainer(this.navContainers[1], 'search');
    setTimeout(() => {
    }, 200);
  }

  searchList(val) {
    this.fetchingResults = true;
    this.searchValue = val;
    const url = APP.api_url + 'getJobsSearch';
    this._http.get(url, { params: { search: val } })
      .toPromise()
      .then(res => {
        this.fetchingResults = false;
        if (res['result'].success) {
          this.searchResults = res['result'].data;
        }
      })
  }

  goTo(state, param) {
    // this.searchValue = null;
    // this.searchResults = {
    //   job_pos: [],
    //   jobs_list: []
    // }
    this.toggleNavContainer(this.navContainers[1]);
    this._commonService.update({ type: 'back-to-projects', data: null });
    if (state == 'job') {
      this._route.navigate(['/projects/' + param.id + '/overview']);
    } else {
      this._route.navigate(['/projects/' + param.jobs_id + '/purchase-orders/' + param.po_id]);
    }
  }

  openSnackBar(obj) {
    let data: SnackBarType = {
      status: obj.status,
      msg: obj.msg
    }
    this.snackbar.openFromComponent(SnackbarComponent, {
      data: data,
      verticalPosition: 'top',
      horizontalPosition: 'right'
    })
  }

  performActions(url?) {
    this.toggleNavContainer(this.navContainers[1]);
    if (url) {
      setTimeout(() => {
        this.router.navigate([url]);
      }, 200)
    } else {
      this.createTask();
    }
  }

  createTask() {
    this.dialog.open(CreateTaskComponent, {
      panelClass: 'my-dialog',
      width: '780px',
      data: {
        title: 'Create New Task',
        jobs_id: null,
        jobs_name: null,
        selectedRow: null,
        dropdowns: null
      }
    })
  }

  logout() {
    this.dialog.open(LogoutDialogComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      disableClose: true,
      data: this.logoutUrl
    })
  }
  closeNotify() {
    this.toggleNavContainer(this.navContainers[1]);
  }

  onSearchNotifications(event) {
    this.searchNotifications.value = event;
    this.getNotificationsList();
  }

  threadAction(type) {
  }
}
