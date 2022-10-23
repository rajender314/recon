import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { MessagingService } from '@app/messaging/messaging.service';
import { CommonService } from '@app/common/common.service';

import * as _ from 'lodash';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';

var APP: any = window['APP'];

@Component({
  selector: 'app-create-thread',
  templateUrl: './create-thread.component.html',
  styleUrls: ['./create-thread.component.scss']
})
export class CreateThreadComponent implements OnInit {

  form: FormGroup;
  userList: any[] = [];
  jobsList: any[] = [];
  filesList: Array<any> = [];
  isNew: boolean = true;
  encryptId: any;
  uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
  allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
  allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt']
  uploader: FileUploader = new FileUploader({
    allowedFileType: this.allowedFileType,
		isHTML5: true,
    url: this.uploadUrl,
    maxFileSize: 5 * 1024 * 1024,
    autoUpload: true,
    headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
  });
  showFiles = false;
  hasDropZoneOver: boolean = false;
  uploadData = {
    error: '',
    files: []
  }

  constructor(
    public dialogRef: MatDialogRef<CreateThreadComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private fb: FormBuilder,
    private messagingService: MessagingService,
    private _commonService: CommonService
  ) {
    if (this.data.hasOwnProperty('isNew')) this.isNew = this.data.isNew;
    else this.isNew = true;

    this.uploader
      .onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
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
    this.createForm();
    if (this.data.hasOwnProperty('isNew')) this.form.patchValue({
      jobs_id: this.data.jobs_id
    })
    this.messagingService.getUsers({ master_type: 6, status: true }).subscribe(response => {
      if (response.result.success) {
        this.userList = response.result.data.users
      }
    });

    this.messagingService.getJobs({}).subscribe(res => {
      if (res.result.success) this.jobsList = res.result.data || [];
    });
    this.showFiles = true;
  }

  createForm() {
    this.form = this.fb.group({
      jobs_id: ['',[Validators.required]],
      users: [],
      subject: "",
      message: "",
      files: []
    });
    this.form.controls.jobs_id.valueChanges.subscribe(val => {
      const job = _.find(this.jobsList, ['id', val]);
      if (job) this.encryptId = job.jobs_id;
    })
  }

  create() {
    let params = {
      // jobs_id: 3,
      tag_ref_id: {
        jobs_id: this.encryptId || this.form.value.jobs_id
      },
      tag: "testing"
    }, url = '';
    params = { ...params, ...this.form.value, attachment: this.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } }) };
    /*if (this.data.hasOwnProperty('jobs_po_id')) {
      url = APP.api_url + 'savePoThreads';
      params['jobs_po_id'] = this.data.jobs_po_id;
    } else if (this.data.hasOwnProperty('jobs_task_id')) {
      url = APP.api_url + 'saveTasksThreads';
      params['jobs_task_id'] = this.data.jobs_task_id;
    } else */if (this.data.hasOwnProperty('isNew')) {
      url = APP.api_url + 'saveProjectThreads';
      params['type'] = this.data.from;
      params['id'] = this.data.id;
      params['breadcrum_type'] = this.data.breadcrum_type;
    } else {
      url = APP.api_url + 'saveThread';
    }
    this.messagingService.createThread(url, params)
      .subscribe(response => {
        if (response.result.success) {
          //  this.messagingService.getMessage(response.result.data.message);
          if (!this.data.hasOwnProperty('isNew')) this._commonService.update({ type: 'message', data: response.result.data.message });
          this.dialogRef.close({ success: true, data: response.result.data });
        }
      });

  }

  removeAttachment(i) {
    this.uploadData.files.splice(i, 1);
  }

  getProjectFiles(job_id: any) {
    this.showFiles = false;
    this._commonService.getApi('getFilesLists', { jobs_id: job_id, type: 'files' })
      .then(res => {
        if (res['result'].success) {
          this.filesList = res['result'].data.files;
          this.showFiles = true;
        }
      })

  }
}
