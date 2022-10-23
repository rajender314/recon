import { Component, ViewChild } from "@angular/core";
import { OwlDateTimeComponent } from "ng-pick-datetime";
import { CommonService } from "@app/common/common.service";
import { GridApi, RowNode, ColumnApi, Column, ColDef } from "ag-grid-community";

import * as _ from 'lodash';
import * as _moment from 'moment';
import { FormControl, Validators } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material";
import { TaskService } from "../task.service";

@Component({
  template: `<ng-container>
      <div *ngIf="params.data.type == 'parent'" style="display: flex;align-items: center;">
        <i class="pixel-icons icon-company-codes"></i>
        <span [innerHtml]="params.value"></span>
      </div>
      <div class="ag-radio-field" *ngIf="params.data.type == 'template'">
        <pi-form-field label="<i class='pixel-icons icon-schedule-templates'></i>{{params.value}}" style="margin-top: 0;">
          <input type="radio" name="template" [(ngModel)]="params.colDef.cellRendererParams.selectedId" pi-input [value]="params.data.id" />
        </pi-form-field>
      </div>
      <div *ngIf="params.data.type == 'no-data'">
        <span [innerHtml]="params.value"></span>
      </div>
    </ng-container>`,
  styles: [`
    .icon-company-codes { font-size: 16px;width: 16px;height: 16px;margin: 0 8px; }
    ::ng-deep .ag-radio-field .ak-field-radio+label{
      cursor: pointer;
    }
    ::ng-deep .ag-radio-field .ak-field-radio+label::after { top: 15px; }
    ::ng-deep .ag-radio-field  .ak-field-radio+label  .icon-schedule-templates{    font-size: 18px;  line-height: 1; height: 20px;  position: relative; top: 2px; }
  `]
})

export class TemplateNameCell {
  params: any;
  agInit(params) {
    this.params = params;
  }
}

@Component({
  template: `<ng-container>
      <ng-container>
        <div style="display: flex;">
          <pi-form-field label=" " style="margin-top: 0;">
            <input type="checkbox" pi-input [(ngModel)]="params.data.selected" (ngModelChange)="selectionChange()" />
          </pi-form-field>
          <b *ngIf="params.data.type == 'parent'" [innerHtml]="params.value"></b>
        </div>
        <div class="sub-tasks-grid-icon" *ngIf="params.data.type == 'child'" [matTooltip]="params.data?.parentLabel">
          <i class="pixel-icons icon-sub-task"></i>
          <b [innerHtml]="params.value"></b>
        </div>
      </ng-container>
  </ng-container>`,
  styles: [`
    :host { display: flex;justify-content: space-between; }
  `]
})

export class TemplateOrderCell {
  params: any;
  agInit(params) {
    this.params = params;
  }
  constructor(private _taskService: TaskService) { }
  selectionChange() {
    if (this.params.data.hasOwnProperty('subtask_list')) {
      this.params.data.subtask_list.map(o => {
        const row: RowNode = (<GridApi>this.params.api).getRowNode(o.id);
        if (row) {
          row.data.selected = this.params.data.selected;
          // row.setData(row.data);
          // row.updateData(row.data);
        }
      })
    }else if(this.params.data.parent_id && this.params.data.parent_id!=0 && this.params.data.selected){
      const parentRow: RowNode = (<GridApi>this.params.api).getRowNode(this.params.data.parent_id);
      if (parentRow) {
        parentRow.data.selected = true;
      }
    }
    this._taskService.update({ type: 'template-grid-date-disable', data: null });
  }
}

@Component({
  template: `<ng-container>
        <ng-container *ngIf="params.data.task_type == 1">
          <pi-select [options]="params.taskTypes['list']" [formControl]="taskType" [inactiveOptions]="[45, 46, 33, 39]" [disabled]="!params.data.selected"></pi-select>
          <span *ngIf="taskType.hasError('required') && params.data.selected && submitted" class="error">Please Select Task Type</span>
        </ng-container>
        <ng-container *ngIf="params.data.task_type == 2">
          <span style="line-height:50px;">Milestones</span>
        </ng-container>
     </ng-container>`,
  styles: [`
    :host { line-height: initial;display: flex;flex-direction: column; }
    .error { color: #f00; }
    .pi-form-field { margin-top: 0; }
  `]
})

export class TemplateTaskTypeCell {
  params: any;
  submitted: boolean = false;
  taskType = new FormControl(2, Validators.required);
  agInit(params) {
    this.params = params;
    if (params.data.task_type == 2) {
      params.data.task_type_id = 39;
      this.updateParams(39);
    }
    this.taskType.valueChanges.subscribe(val => {
      params.data.task_type_id = val;
      this.submitted = false;
      this.updateParams(val);
    })

    this.submitted = params.submitted;
  }

  constructor(private _taskService: TaskService) {
    _taskService.onUpdate().subscribe(ev => {
      if (ev.type == 'template-grid-validation') {
        this.submitted = ev.data;
      }
    })
  }

  updateParams(id) {
    const tasktype = _.find(this.params.taskTypes['list'], ['id', id]);
    if (tasktype) {
      this.params.data.task_type_id = tasktype.id;
      this.params.data.task_type_name = tasktype.name;
      this.params.data.billing_type_id = tasktype.billing_type_id;
      this.params.data.status_ids = tasktype.status_ids;
    }
  }
}

@Component({
  // template: `<div class="product-services-icon-container">
  //             <div *ngIf="params.data.products || params.data.services" 
  //               [matMenuTriggerFor]="ProdSerMenu" 
  //               #productsMenuPop="matMenuTrigger" 
  //               class="vertical-center-ui" 
  //               (click)="getProductServices()">
  //                 <div class="products-count" *ngIf="params.data.products">
  //                   <i class="pixel-icons icon-products"></i>
  //                   <span class="count">{{params.data.products}}</span>
  //                 </div>
  //                 <div class="service-count" *ngIf="params.data.services">
  //                   <i class="pixel-icons icon-orders"></i>
  //                   <span class="count">{{params.data.services}}</span>
  //                 </div>
  //                 <mat-menu class="onplace-dialog" #ProdSerMenu="matMenu">
  //                   <div class="my-dialog" (click)="$event.stopPropagation()">
  //                     <div class="d-heading">
  //                       <h2>Products & Services</h2>
  //                       <button mat-icon-button (click)="$event.stopPropagation();productsMenuPop.closeMenu();">
  //                         <i class="pixel-icons icon-close-slim"></i>
  //                       </button>
  //                     </div>
  //                     <div class="d-content" [class.hide-check]="!params.edit" [class.view-check]="params.edit">
  //                       <div class="products-container-schedule">
  //                         <div class="product" *ngFor="let product of products">
  //                           <div class="product-name">
  //                             <i class='pixel-icons icon-products' *ngIf="!params.edit"></i>
  //                             <div *ngIf="!params.edit">{{product.name}}</div>
  //                             <div class=" chk-radio" *ngIf="params.edit">
  //                               <pi-form-field label="<i class='pixel-icons icon-products'></i><span>{{product.name}}</span>">
  //                                 <input type="checkbox" pi-input (change)="checkAllServices(product,product.selected)" [(ngModel)]="product.selected"  />
  //                               </pi-form-field>
  //                             </div>
  //                           </div>
  //                           <div class="service" *ngFor="let service of product.services">
  //                             <div class="service-name">
  //                               <i class="pixel-icons icon-orders" *ngIf="!params.edit"></i>
  //                               <div *ngIf="!params.edit"><span>{{service.name}}</span></div>
  //                               <div class=" chk-radio" *ngIf="params.edit">
  //                                 <pi-form-field label="<i class='pixel-icons icon-orders' ></i><span>{{service.name}}</span>">
  //                                   <input type="checkbox" pi-input (change)="checkService(product, service.selected)" [(ngModel)]="service.selected" />
  //                                 </pi-form-field>
  //                               </div>
  //                             </div>
  //                           </div>
  //                         </div>
  //                       </div>
  //                     </div>
  //                     <div class="d-footer" *ngIf="params.edit">
  //                       <button pi-button (click)="update();" [disabled]="disableUpdate" color="primary">Update</button>
  //                     </div>
  //                   </div>
  //                 </mat-menu>
  //               </div>
  //             </div>`,
  template: `<ng-container>
              <!-- *ngIf="params.data.products || params.data.services" -->
              <div [matMenuTriggerFor]="productsMenu" #productsTrigger="matMenuTrigger" 
                class="vertical-center-ui" (click)="getProductServices()">
                <div class="products-count">
                  <i class="pixel-icons icon-products"></i>
                  <span class="count">{{displayText.products || '--'}}</span>
                </div>
                <div class="service-count">
                  <i class="pixel-icons icon-orders"></i>
                  <span class="count">{{displayText.services || '--'}}</span>
                </div>
                <i class='pixel-icons icon-info-circle' *ngIf="!displayText.products && params.data.selected && submitted && params.data.task_type_id=='1'" title="Please Select Service"></i>
              </div>
              
              <mat-menu #productsMenu="matMenu" xPosition="after" class="associate-products-list">
                <div class="recon-action-dropdown " (click)="$event.stopPropagation();">
                  <header>
                    <p>Products/Services</p>
                      <div class="d-flex align-items-center">
                        <a class="anch-clear" (click)="resetProductSelection()">Clear</a>
                        <button *ngIf="products.length" pi-button color="primary"
                          (click)="productsTrigger.closeMenu();save(products)">Done</button>
                      </div>
                  </header>
                <aside>
                <mat-spinner diameter="45" class="md" *ngIf="isLoading"></mat-spinner>
                <div class="nested-products-container" *ngIf="!isLoading" style="max-height: 320px; overflow: auto;">
                  <div class="product-group-with-services" *ngFor="let product of products">
                    <div class="main-product-name">
                      <div class="ak-field-group chk-radio">
                        <pi-form-field
                          label="<i class='pixel-icons icon-products'></i><span>{{product.name}}</span>">
                          <input type="radio" pi-input name="product"
                            (change)="checkAllServices(product,product.selected)"
                            [formControl]="productControl" [value]="product.id" />
                        </pi-form-field>
                      </div>
                    </div>
                    <div class="main-service-name" *ngFor="let service of product.services">
                      <div class="service-name">
                        <div class="ak-field-group chk-radio">
                          <pi-form-field
                            label="<i class='pixel-icons icon-orders' ></i><span>{{service.name}}</span>">
                            <input type="radio" pi-input name="service"
                              (change)="checkService(product, service.selected)"
                              [formControl]="serviceControl" [value]="service.jsr_id" />
                          </pi-form-field>
                        </div>
                      </div>
                    </div>
                  </div>
                <div *ngIf="!products.length">No Products/Services Added</div>
              </div>
            </aside>
          </div>
        </mat-menu>
      </ng-container>`,
  styles: [`
    .icon-info-circle{
      font-size: 18px;
      display: flex;
      align-items: center;
      padding-left: 6px;
      color: #f65a63;
    }
  `]
})

export class TemplateProductServiceCell {
  params: any;
  isLoading: boolean = false;
  submitted: boolean = false;
  products: Array<any> = [];
  displayText = {
    products: 0,
    services: 0
  }
  productControl = new FormControl();
	serviceControl = new FormControl();
  constructor(
    private _commonService: CommonService,
    private _taskService: TaskService
  ) { 
    _taskService.onUpdate().subscribe(ev => {
      if (ev.type == 'template-grid-validation') {
        this.submitted = ev.data;
      }
    })
  }
  agInit(params) {
    this.params = params;
  }
  getProductServices(): void {
    this.isLoading = true;
    this._commonService.getApi('getVendorProdServices', {
      jobs_id: this.params.jobs_id,
      type: 'task'
    })
      .then(res => {
        this.isLoading = false;
        this.products = res['result'].data;
      });
  }

  resetProductSelection() {
		this.productControl.setValue('');
		this.serviceControl.setValue('');
		this.updateSelection();
  }
  
  updateSelection() {
		this.products.map(p => {
			if (p.id == this.productControl.value) {
				p.selected = true;
				p.services.map(s => {
					if (s.jsr_id == this.serviceControl.value) {
						s.selected = true;
					} else {
						s.selected = false;
					}
				})
			} else {
				p.selected = false;
			}
		});
  }
  checkAllServices(product: any, status: any): void {
		this.serviceControl.setValue(product.services[0].jsr_id);
		this.updateSelection();
  }
  checkService(product: any, status: any): void {
		this.productControl.setValue(product.id);
		this.updateSelection();
  }
  getServiceCount() {
		let services = [];
		this.products.map(p => {
			if (p.selected && p.services.length) {
				p.services.map(s => {
					if (s.selected) services.push(s);
				})
			}
		});
		return services;
  }
  save() {
    let services = [], products = {};
			this.products.map(p => {
				if (p.selected) {
					products[p.id] = [];
					p.services.map(s => {
						if (s.selected) {
							products[p.id].push(s.jsr_id);
							services.push(s.jsr_id);
						}
					})
				}
			})
			if (services.length) {
				this.params.data.associate_products = services;
        this.params.data.products = products;
        this.submitted = false;
      }
      this.displayText = {
        products: this.products.filter(p => p.selected).length,
        services: services.length
      }
  }
}

@Component({
  template: `<ng-container *ngIf="params.data">
      <ng-container *ngIf="params.data.task_type == 1">
        <div class="template-assignee-cell">
          <div class="container custom-arrow">
            <pi-select label="" [options]="params.userTypes" [formControl]="selectedUserType" [disabled]="!params.data.selected"></pi-select>
              <div class="dropdown"><i class="pixel-icons icon-triangle-arrow-up"></i>
              <i class="pixel-icons icon-triangle-arrow"></i>
            </div>
          </div>
          <div style="line-height: initial;">
            <pi-select [options]="params.usersList[selectedUser?.key] || []" nameKey="name" [formControl]="selectedUserID" [disabled]="!params.data.selected"></pi-select>
            <span class="error" *ngIf="selectedUserID.hasError('required') && params.data.selected && submitted">Please Select User</span>
          </div>
        </div>
      </ng-container>
      <div *ngIf="params.data.task_type == 2" class="no-data">---</div>
    </ng-container>`,
  styles: [`
    :host { display: flex; }
    .error { color: #f00; }
    .no-data { display: flex;width: 100%;align-items: center;justify-content: center; }
    ::ng-deep .template-assignee-cell .pi-form-field { margin-top: 0; }
    ::ng-deep .template-assignee-cell { display: flex;width: 100%;justify-content: space-between; }
    ::ng-deep .template-assignee-cell .custom-arrow { width: 130px;position: relative; }
    ::ng-deep .template-assignee-cell .custom-arrow .pi-form-field { max-width: 125px;min-width: 125px; }
    ::ng-deep .template-assignee-cell .pi-form-field { max-width: 150px;min-width: 150px; }
    ::ng-deep .template-assignee-cell .custom-arrow .pi-select-input { border: 0;background: 0 0;color: rgba(23,43,77,.8); }
    ::ng-deep .template-assignee-cell .custom-arrow .pi-select-input .icon-arrow-down { display: none; }
    ::ng-deep .template-assignee-cell .custom-arrow .pi-select-input.active { box-shadow: none; }
    ::ng-deep .template-assignee-cell .custom-arrow .pi-select-input:focus { box-shadow: none; }
    ::ng-deep .template-assignee-cell .custom-arrow .dropdown { position: absolute;height: 38px;width: 14px;top: -2px;right: 18px;
      display: flex;align-items: center;justify-content: center;line-height: 38px;flex-direction: column; }
      ::ng-deep .template-assignee-cell .custom-arrow .dropdown .icon-triangle-arrow-up { font-size: 8px;width: 8px;height: 8px;line-height: 8px;margin: 0; }
      ::ng-deep .template-assignee-cell .custom-arrow .dropdown .icon-triangle-arrow{ font-size: 8px;width: 8px;height: 8px;line-height: 8px;margin: 0; }
  `]
})

export class TemplateAssigneeCell {
  params: any;
  submitted: boolean = false;
  selectedUserType = new FormControl(1);
  selectedUserID = new FormControl('', Validators.required);
  selectedUser: any;
  agInit(params) {
    this.params = params;
    if (params.data) {
      this.changeUserType(params.data.user_type == 1 ? 1 : 2);
      this.selectedUserType.setValue(params.data.user_type == 1 ? 1 : 2);
      if (params.data.user_type == 3 && params.data.user_id == 2) {
        this.selectedUserID.setValue(params.jobCoordinators[0]);
        params.data.user_id = params.jobCoordinators[0];
      } else {
        const user = _.find(params.usersList[this.selectedUser.key], ['id', params.data.selected_id]);
        if(user) this.selectedUserID.setValue(params.data.selected_id);
      }

      this.selectedUserType.valueChanges.subscribe(val => {
        params.data.user_type = val;
        params.data.user_id = '';
        this.selectedUserID.setValue('');
        this.changeUserType(val);
      })

      this.selectedUserID.valueChanges.subscribe(val => {
        if (val) {
          this.submitted = false;
          params.data.user_id = val;
          const user = _.find(params.usersList[this.selectedUser.key], ['id', val]);
          if (user) {
            params.data.user_name = user.name;
          }
        }
      })
    }

    this.submitted = params.submitted;
  }

  constructor(private _taskService: TaskService) {
    _taskService.onUpdate().subscribe(ev => {
      if (ev.type == 'template-grid-validation') {
        this.submitted = ev.data;
      }
    })
  }

  changeUserType(val) {
    let arr = this.params.userTypes.filter(o => {
      if (o.id == val) return o;
    })
    if (arr.length) this.selectedUser = arr[0];
  }
}

@Component({
  template: `<div class="template-pi-field" *ngIf="params.data">
      <ng-container *ngIf="params.field == 'start_date' ? params.data.task_type == 1 : true">
        <pi-form-field [label]=" " class="date-field">
          <input pi-input matInput 
            [min]="minDate" [max]="maxDate" 
            [owlDateTime]="picker" 
            [formControl]="value" 
            placeholder="MM-DD-YYYY HH:MM"
            [owlDateTimeTrigger]="picker"
            (dateTimeChange)="onSelectChange()"
            placeholder="Choose a date" readonly>
          <div class="owl-picker-toggle">
            <i class="pixel-icons icon-calendar" [owlDateTimeTrigger]="picker"></i>
          </div>
          <owl-date-time #picker (afterPickerOpen)="openPicker()" (afterPickerClosed)="closePicker()" [hour12Timer]="true"></owl-date-time>
        </pi-form-field>
        <span class="error" *ngIf="value.hasError('required') && params.data.selected && submitted">Please Select Due Date</span>
      </ng-container>
      <div *ngIf="params.field == 'start_date' && params.data.task_type == 2" class="no-data">---</div>
    </div>`,
  styles: [`
    :host {     display: flex;  align-items: center; height: 100%; }
    .error { color: #f00; }
    ::ng-deep .template-pi-field { height: 100%; }
    ::ng-deep .template-pi-field .pi-form-field { margin-top: 0;height: 100%; }
    ::ng-deep .template-pi-field .pi-form-field .pi-field { height: 100%; }
    ::ng-deep .template-pi-field .pi-form-field .pi-field input { height: 100%; }
    ::ng-deep .template-pi-field .pi-form-field .pi-field .owl-picker-toggle { right: 4px; }
    ::ng-deep .template-pi-field .pi-form-field .pi-field .owl-picker-toggle i.icon-calendar { width: 16px;height: 16px;font-size: 16px; top: 0; }
    .no-data { display: flex;width: 100%;align-items: center;justify-content: center; }
    `]
})

export class AgOwlDatePickerCell {
  @ViewChild('picker', { read: OwlDateTimeComponent }) picker: OwlDateTimeComponent<Date>;
  params: any;
  minDate = new Date();
  maxDate = null;
  value = new FormControl(null, Validators.required);
  submitted: boolean = false;
  agInit(params) {
    this.params = params;
    if (params.value) {
      this.value.setValue(new Date(params.value));
    } else if (params.field == 'start_date') {
      this.value.setValue(new Date());
      params.data.start_date = _moment(this.value.value).format('MMM DD, YYYY hh:mm:ss');
    }

    if (params.field == 'due_date') {
      if (params.data.selected) {
        this.value.enable();
      } else {
        this.value.disable();
      }
    }

    this.value.valueChanges.subscribe(val => {
      if (val) this.submitted = false;
    })

    this.submitted = params.submitted;
  }
  constructor(private _taskService: TaskService) {
    _taskService.onUpdate().subscribe(ev => {
      if (ev.type == 'template-grid-validation') {
        this.submitted = ev.data;
      } else if (ev.type == 'template-grid-date-disable') {
        if (this.params.field == 'start_date') {
          if (this.params.data.selected) {
            this.value.enable();
          } else {
            this.value.disable();
          }
        }
      }
    })
  }
  openPicker() {
    if (this.params.field == 'due_date') {
      this.minDate = this.params.data.start_date ? new Date(this.params.data.start_date) : new Date();
    }
  }
  onSelectChange(): void {
    this.params.data[this.params.field] = _moment(this.value.value).format('MMM DD, YYYY hh:mm:ss');
  }
  closePicker() {
  }

}

@Component({
  template: `<ng-container>
      <div class="ag-cell-custome-actions">
        <ul>
          <li [matMenuTriggerFor]="noteMenu" #noteTrigger="matMenuTrigger" [class.has-text]="value.value" (click)="menuClick()">
            <i class="pixel-icons icon-notes"></i>
          </li>
        </ul>
      </div>
      <mat-menu #noteMenu="matMenu" [overlapTrigger]="false" yPosition="below" xPosition="before"
	      class="ag-note-container">
          <div class="my-dialog" (click)="$event.stopPropagation()">
          <div class="spinner-view" *ngIf="isLoading">
            <div class="empty-screen">
              <mat-spinner diameter="34" class="md parent-spinner"></mat-spinner>
            </div>
          </div>
            <div class="note-screen" *ngIf="!isLoading">
              <div class="info">
                <h2>Notes</h2>
                <button (click)="closeMenu()" mat-icon-button tabindex="-1">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="note-container">
                <pi-form-field>
                  <textarea pi-input placeholder="" [formControl]="value" rows="4" minRows="4"
                    maxRows="4"></textarea>
                </pi-form-field>
              </div>
              <div class="note-footer">
                <button pi-button class="m-r-15" (click)="closeMenu()">Cancel</button>
                <button pi-button color="primary" (click)="saveNote()">Save</button>
              </div>
            </div>

          </div>
      </mat-menu>
    </ng-container>`,
  styles: [`
    :host { display: flex;height: 100%; }
    .ag-cell-custome-actions { display: flex;align-items: center; }
    .ag-cell-custome-actions ul { padding: 0; }
      ::ng-deep .ag-note-container { max-width: 100%;width: 350px;height: 250px;overflow: hidden; }
      ::ng-deep .ag-note-container .mat-menu-content { padding: 0;height: 100%; }
      ::ng-deep .ag-note-container .note-screen .info { display: flex;align-items: center;padding: 10px;
        border-bottom: 1px solid #f5f5f5;justify-content: space-between; }
      ::ng-deep .ag-note-container .note-screen { height: 100%;display: flex;flex-direction: column; }
      ::ng-deep .ag-note-container .my-dialog { height: 100%;position: relative; }
      ::ng-deep .ag-note-container .note-screen .note-container { padding: 10px;height: calc(250px - 69px);flex: 1; }
      ::ng-deep .ag-note-container .note-screen .note-container .pi-form-field { margin-top: 0; }
      ::ng-deep .ag-note-container .note-screen .note-footer { padding: 10px;display: flex;align-items: center;justify-content: flex-end; }
    `]
})

export class AgNoteCell {
  @ViewChild(MatMenuTrigger) noteTrigger: MatMenuTrigger;
  isLoading: boolean = true;
  params: any;
  value = new FormControl('');
  agInit(params) {
    this.params = params;
    params.data.note = params.value;
    this.value.setValue(params.value);
  }

  menuClick() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 200);
  }

  saveNote() {
    this.params.data.note = this.value.value;
    this.noteTrigger.closeMenu();
  }

  closeMenu() {
    this.noteTrigger.closeMenu();
    this.value.reset(this.params.value);
  }
}