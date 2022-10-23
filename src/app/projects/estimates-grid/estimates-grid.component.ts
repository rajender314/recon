import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatMenuTrigger, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';
import { BundleServiceComponent } from '@app/projects/bundle-service/bundle-service.component';
import { DeleteComponent } from '@app/shared/components/delete/delete.component';
import { AddCreditComponent } from '@app/projects/add-credit/add-credit.component';
import { RowNode, GridApi } from 'ag-grid-community';
import { CopyLineItemComponent } from '@app/projects/copy-line-item/copy-line-item.component';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
var APP = window['APP'];
@Component({
  template: `
    <pi-form-field label="Estimates">
        <input type="checkbox" pi-input (change)="headerCheck()" [(ngModel)]="params.column.colDef.selected"
        />
    </pi-form-field>`,
  styles: [`
    .pi-form-field.checkbox{
        margin-top:0;
    }
  `]
})
export class EstimateHeaderCheck implements OnInit {

  public params: any;

  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  headerCheck(): void {
    this.commonService.update({ allEstimatesChk: this.params.column.colDef.selected });
  }

}

@Component({
  template: ` 
  <div class="user-media">
    <div class="figure">
    <pi-icon name="icon-pn-estimates" size="lg" background="#72be5d" color="#fff"></pi-icon> 
    </div>
    <div class="user-media-body line-height-2 long-and-truncated">
      <div class="estimate-no-status">
        <p class="user-name color-dark medium-font" (click)="getEstimateDetails($event)">
          <a (click)="goTo(params.data.id)">{{params.data.estimate_no}}</a>
        </p>
      </div>
      <small matTooltip="{{params.data.description}}">{{params.data.description}}</small>
    </div>    
  </div>
  `,
  styles: [`
    .pi-form-field.checkbox{
        margin-top:4px;
    }
    .estimate-no-status{
      display: flex;
      align-items: center;
    }
    .status{
      height: 18px;
      display: flex;
      align-items: center;
    }
  `]
})
export class EstimateCheck implements OnInit {
  // <div class="user-product-service"><span class="d-flex align-items-center"><i class="pixel-icons icon-products"></i><span>{{params.data.product_cnt}}</span></span> <span class="d-flex align-items-center m-l-15"><i class="pixel-icons icon-orders"></i><span>{{params.data.services_cnt}}</span></span></div>
  public params: any;
  public checkbox = false;

  constructor(
    private commonService: CommonService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) { }

  ngOnInit() {
  }

  goTo(id) {
    this.router.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + id]);
  }

  agInit(params: any): void {
    this.params = params;
  }

  getEstimateDetails(event): void {
    event.stopPropagation();
    this.router.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + this.params.data.id])
  }

  serviceCheck(): void {
    this.commonService.update({ estimateChk: this.params.data.selected });
  }

}

@Component({
  template: `
  <div *ngIf="params.data?.type=='product'" [class]="params.data.type">
  <div class="estimate-actions-menu {{(params.data.is_bundle)?'unbundle':'bundle'}}" style="position: relative;" >
  <i *ngIf="!params.data.is_cancel" class="pixel-icons icon-products"></i> 
  <i *ngIf="params.data.is_cancel" class="pixel-icons pixel-icons icon-cancelled-products cancel-product-icon" matTooltip="Product Cancelled"></i> <span matTooltip="{{params.data.product_name}}">{{params.data.product_name}}</span>
  </div>
 <div class="d-flex align-items-center" *ngIf="APP.permissions.job_access.bundle_costs=='yes'">
 <div class="ag-cell-custome-actions" *ngIf="params.estimates_status_id!=5 && params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0' && params.estimate.id==params.estimate.selected_revision">
 <ul>
 <li class="m-0" style="background: transparent;" #bundleMenuPop="matMenuTrigger" [matMenuTriggerFor]="bundleMenu"  matTooltip="{{(params.data.is_bundle)?'Unbundle All Services':'Bundle All Services'}}"><i class="pixel-icons icon-more-horizontal"></i></li>
 <mat-menu #bundleMenu="matMenu" class="card-ui row-card colored bg-primary">
 <div class="card row-card" (click)="$event.stopPropagation()">
 <div class="card-header {{(params.data.is_bundle) ? 'unbundle' : 'bundle'}}"><i class="pixel-icons icon-products "></i></div>
 <div class="card-body">
   <h5 class="card-title">{{(params.data.is_bundle) ? 'Unbundle Services' : 'Bundle Services'}}</h5>
   <p class="card-text">Are you sure, you want to {{((params.data.is_bundle) ? 'Unbundle' : 'Bundle')}} all services under <span class="medium-font">{{params.data.product_name}}</span>?
   </p>
   <div class="footer">
   <a class="card-link text-btn" (click)="bundleMenuPop.closeMenu()">Cancel</a>
   <a class="card-link act-btn" (click)="bundleServices('product');bundleMenuPop.closeMenu()">{{((params.data.is_bundle) ? 'Unbundle Services' : 'Bundle Services')}}</a></div>
 </div>
</div>
</mat-menu>
 </ul>
 </div>
  </div>
  </div>

  
  <div *ngIf="params.data?.type=='service'" [ngClass]="{'service ': params.data.type, 'bundle_with_parent': params.node.parent.data.is_bundle, 'bundle_with_service': (params.data.is_bundle && !params.node.parent.data.is_bundle && !params.data.bundle?.jsr_ids_from?.length)}">
  <div class="start-menu" >
  <div class="ag-cell-custome-actions">
  <ul *ngIf="allowEditable && ((APP.permissions.job_access.edit_cancelled_jobs=='yes' && state.projectStatusID=='5') || state.projectStatusID!='5')">
  <li style="background: rgb(228, 231, 241);" class="m-0" [matMenuTriggerFor]="menu" (click)="bundleList()" *ngIf="params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0'"><i class="pixel-icons icon-more-horizontal"></i></li></ul></div></div>
  <mat-menu #menu="matMenu" class="more-grid-actions estimate-bundle"> 
  <ng-container *ngIf="params.estimates_status_id!=5 && params.estimate.id==params.estimate.selected_revision">  
  <div class="bundle-with" *ngIf="!params.node.parent.data.is_bundle && APP.permissions.job_access.bundle_costs=='yes'">
      <ng-container *ngIf="params.data.is_bundle && unbundleServicesList.length">
        <div class="bundle-item unbundle-ser"><i class="pixel-icons icon-products"></i> <span>Unbundle With</span></div>
        <button mat-menu-item class="bundle-list" (click)="bundleServices('service', bundle)" *ngFor="let bundle of unbundleServicesList"><i class="pixel-icons icon-orders"></i>{{bundle.job_service_name}}</button>
      </ng-container>
      <ng-container *ngIf="bundleServicesList.length && !params.data.is_bundle">
        <div class="bundle-item"><i class="pixel-icons icon-products"></i> <span>Bundle With</span></div>
        <button mat-menu-item class="bundle-list" (click)="bundleServices('service', bundle)" *ngFor="let bundle of bundleServicesList"><i class="pixel-icons icon-orders"></i>{{bundle.job_service_name}}</button>
      </ng-container>
    </div>
    <button mat-menu-item (click)="edit('task', $event)"><i class="pixel-icons icon-task-completed"></i><span>Add Task</span></button>
    <button mat-menu-item (click)="edit('misc', $event)"><i class="pixel-icons icon-expenses"></i><span>Misc Expenses</span></button>
    <button mat-menu-item (click)="edit('cost', $event)"><i class="pixel-icons icon-vendor-shape"></i><span>Other Vendor Cost</span></button>
    <button mat-menu-item *ngIf="APP.permissions.job_access.credit_costs=='yes'" (click)="edit('addCredit', $event)"><i class="pixel-icons icon-credit-cost"></i><span>Add Credit</span></button>
    <button mat-menu-item *ngIf="APP.permissions.job_access.clear_costs=='yes'" (click)="edit('clearCredit', $event)"><i class="pixel-icons icon-internal-cost-recovery"></i><span>Clear Costs</span></button>
  </ng-container>
    <button mat-menu-item (click)="cloneLineItem()"><i class="pixel-icons icon-clone"></i><span>Copy Line Item</span></button>
  </mat-menu>

  <div class=" w-100" >
  <div class="service-name-ui" style="    float: left; width: calc(100% - 30px);">
  <i   class="pixel-icons icon-orders" *ngIf="params.data.service_status!='10'"></i>  <i class="pixel-icons icon-cancelled-services" *ngIf="params.data.service_status=='10'" matTooltip="Service Cancelled"></i>
  <span class="order-value"  matTooltip="{{params.data.job_service_name}}">{{params.data.job_service_name}}
  <ng-container *ngIf="params.data.service_status && (params.data.service_status=='10' || params.data.service_status=='11')">
  </ng-container>
  </span>
  <span class="costs-revised" *ngIf="params.data.is_revision" matTooltip="Costs has been revised" ><i class="pixel-icons icon-exclamation" ></i></span>
  
  </div><span class="order-revision" style="text-align: center;width: 24px; float: right;">R{{params.data.jsr_rev_no}}</span></div>
  </div>
  
  <div *ngIf="params.data?.type=='vendor'" [ngClass]="{'vendor': params.data.type}"><i class="pixel-icons icon-vendor-shape"></i>
    <pi-select label=""
     [disabled]="!allowEditable || APP.permissions.job_access.edit_cancelled_jobs!='yes' || state.projectStatusID=='5' || params.estimates_status_id==5 || params.estimates_status_id==4 || params.estimates_status_id==3 || params.estimate.parent_id!='0' || params.estimate.id!=params.estimate.selected_revision"
      [options]="params.data.options" idKey="primary_id" nameKey="display_name" (onChange)="vendorOptionChange($event)" [(ngModel)]="params.data.primary_id"></pi-select>
  </div>
  <div *ngIf="params.data?.type=='task'" [ngClass]="{'task': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit">   
      <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-task-completed"></i> 
        </div>
      <div class="read-select">
      <div class="task-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      <div class="designation-name" *ngIf="params.data.designation_name">{{params.data.designation_name}}</div>
      <div class="user-name" *ngIf="params.data.user_name">{{params.data.user_name}}</div>
      </div>
      </div>
      <div class="d-flex" *ngIf="params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0'">
      <div class="ag-cell-custome-actions">
      <ul>
      <li class="m-0" (click)="cloneLineItem()"><i class="pixel-icons icon-clone"></i></li>
      <ng-container *ngIf="params.estimates_status_id!=5 && params.estimate.id==params.estimate.selected_revision">
      <li class="m-0" (click)="editRow()"><i class="pixel-icons icon-pencil"></i></li>
      <li class="m-0" #removeLineItemPop="matMenuTrigger" [matMenuTriggerFor]="removeLineItem"><i class="pixel-icons icon-delete"></i></li>
        <mat-menu #removeLineItem="matMenu" class="card-ui row-card colored bg-delete">

        <div class="card row-card" (click)="$event.stopPropagation()">
        <div class="card-header"><i class="pixel-icons icon-exclamation"></i></div>
        <div class="card-body">
          <h5 class="card-title">Delete Line Item</h5>
          <p class="card-text">Are you sure you want to delete line item?</p>
          <div class="footer">
          <a class="card-link text-btn" (click)="removeLineItemPop.closeMenu()">Cancel</a>
          <a class="card-link act-btn" (click)="removeRow();removeLineItemPop.closeMenu();">Delete</a></div>
        </div>
        </div>
        </mat-menu>
        </ng-container>
      </ul>
      </div>
     
      </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
    <div class="edit-view-icon">  
    <i class="pixel-icons icon-task-completed"></i>
    </div>
    <div class="edit-mode-line-items">
    <div class="edit-select">
    <pi-select label="" placeholder="Select Task" class="required" [options]="params.colDef.cellRendererParams.tasks" idKey="id" nameKey="name" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      <pi-select label="" placeholder="Select Designation" class="required" [options]="params.colDef.cellRendererParams.designations" (onChange)="designationOptionChange()" idKey="id" nameKey="name" [(ngModel)]="params.data.designation_id"></pi-select>
      <pi-select label="" placeholder="Select User" [options]="(params.data.designation_id!=''?(params.colDef.cellRendererParams.users[params.data.designation_id] || []):[])" (onChange)="userOptionChange()" idKey="users_id" nameKey="user_name" [(ngModel)]="params.data.users_id"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
    </div>
    </div>
      </div>
  </div>
  <div *ngIf="params.data?.type=='misc'" [ngClass]="{'misc': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit">
      
      <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-expenses"></i>
        </div>
      <div class="read-select">
      <div class="misc-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      <div class="designation-name" *ngIf="params.data.designation_name">{{params.data.designation_name}}</div>
      <div class="user-name" *ngIf="params.data.user_name">{{params.data.user_name}}</div>
      <div class="vendor-name" *ngIf="params.data.vendor_name">{{params.data.vendor_name}}</div>
      </div>
      </div>
      <div class="d-flex" *ngIf="params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0'">
      <div class="ag-cell-custome-actions">
      <ul>
      <li class="m-0" (click)="cloneLineItem()"><i class="pixel-icons icon-clone"></i></li>
      <ng-container *ngIf="params.estimates_status_id!=5 && params.estimate.id==params.estimate.selected_revision">
      <li class="m-0" (click)="editRow()"><i class="pixel-icons icon-pencil"></i></li>
      <li class="m-0" #removeLineItemPop="matMenuTrigger" [matMenuTriggerFor]="removeLineItem"><i class="pixel-icons icon-delete"></i></li>
        <mat-menu #removeLineItem="matMenu" class="card-ui row-card colored bg-delete">

        <div class="card row-card" (click)="$event.stopPropagation()">
        <div class="card-header"><i class="pixel-icons icon-exclamation"></i></div>
        <div class="card-body">
          <h5 class="card-title">Delete Line Item</h5>
          <p class="card-text">Are you sure you want to delete line item?</p>
          <div class="footer">
          <a class="card-link text-btn" (click)="removeLineItemPop.closeMenu()">Cancel</a>
          <a class="card-link act-btn" (click)="removeRow();removeLineItemPop.closeMenu();">Delete</a></div>
        </div>
        </div>
        </mat-menu>
        </ng-container>
      </ul>
      </div>
      </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
      <div class="edit-view-icon">  
        <i class="pixel-icons icon-expenses"></i>
      </div>
      <div class="edit-mode-line-items">
      <div class="edit-select">
      <pi-select label="" placeholder="Select Misc" class="required" [options]="params.colDef.cellRendererParams.miscExpense" (onChange)="miscOptionChange()" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      <pi-select label="" placeholder="Select Designation" [options]="params.colDef.cellRendererParams.designations"  idKey="id" nameKey="name" [(ngModel)]="params.data.designation_id"></pi-select>
      <pi-select label="" placeholder="Select User" [options]="(params.data.designation_id!=''?(params.colDef.cellRendererParams.users[params.data.designation_id] || []):[])"  idKey="users_id" nameKey="user_name" [(ngModel)]="params.data.users_id"></pi-select>
      <pi-select label="" placeholder="Select Vendor" [minSearchLength]='3' [options]="params.colDef.cellRendererParams.vendors" idKey="id" nameKey="name" [(ngModel)]="params.data.vendors_id"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
    </div>
    </div>
      </div>
  </div>


  <div *ngIf="params.data?.type=='internalcost'" class="internal-cost" [ngClass]="{'misc': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit">
      
      <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-credit-cost"></i>
        </div>
      <div class="read-select">
      <div class="misc-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      </div>
      </div>
      <div class="d-flex" *ngIf="params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0'">
      <div class="ag-cell-custome-actions">
      <ul>
      <li class="m-0" (click)="cloneLineItem()"><i class="pixel-icons icon-clone"></i></li>
      <ng-container *ngIf="params.estimates_status_id!=5 && params.estimate.id==params.estimate.selected_revision">
      <li class="m-0" (click)="editRow()"><i class="pixel-icons icon-pencil"></i></li>
      <li class="m-0" #removeLineItemPop="matMenuTrigger" [matMenuTriggerFor]="removeLineItem"><i class="pixel-icons icon-delete"></i></li>
        <mat-menu #removeLineItem="matMenu" class="card-ui row-card colored bg-delete">

        <div class="card row-card" (click)="$event.stopPropagation()">
        <div class="card-header"><i class="pixel-icons icon-exclamation"></i></div>
        <div class="card-body">
          <h5 class="card-title">Delete Line Item</h5>
          <p class="card-text">Are you sure you want to delete line item?</p>
          <div class="footer">
          <a class="card-link text-btn" (click)="removeLineItemPop.closeMenu()">Cancel</a>
          <a class="card-link act-btn" (click)="removeRow();removeLineItemPop.closeMenu();">Delete</a></div>
        </div>
        </div>
        </mat-menu>
        </ng-container>
      </ul>
      </div>
      </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
      <div class="edit-view-icon">  
        <i class="pixel-icons icon-credit-cost"></i>
      </div>
      <div class="edit-mode-line-items">
      <div class="edit-select">
      <pi-select label="" placeholder="Select Misc" class="required" [options]="params.colDef.cellRendererParams.miscExpense" (onChange)="miscOptionChange()" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
    </div>
    </div>
      </div>
  </div>


  <div *ngIf="params.data?.type=='cost'" [ngClass]="{'cost': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit">
      
      <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-vendor-shape"></i>
        </div>
        <div class="read-select">
      <div class="task-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      <div class="vendor-name" *ngIf="params.data.vendor_name">{{params.data.vendor_name}}</div>
      </div>
      </div>
      <div class="d-flex" *ngIf="params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0'">
      <div class="ag-cell-custome-actions">
      <ul>
      <li class="m-0" (click)="cloneLineItem()"><i class="pixel-icons icon-clone"></i></li>
      <ng-container *ngIf="params.estimates_status_id!=5 && params.estimate.id==params.estimate.selected_revision">
      <li class="m-0" (click)="editRow()"><i class="pixel-icons icon-pencil"></i></li>
      <li class="m-0" #removeLineItemPop="matMenuTrigger" [matMenuTriggerFor]="removeLineItem"><i class="pixel-icons icon-delete"></i></li>
        <mat-menu #removeLineItem="matMenu" class="card-ui row-card colored bg-delete">

        <div class="card row-card" (click)="$event.stopPropagation()">
        <div class="card-header"><i class="pixel-icons icon-exclamation"></i></div>
        <div class="card-body">
          <h5 class="card-title">Delete Line Item</h5>
          <p class="card-text">Are you sure you want to delete line item?</p>
          <div class="footer">
          <a class="card-link text-btn" (click)="removeLineItemPop.closeMenu()">Cancel</a>
          <a class="card-link act-btn" (click)="removeRow();removeLineItemPop.closeMenu();">Delete</a></div>
        </div>
        </div>
        </mat-menu>
        </ng-container>
      </ul>
      </div>  
      </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
    <div class="edit-view-icon">  
        <i class="pixel-icons icon-vendor-shape"></i>
      </div>
      <div class="edit-mode-line-items">
      <div class="edit-select">
      <pi-select label="" placeholder="Select Task" [options]="params.colDef.cellRendererParams.tasks" idKey="id" nameKey="name" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      <pi-select label="" placeholder="Select Vendor" [minSearchLength]='3' class="required" [options]="params.colDef.cellRendererParams.vendors" (onChange)="vendorCostOptionChange()" idKey="id" nameKey="name" [(ngModel)]="params.data.vendors_id"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
    </div>
    </div>
      </div>
  </div>
  <div *ngIf="params.data?.type=='addCredit'" [ngClass]="{'addCredit': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit"  style="position: relative;  top: 1px;">     
        <div class="read-view-icon-container">       
            <div class="credit ">
                <div class="credit-name"  >
                    <i class="pixel-icons icon-credit-cost"></i><span>Credit</span>
                </div>
            </div>
        </div>
        <div class="d-flex align-items-center" *ngIf="params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0'">
            <div class="ag-cell-custome-actions"  *ngIf="APP.permissions.job_access.credit_costs=='yes'">
            <ul style="position: relative;">
            <li class="m-0" (click)="cloneLineItem()"><i class="pixel-icons icon-clone"></i></li>
            <ng-container *ngIf="params.estimates_status_id!=5 && params.estimate.id==params.estimate.selected_revision">
            <li class="m-0" (click)="editRow()"><i class="pixel-icons icon-pencil"></i></li>
            <li class="m-0" #removeLineItemPop="matMenuTrigger" [matMenuTriggerFor]="removeLineItem"><i class="pixel-icons icon-delete"></i></li>
              <mat-menu #removeLineItem="matMenu" class="card-ui row-card colored bg-delete">

              <div class="card row-card" (click)="$event.stopPropagation()">
              <div class="card-header"><i class="pixel-icons icon-exclamation"></i></div>
              <div class="card-body">
                <h5 class="card-title">Delete Line Item</h5>
                <p class="card-text">Are you sure you want to delete Credit Cost?</p>
                <div class="footer">
                <a class="card-link text-btn" (click)="removeLineItemPop.closeMenu()">Cancel</a>
                <a class="card-link act-btn" (click)="removeCreditCost();removeLineItemPop.closeMenu();">Delete</a></div>
              </div>
              </div>
              </mat-menu>
              </ng-container>
            </ul>                
            </div>    
         
        </div>
    </div>
    <div class="read-view" *ngIf="params.data.is_edit">
        <div class="read-view-icon-container">       
            <div class="credit " [class.edit-cost]="params.data.is_edit">
                <div class="credit-name">
                    <i class="pixel-icons icon-credit-cost"></i><span>Credit</span>
                </div>
            </div>
        </div>
        <div class="cell-actions  credit-actions">
            <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
            <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
        </div>
    </div>
</div>
  `,
  // .bundle-with .bundle-list i.icon-orders{font-size:16px;}
  // .bundle_with_parent .order-value,.bundle_with_parent .order-revision{
  //   color: #C2A64E;
  // }
  styles: [`    
    .bundle_with_service .opt,
    .bundle_with_service .order-value,
    .bundle_with_service .order-revision,
    .bundle_with_service .task-name,
    .bundle_with_service .designation-name,
    .bundle_with_service .user-name,
    .bundle_with_service i.icon-orders,
    .bundle_with_service .vendor-name {      
      color: #C2A64E;
    }
    .icon-cancelled-products{
      margin-left: 8px !important;
      color: #dc4f66;
      font-size: 18px !important;
    }
    .order-value{
      align-items: center;
      display: flex;
    }
    .internal-cost .icon-credit-cost{
      font-size: 16px !important;
      position: relative;
      left: 3px;
      top: 2px;
    }
    .order-value .icon-cancelled-services{
      display: inline-flex;
      margin-left: 8px;
      color: #dc4f66;
    }
    .order-value .icon-exclamation{
      display: inline-flex;
      margin-left: 8px;
      color: #e6753d;
      font-size: 16px;
      position: relative;
      top: 4px;
    }
    .costs-revised{
      i{
&.icon-exclamation{
  display: inline-flex;
  margin-left: 8px;
  color: #e6753d;
  font-size: 16px;
  position: relative;
  top: 4px;
}
      }
    
    }
  `]
})
export class CoProductService implements OnInit {
  public params: any;
  public checkbox = false;
  public APP = APP;
  public vendorOptions = [];
  public state = {
    task: {
      tasks: [],
      designations: [],
      users: []
    },
    misc: {
      miscExpense: [],
      designations: [],
      users: [],
      vendors: []
    },
    vendorCost: {
      tasks: [],
      vendors: []
    },
    projectStatusID: null
  }
  public tasks = [];
  public designations = [];
  public users = [];
  public miscExpense = [];
  public vendors = [];
  public changeVendorOption = false;
  public backupRow = {};
  public rowData = {};
  public selectedMisc = {};
  public selectedDesignation = {};
  public selectedUser = {};
  public prefilMarkups = {};
  public prefilRates = {};
  public prefilMarkup = 0;
  public prefilRate = '';
  public miscChange = false;
  public designationChange = false;
  public userChange = false;
  public vendorCostChange = false;
  public bundleServicesList = [];
  public unbundleServicesList = [];
  public dialogRef: any;
  public estimatePromise: any;
  public allowEditable: boolean = true;

  constructor(
    private commonService: CommonService,
    private router: Router,
    private dialog: MatDialog,
    private _snackbar: MatSnackBar,
    private activeRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    if (this.params.data && this.params.data.type && this.params.data.type == 'vendor') {
      this.params.data.options.map((option) => {
        this.vendorOptions.push({ id: option.vendors_id, name: option.display_name });
      });
    }
    if (this.params.colDef.cellRendererParams['allowEditable'] != undefined) {
      this.allowEditable = this.params.colDef.cellRendererParams['allowEditable'];
    }
  }

  cloneLineItem() {
    this.dialog.open(CopyLineItemComponent, {
      panelClass: 'my-dialog',
      width: '900px',
      height: '600px',
      data: {
        title: 'Copy Line Item',
        type: this.params.data.type,
        rows: this.params.node.rowModel.rowsToDisplay,
        row: this.params.data,
        getParams: {
          id: this.params.data.id,
          estimate_id: this.activeRoute.snapshot.params.estimate_id, //this.params.data.estimates_id,
          type: this.params.data.type == 'service' ? 'service' : 'line-item',
          revision: this.params.data.revision
        }
      }
    })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          this.openSnackBar({ status: 'success', msg: 'Line Items Copied Successfully' });
          this.commonService.update({ reloadCo: true });
        }
      });
  }

  openSnackBar(obj) {
    let data: SnackBarType = {
      status: obj.status,
      msg: obj.msg
    }
    this._snackbar.openFromComponent(SnackbarComponent, {
      data: data,
      verticalPosition: 'top',
      horizontalPosition: 'right'
    })
  }

  bundleList() {
    // this.bundleServicesList = _.filter(this.params.node.parent.data.children, (service) => {
    //   if ((service.is_bundle && !service.bundle.is_parent) || this.params.data.jobs_service_revisions_id == service.jobs_service_revisions_id) {
    //     return false;
    //   }
    //   return true;
    // });
    // this.unbundleServicesList = _.filter(this.params.node.parent.data.children, (service) => {
    //   if (this.params.data.bundle.is_parent) {
    //     if (this.params.data.bundle.jsr_ids_from.indexOf(service.jobs_service_revisions_id) > -1) {
    //       return true;
    //     }
    //   }
    //   return false;
    // });

    this.bundleServicesList = [];
    _.map(this.params.node.parent.childrenAfterGroup, (service: RowNode) => {
      if ((service.data.is_bundle && !service.data.bundle.is_parent) || this.params.data.jobs_service_revisions_id == service.data.jobs_service_revisions_id) {
        // return false;
      } else {
        this.bundleServicesList.push(service.data);
      }
    });
    this.unbundleServicesList = [];
    _.map(this.params.node.parent.childrenAfterGroup, (service: RowNode) => {
      if (this.params.data.bundle.is_parent) {
        if (this.params.data.bundle.jsr_ids_from.indexOf(service.data.jobs_service_revisions_id) > -1) {
          this.unbundleServicesList.push(service.data);
        }
      }
    });
  }

  agInit(params: any): void {
    this.params = params;
    if (this.params.data && (this.params.data.type == 'task' || this.params.data.type == 'vendor' || this.params.data.type == 'misc' || this.params.data.type == 'cost') && !params.colDef.cellRendererParams['loadData']) {
      params.colDef.cellRendererParams['loadData'] = true;
      this.loadDropDownLists();
    }
    if (params.colDef.cellRendererParams['projectStatusID']) {
      this.state.projectStatusID = params.colDef.cellRendererParams['projectStatusID'];
    }
    if (this.params.data && this.params.data.type == 'task') {
      this.getTaskDropdowns();
    } else if (this.params.data && this.params.data.type == 'misc') {
      this.getMiscDropdowns();
    } else if (this.params.data && this.params.data.type == 'cost') {
      this.getCostsDropdowns();
    } else if (this.params.data && this.params.data.type == 'service') {
      this.bundleServicesList = [];
      _.map(this.params.node.parent.childrenAfterGroup, (service: RowNode) => {
        if ((service.data.is_bundle && !service.data.bundle.is_parent) || this.params.data.jobs_service_revisions_id == service.data.jobs_service_revisions_id) {
          // return false;
        } else {
          this.bundleServicesList.push(service.data);
        }
      });
      this.unbundleServicesList = [];
      _.map(this.params.node.parent.childrenAfterGroup, (service: RowNode) => {
        if (this.params.data.bundle.is_parent) {
          if (this.params.data.bundle.jsr_ids_from.indexOf(service.data.jobs_service_revisions_id) > -1) {
            this.unbundleServicesList.push(service.data);
          }
        }
      });
    }
    this.backupRow = _.cloneDeep(this.params.data);
  }

  loadDropDownLists() {
    if (this.estimatePromise) {
      this.estimatePromise.unsubscribe();
    }
    this.estimatePromise = forkJoin(
      this.commonService.getApi('desgnUsers', {}),
      this.commonService.getApi('getTasks', {
        page: 1,
        pageSize: 1000,
        sort: 'asc',
        status: true,
        is_milestone: 1
      }),
      this.commonService.saveApi('getVendors', { org_type: 3 }),
      this.commonService.getApi('drpDwnMiscExpn', {}),
      this.commonService.getApi('getDesignations', {
        page: 1,
        pageSize: 1000,
        status: true,
        sort: 'asc',
        org_type: 1
      })
    ).subscribe(([res2, res3, res4, res5, res6]) => {
      if (res2['result'] && res2['result'].success) {
        this.params.colDef.cellRendererParams['users'] = res2['result'].data;
        // this.params['users'] = res2['result'].data;
      }
      if (res3['result'] && res3['result'].success) {
        this.params.colDef.cellRendererParams['tasks'] = res3['result'].data.items;
        // this.params['tasks'] = res3['result'].data.items;
      }
      if (res4['result'] && res4['result'].success) {
        this.params.colDef.cellRendererParams['vendors'] = res4['result'].data;
        // this.params['vendors'] = res4['result'].data;
      }
      if (res5['result'] && res5['result'].success) {
        this.params.colDef.cellRendererParams['miscExpense'] = res5['result'].data.MiscDt;
        this.params.colDef.cellRendererParams['prefilMarkups'] = res5['result'].data.markup;
        this.params.colDef.cellRendererParams['prefilRates'] = res5['result'].data.rate;
        // this.params['miscExpense'] = res5['result'].data.MiscDt;
        // this.params['prefilMarkups'] = res5['result'].data.markup;
        // this.params['prefilRates'] = res5['result'].data.rate;
      }
      if (res6['result'] && res6['result'].success) {
        this.params.colDef.cellRendererParams['designations'] = res6['result'].data.designations;
        // this.params['designations'] = res6['result'].data.designations;
      }
    });
  }

  toggleChildOrgs(): void {
    event.stopImmediatePropagation();
    this.params.data['showChildren'] = !this.params.data['showChildren'];
    this.params.api.resetRowHeights();
  }

  saveRow(): void {
    let valid = true;
    if (this.params.data.type == 'task') {
      if (this.params.data.designation_id == '' || this.params.data.task_id == '') {
        valid = false;
      }
      _.map(this.params.colDef.cellRendererParams.tasks, (item) => {
        if (item.id == this.params.data.task_id) {
          this.params.data.task_name = item.name;
        }
      });
      _.map(this.params.colDef.cellRendererParams.designations, (item) => {
        if (item.id == this.params.data.designation_id) {
          this.params.data.designation_name = item.name;
        }
      });
      _.map(this.params.colDef.cellRendererParams.users[this.params.data.designation_id], (item) => {
        if (item.users_id == this.params.data.users_id) {
          this.params.data.user_name = item.user_name;
        }
      });
    } else if (this.params.data.type == 'misc') {
      if (this.params.data.task_id == '') {
        valid = false;
      }
      _.map(this.params.colDef.cellRendererParams.miscExpense, (item) => {
        if (item.id == this.params.data.task_id) {
          this.params.data.misc_name = item.name;
          this.params.data.task_id = item.id;
          this.params.data.task_name = item.name;
        }
      });
      _.map(this.params.colDef.cellRendererParams.designations, (item) => {
        if (item.id == this.params.data.designation_id) {
          this.params.data.designation_name = item.name;
        }
      });
      _.map(this.params.colDef.cellRendererParams.users[this.params.data.designation_id], (item) => {
        if (item.users_id == this.params.data.users_id) {
          this.params.data.user_name = item.user_name;
        }
      });
      _.map(this.params.colDef.cellRendererParams.vendors, (item) => {
        if (item.id == this.params.data.vendors_id) {
          this.params.data.vendor_name = item.name;
        }
      });
    } else if (this.params.data.type == 'cost') {
      if (this.params.data.vendors_id == '') {
        valid = false;
      }
      _.map(this.params.colDef.cellRendererParams.tasks, (item) => {
        if (item.id == this.params.data.task_id) {
          this.params.data.task_name = item.name;
        }
      });
      _.map(this.params.colDef.cellRendererParams.vendors, (item) => {
        if (item.id == this.params.data.vendors_id) {
          this.params.data.vendor_name = item.name;
        }
      });
    } else if (this.params.data.type == 'addCredit') {
      let gross_amount = this.params.data.gross_amount.toString();
      if (gross_amount.indexOf('-') == -1) {
        this.params.data['gross_amount'] = '-' + gross_amount;
      }
    }
    this.params.data['estimates_services_id'] = this.params.node.parent.data.id;
    this.params.data['jobs_service_revisions_id'] = this.params.node.parent.data.jobs_service_revisions_id;
    this.params.data['estimates_id'] = this.params.node.parent.data.estimates_id;
    this.params.data['jsr_rev_no'] = this.params.node.parent.data.jsr_rev_no;
    this.params.data['jobs_forms_id'] = this.params.node.parent.data.jobs_forms_id;
    if (valid) {
      this.commonService.saveApi('saveEstimateExpense', this.params.data)
        .then(res => {
          if (res['result'] && res['result'].success) {
            this.params.data.is_edit = false;
            this.params.data.id = res['result'].data.id;
            this.params.node.updateData(this.params.data);
            this.params.api.resetRowHeights();
            this.backupRow = _.cloneDeep(this.params.data);
            this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
            this.commonService.update({ grandTotal: true, data: this.params.data });
          }
        });
    }
  }

  resetRow(): void {
    let rowId = this.params.data.id;
    if (rowId.toString().indexOf('new_') == 0) {
      this.params.api.updateRowData({ remove: [this.params.data] });
      this.commonService.update({ grandTotal: true });
    } else {
      this.params.data.is_edit = false;
      this.params.data = _.cloneDeep(this.backupRow);
      this.params.node.updateData(this.params.data);
      this.params.api.resetRowHeights();
      this.commonService.update({ grandTotal: true, data: this.params.data });
    }
  }

  vendorOptionChange(event): void {
    let optionExists = false;
    let selectedVendor = {};
    this.params.data.options.map((vendor) => {
      if (vendor.primary_id == event) {
        //if (vendor.vendors_id == event) {
        optionExists = true;
        selectedVendor = vendor;
      }
    });
    if (optionExists) {
      let vendor = {
        vendor_name: selectedVendor['vendor_name'],
        name: selectedVendor['vendor_name'],
        type: 'vendor',
        vendors_id: selectedVendor['vendors_id'],
        primary_id: selectedVendor['primary_id'],
        options: this.params.data.options,
        rate: 0.00,
        units: 0,
        net_amount: selectedVendor['net_amount'],
        gross_amount: selectedVendor['gross_amount'],
        total: selectedVendor['total'],
        id: this.params.data.id,
        estimates_id: this.params.estimates_id
      };
      this.commonService.saveApi('saveEstimateServices', {
        id: this.params.data.id,
        jobs_forms_id: selectedVendor['jobs_forms_id'],
        jobs_service_revisions_id: selectedVendor['jobs_service_revisions_id'],
        vendors_id: selectedVendor['vendors_id'],
        vendor_name: selectedVendor['vendor_name'],
        estimates_id: this.params.data.estimates_id,
        vendor_amount: selectedVendor['vendor_amount'],
        net_amount: selectedVendor['net_amount'],
        gross_amount: selectedVendor['gross_amount'],
        markup_amount: selectedVendor['markup_amount'],
        jsr_rev_no: selectedVendor['jsr_rev_no']
      })
        .then(res => {
          if (res['result'] && res['result'].success) {
            this.params.node.parent.data['jobs_forms_id'] = selectedVendor['jobs_forms_id'];
            this.params.node.parent.updateData(this.params.node.parent.data);
            this.params.node.updateData(vendor);
            this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
            this.commonService.update({ grandTotal: true, data: vendor });
          }
        });
    }
  }

  miscOptionChange(): void {
    let selectedMisc = this.params.miscExpense.filter((misc) => {
      if (misc.id == this.params.data.task_id) {
        return true;
      }
      return false;
    });
    this.prefilMarkup = 0;
    this.prefilRate = '';
    if (selectedMisc.length) {
      this.selectedMisc = selectedMisc[0];
      if (this.selectedMisc['types'] == 'Markup') {
        this.prefilMarkup = this.params.prefilMarkups[this.selectedMisc['id']];
      } else if (this.selectedMisc['types'] == 'Rate') {
        this.prefilRate = this.params.prefilRates[this.selectedMisc['id']];
      }
      this.params.data.misc_type = this.selectedMisc['types'];
      this.params.data.misc_type_id = this.selectedMisc['id'];
      this.params.data.gross_markup = this.prefilMarkup;
    } else {
      this.selectedMisc = {};
      this.params.data.misc_type = '';
      this.params.data.misc_type_id = 0;
      this.params.data.gross_markup = false;
    }
    this.params.data.gross_amount = (this.params.data.net_amount * (this.prefilMarkup / 100)) + this.params.data.net_amount;
    this.params.data.rate = this.prefilRate;
    this.params.data.net_amount = this.params.data.rate * this.params.data.units;
    this.params.data.gross_amount = this.params.data.rate * this.params.data.units;
    this.params.data.total = this.params.data.gross_amount;
    this.params.node.updateData(this.params.data);
    this.miscChange = true;
  }

  designationOptionChange(): void {
    let selectedDesignation = this.params.colDef.cellRendererParams.designations.filter((misc) => {
      if (misc.id == this.params.data.designation_id) {
        return true;
      }
      return false;
    });
    if (selectedDesignation.length) {
      this.selectedDesignation = selectedDesignation[0];
    } else {
      this.selectedDesignation = {};
    }
    this.params.data.rate = this.selectedDesignation['bill_rate'];
    this.params.data.net_amount = this.params.data.rate * this.params.data.units;
    this.params.data.gross_amount = this.params.data.rate * this.params.data.units;
    this.params.data.total = this.params.data.gross_amount;
    this.params.node.updateData(this.params.data);
    this.designationChange = true;
  }

  userOptionChange(): void {
    let selectedUser = this.params.users[this.params.data.designation_id].filter((misc) => {
      if (misc.users_id == this.params.data.users_id) {
        return true;
      }
      return false;
    });
    if (selectedUser.length) {
      this.selectedUser = selectedUser[0];
    } else {
      this.selectedUser = {};
    }
    this.params.data.rate = this.selectedUser['user_rating'];
    this.params.data.net_amount = this.params.data.rate * this.params.data.units;
    this.params.data.gross_amount = this.params.data.rate * this.params.data.units;
    this.params.data.total = this.params.data.gross_amount;
    this.params.node.updateData(this.params.data);
    this.userChange = true;
  }

  vendorCostOptionChange(): void {
    this.vendorCostChange = true;
  }

  getCostsDropdowns(): void {
  }

  getMiscDropdowns(): void {
  }

  getTaskDropdowns(): void {
  }

  editRow(): void {
    this.params.data.is_edit = true;
    this.params.api.resetRowHeights();
    this.params.node.updateData(this.params.data);
    // this.params.setValue(this.params.data);
  }

  bundleServices(type: any, selected?: any): void {
    let jsr_ids = [];
    switch (type) {
      case 'product':
        _.map(this.params.data.children, (service) => {
          jsr_ids.push(service.jobs_service_revisions_id);
        });
        // this.dialog.open(BundleServiceComponent, {
        //   panelClass: 'my-dialog',
        //   width: '500px',
        //   data: {
        //     title: (this.params.data.is_bundle) ? 'Unbundle Services' : 'Bundle Services',
        //     msg: 'Are you sure, you want to ' + ((this.params.data.is_bundle) ? 'Unbundle' : 'Bundle') + ' all services under <b>' + this.params.data.product_name + '</b>?',
        //     saveApi: 'saveEstmBundle',
        //     postParams: {
        //       estimates_id: this.activeRoute.snapshot.params.estimate_id,
        //       jsr_ids_from: (this.params.data.is_bundle) ? [] : jsr_ids,
        //       bundle_to: this.params.data.product_id,
        //       id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
        //       product_id: this.params.data.product_id,
        //       is_product: true,
        //       is_bundle: (this.params.data.is_bundle) ? false : true
        //     }
        //   }
        // })
        //   .afterClosed()
        //   .subscribe(res => {
        //     if (res.success) {
        //       this.params.data.is_bundle = !this.params.data.is_bundle;
        //       if(!this.params.data.is_bundle){
        //         _.map(this.params.node.childrenAfterGroup, (service:RowNode) => {
        //           service.data.is_bundle = false;
        //           service.setData(service.data);
        //         });
        //       }
        //     }
        //   });
        this.commonService.saveApi('saveEstmBundle', {
          estimates_id: this.activeRoute.snapshot.params.estimate_id,
          jsr_ids_from: (this.params.data.is_bundle) ? [] : jsr_ids,
          bundle_to: this.params.data.product_id,
          id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
          product_id: this.params.data.product_id,
          is_product: true,
          is_bundle: (this.params.data.is_bundle) ? false : true
        }).then(res => {
          if (res['result'] && res['result'].success) {
            this.params.data.is_bundle = !this.params.data.is_bundle;
            if (!this.params.data.is_bundle) {
              _.map(this.params.node.childrenAfterGroup, (service: RowNode) => {
                service.data.is_bundle = false;
                service.setData(service.data);
              });
            }
          }
        });
        break;
      case 'service':
        let jsr_from = [];
        let jsr_to = '';
        if (this.params.data.is_bundle) {
          jsr_from.push(selected.jobs_service_revisions_id);
          jsr_to = this.params.data.jobs_service_revisions_id;
        } else {
          jsr_from.push(this.params.data.jobs_service_revisions_id);
          jsr_to = selected.jobs_service_revisions_id;
        }
        this.dialog.open(BundleServiceComponent, {
          panelClass: 'my-dialog',
          width: '500px',
          data: {
            title: (this.params.data.is_bundle) ? 'Unbundle Costs' : 'Bundle Costs',
            msg: 'Are you sure you want to ' + ((this.params.data.is_bundle) ? 'Unbundle' + ' <b>' + selected.job_service_name + '</b> from <b>' + this.params.data.job_service_name + '</b>?' : 'Bundle' + ' <b>' + this.params.data.job_service_name + '</b> with <b>' + selected.job_service_name + '</b>?'),
            saveApi: 'saveEstmBundle',
            postParams: {
              estimates_id: this.activeRoute.snapshot.params.estimate_id,
              jsr_ids_from: jsr_from,
              bundle_to: jsr_to,
              product_id: this.params.node.parent.data.product_id,
              id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
              is_product: false,
              is_bundle: (this.params.data.is_bundle) ? false : true
            }
          }
        })
          .afterClosed()
          .subscribe(res => {
            if (res && res.success) {
              let toIndex, fromIndex;
              let childNodes = [];
              const childs = (<RowNode>this.params.node).parent.childrenAfterGroup.map((o: RowNode) => o.data);
              if (this.params.data.is_bundle) {
                //unbundle
                this.params.node.parent.childrenAfterGroup.map((row: RowNode, index) => {
                  if (row.data.jobs_service_revisions_id == jsr_to) {
                    toIndex = index;
                    row.data['bundle']['is_parent'] = true;
                    if (row.data['bundle']['jsr_ids_from'] && row.data['bundle']['jsr_ids_from'].length == 1) {
                      row.data['is_bundle'] = false;
                      row.data['bundle'] = {
                        is_parent: false
                      };
                    } else {
                      row.data['bundle']['jsr_ids_from'].splice(row.data['bundle']['jsr_ids_from'].indexOf(jsr_from[0]), 1);
                    }
                  }
                  if (jsr_from.indexOf(row.data.jobs_service_revisions_id) > -1) {
                    fromIndex = index;
                    row.data['is_bundle'] = false;
                    row.data['bundle'] = {};
                    row.data['bundle']['is_parent'] = false;
                  }
                  childNodes.push(row);
                });
                let fromBackup = _.cloneDeep(childNodes[fromIndex]);
                childNodes.splice(fromIndex, 1);
                if (toIndex < fromIndex) {
                  childNodes.splice(toIndex, 0, fromBackup);
                } else {
                  childNodes.splice(toIndex - 1, 0, fromBackup);
                }
              } else {
                //bundle
                this.params.node.parent.childrenAfterGroup.map((row: RowNode, index) => {
                  if (row.data.jobs_service_revisions_id == jsr_to) {
                    toIndex = index;
                    row.data['is_bundle'] = true;
                    if (!row.data['bundle']) {
                      row.data['bundle'] = {};
                    }
                    row.data['bundle']['bundle_to'] = jsr_to;
                    row.data['bundle']['estimates_id'] = row.data.estimates_id;
                    row.data['bundle']['id'] = res.response.data;
                    row.data['bundle']['is_parent'] = true;
                    row.data['bundle']['is_product'] = false;
                    row.data['bundle']['product_id'] = this.params.node.parent.data.product_id;
                    if (row.data['bundle']['jsr_ids_from'] && row.data['bundle']['jsr_ids_from'].length) {
                      if (row.data['bundle']['jsr_ids_from'].indexOf(jsr_from[0]) == -1) {
                        row.data['bundle']['jsr_ids_from'].push(jsr_from[0]);
                      }
                    } else {
                      row.data['bundle']['jsr_ids_from'] = jsr_from;
                    }
                  }
                  if (jsr_from.indexOf(row.data.jobs_service_revisions_id) > -1) {
                    fromIndex = index;
                    row.data['is_bundle'] = true;
                    row.data['bundle'] = {};
                    row.data['bundle']['is_parent'] = false;
                  }
                  childNodes.push(row);
                });
                let fromBackup = _.cloneDeep(childNodes[fromIndex]);
                childNodes.splice(fromIndex, 1);
                if (toIndex < fromIndex) {
                  childNodes.splice(toIndex + 1, 0, fromBackup);
                } else {
                  childNodes.splice(toIndex, 0, fromBackup);
                }
              }
              let updatedRows = [];
              childNodes.map((row: RowNode) => {
                updatedRows.push(row.data);
                row.childrenAfterGroup.map((childRow: RowNode) => {
                  updatedRows.push(childRow.data);
                });
              });
              (<GridApi>this.params.api).updateRowData({ remove: childs });
              (<GridApi>this.params.api).updateRowData({ add: updatedRows });
              (<GridApi>this.params.api).resetRowHeights();
              // (<GridApi>this.params.api).refreshCells();
              // this.commonService.update({ reloadCo: true });
            }
          });
        break;
      case 'addCredit':
        let credit_jsr_from = [];
        let credit_jsr_to = '';
        if (this.params.data && this.params.data.is_bundle) {
          credit_jsr_from.push(selected.jobs_service_revisions_id);
          credit_jsr_to = this.params.node.parent.data.jobs_service_revisions_id;
        } else {
          credit_jsr_from.push(this.params.node.parent.data.jobs_service_revisions_id);
          credit_jsr_to = selected.jobs_service_revisions_id;
        }
        this.dialog.open(BundleServiceComponent, {
          panelClass: 'my-dialog',
          width: '500px',
          data: {
            title: (this.params.data.is_bundle) ? 'Unbundle Costs' : 'Bundle Costs',
            msg: 'Are you sure you want to ' + ((this.params.data.is_bundle) ? 'Unbundle credit from service?' : 'Bundle credit with service?'),
            saveApi: 'saveEstmBundle',
            postParams: {
              estimates_id: this.activeRoute.snapshot.params.estimate_id,
              jsr_ids_from: credit_jsr_from,
              bundle_to: credit_jsr_to,
              product_id: this.params.node.parent.data.product_id,
              id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
              is_product: false,
              is_bundle: (this.params.data.is_bundle) ? false : true
            }
          }
        })
          .afterClosed()
          .subscribe(res => {
            if (res.success) {
              this.commonService.update({ reloadCo: true });
            }
          });
        break;
    }

  }

  removeRow(): void {
    // this.dialogRef = this.dialog.open(DeleteComponent, {
    //   panelClass: 'my-dialog',
    //   width: '600px',
    //   data: {
    //     title: 'Delete Line Item',
    //     msg: 'Are you sure you want to delete line item?',
    //   }
    // });

    // this.dialogRef.afterClosed().subscribe(result => {
    //   if (result && result.success) {
    this.commonService.deleteApi('removeLineItem', {
      id: this.params.data.id,
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.params.api.updateRowData({ remove: [this.params.data] });
          this.commonService.update({ grandTotal: true });
          this.params.api.resetRowHeights();
          this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
        }
      });
    //   }
    // });
  }

  removeCreditCost(): void {
    // this.dialogRef = this.dialog.open(DeleteComponent, {
    //   panelClass: 'my-dialog',
    //   width: '600px',
    //   data: {
    //     title: 'Remove Credit Cost',
    //     msg: 'Are you sure you want to remove credit cost?',
    //   }
    // });

    // this.dialogRef.afterClosed().subscribe(result => {
    // if (result && result.success) {
    this.commonService.deleteApi('removeCreditCost', {
      id: this.params.data.id,
      type: 'single'
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.params.api.updateRowData({ remove: [this.params.data] });
          this.commonService.update({ grandTotal: true });
        }
      });
    // }
    // });
  }

  addCreditCost(params: any) {
    params['estimates_services_id'] = this.params.node.data.id;
    params['jobs_service_revisions_id'] = this.params.node.data.jobs_service_revisions_id;
    params['estimates_id'] = this.params.node.data.estimates_id;
    params['jsr_rev_no'] = this.params.node.data.jsr_rev_no;
    params['jobs_forms_id'] = this.params.node.data.jobs_forms_id;
    let gross_amount = params.gross_amount.toString();
    if (gross_amount.indexOf('-') == -1) {
      params['gross_amount'] = '-' + gross_amount;
    }
    params['task_type'] = 4;
    this.commonService.saveApi('saveEstimateExpense', params)
      .then(res => {
        if (res['result'] && res['result'].success) {
          params['id'] = res['result'].data.id;
          this.params.api.updateRowData({ add: [params] }); 
          this.backupRow = _.cloneDeep(this.params.data);
          this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
          this.commonService.update({ grandTotal: true });
        }
      });
  }

  edit(type, event): void {
    let randomNum = Math.random() * 100;
    switch (type) {
      case 'task':
        let task = {
          id: 'new_' + randomNum,
          is_edit: true,
          type: 'task',
          task_id: '',
          designation_id: '',
          index: randomNum,
          user_name: '',
          rate: 0,
          units: 0,
          gross_amount: '',
          total: '',
          net_amount: '',
          users_id: '',
          vendor_name: '11',
          vendors_id: 22,
          task_name: '',
          task_type: 1,
          estimates_services_id: this.params.data.id,
          designation_name: '',
          options: [],
          new: true,
          total_price: 1,
          name: 'new_' + randomNum,
          hierarchy: [...this.params.data.hierarchy, ...['new_' + randomNum]]
        };
        this.params.api.updateRowData({ add: [task] });
        break;
      case 'misc':
        let miscRow = {
          new: true,
          id: 'new_' + randomNum,
          index: randomNum,
          is_edit: true,
          type: 'misc',
          vendors_id: '',
          task_id: '',
          designation_id: '',
          misc_name: '',
          designation_name: '',
          user_name: '',
          vendor_name: '',
          options: [],
          rate: 0,
          units: 0,
          total_price: 1,
          gross_amount: '',
          total: '',
          net_amount: '',
          users_id: '',
          task_name: '',
          task_type: 0,
          estimates_services_id: this.params.data.id,
          name: 'new_' + randomNum,
          hierarchy: [...this.params.data.hierarchy, ...['new_' + randomNum]]
        };
        this.params.api.updateRowData({ add: [miscRow] });
        break;
      case 'cost':
        let costRow = {
          new: true,
          id: 'new_' + randomNum,
          index: randomNum,
          is_edit: true,
          type: 'cost',
          vendors_id: '',
          task_id: '',
          task_name: '',
          vendor_name: '',
          options: [],
          rate: 0,
          units: 0,
          total_price: 1,
          designation_id: '',
          user_name: '',
          gross_amount: '',
          total: '',
          net_amount: '',
          users_id: '',
          task_type: 2,
          estimates_services_id: this.params.data.id,
          name: 'new_' + randomNum,
          hierarchy: [...this.params.data.hierarchy, ...['new_' + randomNum]]
        };
        this.params.api.updateRowData({ add: [costRow] });
        break;
      case 'addCredit':
        let rowData = {
          new: true,
          id: 'new_' + randomNum,
          index: randomNum,
          is_edit: false,
          type: 'addCredit',
          vendors_id: '',
          task_id: '',
          task_name: '',
          vendor_name: '',
          options: [],
          rate: 0,
          units: 0,
          total_price: 1,
          designation_id: '',
          user_name: '',
          gross_amount: '',
          total: '',
          net_amount: '',
          users_id: '',
          task_type: 4,
          notes: '',
          estimates_services_id: this.params.data.id,
          name: 'new_' + randomNum,
          hierarchy: [...this.params.data.hierarchy, ...['new_' + randomNum]]
        };
        this.dialogRef = this.dialog.open(AddCreditComponent, {
          panelClass: 'my-dialog',
          width: '600px',
          data: {
            title: 'Add Credit',
            data: rowData,
            credit: 123,
            description: '<p>123</p>'
          }
        });

        this.dialogRef.afterClosed().subscribe(result => {
          if (result && result.success) {
            this.addCreditCost(result.data.data);
          }
        });
        break;
      case 'clearCredit':
        this.dialogRef = this.dialog.open(DeleteComponent, {
          panelClass: 'my-dialog',
          width: '600px',
          data: {
            title: 'Clear All Costs',
            msg: 'Are you sure, you want to clear all the costs?',
          }
        });

        this.dialogRef.afterClosed().subscribe(result => {
          if (result && result.success) {
            this.commonService.deleteApi('removeCreditCost', {
              estimates_id: this.params.node.data.estimates_id,
              id: this.params.data.jobs_service_revisions_id,
              type: 'all'
            })
              .then(res => {
                if (res['result'] && res['result'].success) {
                  let creditRows = [];
                  let otherRows = [];
                  _.map(this.params.node.childrenAfterGroup, (service: RowNode) => {
                    if (service && service.data && service.data.type && (service.data.type == 'addCredit')) {
                      creditRows.push(service.data);
                    } else if (service && service.data && service.data.type && (service.data.type == 'vendor' || service.data.type == 'task' || service.data.type == 'misc' || service.data.type == 'cost')) {
                      service.data['net_amount'] = '0.00';
                      service.data['rate'] = '0.00';
                      service.data['units'] = '0';
                      service.data['gross_amount'] = '0.00';
                      otherRows.push(service.data);
                    }
                  });
                  this.params.api.updateRowData({ remove: creditRows });
                  this.params.api.updateRowData({ update: otherRows });
                  this.commonService.update({ grandTotal: true });
                }
              });
          }
        });
        break;
    }
  }

  getEstimateDetails(event): void {
    event.stopPropagation();
    this.router.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + this.params.data.id]);
  }

  serviceCheck(): void {
    this.commonService.update({ estimateChk: this.params.data.selected });
  }

}
@Component({
  template: `
  <div *ngIf="params.data?.type=='vendor'" [ngClass]="{'vendor': params.data.type, 'bundle_with_service': params.node.parent.data.is_bundle}"><i class="pixel-icons icon-vendor-shape"></i>
    <pi-select label="" [options]="params.data.options" idKey="vendors_id" nameKey="display_name" (onChange)="vendorOptionChange($event)" [(ngModel)]="params.data.vendors_id"></pi-select>
  </div>
  <div *ngIf="params.data?.type=='task'" [ngClass]="{'task': params.data.type, 'bundle_with_service': (!params.node.parent.data.is_bundle && params.data.is_bundle)}">
    <div class="read-view" *ngIf="!params.data.is_edit">
   <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-task-completed"></i>
        </div>
      <div class="read-select">
      <div class="task-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      <div class="designation-name" *ngIf="params.data.designation_name">{{params.data.designation_name}}</div>
      <div class="user-name" *ngIf="params.data.user_name">{{params.data.user_name}}</div>
      </div>
      </div>
      <div class="d-flex">
      <div class="ag-cell-custome-actions"><ul>
      <li class="m-0" [matMenuTriggerFor]="rowSettings"><i class="pixel-icons  icon-more-horizontal"></i></li></ul>
      </div>
       <mat-menu #rowSettings="matMenu" class="more-grid-actions">
      <button mat-menu-item (click)="editRow()"><i class="pixel-icons icon-pencil"></i>Edit</button>
      <button mat-menu-item (click)="removeRow()"><i class="pixel-icons icon-delete"></i>Remove</button>
    </mat-menu>
    </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
    <div class="edit-view-icon">  
    <i class="pixel-icons icon-task-completed"></i>
    </div>
    <div class="edit-mode-line-items">
    <div class="edit-select">
    <pi-select label="" placeholder="Select Task" class="required" [options]="params.tasks" idKey="id" nameKey="name" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      <pi-select label="" placeholder="Select Designation" class="required" [options]="params.designations" (onChange)="designationOptionChange()" idKey="id" nameKey="name" [(ngModel)]="params.data.designation_id"></pi-select>
      <pi-select label="" placeholder="Select User" [options]="(params.data.designation_id!=''?(params.users[params.data.designation_id] || []):[])" (onChange)="userOptionChange()" idKey="users_id" nameKey="user_name" [(ngModel)]="params.data.users_id"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
    </div>
    </div>
      </div>
  </div>
  <div *ngIf="params.data?.type=='misc'" [ngClass]="{'misc': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit">
   
      <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-expenses"></i>
        </div>
      <div class="read-select">
      <div class="misc-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      <div class="designation-name" *ngIf="params.data.designation_name">{{params.data.designation_name}}</div>
      <div class="user-name" *ngIf="params.data.user_name">{{params.data.user_name}}</div>
      <div class="vendor-name" *ngIf="params.data.vendor_name">{{params.data.vendor_name}}</div>
      </div>
      </div>
      <div class="d-flex">
      <div class="ag-cell-custome-actions"><ul>
      <li class="m-0" [matMenuTriggerFor]="rowSettings"><i class="pixel-icons  icon-more-horizontal"></i></li></ul>
      </div>
       <mat-menu #rowSettings="matMenu" class="more-grid-actions">
      <button mat-menu-item (click)="editRow()"><i class="pixel-icons icon-pencil"></i>Edit</button>
      <button mat-menu-item (click)="removeRow()"><i class="pixel-icons icon-delete"></i>Remove</button>
    </mat-menu>
    </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
      <div class="edit-view-icon">  
        <i class="pixel-icons icon-expenses"></i>
      </div>
      <div class="edit-select">
      <pi-select label="" placeholder="Select Misc" class="required" [options]="params.miscExpense" (onChange)="miscOptionChange()" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      <pi-select label="" placeholder="Select Designation" [options]="params.designations"  idKey="id" nameKey="name" [(ngModel)]="params.data.designation_id"></pi-select>
      <pi-select label="" placeholder="Select User" [options]="(params.data.designation_id!=''?(params.users[params.data.designation_id] || []):[])"  idKey="users_id" nameKey="user_name" [(ngModel)]="params.data.users_id"></pi-select>
      <pi-select label="" placeholder="Select Vendor" [minSearchLength]='3' [options]="params.vendors" idKey="id" nameKey="name" [(ngModel)]="params.data.vendors_id"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" class="inner-btns"><i class="pixel-icons icon-close-slim"></i></span>
    </div>
      </div>
  </div>
  <div *ngIf="params.data?.type=='cost'" [ngClass]="{'cost': params.data.type}">
    <div class="read-view" *ngIf="!params.data.is_edit">
    
      <div class="read-view-icon-container">
        <div class="read-view-icon">  
          <i class="pixel-icons icon-vendor-shape"></i>
        </div>
        <div class="read-select">
      <div class="task-name" *ngIf="params.data.task_name">{{params.data.task_name}}</div>
      <div class="vendor-name" *ngIf="params.data.vendor_name">{{params.data.vendor_name}}</div>
      </div>
      </div>
      <div class="d-flex">
      <div class="ag-cell-custome-actions"><ul>
      <li class="m-0" [matMenuTriggerFor]="rowSettings"><i class="pixel-icons  icon-more-horizontal"></i></li></ul>
      </div>
       <mat-menu #rowSettings="matMenu" class="more-grid-actions">
      <button mat-menu-item (click)="editRow()"><i class="pixel-icons icon-pencil"></i>Edit</button>
      <button mat-menu-item (click)="removeRow()"><i class="pixel-icons icon-delete"></i>Remove</button>
    </mat-menu>
    </div>
    </div>
    <div class="edit-view" *ngIf="params.data.is_edit">
    <div class="edit-view-icon">  
        <i class="pixel-icons icon-vendor-shape"></i>
      </div>
      <div class="edit-select">
      <pi-select label="" placeholder="Select Task" [options]="params.tasks" idKey="id" nameKey="name" [(ngModel)]="params.data.task_id" class="first-select"></pi-select>
      <pi-select label="" placeholder="Select Vendor" [minSearchLength]='3' class="required" [options]="params.vendors" (onChange)="vendorCostOptionChange()" idKey="id" nameKey="name" [(ngModel)]="params.data.vendors_id"></pi-select>
      </div>
      <div class="cell-actions">
      <span (click)="saveRow()" class="inner-btns"><i class="pixel-icons icon-select"></i></span>
      <span (click)="resetRow()" ><i class="pixel-icons icon-close-slim"></i></span>
    </div>
      </div>
  </div>
  <div *ngIf="params.data?.type=='addCredit'" [ngClass]="{'addCredit': params.data.type}">
    <div class="read-view align-items-center" *ngIf="!params.data.is_edit">
    <div class="credit ">
      <div class="credit-name"><i class="pixel-icons icon-credit-cost"></i><span>Credit</span></div>
      </div>
      <div class="d-flex align-items-center">
      <div class="ag-cell-custome-actions"><ul>
      <li class="m-0" style="top: 4px;" [matMenuTriggerFor]="rowSettings"><i class="pixel-icons  icon-more-horizontal"></i></li></ul>
      </div>
       <mat-menu #rowSettings="matMenu" class="more-grid-actions">
      <button mat-menu-item (click)="editRow()"><i class="pixel-icons icon-delete"></i>Edit</button>
      <button mat-menu-item (click)="removeCreditCost()"><i class="pixel-icons icon-delete"></i>Remove</button>
    </mat-menu>
    </div>
    </div>
  </div>
  `,
  styles: [` 
    
    .bundle-with .bundle-list i.icon-orders{font-size:16px;}
    .bundle_with_parent .order-value,.bundle_with_parent .order-revision{
      color: #C2A64E;
    }
    .bundle_with_service .opt,
    .bundle_with_service .order-value,
    .bundle_with_service .order-revision,
    .bundle_with_service .task-name,
    .bundle_with_service .designation-name,
    .bundle_with_service .user-name,
    .bundle_with_service .vendor-name {
      color: #af8b0a;
    }
  `]
})
export class CoProductServiceLineItems implements OnInit {
  public params: any;
  public checkbox = false;
  public APP = APP;
  public vendorOptions = [];
  public state = {
    task: {
      tasks: [],
      designations: [],
      users: []
    },
    misc: {
      miscExpense: [],
      designations: [],
      users: [],
      vendors: []
    },
    vendorCost: {
      tasks: [],
      vendors: []
    }
  }
  public tasks = [];
  public designations = [];
  public users = [];
  public miscExpense = [];
  public vendors = [];
  public changeVendorOption = false;
  public backupRow = {};
  public rowData = {};
  public selectedMisc = {};
  public selectedDesignation = {};
  public selectedUser = {};
  public prefilMarkups = {};
  public prefilRates = {};
  public prefilMarkup = 0;
  public prefilRate = '';
  public miscChange = false;
  public designationChange = false;
  public userChange = false;
  public vendorCostChange = false;
  public bundleServicesList = [];
  public unbundleServicesList = [];
  public dialogRef: any;

  constructor(
    private commonService: CommonService,
    private router: Router,
    private dialog: MatDialog,
    private activeRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    if (this.params.data && this.params.data.type == 'vendor') {
      this.params.data.options.map((option) => {
        this.vendorOptions.push({ id: option.vendors_id, name: option.display_name });
      });
    }
  }

  agInit(params: any): void {
    this.params = params;
    if (this.params.data && this.params.data.type == 'task') {
      this.getTaskDropdowns();
    } else if (this.params.data && this.params.data.type == 'misc') {
      this.getMiscDropdowns();
    } else if (this.params.data && this.params.data.type == 'cost') {
      this.getCostsDropdowns();
    } else if (this.params.data && this.params.data.type == 'service') {
      this.bundleServicesList = _.filter(this.params.node.parent.data.children, (service) => {
        if ((service.is_bundle && !service.bundle.is_parent) || this.params.data.jobs_service_revisions_id == service.jobs_service_revisions_id) {
          return false;
        }
        return true;
      });
      this.unbundleServicesList = _.filter(this.params.node.parent.data.children, (service) => {
        if (this.params.data.bundle.is_parent) {
          if (this.params.data.bundle.jsr_ids_from.indexOf(service.jobs_service_revisions_id) > -1) {
            return true;
          }
        }
        return false;
      });
    }
    this.backupRow = _.cloneDeep(this.params.data);
  }

  toggleChildOrgs(): void {
    event.stopImmediatePropagation();
    this.params.data['showChildren'] = !this.params.data['showChildren'];
    //rowNode.setRowHeight(height)
    this.params.api.resetRowHeights();
  }

  miscOptionChange(): void {
    let selectedMisc = this.params.miscExpense.filter((misc) => {
      if (misc.id == this.params.data.task_id) {
        return true;
      }
      return false;
    });
    this.prefilMarkup = 0;
    this.prefilRate = '';
    if (selectedMisc.length) {
      this.selectedMisc = selectedMisc[0];
      if (this.selectedMisc['types'] == 'Markup') {
        this.prefilMarkup = this.params.prefilMarkups[this.selectedMisc['id']];
      } else if (this.selectedMisc['types'] == 'Rate') {
        this.prefilRate = this.params.prefilRates[this.selectedMisc['id']];
      }
      this.params.data.misc_type = this.selectedMisc['types'];
      this.params.data.misc_type_id = this.selectedMisc['id'];
      this.params.data.gross_markup = this.prefilMarkup;
    } else {
      this.selectedMisc = {};
      this.params.data.misc_type = '';
      this.params.data.misc_type_id = 0;
      this.params.data.gross_markup = false;
    }
    this.params.data.gross_amount = (this.params.data.net_amount * (this.prefilMarkup / 100)) + this.params.data.net_amount;
    this.params.data.rate = this.prefilRate;
    this.params.data.net_amount = this.params.data.rate * this.params.data.units;
    this.params.data.gross_amount = this.params.data.rate * this.params.data.units;
    this.params.data.total = this.params.data.gross_amount;
    this.params.node.updateData(this.params.data);
    this.miscChange = true;
  }

  designationOptionChange(): void {
    let selectedDesignation = this.params.designations.filter((misc) => {
      if (misc.id == this.params.data.designation_id) {
        return true;
      }
      return false;
    });
    if (selectedDesignation.length) {
      this.selectedDesignation = selectedDesignation[0];
    } else {
      this.selectedDesignation = {};
    }
    this.params.data.rate = this.selectedDesignation['bill_rate'];
    this.params.data.net_amount = this.params.data.rate * this.params.data.units;
    this.params.data.gross_amount = this.params.data.rate * this.params.data.units;
    this.params.data.total = this.params.data.gross_amount;
    this.params.node.updateData(this.params.data);
    this.designationChange = true;
  }

  userOptionChange(): void {
    let selectedUser = this.params.users[this.params.data.designation_id].filter((misc) => {
      if (misc.users_id == this.params.data.users_id) {
        return true;
      }
      return false;
    });
    if (selectedUser.length) {
      this.selectedUser = selectedUser[0];
    } else {
      this.selectedUser = {};
    }
    this.params.data.rate = this.selectedUser['user_rating'];
    this.params.data.net_amount = this.params.data.rate * this.params.data.units;
    this.params.data.gross_amount = this.params.data.rate * this.params.data.units;
    this.params.data.total = this.params.data.gross_amount;
    this.params.node.updateData(this.params.data);
    this.userChange = true;
  }

  vendorCostOptionChange(): void {
    this.vendorCostChange = true;
  }

  getCostsDropdowns(): void {
  }

  getMiscDropdowns(): void {
  }

  getTaskDropdowns(): void {
  }

  editRow(): void {
    if (this.params.colDef.cellRendererParams['loadData']) {
      this.params['users'] = this.params.colDef.cellRendererParams['users'];
      this.params['tasks'] = this.params.colDef.cellRendererParams['tasks'];
      this.params['vendors'] = this.params.colDef.cellRendererParams['vendors'];
      this.params['miscExpense'] = this.params.colDef.cellRendererParams['miscExpense'];
      this.params['prefilMarkups'] = this.params.colDef.cellRendererParams['prefilMarkups'];
      this.params['prefilRates'] = this.params.colDef.cellRendererParams['prefilRates'];
      this.params['designations'] = this.params.colDef.cellRendererParams['designations'];
    }
    this.params.data.is_edit = true;
    this.params.api.resetRowHeights();
  }

  bundleServices(type: any, selected?: any): void {
    let jsr_ids = [];
    switch (type) {
      case 'product':
        _.map(this.params.data.children, (service) => {
          jsr_ids.push(service.jobs_service_revisions_id);
        });
        this.dialog.open(BundleServiceComponent, {
          panelClass: 'my-dialog',
          width: '500px',
          data: {
            title: (this.params.data.is_bundle) ? 'Unbundle Services' : 'Bundle Services',
            msg: 'Are you sure, you want to ' + ((this.params.data.is_bundle) ? 'Unbundle' : 'Bundle') + ' all services under <b>' + this.params.data.product_name + '</b>?',
            saveApi: 'saveEstmBundle',
            postParams: {
              estimates_id: this.activeRoute.snapshot.params.estimate_id,
              jsr_ids_from: (this.params.data.is_bundle) ? [] : jsr_ids,
              bundle_to: this.params.data.product_id,
              id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
              product_id: this.params.data.product_id,
              is_product: true,
              is_bundle: (this.params.data.is_bundle) ? false : true
            }
          }
        })
          .afterClosed()
          .subscribe(res => {
            if (res.success) {
              this.commonService.update({ reloadCo: true });
            }
          });
        break;
      case 'service':
        let jsr_from = [];
        let jsr_to = '';
        if (this.params.data.is_bundle) {
          jsr_from.push(selected.jobs_service_revisions_id);
          jsr_to = this.params.data.jobs_service_revisions_id;
        } else {
          jsr_from.push(this.params.data.jobs_service_revisions_id);
          jsr_to = selected.jobs_service_revisions_id;
        }
        this.dialog.open(BundleServiceComponent, {
          panelClass: 'my-dialog',
          width: '500px',
          data: {
            title: (this.params.data.is_bundle) ? 'Unbundle Costs' : 'Bundle Costs',
            msg: 'Are you sure you want to ' + ((this.params.data.is_bundle) ? 'Unbundle' + ' <b>' + selected.job_service_name + '</b> from <b>' + this.params.data.job_service_name + '</b>?' : 'Bundle' + ' <b>' + this.params.data.job_service_name + '</b> with <b>' + selected.job_service_name + '</b>?'),
            saveApi: 'saveEstmBundle',
            postParams: {
              estimates_id: this.activeRoute.snapshot.params.estimate_id,
              jsr_ids_from: jsr_from,
              bundle_to: jsr_to,
              product_id: this.params.node.parent.data.product_id,
              id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
              is_product: false,
              is_bundle: (this.params.data.is_bundle) ? false : true
            }
          }
        })
          .afterClosed()
          .subscribe(res => {
            if (res.success) {
              this.commonService.update({ reloadCo: true });
            }
          });
        break;
      case 'addCredit':
        let credit_jsr_from = [];
        let credit_jsr_to = '';
        if (this.params.data.is_bundle) {
          credit_jsr_from.push(selected.jobs_service_revisions_id);
          credit_jsr_to = this.params.node.parent.data.jobs_service_revisions_id;
        } else {
          credit_jsr_from.push(this.params.node.parent.data.jobs_service_revisions_id);
          credit_jsr_to = selected.jobs_service_revisions_id;
        }
        this.dialog.open(BundleServiceComponent, {
          panelClass: 'my-dialog',
          width: '500px',
          data: {
            title: (this.params.data.is_bundle) ? 'Unbundle Costs' : 'Bundle Costs',
            msg: 'Are you sure you want to ' + ((this.params.data.is_bundle) ? 'Unbundle credit from service?' : 'Bundle credit with service?'),
            saveApi: 'saveEstmBundle',
            postParams: {
              estimates_id: this.activeRoute.snapshot.params.estimate_id,
              jsr_ids_from: credit_jsr_from,
              bundle_to: credit_jsr_to,
              product_id: this.params.node.parent.data.product_id,
              id: (this.params.data.is_bundle) ? this.params.data.bundle.id : 0,
              is_product: false,
              is_bundle: (this.params.data.is_bundle) ? false : true
            }
          }
        })
          .afterClosed()
          .subscribe(res => {
            if (res.success) {
              this.commonService.update({ reloadCo: true });
            }
          });
        break;
    }

  }

  removeRow(): void {
    this.dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      data: {
        title: 'Delete Line Item',
        msg: 'Are you sure you want to delete line item?',
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.commonService.deleteApi('removeLineItem', {
          id: this.params.data.id,
        }) 
          .then(res => {
            if (res['result'] && res['result'].success) {
              this.params.api.updateRowData({ remove: [this.params.data] });
              this.commonService.update({ grandTotal: true });
              this.params.api.resetRowHeights();
              this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
            }  
          });
      }
    });
  }

  removeCreditCost(): void {
    this.dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      data: {
        title: 'Remove Credit Cost',
        msg: 'Are you sure you want to remove credit cost?',
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.commonService.deleteApi('removeCreditCost', {
          id: this.params.data.id,
          type: 'single'
        })
          .then(res => {
            if (res['result'] && res['result'].success) {
              this.params.api.updateRowData({ remove: [this.params.data] });
              this.commonService.update({ grandTotal: true });
            }
          });
      }
    });
  }

  addCreditCost(params: any) {
    params['estimates_services_id'] = this.params.node.data.id;
    params['jobs_service_revisions_id'] = this.params.node.data.jobs_service_revisions_id;
    params['estimates_id'] = this.params.node.data.estimates_id;
    params['jsr_rev_no'] = this.params.node.data.jsr_rev_no;
    params['jobs_forms_id'] = this.params.node.data.jobs_forms_id;
    let gross_amount = params.gross_amount.toString();
    if (gross_amount.indexOf('-') == -1) {
      params['gross_amount'] = '-' + gross_amount;
    }
    params['task_type'] = 4;
    this.commonService.saveApi('saveEstimateExpense', params)
      .then(res => {
        if (res['result'] && res['result'].success) {
          params['id'] = res['result'].data.id;
          this.params.api.updateRowData({ add: [params] });
          this.backupRow = _.cloneDeep(this.params.data);
          this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
          this.commonService.update({ grandTotal: true });
        }
      });
  }

  saveRow(): void {
    let valid = true;
    if (this.params.data.type == 'task') {
      if (this.params.data.designation_id == '' || this.params.data.task_id == '') {
        valid = false;
      }
      _.map(this.params.tasks, (item) => {
        if (item.id == this.params.data.task_id) {
          this.params.data.task_name = item.name;
        }
      });
      _.map(this.params.designations, (item) => {
        if (item.id == this.params.data.designation_id) {
          this.params.data.designation_name = item.name;
        }
      });
      _.map(this.params.users[this.params.data.designation_id], (item) => {
        if (item.users_id == this.params.data.users_id) {
          this.params.data.user_name = item.user_name;
        }
      });
    } else if (this.params.data.type == 'misc') {
      if (this.params.data.task_id == '') {
        valid = false;
      }
      _.map(this.params.miscExpense, (item) => {
        if (item.id == this.params.data.task_id) {
          this.params.data.misc_name = item.name;
          this.params.data.task_id = item.id;
          this.params.data.task_name = item.name;
        }
      });
      _.map(this.params.designations, (item) => {
        if (item.id == this.params.data.designation_id) {
          this.params.data.designation_name = item.name;
        }
      });
      _.map(this.params.users[this.params.data.designation_id], (item) => {
        if (item.users_id == this.params.data.users_id) {
          this.params.data.user_name = item.user_name;
        }
      });
      _.map(this.params.vendors, (item) => {
        if (item.id == this.params.data.vendors_id) {
          this.params.data.vendor_name = item.name;
        }
      });
    } else if (this.params.data.type == 'cost') {
      if (this.params.data.vendors_id == '') {
        valid = false;
      }
      _.map(this.params.tasks, (item) => {
        if (item.id == this.params.data.task_id) {
          this.params.data.task_name = item.name;
        }
      });
      _.map(this.params.vendors, (item) => {
        if (item.id == this.params.data.vendors_id) {
          this.params.data.vendor_name = item.name;
        }
      });
    } else if (this.params.data.type == 'addCredit') {

    }
    this.params.data['estimates_services_id'] = this.params.node.parent.data.id;
    this.params.data['jobs_service_revisions_id'] = this.params.node.parent.data.jobs_service_revisions_id;
    this.params.data['estimates_id'] = this.params.node.parent.data.estimates_id;
    this.params.data['jsr_rev_no'] = this.params.node.parent.data.jsr_rev_no;
    this.params.data['jobs_forms_id'] = this.params.node.parent.data.jobs_forms_id;
    if (valid) {
      this.commonService.saveApi('saveEstimateExpense', this.params.data)
        .then(res => {
          if (res['result'] && res['result'].success) {
            this.params.data.is_edit = false;
            this.params.data.id = res['result'].data.id;
            this.params.node.updateData(this.params.data);
            this.params.api.resetRowHeights();
            this.backupRow = _.cloneDeep(this.params.data);
            this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
            this.commonService.update({ grandTotal: true, data: this.params.data });
          }
        });
    }
  }

  resetRow(): void {
    let rowId = this.params.data.id;
    if (rowId.toString().indexOf('new_') == 0) {
      this.params.api.updateRowData({ remove: [this.params.data] });
      this.commonService.update({ grandTotal: true });
    } else {
      this.params.data.is_edit = false;
      this.params.data = _.cloneDeep(this.backupRow);
      this.params.node.updateData(this.params.data);
      this.params.api.resetRowHeights();
      this.commonService.update({ grandTotal: true, data: this.params.data });
    }
  }

  vendorOptionChange(event): void {
    let optionExists = false;
    let selectedVendor = {};
    this.params.data.options.map((vendor) => {
      if (vendor.vendors_id == event) {
        optionExists = true;
        selectedVendor = vendor;
      }
    });
    if (optionExists) {
      let vendor = {
        vendor_name: selectedVendor['vendor_name'],
        type: 'vendor',
        vendors_id: selectedVendor['vendors_id'],
        options: this.params.data.options,
        rate: 0.00,
        units: 0,
        net_amount: selectedVendor['net_amount'],
        gross_amount: selectedVendor['gross_amount'],
        total: selectedVendor['total'],
        id: this.params.data.id,
        estimates_id: this.params.estimates_id
      };
      this.commonService.saveApi('saveEstimateServices', {
        id: this.params.data.id,
        jobs_forms_id: selectedVendor['jobs_forms_id'],
        jobs_service_revisions_id: selectedVendor['jobs_service_revisions_id'],
        vendors_id: selectedVendor['vendors_id'],
        vendor_name: selectedVendor['vendor_name'],
        estimates_id: this.params.data.estimates_id,
        net_amount: selectedVendor['net_amount'],
        vendor_amount: selectedVendor['vendor_amount'],
        gross_amount: selectedVendor['gross_amount'],
        markup_amount: selectedVendor['markup_amount'],
        jsr_rev_no: selectedVendor['jsr_rev_no']
      })
        .then(res => {
          if (res['result'] && res['result'].success) {
            this.params.node.parent.data['jobs_forms_id'] = selectedVendor['jobs_forms_id'];
            this.params.node.parent.updateData(this.params.node.parent.data);
            this.params.node.updateData(vendor);
            this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
            this.commonService.update({ grandTotal: true, data: vendor });
          }
        });
    }
  }

  getEstimateDetails(event): void {
    event.stopPropagation();
    this.router.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + this.params.data.id]);
  }

  serviceCheck(): void {
    this.commonService.update({ estimateChk: this.params.data.selected });
  }

}
var APP: any = window['APP'];
@Component({
  template: `
  <div class="notes-section" *ngIf="params.data?.type=='vendor'">
  <div class="ag-cell-custome-actions">
  <ul>
  <li class="m-0" #specificationsPop="matMenuTrigger" [matMenuTriggerFor]="specsMenu" (click)="getSpecsInfo()">
    <i class="pixel-icons notes icon-specs"></i>
  </li>
  </ul>
  <mat-menu #specsMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before" class="onplace-dialog specs-menu">
      <div class="my-dialog" (click)="$event.stopPropagation()">
        <div class="d-heading">
          <h2>Specifications  <span class="indicator">Empty Specs will not printed in Estimates</span></h2>
         
          <button mat-icon-button (click)="specificationsPop.closeMenu();">
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
      <ul *ngIf="specs.length && !editNote">
        <ng-container *ngFor="let spec of specs">
          <li *ngIf="spec.checked">
            <div>{{spec.label}}</div>
            <div>{{spec.value.length ? spec.value : "--"}}</div>
          </li>
        </ng-container>
      </ul>
    <div class="edit-specs-list">
    <div class="chk-radio" *ngIf="specs.length && editNote">
    <pi-form-field *ngFor="let spec of specs;" class="child-check m-t-0 task" label="<div class='spec-label'>{{spec.label}}</div><div class='spec-value'>{{spec.value.length ? spec.value : '--'}}</div>">
        <input type="checkbox" pi-input [(ngModel)]="spec.checked" />
    </pi-form-field>
</div>
</div>
      <p *ngIf="!hasSepcs && !editNote">{{specs.length ? 'No Specifications Added.' : 'No Specifications Found.'}}</p>
    </div>
        </div>  
        <div class="d-footer">
            <button pi-button color="primary" *ngIf="!editNote && specs.length && params.estimates_status_id!=5 && params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0' && params.estimate.id==params.estimate.selected_revision" (click)="editNotes();">Edit</button>
            <button pi-button class="m-r-15" *ngIf="editNote" (click)="specificationsPop.closeMenu();">Cancel</button>
            <button pi-button color="primary" *ngIf="editNote" (click)="applyServiceSpec();specificationsPop.closeMenu();">Apply</button>
        </div>
      </div>
  </mat-menu>
  
  </div>
  </div>

  <div class="notes-section" *ngIf="params.data?.type=='service'">
  <div class="ag-cell-custome-actions">
  <ul>
  <li class="m-0" #notesPop="matMenuTrigger" [matMenuTriggerFor]="notesMenu" [ngClass]="{'note-exist':(params.data.notes && params.data.notes!='')}" (click)="getNotesInfo()"> <i class="pixel-icons notes icon-notes"></i></li>
  </ul> 
  <mat-menu #notesMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before" class="onplace-dialog {{(editNote)?' editor-grid':''}}">
      <div class="my-dialog" (click)="$event.stopPropagation()">
        <div class="d-heading">
          <h2>Notes</h2>
          <button mat-icon-button (click)="notesPop.closeMenu();">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="d-content">
        <div class="spinner-view" *ngIf="loader || !editorActive">
          <div class="empty-screen">
            <mat-spinner diameter="34" class="md parent-spinner"></mat-spinner>
          </div>                
        </div>
        <div class="specs-list-container" *ngIf="!loader">
          <p class="dialog-info-text"><i class="pixel-icons icon-info-circle"></i> This note will be printed in the estimate against the selected service.</p>
          <p *ngIf="!editNote && params.data.notes && params.data.notes!=''" [innerHtml]="params.data.notes"></p>
          <p style="margin-top: 20px; opacity: .8;" *ngIf="!editNote && (!params.data.notes || params.data.notes=='')">No Notes Added</p>
          <div class="custom-editor" *ngIf="editNote">
            <editor [init]="{plugins: 'link', branding: false, menubar:false, statusbar: false, toolbar: 'bold italic strikethrough forecolor backcolor permanentpen formatpainter | link image media pageembed | alignleft aligncenter alignright alignjustify'}" [class.hide]="!editorActive" (onInit)="onEditorActive()" [(ngModel)]="params.data.notes"></editor>
          </div>
        </div>
        </div>
        <div class="d-footer">
            <button pi-button color="primary" *ngIf="!editNote && params.estimates_status_id!=5 && params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0' && params.estimate.id==params.estimate.selected_revision" (click)="editNotes();">{{(!params.data.notes)?'Add':'Edit'}}</button>
            <button pi-button color="subtle" *ngIf="editNote" (click)="notesPop.closeMenu();">Cancel</button>
            <button pi-button color="primary" *ngIf="editNote" (click)="applyServicerNotes();notesPop.closeMenu();">Apply</button>
          </div>
      </div>
      
  </mat-menu>
  </div>
  </div>
    
  <div class="notes-section" *ngIf="params.data?.type=='addCredit'">
  <div class="ag-cell-custome-actions">
      <ul><li class="m-0" #creditNotesPop="matMenuTrigger" [ngClass]="{'note-exist':(params.data.notes && params.data.notes!='')}" [matMenuTriggerFor]="creditNotesMenu" (click)="getNotesInfo()">
      <i class="pixel-icons notes icon-notes"></i></li></ul>
    
    <mat-menu #creditNotesMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before" class="onplace-dialog editor-grid">
      <div class="my-dialog" (click)="$event.stopPropagation()">
        <div class="d-heading">
          <h2>Notes</h2>
          <button mat-icon-button (click)="creditNotesPop.closeMenu();">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="d-content">
        
        <div class="spinner-view" *ngIf="loader || !editorActive">
          <div class="empty-screen">
            <mat-spinner diameter="34" class="md parent-spinner"></mat-spinner>
          </div>                
        </div>
        <div class="specs-list-container" *ngIf="!loader">
        <p  class="dialog-info-text"><i class="pixel-icons icon-info-circle"></i> This note will be printed in the estimate against the selected service.</p>
          <div class="custom-editor" *ngIf="params.estimates_status_id!=5 && params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0' && params.estimate.id==params.estimate.selected_revision">
            <editor [init]="{plugins: 'link', branding: false, menubar:false, statusbar: false, toolbar: 'bold italic strikethrough forecolor backcolor permanentpen formatpainter | link image media pageembed | alignleft aligncenter alignright alignjustify'}" [class.hide]="!editorActive" (onInit)="onEditorActive()" [(ngModel)]="params.data.notes"></editor>
          </div> 
          <p *ngIf="(params.estimates_status_id==5 || params.estimates_status_id==4 || params.estimates_status_id==3 || params.estimate.parent_id!='0' || params.estimate.id!=params.estimate.selected_revision) && params.data.notes && params.data.notes!=''" [innerHtml]="params.data.notes"></p>
          <p *ngIf="(params.estimates_status_id==5 || params.estimates_status_id==4 || params.estimates_status_id==3 || params.estimate.parent_id!='0' || params.estimate.id!=params.estimate.selected_revision) && (!params.data.notes || params.data.notes=='')">No Notes Added</p>
        </div>
        </div>
        <div class="d-footer" *ngIf="!loader && params.estimates_status_id!=5 && params.estimates_status_id!=6 && params.estimates_status_id!=4 && params.estimates_status_id!=3 && params.estimate.parent_id=='0' && params.estimate.id==params.estimate.selected_revision">
            <button pi-button color="subtle" (click)="creditNotesPop.closeMenu();">Cancel</button>
            <button pi-button color="primary" (click)="applyNotes();creditNotesPop.closeMenu();">Apply</button>
          </div>
      </div>
    </mat-menu>
    </div>
    </div>
  `,
  styles: [`
    .pixel-icons.notes{
      margin: 0px 10px;
    }
    .specs-list-container.hide,.d-footer.hide{
       visibility: hidden;
    }
    .spec-icon{
      text-align: center;
      border: 1px solid rgba(23, 43, 77, 0.8);
      font-size: 10px;
      color: rgba(23, 43, 77, 0.8);
      padding: 0 4px;
      border-radius: 50%;
      margin-right: 5px;
      text-transform: capitalize;
      cursor: pointer;
      line-height: 1.4;
    }
    .mat-menu-content{
      display: flex;
      height: 100%;
      width: 100%;
      padding: 30px 30px 30px 30px;
    }
    .my-dialog{
      display: flex;
      flex-direction: column;
    }
  `]
})
export class displaySpecs implements OnInit {
  //<li class="m-0" #notesPop="matMenuTrigger" [matMenuTriggerFor]="notesMenu" (click)="getNotesInfo()"> <i class="pixel-icons notes icon-notes"></i></li>
  /*<mat-menu #notesMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before" class="more-grid-actions more-actions{{(editNote)?' editor-grid':''}}">
  <div class="my-dialog" (click)="$event.stopPropagation()">
  <div class="d-heading">
    <h2>Notes</h2>
    <button mat-icon-button (click)="notesPop.closeMenu();">
      <mat-icon>close</mat-icon>
    </button>
  </div>
  <div class="spinner-view" *ngIf="loader || !editorActive">
    <div class="empty-screen">
      <mat-spinner diameter="34" class="md parent-spinner"></mat-spinner>
    </div>                
  </div>
  <div class="specs-list-container" *ngIf="!loader">
    <p>This note will be printed in the estimate against the selected vendor.</p>
    <p *ngIf="!editNote && params.data.notes && params.data.notes!=''" [innerHtml]="params.data.notes"></p>
    <p *ngIf="!editNote && (!params.data.notes || params.data.notes=='')">No Notes Added</p>
    <div class="custom-editor" *ngIf="editNote">
      <editor [init]="{plugins: 'link'}" [class.hide]="!editorActive" (onInit)="onEditorActive()" [(ngModel)]="params.data.notes"></editor>
    </div>
  </div>
  <div class="d-footer">
      <button pi-button color="primary" *ngIf="!editNote" (click)="editNotes();">Edit</button>
      <button pi-button color="subtle" *ngIf="editNote" (click)="notesPop.closeMenu();">Cancel</button>
      <button pi-button color="primary" *ngIf="editNote" (click)="applyNotes()">Apply</button>
    </div>
</div>
</mat-menu>*/
  public APP = APP;
  public params: any;

  public loader = true;

  public hasSepcs: boolean = false;
  public specs = [];
  public spec_ids = [];

  public editorActive = false;

  public editNote = false;

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  constructor(
    private commonService: CommonService, private _snackbar: MatSnackBar) { }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  closeMessages() {
    this.trigger.closeMenu();
  }

  getSpecsInfo() {
    this.editNote = false;
    this.loader = true;
    this.commonService.getApi('jobPrdSpecs', {
      id: this.params.node.data.jobs_forms_id,
      jsr_id: this.params.data.jobs_service_revisions_id,
      revision_no: this.params.data.jsr_rev_no
    }).then(data => {
      this.loader = false;
      if (data['result'] && data['result'].success) {
        this.spec_ids = data['result'].data[0].is_show_estimate;
        this.specs = data['result'].data[0].values;
        let counter = 0;
        _.map(this.specs, (spec) => {
          spec['checked'] = (this.spec_ids.indexOf(spec.id) > -1) ? true : false;
          if (spec['checked']) counter++;
        });
        if (counter != 0) this.hasSepcs = true;
        else this.hasSepcs = false;
      }
    });
  }

  editNotes() {
    this.editorActive = false;
    this.editNote = true;
  }

  onEditorActive() {
    this.editorActive = true;
  }

  getNotesInfo() {
    this.editNote = false;
    this.loader = true;
    if (this.params.data.type == 'addCredit') {
      if (this.params.estimates_status_id == 5 || this.params.estimates_status_id == 4 || this.params.estimates_status_id == 3 || this.params.estimate.parent_id != '0' || this.params.estimate.id != this.params.estimate.selected_revision) {
        this.editorActive = true;
      }
      setTimeout(() => {
        this.loader = false;
      }, 100);
    } else {
      this.loader = false;
      this.editorActive = true;
    }
  }

  applyServiceSpec() {
    let params = {
      id: this.params.node.data.jobs_forms_id,
      jobs_service_revisions_id: this.params.node.parent.data.jobs_service_revisions_id,
      ids: []
    };
    _.map(this.specs, (spec) => {
      if (spec.checked) {
        params.ids.push(spec.id);
      }
    });
    this.commonService.saveApi('saveJobSpecs', params).then(res => {
      this._snackbar.openFromComponent(SnackbarComponent, {
        data: { status: 'success', msg: 'Specs Updated Successfully' },
        verticalPosition: 'top',
        horizontalPosition: 'right'
      });
    });
  }

  applyServicerNotes() {
    let param = {
      is_notes: true,
      id: this.params.data.notes_id,
      notes: this.params.data.notes
    };
    this.commonService.saveApi('saveEstimateExpense', param)
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.params.data.is_edit = false;
          this.params.data.id = res['result'].data.id;
          this.params.node.updateData(this.params.data);
          this.params.api.resetRowHeights();
          this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
          this.commonService.update({ grandTotal: true, data: this.params.data });
        }
      });
  }

  applyNotes() {
    this.params.data['estimates_services_id'] = this.params.node.parent.data.id;
    this.params.data['jobs_service_revisions_id'] = this.params.node.parent.data.jobs_service_revisions_id;
    this.params.data['estimates_id'] = this.params.node.parent.data.estimates_id;
    this.params.data['jsr_rev_no'] = this.params.node.parent.data.jsr_rev_no;
    this.params.data['jobs_forms_id'] = this.params.node.parent.data.jobs_forms_id;
    let gross_amount = this.params.data.gross_amount.toString();
    if (gross_amount.indexOf('-') == -1) {
      this.params.data['gross_amount'] = '-' + gross_amount;
    }
    this.commonService.saveApi('saveEstimateExpense', this.params.data)
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.params.data.is_edit = false;
          this.params.data.id = res['result'].data.id;
          this.params.node.updateData(this.params.data);
          this.params.api.resetRowHeights();
          this.commonService.update({ type: 'estimate-status-change', data: res['result'].data });
          this.commonService.update({ grandTotal: true, data: this.params.data });
        }
      });
  }

}