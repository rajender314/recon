import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatMenuTrigger, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatSnackBar } from '@angular/material';

// import { AnalyzeBidsComponent } from '@app/projects/analyze-bids/analyze-bids.component';
//import { BidsDiscussionComponent } from '@app/projects/bids-discussion/bids-discussion.component';

import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';

import * as moment from 'moment';
import { Subscription, Observable } from 'rxjs';
import { CommonService } from '@app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { RowNode, GridApi } from 'ag-grid-community';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import Message from '@app/messaging/entities/message';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { VendorScheduleComponent } from '../project-details/vender-queue/vendor-schedule/vendor-schedule.component';

@Component({
  template: `
  <div class="settings-container">
    <i class="pixel-icons icon-more-horizontal" [matMenuTriggerFor]="settingsMenu"></i>
    <mat-menu #settingsMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before" class="more-actions">
      <button mat-menu-item (click)="togglePlants()">{{params.column.colDef.plants ? 'Hide' : 'Show'}} Plants</button>
      <!-- <button mat-menu-item (click)="hidePlants()" *ngIf="params.column.colDef.plants">Hide Plants</button> -->
      <button mat-menu-item (click)="toggleSpecs()">{{params.column.colDef.specs ? 'Hide' : 'Show'}} Bid Submission Specs</button>
      <!-- <button mat-menu-item (click)="hideSpecs()" *ngIf="params.column.colDef.specs">Hide Bid Submission Specs</button> -->
    </mat-menu>
    </div>
  `,
  styles: [`
    .settings-container{text-align:right;line-height: 33px;}
    .pixel-icons{font-size:14px;width:14px;height:14px;margin: 0 5px;
      color: rgba(23, 43, 77, 0.7);cursor:pointer;}
    .pixel-icons:hover{color: rgba(23, 43, 77, 1);}
    .icon-more-horizontal{font-size:16px;width:16px;height:16px;position: relative;top: 4px;}
  `]
})
export class HeaderSettings implements OnInit {

  public params: any;

  constructor(
    private dialog: MatDialog,
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  togglePlants() {
    this.params.column.colDef.plants = !this.params.column.colDef.plants;
    if(this.params.altOption){
      this.params.columnApi.setColumnVisible('alt_plant', this.params.column.colDef.plants);
    }
    for (let i = 1; i <= this.params.maxOptions; i++) {
      this.params.columnApi.setColumnVisible('plant' + i, this.params.column.colDef.plants);
    }
  }

  toggleSpecs() {
    this.params.column.colDef.specs = !this.params.column.colDef.specs;
    if(this.params.altOption){
      this.params.columnApi.setColumnVisible('alt_spec', this.params.column.colDef.specs);
    }
    for (let i = 1; i <= this.params.maxOptions; i++) {
      this.params.columnApi.setColumnVisible('spec' + i, this.params.column.colDef.specs);
    }
  }

}

@Component({
  template: `
  
    <pi-form-field label=" ">
        <input type="checkbox" pi-input (change)="headerCheck()" [(ngModel)]="params.column.colDef.selected"
        />
    </pi-form-field>
  
  `,
  styles: [`
    .pi-form-field.checkbox{
        margin-top:0;
    }
  `]
})
export class serviceHeaderCheck implements OnInit {

  public params: any;

  constructor(
    private _commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  headerCheck(): void {
    this.params.api.forEachNode((node: RowNode) => {
      if (node.data) {
        node.data.options.map((o, i) => {
          o.selected = this.params.column.colDef.selected;
          if (node.data['option' + (i + 1)]) node.data.selected = this.params.column.colDef.selected;
        });
        node.setData(node.data);
      }
    })
    this._commonService.update({ enableButton: this.params.column.colDef.selected });
  }

}

@Component({
  template: `
  <div *ngIf="params.data && params.data.type=='service'">
    <pi-form-field label=" ">
        <input type="checkbox" pi-input [disabled]="!params.data.hasBid" (change)="serviceCheck()" [(ngModel)]="params.data.selected"
        />
    </pi-form-field>
  </div>
  `,
  styles: [`
    .pi-form-field.checkbox{
        margin-top:4px;
    }
  `]
})
export class serviceCheck implements OnInit {

  public params: any;
  public checkbox = false;

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  serviceCheck(): void {
    this.params.data.options.map(o => {
      if (o.option) o.selected = this.params.data.selected;
    });
    (<RowNode>this.params.node).setData(this.params.data);
    this.commonService.update({ enableButton: this.isChecked() > 0 });
  }

  isChecked() {
    let rowCount = 0, selectedCount = 0, isEnter = false;
    (<GridApi>this.params.api).forEachNode(p => {
      if (p.data) {
        isEnter = false;
        if (p.data.selected) selectedCount++;
        p.data.options.map((o, i) => {
          if (p.data['option' + (i + 1)] && !isEnter) {
            isEnter = true;
            rowCount++;
          }
        })
      }
    })
    if (rowCount == selectedCount && rowCount != 0) {
      this.params.colDef.selected = true;
    } else {
      this.params.colDef.selected = false;
    }
    return selectedCount;
  }

}

@Component({
  template: `<div *ngIf="params.data.type == 'service'">
              <div *ngIf="params.data.children.length > 1" [ngClass]="(params.value > 0) ? 'inner-sec' : ''">
                <span class="avg-values" [innerHtml]="params.value ? '<span class=avg>AVG</span>' + '<span>$'+ formatNumber(params.value) +'</span>' : ''"></span>
              </div>
              <div *ngIf="hasOption()" class="specs-ui">
                <span (menuOpened)="getSpecs()" [matMenuTriggerFor]="specificationMenu" #specification="matMenuTrigger"><i class="pixel-icons icon-specs"></i></span>
                  <mat-menu #specificationMenu="matMenu" class="custom-addvendor-small-menu onplace-dialog specs-menu">
                    <div class="my-dialog" (click)="$event.stopPropagation();">
                      <div class="d-heading">
                        <h2>Specifications</h2>
                        <button mat-icon-button (click)="specification.closeMenu();">
                          <i class="pixel-icons  icon-close-slim"></i>
                        </button>
                      </div>
                      <div class="d-content" [class.is-loading]="isLoading">
                        <mat-spinner diameter="24" class="md" *ngIf="isLoading"></mat-spinner>
                        <div *ngIf="!isLoading">
                            <div class="specs-list-container" *ngIf="specifications?.values.length">
                                <ul>
                                    <li *ngFor="let spec of specifications?.values" class="spec-labels">
                                        <ng-container>
                                        <div [innerHtml]="spec.label"></div>
                                        <div [innerHtml]="spec.value || '---'"></div>
                                        </ng-container>
                                    </li>
                                </ul>
                            <!-- *ngIf="spec.value" -->
                            </div>
                          <div *ngIf="!specifications?.values.length" style="text-align: center;  padding: 20px; color: rgba(23, 43, 77, 0.5);">No Specifications Found</div>
                        </div>
                      </div>
                    </div>
                </mat-menu>
                </div>
            </div>
            <ng-container *ngIf="params.data.type == 'vendor' && params.colDef.cellRendererParams.index < params.data.options?.length">
              <div style="display: flex;align-items: center" *ngIf="params.data[params.colDef.field]" class="modified-bid">
                <span class="bid-type" *ngIf="params.data.options[params.index].type"  matTooltip="{{getBidTitle(params.data.options[params.index].type)}}" [innerHtml]="getBidSymbol(params.data.options[params.index].type)"></span>
                <span style="flex: 0 !important;margin-left: auto;"></span>
                <!--<pi-form-field class="grid-checkbox" label=" " style="margin-top: 0">
                  <input type="checkbox" pi-input (change)="checkStatus()" [(ngModel)]="params.data.options[params.index].selected" />
                </pi-form-field>-->
                \${{formatNumber(params.data[params.colDef.field])}}
              </div>
            <ng-container *ngIf="!params.data[params.colDef.field]">---</ng-container>
          </ng-container>
  `,
  styles: [`.spec-icon{text-align: center;border: 1px solid rgba(23, 43, 77, 0.8);line-height: initial;    font-size: 12px;
    color: rgba(23, 43, 77, 0.8); font-size: 12px; padding: 0 4px;border-radius: 50%;margin-right: 5px;text-transform: capitalize;cursor: pointer;}
    .spec-icon :hover{border: 1px solid rgba(23, 43, 77, 1); color: rgba(23, 43, 77, 1);}
    .spec-container{ width:100%;display:flex;align-items: center; }
    .spec-container + span{width:100%;}
    .spec-container .inner-sec{order:1; margin-left:auto;} 
    .modified-bid .pi-form-field {flex:0 !important; margin-left:auto; }
    ::ng-deep .modified-bid .pi-form-field .pi-field .ak-field-checkbox+label{padding-right:0px; }
    .spec-labels span:first-child{margin-bottom: 10px; display:inline-block; width:250px; max-width:250px; color: rgba(23, 43, 77, 0.6) !important;}
    :host{width:100%;}
    .my-dialog .content.is-loading{display: flex;justify-content: center}
    .avg-values {display: flex;align-items: center;justify-content: space-between;}
    ::ng-deep .avg-values .avg{height:16px; line-height:12px;}
    .specs-ui{ position: absolute;  top: 0; cursor: pointer; }
    .inner-sec {padding-left: 28px;}
    `]
})
export class OptionCell {

  params: any;
  isLoading: boolean = false;
  specifications: any = null;

  constructor(private _commonService: CommonService) { }

  agInit(params: any) {
    this.params = params;
  }

  checkStatus() {
    let count = 0, selectedCount = 0;
    this.params.data.options.map(o => {
      if (o.option) {
        count++;
        if (o.selected) selectedCount++;
      }
    });
    if (count == selectedCount) this.params.data.selected = true;
    else this.params.data.selected = false;
    (<RowNode>this.params.node).setData(this.params.data);
  }

  formatNumber(number) {
    let x = number.split('.');
    let x1 = x[0];
    x1 = isNaN(x1) ? "0" : Number(x1);
    x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
    return x1 + x2;
  }

  getBidTitle(type) {
    let title = '';
    switch (type) {
      case 'm': title = 'Manual Bid';
        break;

      case 'alt': title = 'Alternate Bid';
        break;

      case 'v': title = 'Vendor Bid';
        break;
    }
    return title;
  }

  getBidSymbol(type) {
    let title = '';
    switch (type) {
      case 'm': title = '<i class="pixel-icons icon-manual-bid"></i>';
        break;

      case 'alt': title = '<i class="pixel-icons icon-alternate-bid"></i>';
        break;

      case 'v': title = '<i class="pixel-icons icon-vendor-bid"></i>';
        break;
    }
    return title;
  }

  hasOption() {
    const firstRow = this.params.data.children.length >= 1 ? this.params.data.children[0] : null;
    const indx = this.params.colDef.cellRendererParams.index;
    if (firstRow)
      return indx < firstRow.options.length;
    else return false;
  }

  getSpecs() {
    const firstRow = this.params.data.children.length >= 1 ? this.params.data.children[0] : null;
    const indx = this.params.colDef.cellRendererParams.index;
    if (firstRow) {
      const selectedOption = indx < firstRow.options.length ? firstRow.options[indx] : null;
      if (selectedOption) {
        this.isLoading = true;
        this._commonService.getApi('jobPrdSpecs', { id: selectedOption.jobs_forms_id, type: 'string' })
          .then(res => {
            this.isLoading = false;
            if (res['result'].success) this.specifications = res['result'].data[0];
            else this.specifications = null;
          })
      }
    }
  }
}

@Component({
  template: `<div *ngIf="params.data.type == 'vendor' && params.data[params.colDef.field]">
              <div class="specs-ui">
                <span (menuOpened)="getSpecs()" [matMenuTriggerFor]="specificationMenu" #specification="matMenuTrigger"><i class="pixel-icons icon-specs"></i></span>
                  <mat-menu #specificationMenu="matMenu" class="custom-addvendor-small-menu onplace-dialog specs-menu">
                    <div class="my-dialog" (click)="$event.stopPropagation();">
                      <div class="d-heading">
                        <div class="d-heading-left">
                          <h2>Specifications</h2>
                          <a class="add-tab option" title="Add Option" #altOption="matMenuTrigger" [matMenuTriggerFor]="addProductMenu">
                            <i class="pixel-icons icon-plus-slim"></i>
                          </a>
                          <div class="wrapper-triangle-top">
                            <mat-menu #addProductMenu="matMenu" [overlapTrigger]="false" yPosition="below" class="more-actions add-alt-option add-tab-menu">
                              <div (click)="$event.stopPropagation();">
                                <p>Add this ALT Option as a new Option to Service</p>
                                <div class="footer">
                                  <button (click)="altOption.closeMenu();" pi-button>Cancel</button>
                                  <button (click)="addAltOption();altOption.closeMenu();specification.closeMenu();" pi-button color="primary">Add</button>
                                </div>
                              </div>
                            </mat-menu>
                          </div>
                        </div>
                        <button mat-icon-button (click)="specification.closeMenu();">
                          <i class="pixel-icons  icon-close-slim"></i>
                        </button>
                      </div>
                      <div class="d-content" [class.is-loading]="isLoading">
                        <mat-spinner diameter="24" class="md" *ngIf="isLoading"></mat-spinner>
                        <div *ngIf="!isLoading">
                            <div class="specs-list-container" *ngIf="params.data['alt_spec'].length">
                                <ul>
                                    <li *ngFor="let spec of params.data['alt_spec']" class="spec-labels">
                                        <ng-container>
                                        <div [innerHtml]="spec.label"></div>
                                        <div [innerHtml]="spec.value || '---'"></div>
                                        </ng-container>
                                    </li>
                                </ul>
                            </div>
                          <div *ngIf="!params.data['alt_spec'].length" style="text-align: center;  padding: 20px; color: rgba(23, 43, 77, 0.5);">No Specifications Found</div>
                        </div>
                      </div>
                    </div>
                </mat-menu>
                </div>
            </div>
            <ng-container *ngIf="params.data.type == 'vendor'">
              <div style="display: flex;align-items: center" *ngIf="params.data[params.colDef.field]" class="modified-bid">
                <span style="flex: 0 !important;margin-left: auto;"></span>
                \${{formatNumber(params.data[params.colDef.field])}}
              </div>
            <ng-container *ngIf="!params.data[params.colDef.field]">---</ng-container>
          </ng-container>
  `,
  styles: [`.spec-icon{text-align: center;border: 1px solid rgba(23, 43, 77, 0.8);line-height: initial;    font-size: 12px;
    color: rgba(23, 43, 77, 0.8); font-size: 12px; padding: 0 4px;border-radius: 50%;margin-right: 5px;text-transform: capitalize;cursor: pointer;}
    .spec-icon :hover{border: 1px solid rgba(23, 43, 77, 1); color: rgba(23, 43, 77, 1);}
    .spec-container{ width:100%;display:flex;align-items: center; }
    .spec-container + span{width:100%;}
    .spec-container .inner-sec{order:1; margin-left:auto;} 
    .modified-bid .pi-form-field {flex:0 !important; margin-left:auto; }
    ::ng-deep .modified-bid .pi-form-field .pi-field .ak-field-checkbox+label{padding-right:0px; }
    .spec-labels span:first-child{margin-bottom: 10px; display:inline-block; width:250px; max-width:250px; color: rgba(23, 43, 77, 0.6) !important;}
    :host{width:100%;}
    .my-dialog .content.is-loading{display: flex;justify-content: center}
    .avg-values {display: flex;align-items: center;justify-content: space-between;}
    ::ng-deep .avg-values .avg{height:16px; line-height:12px;}
    .specs-ui{ position: absolute;  top: 0; cursor: pointer; }
    .inner-sec {padding-left: 28px;}
    ::ng-deep .add-alt-option{width: 230px !important;}
    ::ng-deep .add-alt-option .footer{
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .d-heading-left{
      display: flex;
      align-items: center;
    }
    ::ng-deep .add-tab.option{
      margin-left: 10px;
      width: 24px;
      height: 24px;
      background: #0747a6;
      right: 12px;
      color: #fff;
      top: 16px;
      font-size: 12px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    ::ng-deep .add-tab.option .icon-plus-slim{
     font-size: 14px;
     color: #fff;
     height: 14px;
     width: 14px;
    }
    `]
})
export class ALTOptionCell {

  params: any;
  isLoading: boolean = false;
  specifications: any = null;

  constructor(
    private _commonService: CommonService,
    private _dialog: MatDialog
  ) { }

  agInit(params: any) {
    this.params = params;
  }

  checkStatus() {
    let count = 0, selectedCount = 0;
    this.params.data.options.map(o => {
      if (o.option) {
        count++;
        if (o.selected) selectedCount++;
      }
    });
    if (count == selectedCount) this.params.data.selected = true;
    else this.params.data.selected = false;
    (<RowNode>this.params.node).setData(this.params.data);
  }

  addAltOption(){
    this._dialog.open(ConfirmationComponent, {
      width: '480px',
      panelClass: 'recon-dialog',
      data: {
        title: 'Add Option',
        content: `
          <ul class="add_option_rules">
            <li>This option will be added to the service as <span class="bld">Option 4</span>.</li>
            <li>The newely added option will be available to all the vendors, however we will push the cost for selected vendor.</li>
            <li>The selected vendor will be notified about this option.</li>
          </ul>
          <p>Are you sure, you want to add this option?</p>
        `
      }
    })
    .afterClosed()
    .subscribe(result => {
      if (result && result.success) {
        this._commonService.saveApi('addAltBidToOption', {alt_id: this.params.data['alt_id']})
        .then(res => {
          if (res['result'].success) {
            this._commonService.update({ reloadBids: true });
          }
        });
      }
    });
  }

  formatNumber(number) {
    let x = number.split('.');
    let x1 = x[0];
    x1 = isNaN(x1) ? "0" : Number(x1);
    x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
    return x1 + x2;
  }

  getBidTitle(type) {
    let title = '';
    switch (type) {
      case 'm': title = 'Manual Bid';
        break;

      case 'alt': title = 'Alternate Bid';
        break;

      case 'v': title = 'Vendor Bid';
        break;
    }
    return title;
  }

  getBidSymbol(type) {
    let title = '';
    switch (type) {
      case 'm': title = '<i class="pixel-icons icon-manual-bid"></i>';
        break;

      case 'alt': title = '<i class="pixel-icons icon-alternate-bid"></i>';
        break;

      case 'v': title = '<i class="pixel-icons icon-vendor-bid"></i>';
        break;
    }
    return title;
  }

  hasOption() {
    const firstRow = this.params.data.children.length >= 1 ? this.params.data.children[0] : null;
    const indx = this.params.colDef.cellRendererParams.index;
    if (firstRow)
      return indx < firstRow.options.length;
    else return false;
  }

  getSpecs() {
    this.isLoading = true;
    setTimeout(()=>{
      this.isLoading = false;
    },500)
  }
}

@Component({
  template: `<ng-container *ngIf="params.data.type == 'vendor'">
                <span *ngIf="hasBid()">
                  <i [matMenuTriggerFor]="bidSubmissionMenu" (click)="getGenericFormData()" #bidSubmission="matMenuTrigger" class="pixel-icons icon-capabilities"></i>
                  <mat-menu #bidSubmissionMenu="matMenu" class="onplace-dialog 3333 custom-addvendor-small-menu">
                    <div class="my-dialog" (click)="$event.stopPropagation();">
                      <div class="d-heading">
                        <h2>Bid Submission Specs</h2>
                        <button mat-icon-button (click)="bidSubmission.closeMenu();">
                          <i class="pixel-icons  icon-close-slim"></i>
                        </button>
                      </div>
                      <div *ngIf="genericForm.length">
                        <div class="specs-list-container">
                            <ul>
                                <li *ngFor="let spec of genericForm" class="spec-labels">
                                    <div [innerHtml]="spec.label"></div>
                                    <div [innerHtml]="spec.values || '---'"></div>
                                </li>
                            </ul>
                        </div>
                      </div>
                      <div *ngIf="!genericForm.length" class="no-data">No Specifications Found</div>
                    </div>
                </mat-menu>
                </span>
            </ng-container>`,
  styles: [`
            .no-data {text-align: center;padding: 20px; color: rgba(23, 43, 77, 0.5);}
            .specs-list-container{
              padding: 0 20px;
              overflow: auto;
            }
            `]
})

export class BidScheduleSpecs {

  params: any;
  showBidSpecs: boolean = false;
  public genericForm = [];
  constructor(
    private commonService: CommonService
  ) { }

  agInit(params: any) {
    this.params = params;
  }

  getGenericFormData(){
    this.commonService.getApi('bidSubmissionSpecs', {bid_id: this.params.data.bidId})
    .then(res => {
      if (res['result'].success && res['result'].data && res['result'].data.form) {
        this.genericForm = res['result'].data.form;
      }
    })
  }

  hasBid() {
    return this.params.colDef.cellRendererParams.index < this.params.data.options.length ? (this.params.data.options[this.params.colDef.cellRendererParams.index].option ? true : false) : false;
  }
}

@Component({
  selector: 'app-post-bids-grid',
  template: `
    <div [class]="params.data.type">
      <span>
        <i *ngIf="params.data.type == 'product' && !params.data.product_cancel" class="pixel-icons icon-products"></i>
        <i *ngIf="params.data.type == 'product' && params.data.product_cancel" class="pixel-icons icon-cancelled-products"></i>
        
        <i [title]="params.data.form_status == 10 ? 'Service Cancelled' : ''" *ngIf="params.data.type == 'service'" class="pixel-icons {{params.data.form_status == 10 ? 'icon-cancelled-services' : 'icon-orders'}}" ></i>
        <i *ngIf="params.data.type == 'vendor'" class="pixel-icons icon-vendor-shape"></i>
        {{params.value}}
      </span>
    </div>`,
  styles: [`
    .product{
      display: flex;justify-content: space-between;align-items: center;
    }
    .icon-orders, .icon-cancelled-services{   
      color: #dc4f66;font-size: 16px;height: 16px;width: 16px;margin-right: 2px;
      position: relative;top: 3px; 
    }
    .icon-vendor-shape{   
      color: rgba(23,43,77,0.5);font-size: 18px;height: 18px;width: 18px;
      margin-right: 1px;position: relative;top: 3px;
   }
    .product span:nth-child(1){text-overflow: ellipsis;overflow: hidden;white-space: nowrap;}
    .product span:nth-child(2){
      height: 16px;border-radius: 2px;background: #ebedf9;padding: 0 2px;
      font-size: 10px;font-weight: 600;color: rgba(23, 43, 77, 0.6);letter-spacing: 0.5px;
      display:flex;align-items:center;
    }
    .product span:nth-child(2):hover{
      color: rgba(23, 43, 77, 0.8);
    }
    .avg,.service{padding-left: 0px;}
    .avg{text-align: right;}
    .service{overflow: hidden;white-space: nowrap;text-overflow: ellipsis;}
  `]
})
export class PostBidsGridComponent implements OnInit {

  public params: any;
  public name: string = '';
  public isOpen: boolean = false;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

}


var APP: any = window['APP'];
@Component({
  templateUrl: '../post-bids-icon-dialogs.html',
  styles: [`
    .container .pi-form-field{margin-top:1px;}
    ::ng-deep .container .pi-form-field .pi-select-input .pi-icon{display:none;}
    .pixel-icons{
      font-size:14px;width:14px;height:14px;margin: 0 5px;cursor:pointer;
      color: rgba(23, 43, 77, 0.6);position: relative;top: 3px;
    }
    ::ng-deep .analyze-bids-matmenu-message{padding:0px;}
    ::ng-deep .analyze-bids-matmenu-message .d-heading {padding: 0 0 18px 0;}
    ::ng-deep .analyze-bids-matmenu-message .d-heading h2{ font-size:18px;}
    ::ng-deep .analyze-bids-matmenu-message .d-heading button.icon-button{background-color:transparent; padding:0; min-width:0;}
    ::ng-deep .analyze-bids-matmenu-message .d-heading button.icon-button .icon-close-slim{font-size: 20px;width:19px;
      height:20px;line-height:21px;top:0px;margin:0;}
    ::ng-deep .analyze-bids-matmenu-message .d-content{overflow:hidden; padding:0;}
    ::ng-deep .analyze-bids-matmenu-message .d-content .no_data{flex:1;}
    
    .pixel-icons:hover{color: rgba(23, 43, 77, 1);}
    mat-spinner{
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      margin-left: -20px;
    }
    .d-msgs {flex:1;overflow:auto;max-height:180px;}
    .d-msgs .item{display: flex;padding: 0 10px 16px 0;}
    .d-msgs pi-avatar{flex-shrink: 0; width:30px; height:30px; font-size:18px;}
    ::ng-deep .analyze-bids-matmenu-message .d-msgs pi-avatar pi-icon.circle{font-size: 18px; width:30px; height:30px;}
    ::ng-deep .analyze-bids-matmenu-message .d-msgs pi-avatar pi-icon i.icon-user{ width:18px; height:15px;}
    .d-msgs .item .details{margin-left: 12px;flex: 1;}
    .d-msgs .item .details .info{display: flex;align-items: baseline;}
    .d-msgs .item .details .info .user{font-weight: bold;max-width: 50%;}
    .d-msgs .item .details .info .time{color: #808A9C;font-size: 0.9em;margin-left: 16px;}
    .d-msgs .item .details .msg{margin-top: 0px;}
  `]
})
export class PostBidsIcons {

  @ViewChild(MatMenuTrigger) messageTrigger: MatMenuTrigger;
  @ViewChild('messageListSection') private messageListContainer: ElementRef;

  public params: any;
  public bidThreadId: any;
  public jobsId = this.route.parent.snapshot.params.id ? this.route.parent.snapshot.params.id : null

  revisions: Array<any> = [];
  selectedRevison = new FormControl(0);

  messages = {
    isNew: true,
    inProgress: true,
    noData: false,
    showButtons: false,
    userName: APP.user.first_name + ' ' + APP.user.last_name,
    uploadData: {
      error: '',
      files: []
    },
    newMessage: '',
    thread: {},
    list: []
  }

  public uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
  allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
  allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt'];
  public uploader: FileUploader = new FileUploader({
    url: this.uploadUrl,
    allowedFileType: this.allowedFileType,
    maxFileSize: 5 * 1024 * 1024,
    autoUpload: true,
    headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
  });

  public state = {
    loader: true
  };

  /* Revision Change */
  getRevisions(val) {
    return _.range(val + 1).map(o => { return { id: o, name: 'R ' + o } });
  }

  treeData(data): Array<any> {
    let rows = [];
    data.map(p => {
      p.services.map(s => {
        if (s.children.length) {
          s.children.map(v => {
            let obj = {
              jsr_id: s.jsr_id,
              type: 'vendor'
            };
            v.options.map((o, i) => {
              obj['option' + (parseInt(i) + 1)] = o.option;
              obj['plant' + (parseInt(i) + 1)] = o.plant;
              obj['spec' + (parseInt(i) + 1)] = o.spec;
              obj['bidId'] = o.bid_id;
            });
            rows.push({ ...v, ...obj, ...{ hireracy: [p.products_id, s.jsr_id, v.id] } })
          })
        } else {
          const dummy = {
            id: 'no_vendors_' + s.jsr_id,
            type: 'empty',
            revision_no: s.rev || 0,
            name: 'No Vendors Selected',
            options: []
          }
          rows.push({ jsr_id: s.jsr_id, ...dummy, ...{ hireracy: [p.products_id, s.jsr_id, 'no_vendors_' + s.jsr_id] } });
        }
      })
    })
    return rows;
  }

  createDummyRow() {
    const p = (<GridApi>this.params.api).getRowNode(this.params.data.hireracy[0]) ? (<GridApi>this.params.api).getRowNode(this.params.data.hireracy[0]).data : null;
    const dummy = {
      id: 'no_vendors_' + this.params.data.jsr_id,
      type: 'empty',
      revision_no: this.params.data.rev || 0,
      name: 'No Vendors Selected',
      options: []
    }
    return [{ jsr_id: this.params.data.jsr_id, ...dummy, ...{ hireracy: [p.products_id, this.params.data.jsr_id, 'no_vendors_' + this.params.data.jsr_id] } }];
  }

  flatJosn(key, data) {
    let arr = [];
    data.map(p => {
      if (p.children.length) {
        p.children.map(s => {
          let obj = {};
          s.type = 'service';
          s.options.map((o, i) => {
            obj['option' + (parseInt(i) + 1)] = o.option;
            obj['plant' + (parseInt(i) + 1)] = o.plant;
            obj['spec' + (parseInt(i) + 1)] = o.spec;
            obj['bidId'] = o.bid_id;
          })
          arr.push({
            [key]: p.jsr_id,
            product_name: p.name,
            revision: p.rev,
            jsr_id: p.jsr_id,
            ...s,
            ...obj
          })
        })
      } else {
        const dummy = {
          type: 'empty',
          revision_no: p.rev || 0,
          name: 'No Vendors Selected',
          options: []
        }
        arr.push({
          [key]: p.jsr_id,
          product_name: p.name,
          revision: p.rev,
          jsr_id: p.jsr_id,
          ...dummy
        })
      }
    });
    return arr;
  }

  changeRevision(rev) {
    /*const childs = (<RowNode>this.params.node).allLeafChildren.map((o: RowNode) => o.data);
    if (childs.length) {
      this.getSelectedProduct({ jobs_id: this.route.parent.snapshot.params.id, jsr_id: childs[0].jsr_id, revision_no: rev }, (prod) => {
        prod = prod ? prod : [{ jsr_id: childs[0].jsr_id, name: childs[0].product_name, rev: childs[0].revision, type: "product", children: [] }];
        if (prod) {
          (<GridApi>this.params.api).updateRowData({ add: this.flatJosn('product', [prod[0]]), addIndex: this.params.rowIndex });
          (<GridApi>this.params.api).updateRowData({ remove: childs });
        }
      });
    }*/

    let childs = [];
    this.params.data.children.map(vendor => {
      const vendorData: RowNode = (<GridApi>this.params.api).getRowNode(vendor.id);
      if (vendorData) childs.push(vendorData.data);
    })
    if (!childs.length) {
      const data = (<GridApi>this.params.api).getRowNode('no_vendors_' + this.params.data.jsr_id) ? (<GridApi>this.params.api).getRowNode('no_vendors_' + this.params.data.jsr_id).data : null;
      if (data) childs.push(data);
    }
    this.getSelectedProduct({ jobs_id: this.route.parent.snapshot.params.id, jsr_id: this.params.data.jsr_id, revision_no: rev }, (prod) => {
      (<GridApi>this.params.api).updateRowData({ remove: childs });
      if (prod) {
        this.params.data.children = prod[0].services[0].children;
        (<GridApi>this.params.api).updateRowData({ add: this.treeData([prod[0]]), addIndex: this.params.rowIndex });
      } else {
        this.params.data.children = [];
        (<GridApi>this.params.api).updateRowData({ add: this.createDummyRow(), addIndex: this.params.rowIndex });
      }
    });
  }

  getSelectedProduct(params, cb?) {
    this._commonService.getApi('getAnalyzeBids', params)
      .then(res => {
        if (res['result'].success) {
          // if (cb) cb(res['result'].data.products);
          if (cb) cb(res['result'].data.products_new);
        }
      })
  }

  constructor(
    private dialog: MatDialog,
    private _commonService: CommonService,
    private route: ActivatedRoute,
    private _dialog: MatDialog,
    private fb: FormBuilder) {
    this.uploader
      .onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
        if (item.size >= options.maxFileSize) this.messages.uploadData.error = 'Exceeds Max. Size';
        else this.messages.uploadData.error = 'Invalid File Upload';
      }

    this.uploader
      .onCompleteItem = (item: any, response: any, status: any, headers: any) => {
        let obj = JSON.parse(response);
        if (obj.result.success) {
          let type = obj.result.data.original_name.split('.').pop();
          this.messages.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
          this.messages.uploadData.error = '';
        }
      }

    this.selectedRevison.valueChanges.subscribe(val => {
      this.changeRevision(val);
    })
  }

  agInit(params: any): void {
    this.params = params;
    if (params.data.type == 'service') {
      this.revisions = this.getRevisions(params.data.rev);
      this.selectedRevison.setValue(params.data.rev || 0, { emitEvent: false });
    }
  }

  /* Messaging Menu */

  closeMenu() {
    this.messageTrigger.closeMenu();
  }

  getMessageList(threadId) {
    this.bidThreadId = threadId;
    this.messages.isNew = false;
    this._commonService.getApi('thread', { thread_id: threadId, type: 'thread' })
      .then((res: any) => {
        if (res.result.success) {
          if (!res.result.data.message.length) this.messages.noData = true;
          else {
            this.messages.noData = false;
            this.messages.list = res.result.data.message[0].message;
            this.messages.thread = res.result.data.message[0].thread;
            this.messages.list.reverse();
            this.messages.list.map(o => {
              o.message = o.message.replace(/\n/g, '<br/>');
            });
            setTimeout(this.scrollToBottom.bind(this), 0);
          }
        } else {
          this.messages.noData = true;
        }
        this.messages.inProgress = false;
      })
  }

  getMessages() {
    this.resetMessage();
    this.messages.inProgress = true;
    if (this.params.data.message_id) {
      this.getMessageList(this.params.data.message_id);
    } else {
      this.messages.inProgress = false;
      this.messages.isNew = true;
    }
  }

  createDiscussion() {
    this._dialog.open(CreateThreadComponent, {
      width: '700px',
      data: {
        jobs_id: this.route.parent.snapshot.params.id ? this.route.parent.snapshot.params.id : null,
        id: this.params.data.id,
        isNew: false,
        from: 'bids',
        breadcrum_type: 5
      }
    })
      .afterClosed()
      .subscribe(result => {
        if (result && result.success) {
          this.messages.inProgress = true;
          this.params.data.message_id = result.data.thread_id;
          this.getMessageList(result.data.thread_id);
          // this.snackbarModal('Discussion Created Successfully');
        }
      });
  }

  resetMessage() {
    this.messages.showButtons = false;
    this.messages.newMessage = '';
    this.messages.uploadData.files = [];
  }
  onMessageAdd(event) {
    this.messages.list.push((<any>{
      created: event.created,
      message: event.message.replace(/\n/g, '<br />'),
      created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
    }))

    this.resetMessage();

    this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
  }
  createMessage() {
    this.messages.list.push((<any>{
      created: this.messages.userName,
      message: this.messages.newMessage.replace(/\n/g, '<br />'),
      created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
    }))

    let params = {
      message: this.messages.newMessage,
      thread_id: this.messages.thread['thread_id'],
      attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
    }

    this._commonService.saveApi('saveMessage', params)
      .then(res => {
        this.messages.list[this.messages.list.length - 1] = res['result'].data[0].message[0];
      });

    this.resetMessage();

    this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
  }

  scrollToBottom(): void {
    try {
      this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  onKeydown(e) {

    let key = e.which || e.keyCode,
      shiftKey = !!e.shiftKey;

    if (key === 13) {
      if (shiftKey) {
        setTimeout(this.scrollToBottom.bind(this), 0);
      } else if (this.messages.newMessage) {
        e.preventDefault();

        this.createMessage();

        setTimeout(this.scrollToBottom.bind(this), 0);
      }

    }
  }

  removeAttachment(i) {
    this.messages.uploadData.files.splice(i, 1);
  }

}



/* JOB NAME */
@Component({
  selector: 'app-job-name',
  template: `<div class="project-client-holder"  *ngIf="params.value">
              <div class="fav-check-icon-and-client-image">
                  <div class="fav-check">
                  <i (click)="changeFav(params.data.is_favorite)" 
                  [ngClass]="!params.data.is_favorite ? 'icon-favorites' : 'icon-favorites-filled'"
                   class="pixel-icons"></i>
                  </div>
                  <div class="project-client-image">
                    <img *ngIf="params.data.logo" style="width: 100%;height: 100%" [src]="params.data.logo" />
                  </div>
              </div>
              <div class="job-name-and-client-id">
                  <p title="{{params.value}}">{{params.value}}</p>
                  <p class="client-id" title="{{params.data.job_no}}"> {{params.data.job_no }}</p>
              </div>
            </div>`, // 
  //<span>{{params.data?.job_no}}</span>

  //   <div class="job-info project-name-grid-value" *ngIf="params.value">
  //   <div class="sec-1">
  //   <i (click)="changeFav(params.data.is_favorite)" 
  //   [ngClass]="!params.data.is_favorite ? 'icon-favorites' : 'icon-favorites-filled'"
  //    class="pixel-icons"></i>
  //   <span title="{{params.value}}">{{params.value}}</span></div>
  //   <div class="sec-2">
  //   <span title="{{params.data.job_no}}"> {{params.data.job_no }}</span>
  //   <!-- <span>{{params.data.coordinator_name }}</span> -->
  //   </div>
  // </div>
  styles: [
    `.sec-1 span{overflow: hidden; text-overflow: ellipsis;}
    .sec-2 span{overflow: hidden; text-overflow: ellipsis;}
    `
  ]
})
export class JobNameComponent implements OnInit {

  public params: any;

  // this.params.api.updateRowData({ update: this.params.data.children[0] });

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  changeFav(fav) {
    this.params.data.is_favorite = !fav;
  }

}


/* JOB NAME */
@Component({
  template: `<div class="vendor-icons">
              <i [matMenuTriggerFor]="capabilitiesMenu" #capabilitiesPop="matMenuTrigger" (click)="getCapabilities($event)" class="pixel-icons icon-capabilities"></i>
              <i [matMenuTriggerFor]="equipmentsMenu" #equipmentsPop="matMenuTrigger" (click)="getEquipments($event)" class="pixel-icons icon-equipments"></i>
            </div>
            <mat-menu #capabilitiesMenu="matMenu" class="onplace-dialog">
              <div class="my-dialog" (click)="$event.stopPropagation();">
                <div class="d-heading">
                  <h2>Capabilities - <b [innerHtml]="params.data?.name"></b></h2>
                  <button mat-icon-button (click)="capabilitiesPop.closeMenu();">
                  <i class="pixel-icons  icon-close-slim"></i>
                  </button>
                </div>
                <mat-spinner diameter="24" class="md" *ngIf="loader"></mat-spinner>
                <div class="d-content capabilities-modal " *ngIf="!loader">
                  <ng-container *ngIf="capabilities.length">
                    <div class="product capabilities-window-ui" *ngFor="let product of capabilities">
                      <div class="product-name"><i class="pixel-icons icon-capabilities"></i><span>11111{{product.name}}</span></div>
                      <div class="service" *ngFor="let service of product.children">
                        <div class="service-name"><i class="pixel-icons icon-capabilities"></i><span>{{service.name}}</span></div>
                      </div>
                    </div>
                  </ng-container>
                  <div *ngIf="!capabilities.length" class="no-data">No Capabilities Found</div>
                </div>
              </div>
            </mat-menu>
            <mat-menu #equipmentsMenu="matMenu" class="onplace-dialog">
              <div class="my-dialog" (click)="$event.stopPropagation();">
                <div class="d-heading">
                  <h2>Equipment - <b [innerHtml]="params.data?.name"></b></h2>
                  <button mat-icon-button (click)="equipmentsPop.closeMenu();">
                    <i class="pixel-icons icon-close-slim"></i>
                  </button>
                </div>
              
                <div class="d-content equipment-window-ui" >

                <mat-spinner diameter="24" class="md" *ngIf="loader"></mat-spinner>
                    <ng-container *ngIf="equipments.length && !loader">
                      <div class="equipments" *ngFor="let equipment of equipments">
                        <div class="equipment-name"><i class="pixel-icons icon-equipments"></i> <span class="equipment_name-ui">{{equipment.name}}</span> - <span>{{equipment.equip_name}}</span></div>
                      </div>
                    </ng-container>
                    <div *ngIf="!equipments.length && !loader" class="no-data">No Equipment Found</div>
                </div>
              </div>
            </mat-menu>`,
  styles: [`
    .vendor-icons .pixel-icons{
      margin-top: 10px;
      font-size: 16px;
      width: 14px;
      height: 14px;
      color: rgba(23, 43, 77, 0.6);
    }
    .vendor-icons .icon-equipments{
      margin-left:15px;
    }
    .d-heading h2 b {
      font-size: 15px;
      font-weight:normal;
    }
    .service{
      margin-left: 20px;
    }
    mat-spinner{
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  `]
})
export class capabilityEquipmentComponent implements OnInit {

  public params: any;

  public loader = true;

  public capabilities = [];
  public equipments = [];

  // this.params.api.updateRowData({ update: this.params.data.children[0] });

  constructor(
    private router: Router,
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  getCapabilities(e): void {
    e.stopPropagation();
    setTimeout(() => {
      this.loader = false;
    }, 2000);
    this.commonService.getApi('vendorsCapableNames', {
      id: this.params.data.id
    })
      .then(res => {
        this.loader = false;
        this.capabilities = res['result'].data;
      });
  }

  getEquipments(e): void {
    e.stopPropagation();
    this.commonService.getApi('OrgEquipCtgSpec', {
      org_id: this.params.data.id
    })
      .then(res => {
        this.loader = false;
        this.equipments = res['result'].data;
      });
  }

}

@Component({
  template: `<div class="product-services-icon-container">
            <div *ngIf="params.data.products || params.data.services" [matMenuTriggerFor]="capabilitiesMenu" #productsMenuPop="matMenuTrigger" class="vertical-center-ui" (click)="getProductServices()">
              <div class="products-count" *ngIf="params.data.products"><i class="pixel-icons icon-products"></i><span class="count">{{params.data.products}}</span></div>
              <div class="service-count" *ngIf="params.data.services"><i class="pixel-icons icon-orders"></i><span class="count">{{params.data.services}}</span></div>
            
            <mat-menu class="onplace-dialog" #capabilitiesMenu="matMenu">
              <div class="my-dialog" (click)="$event.stopPropagation()">
                <div class="d-heading">
                  <h2>Products & Services</h2>
                  <button mat-icon-button (click)="$event.stopPropagation();productsMenuPop.closeMenu();">
                  <i class="pixel-icons icon-close-slim"></i>
                  </button>
                </div>
                <div class="d-content" [class.hide-check]="!params.edit" [class.view-check]="params.edit">
                  <div class="products-container-schedule">
                    <div class="product" *ngFor="let product of products">
                      <div class="product-name">
                      <i class='pixel-icons icon-products' *ngIf="!params.edit"></i>
                        <div *ngIf="!params.edit">000111  {{product.name}}</div>
                        <div class=" chk-radio" *ngIf="params.edit">
                            <pi-form-field label="<i class='pixel-icons icon-products'></i><span>{{product.name}}</span>">
                                <input type="checkbox" pi-input (change)="checkAllServices(product,product.selected)" [(ngModel)]="product.selected"  />
                            </pi-form-field>
                        </div>
                      </div>
                      <div class="service" *ngFor="let service of product.services">
                        <div class="service-name">
                        <i class="pixel-icons icon-orders" *ngIf="!params.edit"></i>
                          <div *ngIf="!params.edit"><span>{{service.name}}</span></div>
                          <div class=" chk-radio" *ngIf="params.edit">
                              <pi-form-field label="<i class='pixel-icons icon-orders' ></i><span>{{service.name}}</span>">
                                  <input type="checkbox" pi-input (change)="checkService(product, service.selected)" [(ngModel)]="service.selected" />
                              </pi-form-field>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-footer" *ngIf="params.edit">
                  <button pi-button (click)="update();" [disabled]="disableUpdate" color="primary">Update</button>
                </div>
              </div>
            </mat-menu>
            </div>
            <pi-icon size="sm" *ngIf="params.data.is_revision" name="icon-exclamation" title="Some or all services sent to this vendor have been revised. Please Request Bids Again."></pi-icon>
            </div>`,
  styles: [`
    .product-services-icon-container{
      display: flex;
      align-items: center;
    }
    ::ng-deep .product-services-icon-container pi-icon {
      margin-left: 15px;
    }
    ::ng-deep .product-services-icon-container pi-icon i.icon-exclamation {
      display: flex;
      align-items: center;
      color: #FF9800;
    }
    .vendor-icons{
      display: flex;
      align-items: center;
      height: 36px;
    }
    .vendor-icons > div{
      display: flex;
    }
    .vendor-icons .count{
      font-size: 14px;
      padding: 0 10px 0 5px;
    }
    .vendor-icons .pixel-icons{
      margin-top: 10px;
      font-size: 16px;
      width: 14px;
      height: 14px;
      color: rgba(23, 43, 77, 0.6);
    }
    .vendor-icons .icon-equipments{
      margin-left:5px;
    }
  `]
})
export class ProductsServicesComponent implements OnInit {

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  public params: any;

  public products = [];

  public disableUpdate = true;

  // this.params.api.updateRowData({ update: this.params.data.children[0] });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private snackbar: MatSnackBar,
    private _dialog: MatDialog
  ) { }

  ngOnInit() {
    // this.getProductServices();
  }

  getProductServices(): void {
    this.commonService.getApi('getVendorProdServices', {
      jobs_id: this.params.jobs_id || this.route.parent.snapshot.params.id,
      vendors_id: this.params.data.id
    })
      .then(res => {
        this.products = res['result'].data;
      });
  }

  update() {
    let services = [];
    this.products.map((product) => {
      if (product.services && product.services.length) {
        product.services.map((service) => {
          if (service.selected) {
            services.push(service.jsr_id);
          }
        });
      }
    });
    this.params.data.jsr_ids = services;
    if (services.length) {
      this.updateServiceApi(services);
    }
    else {
      this._dialog.open(ConfirmationComponent, {
        panelClass: 'my-dialog',
        width: '600px',
        data: {
          title: 'Remove Vendor',
          action: 'remove',
          tab: 'Vendor Que',
          url: '',
          params: {},
          content: 'Removing all Services will also remove the Vendor from Queue. <br /> Are you sure, you want to remove this Vendor from this list?'
        }
      })
        .afterClosed()
        .subscribe(res => {
          if (res && res.success) this.updateServiceApi(services);
          if (res && !res.success) this.trigger.closeMenu();
        })
    }

  }

  updateServiceApi(services = []) {
    this.commonService.saveApi('updateVendorsQue', {
      jobs_id: this.params.jobs_id || this.route.parent.snapshot.params.id,
      vendors_id: this.params.data.id,
      services: services
    })
      .then(res => {
        if (res['result'].data.products_count == 0) {
          this.trigger.closeMenu();
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Products Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          this.params.api.updateRowData({ remove: [this.params.data] });
        } else {
          this.params.data.products = res['result'].data.products_count;
          this.params.data.services = res['result'].data.services_count;
          this.trigger.closeMenu();
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Products Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
        }
      });
  }

  checkAllServices(product: any, status: any): void {
    this.disableUpdate = false;
    product.services.map((service) => {
      service.selected = status;
    });
  }

  checkService(product: any, status: any): void {
    this.disableUpdate = false;
    if (status) {
      product.selected = status;
    } else {
      product.services.filter((service) => {
        return service.selected;
      }).length ? product.selected = true : product.selected = false;
    }
  }

  agInit(params: any): void {
    this.params = params;
  }

}

/**
 * Send Schedule Header Cell
 * Ag-Grid
 */
@Component({
  template: `<ng-container>
              <div class="ag-checkbox">
                <pi-form-field label=" ">
                  <input type="checkbox" pi-input (change)="headerCheck()" [(ngModel)]="params.column.colDef.headerComponentParams.selected" 
                  [disabled]="!params.column.colDef.headerComponentParams.edit"/>
                </pi-form-field>
                <span>Send Schedule</span>
              </div>
            </ng-container>`,
  styles: [`
    .ag-checkbox { display: flex;height: 100%;align-items: center; }
    .pi-form-field { margin-top: 0 }
    ::ng-deep .ag-checkbox .ak-field-checkbox+label::after { top: -4px; width: 15px; }
  `]
})
export class SendScheduleHeaderCell {
  params: any;
  agInit(params) {
    this.params = params;
  }
  headerCheck() {
    this.params.api.forEachNode((node: RowNode) => {
      if (node.data) {
        node.data.schedule = this.params.column.colDef.headerComponentParams.selected;
      }
    })
  }
}

/**
 * Send Schedule Row Cell
 * Ag-Grid
 */
@Component({
  template: `<ng-container>
              <div class="ag-checkbox">
                <pi-form-field label=" ">
                  <input type="checkbox" pi-input (change)="cellCheck()" [(ngModel)]="params.data.schedule" 
                  [disabled]="!params.column.colDef.headerComponentParams.edit"/>
                </pi-form-field>
                <i class="pixel-icons icon-schedule-templates" (click)="vendorDialog($event)"></i>
              </div>
            </ng-container>`,
  styles: [`
    .ag-checkbox { display: flex;height: 100%;align-items: center; }
    .pi-form-field { margin-top: 0 }
    i.icon-schedule-templates { font-size: 20px;width: 20px;height: 20px; }
  `]
})
export class SendScheduleRowCell {
  params: any;
  agInit(params) {
    this.params = params;
    this.params.data.schedule = true;
  }
  constructor(private _dialog: MatDialog, private route: ActivatedRoute) { }
  cellCheck() {
    this.isHeaderChecked();
  }
  isHeaderChecked() {
    let rowCount = 0, selectedCount = 0;
    (<GridApi>this.params.api).forEachNode(p => {
      if (p.data) {
        if (p.data.schedule) selectedCount++;
        rowCount++;
      }
    })
    if (rowCount == selectedCount && rowCount != 0) {
      this.params.column.colDef.headerComponentParams.selected = true;
    } else {
      this.params.column.colDef.headerComponentParams.selected = false;
    }
  }
  vendorDialog(e) {
    e.stopPropagation();
    const rows = [];
    let schedule: any = {};
    (<GridApi>this.params.api).forEachNode((o: RowNode) => {
      rows.push(o.data);
      schedule[o.data.id] = o.data.schedule;
    })
    this._dialog.open(VendorScheduleComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      data: {
        title: 'Vendor Schedule',
        vendorsList: rows,
        selectedVendor: this.params.data.id,
        sendSchedule: schedule,
        jobs_id: this.params.jobs_id || this.route.parent.snapshot.params.id
      }
    })
      .afterClosed()
      .subscribe(res => {
        (<GridApi>this.params.api).forEachNode((o: RowNode) => {
          o.data.schedule = schedule[o.data.id];
        });
        this.isHeaderChecked();
      })
  }
}