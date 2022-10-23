import { Component, ViewChild } from "@angular/core";
import { CommonService } from "@app/common/common.service";
import { MatSnackBar } from "@angular/material";
import { GridApi, RowNode } from "ag-grid-community";
import { SnackbarComponent } from "@app/shared/material/snackbar/snackbar.component";
import { FormControl, Validators } from "@angular/forms";
import { OwlDateTimeComponent } from "ng-pick-datetime";

import * as _moment from 'moment';

import * as _ from 'lodash';

@Component({
    template: `<div *ngIf="params.data">
					<div *ngIf="params.data.is_enable && params.data.slug != 'delivery_due_date'" [matMenuTriggerFor]="menu" class="empty-status status-pills status_{{params.data.status}} {{params.value | lowercase}}">
						<span class="{{params.value | lowercase}}"> {{params.value}}</span>
						<i class="pixel-icons icon-arrow-down"></i>
					</div>
					<div *ngIf="!params.data.is_enable || params.data.slug == 'delivery_due_date'" class="status-pills {{params.value | lowercase}}">
						<span [innerHtml]="params.value"></span>
					</div>
					<mat-menu #menu="matMenu" xPosition="after" yPosition="below" class="drop-menu-ui">
							<a *ngFor="let st of params.data.status_dropdown" [innerHtml]="st.name"
								(click)="performActions(st)"
								[class.active]="st.id == params.data.status"></a>
						</mat-menu>
				</div>`,
    styles: [`
	.empty-status.status-pills.status_0{
		background: #f4e4d8;
		color: #90574c;
		line-height: normal;
		height: 100%;
		display: inline-flex;
		justify-content: space-between;
		padding: 1px 8px 1px 4px;
	}
	`]
})

export class StatusMenuCell {
    params: any;
    constructor(private _commonService: CommonService, private _snackbar: MatSnackBar) { }
    agInit(params) {
        this.params = params;
    }
    performActions(st) {console.log('custom cell', this.params)
        this._commonService.saveApi('taskFlow', {
            jobs_id: this.params.jobs_id,
            id: this.params.data.id,
            status_id: st.id,
            key: st.key,
            task_id: this.params.data.task_id
        })
            .then(res => {
                if (res['result'].success) {
                    this._commonService.update({ type: 'job_status', data: null });
                    if (res['result'].data.status) {
                        if (!this.params.isGlobal) {
                            if (this.params.data.slug == 'deliver') {
                                (<GridApi>this.params.api).getModel().forEachNode((node: RowNode) => {
                                    if (node.data.slug == 'delivery_due_date' && st.id == 5) {
                                        node.data.is_enable = false;
                                        node.data.status = st.id;
                                        node.data.status_name = st.name;
                                        node.data.status_dropdown = res['result'].data.status_dropdown || [];
                                        node.setData(node.data);
                                    }
                                })
                            }
                            if (this.params.data.slug == 'final_bill_due') {
                                (<GridApi>this.params.api).getModel().forEachNode((node: RowNode) => {
                                    if (node.data.slug == 'final_bill_due_date' && st.id == 5) {
                                        node.data.is_enable = false;
                                        node.data.status = st.id;
                                        node.data.status_name = st.name;
                                        node.data.status_dropdown = res['result'].data.status_dropdown || [];
                                        node.setData(node.data);
                                    }
                                })
                            }
                        }
                        this.params.data.is_enable = st.id == 5 ? false : true;
                        this.params.data.status = st.id;
                        this.params.data.status_name = st.name;
                        this.params.data.status_dropdown = res['result'].data.status_dropdown || [];
                        this.params.node.setData(this.params.data);
                    } else {
                        this.snackbarModal('error', false, res['result'].data.message);
                    }
                }
            })
    }

    snackbarModal(status = 'success', isNew = true, msg?) {
        this._snackbar.openFromComponent(SnackbarComponent, {
            data: { status: status, msg: msg ? msg : ('Task ' + (isNew ? 'Created ' : 'Updated ') + ' Successfully') },
            verticalPosition: 'top',
            horizontalPosition: 'right',
            panelClass: status
        });
    }
}

@Component({
    template: `<ng-container *ngIf="params.data">
        <div class="delete-org" [title]="params.tooltip" #removeOrgPop="matMenuTrigger" [matMenuTriggerFor]="removeOrgMenu"> 
        <div class="ag-cell-custome-actions">
        <ul>
            <li class="m-0"> <i class="pixel-icons icon-delete"></i></li>
        </ul> 
        </div>
        </div>
        <mat-menu #removeOrgMenu="matMenu" class="card-ui row-card colored bg-delete">
            <div class="card row-card" (click)="$event.stopPropagation()">
                <div class="card-header">
                    <i class="pixel-icons icon-exclamation"></i>
                </div>
                <div class="card-body">
                    <h5 class="card-title" [innerHtml]="params.tooltip"></h5>
                    <p class="card-text">Are you sure you want to delete <strong [innerHtml]="params.data.org_display_name"></strong>?</p>
                    <div class="footer">
                        <a class="card-link text-btn" (click)="removeOrgPop.closeMenu()">Cancel</a>
                        <a class="card-link act-btn" (click)="removeRow();removeOrgPop.closeMenu();">Delete</a>
                    </div>
                </div>
            </div>
        </mat-menu>
    </ng-container>`,
    styles: [`
        .delete-org{
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .delete-org .icon-delete{
            font-size: 16px;
            height: 16px;
            width: 16px;
            cursor: pointer;
            color: rgba(0,0,0,0.54);
        }
    `]
})
export class DeleteMenuCell {
    params: any;
    constructor(
        private _commonService: CommonService
    ) { }
    agInit(params) {
        this.params = params;
    }

    removeRow() {
        (<GridApi>this.params.api).updateRowData({ remove: [this.params.data] });
        /*if(this.params.url) {
            this._commonService.deleteApi(this.params.url, {
                id: this.params.data.id,
                org_id: this.params.data.org_id,
                ...this.params.deleteParams
              })
              .then(res => {
                if (res['result'] && res['result'].success) {
                    (<GridApi>this.params.api).updateRowData({remove: [this.params.data]});
                }
              });
        } else {
            (<GridApi>this.params.api).updateRowData({remove: [this.params.data]});
        }*/
    }
}

@Component({
    template: `<ng-container>
        <pi-select [options]="options" [nameKey]="params.nameKey || 'name'" [formControl]="selectControl"></pi-select>
        <span class="error" *ngIf="selectControl.hasError('required') && submitted">Please Select {{params.label}}</span>
    </ng-container>`,
    styles: [`
        :host { display: flex; align-items: center;height: 100%; }
        .pi-form-field { margin-top: 0;width: 100%; }
        
        .error { position: absolute;bottom: 2px;font-size: 12px;line-height: 1;background: #fff;color: #f00; }

    `]
})

export class AgPiSelectRenderer {
    params: any;
    selectControl = new FormControl('');
    options = [];
    submitted: boolean = false;
    constructor(private _commonService: CommonService) {
        _commonService.onUpdate().subscribe(ev => {
            if (ev.type == 'ag-grid-validation') {
                this.submitted = ev.data;
            }
        })
    }
    agInit(params) {
        this.params = params;
        this.options = this.params.options || [];
        if (this.params.value) {
            if (this.params.checkAvailablility) {
                const name = this.getName(this.params.value, this.options);
                if (name) this.selectControl.setValue(this.params.value);
            } else {
                this.selectControl.setValue(this.params.value);
            }
        }
        if (this.params.isRequired) this.selectControl.setValidators([Validators.required]);
        if (this.params.displayName) {
            if (!this.params.data[this.params.displayName] && this.selectControl.value) this.params.data[this.params.displayName] = this.getName(this.selectControl.value, this.options);
            this.selectControl.valueChanges.subscribe(val => {
                this.submitted = false;
                this.params.data[this.params.column.colId] = val;
                this.params.data[this.params.displayName] = this.getName(val, this.options);
            })
        }
        this.submitted = params.submitted;
    }

    getName(id, options) {
        const obj = _.find(options, ['id', id]);
        if (obj) return obj[this.params.nameKey || 'name'];
        else ''
    }
}

@Component({
    template: `<div class="template-pi-field" *ngIf="params.data">
        <ng-container *ngIf="showPicker">
        <!-- *ngIf="params.field == 'start_date' ? params.data.task_type == 1 : true" -->
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
          <span class="error" *ngIf="value.hasError('required') && submitted">Please Select {{params.label}}</span>
        </ng-container>
        <div *ngIf="!showPicker" class="no-data">---</div>
        <!-- *ngIf="params.field == 'start_date' && params.data.task_type == 2" -->
      </div>`,
    styles: [`
      :host { height: 30px;display: flex; }
      .error { position: absolute;bottom: 2px;font-size: 12px;line-height: 1;
        background: #fff;color: #f00; }
      ::ng-deep .template-pi-field { height: 100%; }
      ::ng-deep .template-pi-field .pi-form-field { margin-top: 0;height: 100%; }
      ::ng-deep .template-pi-field .pi-form-field .pi-field { height: 100%; }
      ::ng-deep .template-pi-field .pi-form-field .pi-field input { height: 100%; }
      ::ng-deep .template-pi-field .pi-form-field .pi-field .owl-picker-toggle { right: 4px; }
      ::ng-deep .template-pi-field .pi-form-field .pi-field .owl-picker-toggle i.icon-calendar { width: 16px;height: 16px;font-size: 16px; top: 0; }
      .no-data { display: flex;width: 100%;align-items: center;justify-content: center; }
      `]
})

export class AgOwlDatePickerRenderer {
    @ViewChild('picker', { read: OwlDateTimeComponent }) picker: OwlDateTimeComponent<Date>;
    params: any;
    minDate = new Date();
    maxDate = null;
    value = new FormControl(null, Validators.required);
    submitted: boolean = false;
    showPicker: boolean = false;
    agInit(params) {
        if (params.isVisible) this.showPicker = true;
        else {
            let cond = false;
            Object.keys(params.condition).map(o => {
                if (params.data[o] == params.condition[o]) cond = true;
                else false;
            });
            this.showPicker = cond;
        }
        this.params = params;
        if (params.value) {
            this.value.setValue(new Date(params.value));
        } else if (params.field == 'start_date') {
            this.value.setValue(new Date());
            params.data.start_date = _moment(this.value.value).format('MMM DD, YYYY hh:mm:ss');
        }

        this.value.valueChanges.subscribe(val => {
            if (val) this.submitted = false;
        })

        this.submitted = params.submitted;
    }
    constructor(private _commonService: CommonService) {
        _commonService.onUpdate().subscribe(ev => {
            if (ev.type == 'ag-grid-validation') {
                this.submitted = ev.data;
            }
        })
    }
    openPicker() {
        if (this.params.field == 'due_date') {
            this.minDate = this.params.data.start_date ? new Date(this.params.data.start_date) : new Date();
        }
    }
    onSelectChange(): void {
        this.params.data[this.params.field] = _moment(this.value.value).format('MMM DD, YYYY HH:mm:ss');
    }
    closePicker() {
    }

}

@Component({
    template: `<ng-container>
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
                  <div style="height: 100px; width: 100%; display: flex; align-items:center; justify-content: center;" *ngIf="isLoading">
                  <mat-spinner diameter="26" class="md" *ngIf="isLoading"></mat-spinner></div>
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
    styles: [``]
})

export class AgProdServRenderer {
    params: any;
    isLoading: boolean = false;
    products: Array<any> = [];
    displayText = {
        products: 0,
        services: 0
    }
    productControl = new FormControl();
    serviceControl = new FormControl();
    constructor(private _commonService: CommonService) { }
    agInit(params) {
        this.params = params;
        this.updateView(this.params.options || []);
    }
    checkProducts() {
        this.products.map(p => {
            p.selected = false;
            p.services.map(s => {
                s.selected = this.params.data[this.params.selected].indexOf(s.jsr_id) > -1 ? true : false;
                if (s.selected) {
                    p.selected = true;
                    this.productControl.setValue(p.id);
                    this.serviceControl.setValue(s.jsr_id);
                }
            })
        })
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
                this.checkProducts();
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

    updateView(productsList) {
        let services = [], products = {};
        productsList.map(p => {
            p.selected = false;
            p.services.map(s => {
                s.selected = this.params.data[this.params.selected].indexOf(s.jsr_id) > -1 ? true : false;
                if (s.selected) {
                    services.push(s.jsr_id);
                    p.selected = true;
                    if (!products[p.id]) {
                        products[p.id] = [s.jsr_id]
                    } else {
                        products[p.id].push(s.jsr_id);
                    }
                }
            })
        })
        if (services.length) {
            this.params.data.associate_products = services;
            this.params.data.products = products;
        }
        this.displayText = {
            products: productsList.filter(p => p.selected).length,
            services: services.length
        }
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
        }
        this.displayText = {
            products: this.products.filter(p => p.selected).length,
            services: services.length
        }
    }
}