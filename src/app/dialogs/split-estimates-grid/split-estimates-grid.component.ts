import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IHeaderGroupAngularComp } from 'ag-grid-angular';
import { IHeaderGroupParams, GridApi, RowNode } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';

@Component({
  template: `
  <div class="split-cell-view bal-val text-right" *ngIf="params.data" [innerHtml]="params.data[params.column.colId]"></div>`,
  styles: [`
    .bal-val.split-cell-view{
      justify-content: space-between !important;
    }
  `]
})
export class BalanceViewComponent implements OnInit {

  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
    if(this.params.data){
      this.calculateBalance();
    }
  }

  calculateBalance(){
    let balance: any = '0.0000';
    let currentBalance: any = '0.0000'
    _.map(this.params.headers, (col, index) => {
      if(index>1){
        balance = parseFloat(balance) + (this.params.data[col.id]?parseFloat(this.params.data[col.id]):0);
      }
    });
    currentBalance = (<any>parseFloat(this.params.data[this.params.parent_org])).toFixed(4) - (<any>parseFloat(balance)).toFixed(4);
    currentBalance = currentBalance.toString();
    this.params.data['balance_value'] = currentBalance;
    if(currentBalance.indexOf('-')>-1){
      this.params.data[this.params.column.colId] = '<i class="pixel-icons icon-exclamation"></i><span matTooltip="$'+this.formatNumber(parseFloat(currentBalance.split('-')[1]).toFixed(4))+'" class="negative-balance">-$'+this.formatNumber(parseFloat(currentBalance.split('-')[1]).toFixed(4))+'</span>';
    }else{
      if(this.formatNumber(parseFloat(currentBalance).toFixed(4))=='0.0000'){
        this.params.data[this.params.column.colId] = '';
      }else{
        this.params.data[this.params.column.colId] = '<i class="pixel-icons icon-exclamation"></i><span class="positive-balance">$'+this.formatNumber(parseFloat(currentBalance).toFixed(4))+'</span>';
      }
    }
  }

  formatNumber(number) {
    if(number){
      let x = number.split('.');
      let x1 = x[0];
      x1 = isNaN(x1) ? "0" : Number(x1);
      x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
      var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
      return x1 + x2;
    }
    return '0.0000';
  }

}

@Component({
  template: `<div class="split-cell-view" *ngIf="params.data">
    <div class="split-value">{{'$'+formatNumber(params.data[params.column.colId])}}</div>
    <div class="split-percentage">{{formatNumber(params.data[params.column.colId+"_percent"])}}%</div>
  </div>
  <div class="split-cell-view text-right" *ngIf="!params.data">{{'$'+formatNumber(params.value)}}</div>`,
  styles: [`
  .split-cell-view{
    display: flex;
    justify-content: space-between;
  }
  .split-cell-view.text-right{
    justify-content: flex-end;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: inline-block !important;
    width: calc(100% - 50%);
  }
  .split-cell-view .split-value{
    height: 33px;
    flex: 1;
    justify-content: flex-end;
    border-right: 1px solid #e8e9ee;
    padding: 0px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }
  .split-cell-view .split-percentage{
    height: 33px;
    width: 100px;
    justify-content: flex-end;
    padding: 0px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    flex: 1;
  }
  .split-cell-edit input{
    border-color: transparent !important;
  }

  `]
})
export class SplitCellViewComponent implements OnInit {
  
  public params: any;

  constructor() { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  formatNumber(number) {
    if(number){
      let x = number.split('.');
      let x1 = x[0];
      x1 = isNaN(x1) ? "0" : Number(x1);
      x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
      var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
      return x1 + x2;
    }
    return '0.0000';
  }

}

@Component({
  template: `<div class="split-cell-edit" *ngIf="params.data">
  <div class="split-value"><input #input1 [appPriceFormat]="currencyConfig" pi-input [(ngModel)]="params.data[params.column.colId]"></div>
  <div class="split-percentage"><input #input2 [appPriceFormat]="percentConfig" pi-input [(ngModel)]="params.data[params.column.colId+'_percent']"></div>
</div>`,
  styles: [`
    .split-cell-edit{
      display: flex;
      justify-content: space-between;
    }
    .split-cell-edit .split-value{
      height: 33px;
      flex: 1;
      width: 50%;
      display: flex;
      justify-content: flex-end;
      border-right: 1px solid #e8e9ee;
    }
    .split-cell-edit .split-percentage{
      height: 33px;
      width: 50%;
      display: flex;
      justify-content: flex-end;
    }
    .split-cell-edit input{
      padding: 0px 8px;
      text-align: right;
    }
    .split-cell-edit input{
      border-color: transparent !important;
    }
  `]
})
export class SplitCellEditComponent implements OnInit {
  @ViewChild('input1', { read: ViewContainerRef }) public input1;
  @ViewChild('input2', { read: ViewContainerRef }) public input2;
  public params: any;
  public currencyConfig: any = {
    prefix: '$',
    limit: 5000,
    centsLimit: 4
  };

  public percentConfig: any = {
    prefix: '',
    limit: 5000,
    centsLimit: 4
  };

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
		setTimeout(() => {
      if(this.params.data && this.params.data.target && this.params.data.target=='split-value'){
        this.input1.element.nativeElement.focus();
      }else if(this.params.data && this.params.data.target && this.params.data.target=='split-percentage'){
        this.input2.element.nativeElement.focus();
      }
		});
	}

  agInit(params: any): void {
    this.params = params;
  }

  calculateBalance(){
    let balance: any = '0.0000';
    let currentBalance: any = '0.0000'
    _.map(this.params.headers, (col, index) => {
      if(index>1){
        balance = parseFloat(balance) + (this.params.data[col.id]?parseFloat(this.params.data[col.id]):0);
      }
    });
    currentBalance = (<any>parseFloat(this.params.data[this.params.parent_org])).toFixed(4) - (<any>parseFloat(balance)).toFixed(4);
    currentBalance = currentBalance.toString();
    if(currentBalance.indexOf('-')>-1){
      this.params.data['balance'] = '<i class="pixel-icons icon-exclamation"></i><span matTooltip="$'+this.formatNumber(parseFloat(currentBalance.split('-')[1]).toFixed(4))+'" class="negative-balance">-$'+this.formatNumber(parseFloat(currentBalance.split('-')[1]).toFixed(4))+'</span>';
    }else{
      if(this.formatNumber(parseFloat(currentBalance).toFixed(4))=='0.0000'){
        this.params.data['balance'] = '';
      }else{
        this.params.data['balance'] = '<i class="pixel-icons icon-exclamation"></i><span class="positive-balance">$'+this.formatNumber(parseFloat(currentBalance).toFixed(4))+'</span>';
      }
    }
    /*if(currentBalance.indexOf('-')>-1){
      this.params.data['balance'] = '<span class="negative-balance">-$'+this.formatNumber(parseFloat(currentBalance.split('-')[1]).toFixed(4))+'</span>';
    }else{
      if(this.formatNumber(parseFloat(currentBalance).toFixed(4))=='0.0000'){
        this.params.data['balance'] = '';
      }else{
        this.params.data['balance'] = '<span class="positive-balance">$'+this.formatNumber(parseFloat(currentBalance).toFixed(4))+'</span>';
      }
    }*/
  }

  formatNumber(number) {
    if(number){
      let x = number.split('.');
      let x1 = x[0];
      x1 = isNaN(x1) ? "0" : Number(x1);
      x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
      var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
      return x1 + x2;
    }
    return '0.0000';
  }

  changeEstimateValue(){
// is_new
    this.commonService.saveApi('editSplitEst', {
      jobs_products_id: this.params.data['id'],
      org_id: this.params['org_id'],
      estimates_id: this.params['estimate_id'],
      amount: this.params.data[this.params.column.colId],
      percentage: this.params.data[this.params.column.colId+"_percent"]
    });
  }

  getValue(): string {
    if(this.params.data[this.params.column.colId]!=this.params.value){
      this.params.data[this.params.column.colId+"_percent"] = ((this.params.data[this.params.column.colId]*100)/this.params.data[this.params.parent_org]).toFixed(4) || '0.0000';
    }else{
      this.params.data[this.params.column.colId] = ((this.params.data[this.params.parent_org]*(this.params.data[this.params.column.colId+"_percent"]))/100).toFixed(4);
    }
    this.changeEstimateValue();
    this.calculateBalance();
    return this.params.data[this.params.column.colId] ? this.params.data[this.params.column.colId] : '0.0000';
  }

}

@Component({
  template: `<div class="split-cell org">
    <div class="add-org" (click)="orgDetails()" #addOrgPop="matMenuTrigger" [matMenuTriggerFor]="addOrgMenu">
    <div class="ag-cell-custome-actions">
    <ul>
        <li class="m-0"> <i class="pixel-icons icon-plus"></i></li>
    </ul> 
    </div>  
    </div>
    <div class="label">Add Organization</div>
  </div>
  <mat-menu #addOrgMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before" class="onplace-dialog add-org-dialog editor-grid">
      <div class="my-dialog" (click)="$event.stopPropagation()">
        <div class="d-heading">
          <h2>Add Organization</h2>
          <button mat-icon-button (click)="addOrgPop.closeMenu();">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="d-content">
        
        <div class="spinner-view" *ngIf="loader">
          <div class="empty-screen">
            <mat-spinner diameter="34" class="md parent-spinner"></mat-spinner>
          </div>                
        </div>
        <div class="specs-list-container" *ngIf="!loader">
          <pi-select label="Organization" placeholder="Select Organization" class="required" [options]="params.orgs" [(ngModel)]="params.org_id" class="first-select"></pi-select>
          <div class="msgs">
						<div class="pi-error" *ngIf="params.org_id=='' && submitted">
							Please Select Organization
						</div>
					</div>
          <pi-select label="Estimate Cost" placeholder="Select Estimate Cost" (onChange)="changeCostType($event)" class="required" [options]="params.estimate_costs" [(ngModel)]="params.estimate_cost_id" class="first-select"></pi-select>
          <pi-form-field label="Subsidiary Split">
            <input type="text" pi-input [(ngModel)]="params.secondary_split" />
          </pi-form-field>
          <pi-form-field label=" " *ngIf="showPercentage">
            <input type="text" [appPriceFormat]="percentConfig" pi-input [(ngModel)]="params.percentage" />
            <span>% of parent estimate</span>
          </pi-form-field>
        </div>
        </div>
        <div class="d-footer">
        <div class="pi-error" *ngIf="state.duplicateRows!=0">Please enter unique secondary split for organization.</div>
            <button pi-button color="subtle" class="m-l-15" (click)="addOrgPop.closeMenu();">Cancel</button>
            <button pi-button color="primary" class="m-l-15" (click)="addOrganization(addOrgPop);">Apply</button>
          </div>
      </div>
    </mat-menu>`,
  styles: [`
    .add-org-dialog{
      max-width: 380px !important;
      min-width: 380px !important;
    }
    .split-cell.org{
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      left: -6px;
    }
    .split-cell.org .add-org{
      margin-right: 10px;
      cursor: pointer;
    }
    .split-cell.org .add-org .pixel-icons{
      font-size: 14px;
      width: 14px;
      height: 14px;
      cursor: pointer;
      color: rgba(0,0,0,0.54);
    }
  `]
})
export class AddOrganizationsComponent implements OnInit, IHeaderGroupAngularComp {

  public params: IHeaderGroupParams;
  public showPercentage = true;
  public loader = true;
  public percentConfig: any = {
    prefix: '',
    limit: 5,
    centsLimit: 4
  };
  public submitted = false;

  public state = {
    duplicateRows: 0
  }

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: IHeaderGroupParams): void {
    this.params = params;
  }

  changeCostType(event){
    switch(event){
      case 1:
        this.showPercentage = true;
        break;
      case 2:
        this.showPercentage = false;
        break;
    }
  }

  orgDetails(){
    this.loader = true;
    this.params['estimate_cost_id'] = 1;
    this.params['secondary_split'] = '';
    this.params['percentage'] = '';
    this.params['org_id'] = '';
    this.state.duplicateRows = 0;
    this.submitted = false;
    this.showPercentage = true;
    setTimeout(()=>{
      this.loader = false;
    },100);
  }

  addOrganization(addOrgPop: any){
    this.submitted = true;
    if(this.params['org_id']!=''){
      let headers = [];
      _.map(this.params['headers'], () => {

      });
      let rowData = [];
      this.params.api.forEachNode((node: RowNode) => {
        if (node.data)
          rowData.push(node.data)
      });
      var duplicateRows = _.filter(this.params['headers'],{ org_id: this.params['org_id'], secondary_split: this.params['secondary_split'] });
      this.state.duplicateRows = duplicateRows.length;
      if(!duplicateRows.length){
        this.commonService.saveApi('addOrgSplitEst', {
          org_cost_percentage: this.params['percentage'],
          org_id: this.params['org_id'],
          estimates_id: this.params['estimate_id'],
          secondary_name: this.params['secondary_split'],
          split_name: this.params['split_count'],
          jobs_id: this.params['job_id'],
          cost_from: this.params['estimate_cost_id']
        })
        .then(res => {
          addOrgPop.closeMenu();
          if (res['result'] && res['result'].success) {
            this.commonService.update({ type: 'split-estimate', action: 'add' });
          }
        });
      }
    }
  }

}

@Component({
  template: `<div class="split-cell org">
    <div class="label">{{params.displayName}}</div>
    <div class="add-org" title="Remove Organization" #removeOrgPop="matMenuTrigger" [matMenuTriggerFor]="removeOrgMenu">
    <div class="ag-cell-custome-actions">
    <ul style="padding:0px;">
        <li class="m-0"> <i class="pixel-icons icon-delete"></i></li>
    </ul> 
    </div>  
    </div>
  </div>
  <mat-menu #removeOrgMenu="matMenu" class="card-ui row-card colored bg-delete">
        <div class="card row-card" (click)="$event.stopPropagation()">
        <div class="card-header"><i class="pixel-icons icon-exclamation"></i></div>
        <div class="card-body">
          <h5 class="card-title">Delete Organization</h5>
          <p class="card-text">Are you sure you want to delete <strong [innerHtml]="params.displayName"></strong>?</p>
          <div class="footer">
          <a class="card-link text-btn" (click)="removeOrgPop.closeMenu()">Cancel</a>
          <a class="card-link act-btn" (click)="removeOrg();removeOrgPop.closeMenu();">Delete</a></div>
        </div>
        </div>
    </mat-menu>`,
  styles: [`
    .split-cell.org{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .split-cell.org .add-org{
      margin-right: 0px;
      cursor: pointer;
      position: relative;
      left: 6px;
    }
    .split-cell.org .add-org .pixel-icons{
      font-size: 14px;
      width: 14px;
      height: 14px;
      cursor: pointer;
      color: rgba(0,0,0,0.54);
    }
  `]
})
export class RemoveOrganizationComponent implements OnInit, IHeaderGroupAngularComp {

  public params: IHeaderGroupParams;
  public loader = true;

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: IHeaderGroupParams): void {
    this.params = params;
  }

  removeOrg(){
    this.commonService.deleteApi('rmColSplitEst', {
      org_id: this.params['org_id'],
      estimates_id: this.params['estimate_id'],
      jobs_id: this.params['job_id']
    })
    .then(res => {
      if (res['result'] && res['result'].success) {
        this.commonService.update({ type: 'split-estimate', action: 'remove' });
      }
    });
  }

}

@Component({
  template: `<div class="split-cell" [class.org-settings]="params.data">
    <div class="split-settings" #splitSettingsPop="matMenuTrigger" [matMenuTriggerFor]="splitSettingsMenu" *ngIf="params.data && params.data.is_distro">
    <div class="ag-cell-custome-actions">
    <ul>
        <li class="m-0" style="background: rgb(228, 231, 241);"> <i class="pixel-icons icon-more-horizontal"></i></li>
    </ul> 
    </div>
    <mat-menu #splitSettingsMenu="matMenu" class="estimate-bundle row-card colored bg-primary">
    <div (click)="$event.stopPropagation()">
    <button mat-menu-item (click)="splitOrgCost(1);splitSettingsPop.closeMenu();">Split evenly across all Organizations</button> 
    <button mat-menu-item (click)="splitOrgCost(2);splitSettingsPop.closeMenu();">Remove costs from all Organizations</button> 
    <button mat-menu-item (click)="splitOrgCost(3);splitSettingsPop.closeMenu();">Recalculate from Distribution List</button> 
    </div>
    <!--  <div class="card row-card" (click)="$event.stopPropagation()">
      <div class="card-body">
        <ul>
          <li *ngFor="let item of settings" (click)="splitOrgCost(item);splitSettingsPop.closeMenu();">{{item.label}}</li>
          <li (click)="splitOrgCost(1);splitSettingsPop.closeMenu();">Split evenly across all Organizations</li>
          <li (click)="splitOrgCost(2);splitSettingsPop.closeMenu();">Remove costs from all Organizations</li>
          <li (click)="splitOrgCost(3);splitSettingsPop.closeMenu();">Recalculate from Distribution List</li>
        </ul>
      </div>
      </div>-->
    </mat-menu>
    </div>
    <div class="split-cell-view org-value text-right">{{(params.data)?'$'+formatNumber(params.data[params.column.colId]):'$'+formatNumber(params.value)}}</div>
    
  </div>`,
  styles: [`
  .card-ui{
    min-width: 310px !important;
  }
    ul{
      padding: 0;
      margin: 0;
      list-style: none;
      font-size: 14px;
    }
    ul li{
      font-size: 14px;
      padding: 5px 10px;
      cursor: pointer;
    }
    .split-cell-view.org-value{
      flex: 1;
    }
    li:hover{
      background: #4e80d6;
    }
    .org-settings{
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }
    .split-settings{
      display: flex;
      align-items: center;
    }
    .icon-pn-settings{
      font-size: 18px;
      width:18px;
      height:18px;
      line-height:18px;
      cursor: pointer;
    }
  `]
})
export class OrganizationComponent implements OnInit {

  public params: any;

  public settings: [
    {id: 1, label: 'Split evenly across all Organizations'},
    {id: 2, label: 'Remove costs from all Organizations'},
    {id: 3, label: 'Recalculate from Distribution List'}
  ];

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: IHeaderGroupParams): void {
    this.params = params;
  }

  splitOrgCost(settings: any){
    switch(settings){
      case 1: 
        let totalAmount = this.params.data[this.params.parent_org];
        let splitCount = this.params.split_count;
        let splitAmount = (totalAmount/splitCount);
        let splitRow = {};
        _.map(this.params.headers, (value, key)=>{
          if(key>1){
            splitRow[value.id] = splitAmount.toFixed(4).toString();
            splitRow[value.id+"_percent"] = ((splitAmount*100)/this.params.data[this.params.parent_org]).toFixed(4);
          }
        });
        if(this.params.data && this.params.data['is_distro']){
          splitRow['is_distro'] = this.params.data['is_distro']; 
        }
        splitRow[this.params.parent_org] = this.params.data[this.params.parent_org]; 
        splitRow['0'] = this.params.data['0']; 
        splitRow['id'] = this.params.data['id']; 
        splitRow['balance'] = ''; 
        this.params.api.updateRowData({update: [splitRow]});
        break;
      case 2:
        let emptyRow = {};
        _.map(this.params.data,(value,key)=>{
          if(this.params.parent_org==key || key=='0' || key=='id' || key=='balance'){
            emptyRow[key] = value;
          }else{
            emptyRow[key] = '0.0000';
          }
        });
        emptyRow['balance'] = this.params.data[this.params.parent_org]?this.params.data[this.params.parent_org]:''; 
        this.params.api.updateRowData({update: [emptyRow]});
        break;
      case 3:
        // this.params.api.updateRowData({update: [this.params.data]});
        this.commonService.getApi('generateSplitEst', {
          id: this.params['estimate_id'],
          type: 2
        })
        .then(res => {
          if (res['result'] && res['result'].success) {
            this.commonService.update({ type: 'split-estimate', action: 'reload' });
          }
        });
        break;
    }
    if(settings!=3){
      this.commonService.saveApi('splitOrgSettings', {
        jobs_products_id: this.params.data.id,
        org_id: this.params['org_id'],
        estimates_id: this.params['estimate_id'],
        jobs_id: this.params['job_id'],
        total_cost: this.params.data[this.params.column.colId],
        org_count: this.params['split_count'],
        type: settings
      });
    }
  }

  formatNumber(number) {
    if(number){
      let x = number.split('.');
      let x1 = x[0];
      x1 = isNaN(x1) ? "0" : Number(x1);
      x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
      var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
      return x1 + x2;
    }
    return '0.0000';
  }

}