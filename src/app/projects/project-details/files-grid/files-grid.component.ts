import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { CommonService } from '@app/common/common.service';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { GridApi, RowNode } from 'ag-grid-community';
import { MatDialog } from '@angular/material';
import { DownloadOldVersionsComponent } from '../files/download-old-versions/download-old-versions.component';
import { UploadFilesComponent } from '@app/dialogs/upload-files/upload-files.component';
import { FormControl } from '@angular/forms';

var APP: any = window['APP'];

@Component({
  template: `<div class="tag-info" *ngIf="params.data">
              <div class="wrapper">
                <div class="top-line">
                  <div class="version">{{params.data.version}},</div>
                  <div class="size">{{params.data.size}}</div>
                </div>
                <div class="bottom-line" *ngIf="false">
                  <div class="job-no">{{params.job_no}}</div>
                </div>
              </div>
              <div class="access_status" *ngIf="params.data.is_private">Private</div>
            </div>`,
  styles: [`
  :host{width: 100%;}
  .tag-info .wrapper{margin-right:25px;}
  .tag-info{flex-direction: row !important;width: 100%;align-items: center !important;justify-content: flex-start !important;}
  .access_status{padding: 3px 4px 5px;font-size: 11px;border-radius: 2px;text-transform: uppercase;
    line-height: 11px;height: 16px;display: inline-block;letter-spacing: -0.2px;font-family: "SF-Pro-Text-Semibold", Sans-Serif;
    text-align: center;min-width: 3rem;box-sizing: border-box;background-color: #949596;color: #fff;}
  .size{color: #c5cad4;margin-left: 15px;}
`]
})
export class FilesGridComponent implements OnInit {

  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

}

@Component({
  template: `<div class="messaging">
              <i class="pixel-icons icon-messages"></i>
              <span>{{params.data.messages}}</span>
            </div>`,
  styles: [`
    .messaging{
      display: flex;
      align-items: center;
    }
    .icon-messages{
      color: #909aaa;
      font-size: 20px;
      width: 20px;
      line-height: 20px;
      height: 20px;
    }
  `]
})
export class FileMessagesComponent implements OnInit {

  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

}

@Component({
  template: `<ng-container *ngIf="params.data"> 
                <div class="ag-cell-custome-actions" style="display:flex;align-items:center; height: 37px;">
                  <ul style="padding-top:0;">
                    <li class="disable-click" style="margin-left: 0px; background: rgb(228, 231, 241);" [matMenuTriggerFor]="menu"><i class="pixel-icons icon-more-horizontal" ></i></li>
                  </ul>
                  <mat-menu #menu="matMenu" xPosition="before" yPosition="below" class="grid-cell-drop-menu-ui cust-ui-menu files-menu">
                    <ng-container *ngFor="let act of actions">
                      <a *ngIf="act.is_visible" (click)="performActions(act)"><i class="pixel-icons  icon-{{act.icon}}"></i> <span>{{act.label}}</span></a>
                    </ng-container>
                  </mat-menu>
                </div>
              </ng-container>`,
  styles: [``]
})
export class FileOptionsComponent implements OnInit {

  params: any;
  actions = [
    { key: 'download', label: 'Download', icon: 'download-new', is_visible: true },
    { key: 'download-old', label: 'Download Old Version', icon: 'download-new old', is_visible: false },
    { key: 'upload', label: 'Upload New Version', icon: 'upload-new', is_visible: true },
    { key: 'private', label: 'Make Private', icon: 'make-private', is_visible: true },
    { key: 'public', label: 'Make Public', icon: 'make-private', is_visible: false },
    { key: 'remove', label: 'Remove', icon: 'delete-lined', is_visible: true },
  ]

  constructor(
    private _dialog: MatDialog,
    private _commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
    if (this.params.data) this.enableActions()
  }

  enableActions() {
    if (APP.permissions.job_access.access_private_files == 'yes') {
      if (this.params.data.is_private) {
        this.actions[3].is_visible = false;
        this.actions[4].is_visible = true;
      } else {
        this.actions[3].is_visible = true;
        this.actions[4].is_visible = false;
      }
    } else {
      this.actions[3].is_visible = false;
      this.actions[4].is_visible = false;
    }
    if (this.params.data.version == 'V0') {
      this.actions[1].is_visible = false;
    } else {
      this.actions[1].is_visible = true;
    }
  }

  performActions(act) {
    if (act.key == 'download') {
      window.location.href = this.params.data.file_path;
    } else if (act.key == 'remove') {
      let msg = 'Are you sure, you want to delete this File?';
      const locals = {
        title: 'Delete File',
        url: 'removeFilesAttachment',
        method: 'delete',
        params: {
          id: this.params.data.id,
          jobs_id: this.params.jobs_id
        },
        content: `<div class="po-dialog confirm-delete">
							<div class="">
								<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
							</div>
							<div class="">
								<p>${msg}</p>
							</div>
						</div>`,
        buttonText: 'Delete'
      }
      this._dialog.open(ConfirmationComponent, {
        panelClass: 'recon-dialog',
        width: '570px',
        data: { ...locals }
      })
        .afterClosed()
        .subscribe(res => {
          if (res && res.success) {
            (<GridApi>this.params.api).updateRowData({ remove: [this.params.data] });
            this._commonService.update({ type: 'file_ag_remove', data: this.params.data })
          }
        })
    } else if (act.key == 'private' || act.key == 'public') {
      this._commonService.saveApi('updateFileAccess', { jobs_id: this.params.jobs_id, id: this.params.data.id, flag: act.key })
        .then(res => {
          if (res['result'].success) {
            this.params.data.is_private = !this.params.data.is_private;
            (<RowNode>this.params.node).setData(this.params.data);
            this._commonService.update({ type: 'file_ag_private', data: this.params.data })
            this.enableActions();
          }
        })
    } else if (act.key == 'download-old') {
      this._dialog.open(DownloadOldVersionsComponent, {
        width: '600px',
        panelClass: 'recon-dialog',
        data: {
          title: 'Download Files',
          url: 'getVersionFiles',
          method: 'get',
          params: { jobs_id: this.params.jobs_id, id: this.params.data.id }
        }
      })
        .afterClosed()
        .subscribe(res => {
        })
    } else if (act.key == 'upload') {
      this._dialog.open(UploadFilesComponent, {
        panelClass: 'my-dialog',
        width: '930px',
        height: '590px',
        disableClose: true,
        data: {
          appendJobsId: true,
          title: 'Add Files',
          url: 'uploadNewVersion',
          multiple: false,
          params: {
            jobs_id: this.params.jobs_id,
            id: this.params.data.id
          }
        }
      })
        .afterClosed()
        .subscribe(res => {
          if (res && res.success) {
            (<GridApi>this.params.api).updateRowData({ remove: [this.params.data] });
            (<GridApi>this.params.api).updateRowData({ add: res.data, addIndex: this.params.rowIndex });
            this._commonService.update({ type: 'file_ag_upload', data: { remove: this.params.data, add: res.data } })
          }
        })
    }
  }

}

@Component({
  template: `<div class="file-info" *ngIf="params.data">
  <div class="icon file">
    <div class="has-preview" 
      *ngIf="params.data.file_type == 'jpg' || params.data.file_type == 'jpeg' || 
        params.data.file_type == 'png' || params.data.file_type == 'gif'">
      <div class="img-src" [style.background-image]="'url(' + params.data.preview_url + ')' | safeHtml: 'style'"></div>
    </div>
    <div class="no-preview" 
      *ngIf="params.data.file_type == 'pdf' || params.data.file_type == 'txt' ||
        params.data.file_type == 'doc' || params.data.file_type == 'docx' || 
        params.data.file_type == 'xls' || params.data.file_type == 'xlsx' ||
        params.data.file_type == 'zip' || params.data.file_type == 'rar' ||
        params.data.file_type == 'tiff' || params.data.file_type == 'bmp' ||
        params.data.file_type == 'csv'">
      <i class="pixel-icons icon-{{params.data.file_type}}"></i>
    </div>
  </div>
  <div class="file-name-wrapper">
  <div class="file-name">
  <div *ngIf="!isEdit" (click)="editFiled()">{{params.data.file_name}}</div>
  <ng-container *ngIf="isEdit">
    <pi-form-field label=""> 
      <input type="text" #truncate pi-input (blur)="removeEdit();" (keydown)="changeFileName($event);" [formControl]="fileName" />
    </pi-form-field>
    </ng-container>
</div>
</div>
</div>`,
  styles: [`
  .file-name{color: #172B4D;width: 200px;white-space: pre-wrap;line-height: 1.3;}
  .file-name-wrapper{line-height: normal;}
  .file-extenstion{margin-top: 2px;color: #172B4D;}
    .file-info{
      display: flex;
      align-items: center;
    }
    .file-info .icon{
      display: flex;
      align-items: center;
      height: 40px;
      width: 40px;
      border: 1px solid #D0D2E3;
      justify-content: center;
      margin-right: 10px;
      border-radius: 4px;
    }
    .file-info .has-preview{
      width: 100%;
      height: 100%;
    }
    .file-info .no-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .file-info .has-preview .img-src{
      width: 100%;
      height: 100%;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      background-color: #000;
      border-radius: 4px;
    }
    .icon-pdf {
      color: #e41d24;
    }
    .icon-gif {
        color: #0087ca;
    }
    .icon-png {
        color: #ff6f2d;
    }
    .icon-jpeg,
    .icon-jpg {
        color: #00bcc2;
    }
    .icon-doc,
    .icon-docx,
    .icon-txt,
    .icon-xls,
    .icon-xlsx {
        color: #2fac7a;
    }
    .icon-zip {
        color: #9c27b0;
    }
  `]
})
export class FilesInfoComponent implements OnInit, AfterViewInit {

  @ViewChild('truncate') truncate: ElementRef;

  public params: any;
  public isEdit: boolean = false;
  fileName = new FormControl('');

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params; 
  }

  editFiled() {
    this.isEdit = true;
    const name = this.params.value.split('.');
    name.pop(); 
    this.fileName.setValue(name.join('.'));
    setTimeout(()=>{
      this.truncate.nativeElement.focus()
    },100);
  }

  changeFileName(ev){
    if(ev.keyCode==8){
      ev.stopPropagation();
    }
  }

  removeEdit(){
    this.isEdit = false;
    this.params.data.file_name_new = this.fileName.value;
  }

  ngAfterViewInit() {
  }

}

@Component({
  template: `<div class="file-category" *ngIf="params.data">{{params.data.file_categories_name || '---'}}</div>`,
  styles: [``]
})
export class FilesCategoryComponent implements OnInit {

  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

}

@Component({
  template: `<div class="file-category" *ngIf="params.data">{{params.data.thumbnail_name || '---'}}</div>`,
  styles: [``]
})
export class FilesThumbnailComponent implements OnInit {

  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

}

@Component({
  template: `<div class="file-change-details" *ngIf="params.data">
    <div class="modified-date">{{params.data.last_modified}}</div>
    <div class="modified-by">{{params.data.modified_by}}</div>
  </div>`,
  styles: [`
    .file-change-details{
      line-height: 20px;
    }
    .modified-by{
      color: #c5cad4;
    }
  `]
})
export class FilesChangeComponent implements OnInit {

  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

}

@Component({
  template: `
    <pi-select class="grid-select-fild" label="" [options]="params.column.colDef.cellRendererParams.options" (onChange)="userOptionChange($event)" [(ngModel)]="params.node.data.users_id"></pi-select>
  `,
  styles: [`
  pi-select{
    background: red !important;
  }
  `]
})
export class GridSelectComponent implements ICellEditorAngularComp {

  constructor(
    private commonService: CommonService
  ) { }

  public params: any;
  public selectedValue: any;
  public selectedId: any;
  public selectType: any;

  agInit(params): void {
    this.params = params;
    this.selectedValue = this.params.value;
    this.selectType = params.column.colDef.cellRendererParams ? params.column.colDef.cellRendererParams.selectType : null;
    this.selectedId = params.node.data[this.selectType];
  }

  getValue(): any {
    return this.selectedValue;
  }

  userOptionChange(ev) {
    setTimeout(() => {
      this.params.stopEditing();
    });
    this.commonService.saveApi('updateCostAnalysis', {
      id: this.params.node.data.id,
      unit: this.params.node.data.units,
      rate: this.params.node.data.rates,
      net_amount: this.params.node.data.net,
      gross_amount: this.params.node.data.gross,
      users_id: this.params.node.data.users_id
    }).then(res => {
      if (res['result'].success) {
        if (document.querySelector('.pi-select-list')) {
          document.body.removeChild(document.querySelector('.pi-select-list'));
        }
        this.params.node.data['asignee'] = res['result'].data.asignee;
        this.params.node.data['unit'] = res['result'].data.unit;
        this.params.node.data['rate'] = res['result'].data.rate;
        this.params.node.data['net_amount'] = res['result'].data.net_amount;
        this.params.node.data['gross_amount'] = res['result'].data.gross_amount;
        this.params.api.updateRowData({ update: [this.params.node.data] });
      }
    });
  }

}