import { Component, OnInit, Input, SimpleChanges, OnChanges, ModuleWithComponentFactories, EventEmitter, ViewChild, ElementRef, Output, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatMenuTrigger } from '@angular/material';

import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

import Message from '@app/messaging/entities/message';

import { MessagingService } from '@app/messaging/messaging.service';
import { AuthService } from '@app/core/auth/auth.service';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { SearchComponent } from '@app/shared/components/search/search.component';
import { AddReciepientsComponent } from '@app/dialogs/add-reciepients/add-reciepients.component';
import { CommonService } from '@app/common/common.service';
import { Lightbox } from 'ngx-lightbox';

var APP: any = window['APP'];

@Component({
  selector: 'app-thread-detail',
  templateUrl: './thread-detail.component.html',
  styleUrls: ['./thread-detail.component.scss']
})
export class ThreadDetailComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(MatMenuTrigger) listUsersMenu: MatMenuTrigger;
  @ViewChild('messageListSection') private messageListContainer: ElementRef;
  @ViewChild('appSearch') private appSearch: SearchComponent;

  @Input() thread: any;
  @Input() tab: any;

  @Output() onThreadChange = new EventEmitter;

  private userName: any = APP.user.first_name + ' ' + APP.user.last_name;

  list: Message[] = [];
  selectedThread: any = null;
  newMessage: string;
  inProgress: boolean = true;
  noData: boolean = false;
  form: FormGroup;
  showButtons: boolean = false;
  selectedUser: any = null;
  selectedGroup: any = null;
  show = {
    usersCount: 15,
    groupsCount: 15
  }
  breadcrumbs: Array<any> = [];
  public attachmentImageTypes = ['jpeg','jpg','PNG','png','bmp','GIF','gif','svg','SVG'];
  public attachmentOtherTypes = ['tiff','ZIP','zip','pptx','ppsm','ppsx', 'ppt','pptm','TXT','txt','RAR','rar','mp4','pdf','doc','docx','xlsx', 'xls','csv','pdf'];
  public prepressMsg = [
    {
      css: "Notify",
      attachment: [],
      created: "f-6753 L-6753",
      created_date: "Sep 06, 2019 16:22:19",
      created_id: 6753,
      is_read: true,
      message: "Revised Bid Requested",
      isNotify: "5",
      prepressInfo: {
        address1: "602 Silveron Suite 200",
        address2: "",
        city: "Flower Mound",
        country: "United States",
        file_path: "",
        file_source: "RapidRemark",
        job_name: "",
        jpk_id: "26994",
        msg: "<span style='color: #1f1f1f; font-weight: bold;'><a href='http://192.168.1.2/recon_sprints/Jun_branch_2019/home#/job/74101/schedule' style='color: #164F88;'> 3602 Reports Due</a>: Round 1</span> has been added for 1005 920 with the due date Wed, Jul 24, 2019 04:30 AM CST, by <span style='font-weight: bold;'>Recon Dev User</span>",
        services: [],
        state: "Texas",
        tasks_job_id: "14856004",
        zip: "75028"
      }
    }
  ];

  public uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
  public hasDropZoneOver: boolean = false;
  public uploadData: any = {
    error: '',
    files: []
  }
  public state = {
    loader: true,
    notifyType: 'new',
    currentUserId:null,
  };
  public uploader: FileUploader = new FileUploader({
    url: this.uploadUrl,
    allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
    maxFileSize: 5 * 1024 * 1024,
    autoUpload: true,
    headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
  });

  showRecipients: boolean = false;
  users = {
    members: [],
    groups: []
  }
  isSelect: boolean = false;
  selectedIndex: number = 0;
  userConfig: any = {
    firstName: "Hiro", lastName: "Hamada", imageUrl: ""
  }
  selected: Array<any> = [];
  clonedUsesList: Array<any> = [];
  usersList: Array<any> = [];
  selectedUsers: Array<number> = [];
  jobs_id: string;

  constructor(
    private messagingService: MessagingService,
    private authService: AuthService,
    private commonService: CommonService,
    private dialog: MatDialog,
    private _lightbox: Lightbox
  ) {
    this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
      if (item.size >= options.maxFileSize) this.uploadData.error = 'Exceeds Max. Size';
      else this.uploadData.error = 'Invalid File Upload';
    }

    this.uploader
      .onCompleteItem = (item: any, response: any, status: any, headers: any) => {
        let obj = JSON.parse(response);
        if (obj.result.success) {
          let type = obj.result.data.original_name.split('.').pop();
          this.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
          this.uploadData.error = '';
        }
      }
  }

  ngOnInit() {
    this.state.currentUserId =  APP.recon_user[0].id;
    this.getUsersList('', 'init');
    /*this.list = Array(100).fill(0).map((val, i) => {
      let offsetTime :moment.unitOfTime.DurationConstructor = 'minutes',
          time;

      if (i > 75) {
        offsetTime = 'years';
      } else if (i > 60) {
        offsetTime = 'months';
      } else if (i > 45) {
        offsetTime = 'weeks';
      } else if (i > 30) {
        offsetTime = 'days';
      } else if (i > 15) {
        offsetTime = 'hours';
      } 
      time = moment().subtract(i, offsetTime);

      return {
        user_id: "User " + i, 
        message: `
        Good tools make application development quicker and easier to maintain than if you did everything by hand.\
        \
        The Angular CLI is a command line interface tool that can create a project, add files, and perform a variety of ongoing development tasks such as testing, bundling, and deployment.\
        \
        The goal in this guide is to build and run a simple Angular application in TypeScript, using the Angular CLI while adhering to the Style Guide recommendations that benefit every Angular project.

        By the end of the chapter, you'll have a basic understanding of development with the CLI and a foundation for both these documentation samples and for real world applications.
        `,
        time: time
      }
    });

    this.list = this.list.reverse();*/

    //this.getDetails();

    setTimeout(this.scrollToBottom.bind(this), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    this._lightbox.close();
    if (changes.thread) {
      this.reset();
      if (this.thread.thread_id || this.thread.notify_category_id || this.thread.note_type_id)
        this.getDetails();
    }
  }

  ngOnDestroy() {
    this._lightbox.close();
  }

  reset() {
    this.state.loader = false;
    this.inProgress = false;
    this.noData = true;
    this.users = {
      members: [],
      groups: []
    }
    this.show = {
      usersCount: 15,
      groupsCount: 15
    }
  }

  downloadFile(atch) {
    if (atch.link)
      window.location.href = atch.link + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
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

  singleDownload(file) {
    window.location.href = file.link;
  }

  saveFlag(data: any): void {
    if (this.thread.notify_category_id) {
      this.commonService.saveApi('saveNotificationsInfo', {
        read: this.thread.read,
        notification_id: this.thread.notification_id,
        is_archive: (data.type == 'archive') ? (this.thread.is_archive ? false : true) : this.thread.is_archive,
        is_flag: (data.type == 'flag') ? (this.thread.is_flag ? false : true) : this.thread.is_flag,
        time_zone: APP.user.timezone_offset
      })
        .then(response => {
          if (response['result'].success) {
            if (data.type == 'flag') {
              this.thread.is_flag = data.status ? false : true;
              this.onThreadChange.emit(this.thread);
            } else if (data.type == 'archive') {
              this.thread.is_archive = data.status ? false : true;
              this.state.loader = true;
              this.noData = false;
              this.list = [];
              this.thread.read = !this.thread.read;
              this.onThreadChange.emit({});
            }
          }
        })
    } else {
      this.messagingService.saveFlag({
        users_id: APP.recon_user[0].id,
        thread_id: this.thread.thread_id,
        type: data.type,
        status: data.status ? false : true
      })
        .subscribe(response => {
          if (response.result.success) {
            if (data.type == 'flag') {
              this.thread.is_flag = data.status ? false : true;
              this.onThreadChange.emit(this.thread);
            } else if (data.type == 'archive') {
              this.thread.is_archive = data.status ? false : true;
              this.state.loader = true;
              this.noData = false;
              this.list = [];
              this.onThreadChange.emit({});
            }

          }
        });
    }
  }

  markAsRead(): void {
    if (this.thread.notify_category_id) {
      this.commonService.saveApi('saveNotificationsInfo', {
        read: this.thread.read ? false : true,
        notification_id: this.thread.notification_id,
        is_archive: this.thread.is_archive,
        is_flag: this.thread.is_flag,
        time_zone: APP.user.timezone_offset
      })
        .then(response => {
          if (response['result'].success) {
            this.thread.unread_count = 0;
            this.thread.read = !this.thread.read;
            this.onThreadChange.emit(this.thread);
          }
        })
    } else {
      if (this.thread.unread_count != 0) {
        this.messagingService.saveRead({
          users_id: APP.recon_user[0].id,
          thread_id: this.thread.thread_id,
          status: false
        }).subscribe(response => {
          if (response.result.success) {
            this.thread.unread_count = 0;
            this.onThreadChange.emit(this.thread);
          }
        });
      }
    }
  }

  saveRead(): void {
    if (this.thread.notify_category_id) {
      this.commonService.saveApi('saveNotificationsInfo', {
        read: this.thread.read ? false : true,
        notification_id: this.thread.notification_id,
        is_archive: this.thread.is_archive,
        is_flag: this.thread.is_flag,
        time_zone: APP.user.timezone_offset
      })
        .then(response => {
          if (response['result'].success) {
            if (this.thread.unread_count == 0) {
              this.thread.unread_count = 1;
            } else {
              this.thread.unread_count = 0;
            }
            this.thread.read = !this.thread.read;
            this.onThreadChange.emit(this.thread);
          }
        })
    } else {
      this.messagingService.saveRead({
        users_id: APP.recon_user[0].id,
        thread_id: this.thread.thread_id,
        status: this.thread.unread_count == 0 ? true : false
      })
        .subscribe(response => {
          if (response.result.success) {
            if (this.thread.unread_count == 0) {
              this.thread.unread_count = 1;
            } else {
              this.thread.unread_count = 0;
            }
            this.onThreadChange.emit(this.thread);
          }
        });
    }
  }

  getDetails() {
    this.inProgress = true;
    this.state.loader = true;
    this.state.notifyType = 'new';
    if (this.thread.notify_category_id) {
      this.commonService.saveApi('getNotificationsDetails', {
        group_id: this.thread.group_id,
        job_id: this.thread.job_id,
        notify_category_id: this.thread.notify_category_id,
        time_zone: APP.user.timezone_offset
      })
        .then(response => {
          if (response['result'].success) {
            if (!response['result'].data.list.length) this.noData = true;
            else {
              this.noData = false;
              this.list = response['result'].data.list;
              this.list.reverse();
              this.list.map(msgObj => {
                msgObj.message = msgObj['body'].replace(/\n/g, '<br/>')
              });
              setTimeout(this.scrollToBottom.bind(this), 0);
              if (!this.thread.read) setTimeout(this.markAsRead.bind(this), 2000);
            }
          }
          else {
            this.noData = true;
          }
          this.state.loader = false;
          this.inProgress = false;
        })
    } else if (this.thread.note_type_id) {
      this.state.notifyType = 'old_notify';
      this.commonService.saveApi('getOldNotifThreadList', {
        // group_id: this.thread.group_id,
        // job_id: this.thread.job_id,
        // notify_category_id: this.thread.notify_category_id,
        // time_zone: APP.user.timezone_offset
        msg_id: this.thread.id,
        tid: this.thread.tid,
        location: 0,
        job_id: this.thread.job_id,
        notify: 1,
        count: 0,
        ajax: 1
      })
        .then(response => {
          if (response['result'].success) {
            if (!response['result'].data.thread.length) this.noData = true;
            else {
              this.noData = false;
              this.list = response['result'].data.thread;
              this.list.reverse();
              this.list.map(msgObj => {
                msgObj.message = msgObj['msg'].replace(/\n/g, '<br/>')
              });
              setTimeout(this.scrollToBottom.bind(this), 0);
              if (!this.thread.read) setTimeout(this.markAsRead.bind(this), 2000);
            }
          }
          else {
            this.noData = true;
          }
          this.state.loader = false;
          this.inProgress = false;
        })
    } else {
      this.messagingService.getThreadDetails({
        thread_id: this.thread.thread_id,
        type: 'thread'
      })
        .subscribe(response => {
          if (response.result.success) {
            this.breadcrumbs = response['result'].data.message[0].breadcrumbs || [];
            if (!response.result.data.message[0].message.length) this.noData = true;
            else {
              this.noData = false;
              this.list = response.result.data.message[0].message;
              this.selectedThread = response.result.data.message[0].thread;
              this.list.map(o => {
                if (o['notify_id'] == 5) this.frameWOP(o);
              })
              this.users.members = response.result.data.message[0].users || [];
              this.users.groups = response.result.data.message[0].groups || [];
              if (response.result.data.message[0].thread && response.result.data.message[0].thread.jobs_id) {
                this.jobs_id = response.result.data.message[0].thread.jobs_id;
              }
              this.list.reverse();
              this.list.map(msgObj => {
                msgObj.message = msgObj.message.replace(/\n/g, '<br/>');
                if(msgObj['attachment'] && msgObj['attachment'].length){
                  let attachmentTypes = [];
                  let attachmentTypesObj = {};
                  msgObj['attachment'].map((attachment)=>{
                    if(attachmentTypes.indexOf(attachment.extension)==-1){
                      attachmentTypes.push(attachment.extension);
                    }
                    if(attachmentTypesObj[attachment.extension]){
                      attachmentTypesObj[attachment.extension] = attachmentTypesObj[attachment.extension]+1;
                    }else{
                      attachmentTypesObj[attachment.extension] = 1;
                    }
                  });
                  msgObj['attachment_css'] = 'multiple-formats';
                  let imageFormats = 0;
                  attachmentTypes.map((type)=>{
                    if(this.attachmentImageTypes.indexOf(type)>-1){
                      imageFormats = imageFormats + attachmentTypesObj[type];
                      if(imageFormats == msgObj['attachment'].length){
                        msgObj['attachment_css'] = 'single-format image';
                      }
                    }
                    if(attachmentTypesObj[type]==msgObj['attachment'].length){
                      msgObj['attachment_css'] = 'single-format '+type;
                    }
                  });
                }
              });
              setTimeout(this.scrollToBottom.bind(this), 0);
              setTimeout(this.markAsRead.bind(this), 2000);
            }
          }
          else {
            this.noData = true;
          }
          this.state.loader = false;
          this.inProgress = false;
        })
    }
  }

  frameWOP(o) {
    o.html_code.specDt.map(p => {
      if (p.spectDt.key == 'dropdown') {
        const name = p.spectDt.options.filter(o => { return o.id == Number(p.form_save_values.value) });
        p.form_save_values.display_name = name.length ? name[0].value : '---';
      }
    })
  }

  onUpdate(ev, msg) {
    msg.html_code.address = { ...msg.html_code.address, ...ev.data.address };
    ev.data.spec_ids.map(id => {
      const specDt = msg.html_code.specDt.filter(o => o.spectDt.id === id);
      const data = _.find(ev.data.form_save_values, ['id', id]);
      if (specDt && specDt.length) {
        specDt[0].form_save_values = { ...specDt[0].form_save_values, ...data };
        this.frameWOP(msg);
      }
    })
  }

  scrollToBottom(): void {
    try {
      this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  onKeydown(e) {

    //this.showButtons = true;

    let key = e.which || e.keyCode,
      shiftKey = !!e.shiftKey;

    if (key === 13) {
      if (shiftKey) {
        setTimeout(this.scrollToBottom.bind(this), 0);
      } else if (this.newMessage) {
        e.preventDefault();

        this.list.push({
          created: this.userName,
          message: this.newMessage.replace(/\n/g, '<br />'),
          created_date: moment().format('MM/DD/YYYY h:mm:ss a')
        });

        let params = {
          message: this.newMessage,
          thread_id: this.thread.thread_id,
          attachment: this.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
        }

        this.messagingService.createMessage(params)
          .subscribe(response => {
            if (response.result.success) {
              this.list[this.list.length - 1] = response.result.data[0].message[0];
            }
          });
        this.showButtons = false;
        this.newMessage = "";
        this.uploadData.files = [];
        //thread_count
        this.thread['thread_count'] = this.thread['thread_count'] + 1;
        this.onThreadChange.emit(this.thread);
        setTimeout(this.scrollToBottom.bind(this), 0);
      }

    }
  }

  onMessageAdd(message: any) {
    // this.list[this.list.length - 1] = message;
    if(message['attachment'] && message['attachment'].length){
      let attachmentTypes = [];
      let attachmentTypesObj = {};
      message['attachment'].map((attachment)=>{
        if(attachmentTypes.indexOf(attachment.extension)==-1){
          attachmentTypes.push(attachment.extension);
        }
        if(attachmentTypesObj[attachment.extension]){
          attachmentTypesObj[attachment.extension] = attachmentTypesObj[attachment.extension]+1;
        }else{
          attachmentTypesObj[attachment.extension] = 1;
        }
      });
      message['attachment_css'] = 'multiple-formats';
      let imageFormats = 0;
      attachmentTypes.map((type)=>{
        if(this.attachmentImageTypes.indexOf(type)>-1){
          imageFormats = imageFormats + attachmentTypesObj[type];
          if(imageFormats == message['attachment'].length){
            message['attachment_css'] = 'single-format image';
          }
        }
        if(attachmentTypesObj[type]==message['attachment'].length){
          message['attachment_css'] = 'single-format '+type;
        }
      });
    }
    this.list.push(message);
    this.thread['thread_count'] = this.thread['thread_count'] + 1;
    this.onThreadChange.emit(this.thread);
    setTimeout(this.scrollToBottom.bind(this), 0);
  }


  removeAttachment(i) {
    this.uploadData.files.splice(i, 1);
  }

  createMessage() {

    this.list.push({
      created: this.userName,
      message: this.newMessage.replace(/\n/g, '<br />'),
      created_date: moment().format('MM/DD/YYYY h:mm:ss a')
    });

    let params = {
      message: this.newMessage,
      thread_id: this.thread.thread_id,
      attachment: this.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
    }

    this.messagingService.createMessage(params)
      .subscribe(response => {
        if (response.result.success) {
          this.list[this.list.length - 1] = response.result.data[0].message[0];
        }
      });

    this.showButtons = false;
    this.newMessage = "";
    this.uploadData.files = [];

    this.thread['thread_count'] = this.thread['thread_count'] + 1;
    this.onThreadChange.emit(this.thread);
    setTimeout(this.scrollToBottom.bind(this), 0);
  }

  close() {
    this.showButtons = false;
  }

  /* Side Nav */

  toggleSidenav(flag) {
    this.showRecipients = !this.showRecipients;
  }

  addRecipients(prop) {
    const users = [], groups = [];
    this.users.members.map(o => {
      users.push(o.users_id);
    })
    this.users.groups.map(o => {
      groups.push(o.id);
    })

    this.dialog.open(AddReciepientsComponent, {
      width: '500px',
      panelClass: 'recon-dialog',
      data: {
        title: 'Add Recipients',
        flag: prop,
        selected: {
          user: users,
          group: groups,
          thread_id: this.thread.thread_id
        }
      }
    })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          this.users[prop] = [...this.users[prop], ...res.data];
          this.thread[prop == 'members' ? 'users' : prop] = _.cloneDeep(this.users[prop]);
          this.onThreadChange.emit(this.thread);
        }
      })
  }

  removeUser(prop, key) {
    let id = '';
    if (prop == 'members') id = this.selectedUser.users_id;
    if (prop == 'groups') id = this.selectedGroup.id;
    this.commonService.deleteApi('removeThreadUsers', {
      thread_id: this.thread.thread_id,
      users_id: id,
      type: prop
    })
      .then(res => {
        if (res['result'].success) {
          const indx = _.findIndex(this.users[prop], [key, id]);
          if (indx > -1) this.users[prop].splice(indx, 1);
        }
      });
  }

  showAll(prop, key) {
    this.show[key] = this.users[prop].length;
  }

  lightbox(files, selected) {
    let albums: Array<any> = [];
    const etn = ['jpeg','jpg','PNG','png','bmp','GIF','gif','svg','SVG'];
    files.map(o => {
      if (etn.indexOf(o.extension) > -1) albums.push({
        id: o.id,
        src: o.preview_path,
        caption: o.original_name,
        thumb: o.preview_path
      })
    })
    const indx = _.findIndex(albums, ['id', selected.id]);
    if (indx > -1)
      this._lightbox.open(albums, indx, { disableScrolling: true });
  }

  /* MENU */

  onMenuOpened() {
    this.appSearch.searchOpts.value = '';
    this.usersList = _.cloneDeep(this.clonedUsesList);
    this.selected = this.usersList.slice(0, 10);
    this.selectedUsers = [];
    this.selected.map(o => {
      this.userSelection(o);
    });
    this.setSelection();
  }

  onMenuClosed() {
    setTimeout(() => {
      this.selectedIndex = 0;
    }, 200);
  }

  onSelectionChange() {
    if (this.selectedIndex == 0) {
      this.selectedIndex = 1;
      this.setSelection();
    } else {
      this.onMenuClosed();
      this.listUsersMenu.closeMenu();
    }
  }

  getUsersList(search = '', flag = 'search') {
    this.messagingService.getUsers({ master_type: 6, status: true, search: search })
      .subscribe(res => {
        if (res['result'].success) {
          this.usersList = res['result'].data.users || [];
          if (flag == 'init') {
            this.clonedUsesList = _.cloneDeep(this.usersList);
          }
        }
      })
  }

  setSelection() {
    this.usersList.map(o => {
      const indx = this.selectedUsers.indexOf(o.id);
      if (indx > -1) o.selected = true;
      else delete o.selected;
    })
  }

  onSearch(val) {
    this.getUsersList(val);
  }

  userSelection(item) {
    const indx = this.selectedUsers.indexOf(item.id);
    if (indx > -1) this.selectedUsers.splice(indx, 1);
    else this.selectedUsers.push(item.id);
  }

  // removeUser(item, i) {
  //   const indx = this.selectedUsers.indexOf(item.id);
  //   if (indx > -1) this.selectedUsers.splice(indx, 1);
  //   this.selected = this.selected.filter((a, indx) => indx !== i);
  // }





  /* close() {
     this.newMessage = "";
     this.showButtons = false;
   }*/

  /*onKeydown(e) {
    let key = e.which || e.keyCode,
      shiftKey = !!e.shiftKey;

    if (key === 13) {
      if (shiftKey) {
        setTimeout(this.scrollToBottom.bind(this), 0);
      } else if (this.newMessage) {
        e.preventDefault();

        this.list.push({
          user_id: "Kiran",
          message: this.newMessage.replace(/\n/g, '<br />'),
          time: moment().format('MM/DD/YYYY h:mm:ss a')
        });

        this.newMessage = "";

        setTimeout(this.scrollToBottom.bind(this), 0);
      }
      
    }
  }*/



}
