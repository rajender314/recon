import { Component, OnInit, ViewChild, ElementRef, HostListener, OnDestroy, ViewChildren, HostBinding, QueryList, TemplateRef, AfterContentInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService } from '@app/common/common.service';

import * as _ from 'lodash';
import { MatDialog, MatSnackBar } from '@angular/material';
import { EditProductComponent } from '@app/projects/project-details/products/edit-product/edit-product.component';
import { ActionsDialogComponent } from '@app/projects/project-products/actions-dialog/actions-dialog.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { ScrollToService, ScrollToConfigOptions } from '@nicky-lenaers/ngx-scroll-to';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { ReorderServicesComponent } from '@app/projects/project-details/products/reorder-services/reorder-services.component';
import { objectToArray } from '@app/admin/admin.config';
import { AddServiceComponent } from '@app/projects/project-details/products/add-service/add-service.component';
import { Subscription } from 'rxjs';
import { ProductServiceComponent } from '@app/projects/product-service/product-service.component';
import { RemoveProductComponent } from '@app/projects/project-details/remove-product/remove-product.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { EditOrderComponent } from '@app/projects/edit-order/edit-order.component';
import { ReorderComponent } from './reorder/reorder.component';
import { AddOptionComponent } from '@app/projects/project-products/add-option/add-option.component';
import { AddSpecDialogComponent } from '@app/dialogs/add-spec-dialog/add-spec-dialog.component';
import { ChangeDetectionComponent } from '@app/dialogs/change-detection/change-detection.component';
import { SnackBarType } from '@app/shared/utility/types';
import { trigger, transition, style, animate } from '@angular/animations';
import { PiSearchInputFocus, perfectScrollBarReset } from '@app/shared/utility/config';
import { GridApi } from 'ag-grid-community';
import PerfectScrollbar from 'perfect-scrollbar';
import { ProjectDetailsService } from '@app/projects/project-details/project-details.service';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { checkedLength } from '@app/shared/utility/dummyJson';
var APP = window['APP'];
const JSON_DATA = {
    searchResult: [],
    suggested: [
        { id: 1, product_name: 'TV Brochure Banner Stand 10"', type: 'Brochure' },
        { id: 1, product_name: 'CDW Supplies - IT Hardware', type: '3 Services' },
        { id: 1, product_name: 'Easel Signs - Sign', type: 'Brochure' },
    ],
    recent: [
        { id: 1, product_name: 'CDW Supplies - IT Hardware', type: '3 Services' },
        { id: 1, product_name: 'Easel Signs - Sign', type: 'Brochure' },
    ],
    favourites: [
        { id: 1, product_name: 'CDW Supplies - IT Hardware', type: '3 Services' },
        { id: 1, product_name: 'Easel Signs - Sign', type: 'Brochure' },
    ]
};

const REV = [1, 2, 3, 4, 5];

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.scss'],
    animations: [
        trigger('servicesAnimate', [
            transition(':enter', [
                style({ transform: 'translateY(-100px)', opacity: 0 }),
                animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
            ])
        ]),
        trigger('editOrder', [
            transition(':enter', [
                style({ transform: 'translateY(-100px)', opacity: 0 }),
                animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
            ])
        ])
    ]
})
export class ProductsComponent implements OnInit, OnDestroy, AfterContentInit {
    @ViewChildren('reconscroll') reconScroll;
    // @ViewChild('detailScroll') detailScroll: ElementRef;
    @ViewChild('detailScroll') detailScroll: VirtualScrollerComponent;
    @ViewChild('scroll') scroll: VirtualScrollerComponent;
    @ViewChild('myInput') myInput: ElementRef;
    @ViewChild('productName') productName: ElementRef;
    @ViewChildren('searchInput') searchInput: any;
    @ViewChild('productNameInput') productNameInput: ElementRef;
    ps: any;
    public gridApi: GridApi;
    public APP = APP;
    @HostBinding('@.disabled') disabled = true;
    state = {
        top: 0,
        bottom: 10,
        isSort: false,
        showView: false,
        editOrder: false,
        hideCancelledProducts: false,
        editJobAccess: false,
        editServiceAccess: false,
        productWidth: 0,
        searchOpts: {
            placeHolder: 'Enter Product Type',
            value: ''
        },
        searchProjectOpts: {
            placeHolder: 'Search By Project Number',
            value: '',
            spinner: false
        },
        searchProjects: {
            placeHolder: 'Search...',
            value: '',
            spinner: false
        },
        pagination: {
            pageSize: 100,
            page: 1,
            type: 'all',
            search: '',
            column: '',
            sort: ''
        },
        jobs: {},
        showAdd: false,
        showExternalProjects: false,
        showImport: false,
        dynamicWidth: 300,
        isLoading: false,
        projectID: null,
        projectStatusID: null,
        breadcrumbs: [
            { label: 'Projects', type: 'link', route: '/projects' },
            { label: 'Name', type: 'text' },
            /* { label: 'Products', type: 'text' }, */
        ],
        globalActions: [
            { flag: 'add', key: 'clone', label: 'Clone Products' },
            { flag: 'add', key: 'import', label: 'Import Products' },
            // { flag: '', key: 'show', label: 'Show Cancelled Products' }
        ],
        productActions: [
            { flag: 'remove', key: 'removeProduct', type: 'menu', class: 'icon-button-small', title: 'Remove Product', label: '<i class="pixel-icons icon-delete"></i>' },
            { flag: 'edit', key: 'addService', type: 'button', label: 'Add Service', title: 'Add Service' }
            // { flag: 'cancel', key: 'cancelProduct', label: 'Cancel Product' },
        ],
        productActionsPosted: [
            { flag: 'cancel', key: 'cancelProduct', type: 'menu', class: 'icon-button-small', title: 'Cancel Product', label: '<i class="pixel-icons icon-cancelled-products"></i>' },
            { flag: 'edit', key: 'addService', type: 'button', label: 'Add Service', title: 'Add Service' },
            // { flag: 'remove', key: 'removeProduct', label: 'Remove Product' }
        ],
        serviceActions: [
            // { flag: 'cancel', key: 'cancelService', label: 'Cancel Service' },
            // { flag: 'order', key: 'edit', label: 'Edit Spec Order' },
            { flag: 'remove', key: 'removeService', type: 'menu', label: '<i class="pixel-icons icon-delete"></i>', title: 'Remove Service' }
        ],
        serviceActionsPosted: [
            { flag: 'cancel', key: 'cancelService', type: 'menu', label: '<i class="pixel-icons icon-cancelled-services"></i>', title: 'Cancel Service' },
            // // { flag: 'order', key: 'edit', label: 'Edit Spec Order' },
            // { flag: 'remove', key: 'removeService', label: 'Remove Service' }
        ],
        allProducts: [],
        cloneProducts: [],
        DOMSearchValue: null,
        allProductsBak: [],
        projectDetails: null,
        selectedService: {},
        addList: {
            searchValue: '',
            isLoading: false,
            ...JSON_DATA, ...{
                selectedProduct: null
            }
        },
        projectsList: {
            searchResults: [],
            selectedProject: {},
            showList: true,
            gridOptions: {
                rowHeight: 50,
                columnDefs: [
                    {
                        headerName: 'Project Name', field: 'job_title', cellRenderer: (params) => {
                            return params.value ?
                                `<div style="display: flex;flex-direction: column; line-height: 1.3; position: relative; top: 9px;">
                                    <span>`+ params.value + `</span>
                                    <span class="muted">`+ params.data.job_no + `</span>
                                </div>`
                                : ''
                        }
                    },
                    {
                        headerName: 'Company Name', field: 'company_name'/*, cellRenderer: (params) => {
                            return params.value ?
                                `<div style="display: flex;flex-direction: column; line-height: 1.3;  position: relative; top: 9px;">
                                    <span >`+ params.value + `</span>
                                    <span class="muted">`+ params.data.coordinator_name + `</span>
                                </div>`
                                : ''
                        }*/
                    },
                    { headerName: 'Start Date', field: 'start_date' },
                    { headerName: 'Delivery Due Date', field: 'delivery_due_date' }
                ],

                defaultColDef: {
                    sortable: true
                },

                rowSelection: 'single',
                rowDeselection: true,

                rowModelType: 'infinite',
                infiniteInitialRowCount: 1,
                maxBlocksInCache: 2,
                overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Please wait while the projects are loading</span>',
                localeText: { noRowsToShow: 'No Projects Found' },
                stopEditingWhenGridLosesFocus: true,
                suppressDragLeaveHidesColumns: true,
                rowData: [],
                onGridReady: (params) => {
                    this.gridApi = params.api;
                    params.api.sizeColumnsToFit();
                    this.gridApi.showLoadingOverlay();
                    this._commonService.getApi('requestCloneJobList', { jobs_id: this.state.projectID, ...this.state.pagination })
                        .then(res => {
                            if (res['result'].success) {
                                this.gridInitialize(res['result'].data);
                            }
                        })
                },
                onSortChanged: (params) => {
                    this.resetGrid();
                }
            }
        },
        sideNavData: {
            title: 'Clone Product'
        },
        revisions: REV
    }
    promise: any;
    @ViewChild('piSearchInput') piSearchInput: any;
    addProductForm: FormGroup;
    route_product_id: any;
    route_product_index: any;
    subscription: Subscription;
    routerSubscription: Subscription;

    constructor(
        private _fb: FormBuilder,
        private _dialog: MatDialog,
        private _router: Router,
        private _route: ActivatedRoute,
        private _commonService: CommonService,
        private _projectDetailService: ProjectDetailsService,
        private _scrollToService: ScrollToService,
        private snackbar: MatSnackBar
    ) {
        this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
        this.routerSubscription = _route.parent.params.subscribe(param => {
            //this.state.showView = !this.state.showView;
            this.state.projectID = param.id ? param.id : null;
            this.state.isLoading = true;
            // this.getProductsList(this.state.projectID);
        });

        _route.params.subscribe(param => {
            this.route_product_id = param.id ? param.id : null;
        });

        this.subscription = _commonService.onUpdate().subscribe(obj => {
            if (obj.type == 'projectName' && Object.keys(obj.data).length) {
                this.state.projectStatusID = obj.data.job_status_id;
                this.state.breadcrumbs[1].label = obj.data.job_title || '----';
                this.state.projectDetails = obj.data;
                if (this.state.projectDetails.hasOwnProperty('id')) this.getProductsList(this.state.projectID);
                this.state.editJobAccess = this.checkPermissions();
                this.state.editServiceAccess = this.checkPermissions('services');
            } else if (obj.type && obj.type == 'distroRefresh') {
                this.state.DOMSearchValue = '';
                if (this.piSearchInput && this.piSearchInput.searchOpts && this.piSearchInput.searchOpts.value) this.piSearchInput.searchOpts.value = '';
                this.getProductsList(this.state.projectID);
            } else if (obj.type == 'job_status') {
                this.state.projectStatusID = obj.data.job_status_id;
                this.state.projectDetails = obj.data;
                this.state.isLoading = true;
                this.getProductsList(this.state.projectID);
            }
        })


    }

    ngOnInit() {
        // this._commonService.update({ type: 'overlay', action: 'start' });
        // this._commonService.update({ type: 'overlay', action: 'stop' });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.routerSubscription.unsubscribe();
    }

    DOMSearch(val) {
        this.state.DOMSearchValue = val;
        if (!val) {
            this.state.allProductsBak = _.cloneDeep(this.state.cloneProducts);
            if (this.state.allProductsBak.length) {
                const product = { products_id: this.state.allProductsBak[0].products_id, product_name: this.state.allProductsBak[0].product_name };
                this.state.selectedService = { ...this.state.allProductsBak[0].services[0], ...product };
                // this.onTabChange(this.state.allProductsBak[0].services[0], 0);
                // this.state.allProducts = this.state.allProductsBak.slice(0, 10);
                this.state.allProducts = this.state.allProductsBak;
            } else {
                this.state.allProducts = [];
            }
        } else {
            this.state.allProductsBak = _.cloneDeep(this.state.cloneProducts);
            val = val.toLowerCase();
            let products = [];
            this.state.allProductsBak.map(p => {
                const arr = [];
                p.services.map(s => {
                    if (s.services_name.toLowerCase().includes(val)) {
                        arr.push(s);
                    }
                })
                if (arr.length) {
                    products.push(
                        { ...p, ...{ services: arr } }
                    )
                } else {
                    if (p.product_name.toLowerCase().includes(val)) {
                        products.push({ ...p });
                    }
                }
            })
            this.state.allProductsBak = products;
            if (this.state.allProductsBak.length) {
                const product = { products_id: this.state.allProductsBak[0].products_id, product_name: this.state.allProductsBak[0].product_name };
                this.state.selectedService = { ...this.state.allProductsBak[0].services[0], ...product };
                // this.onTabChange(this.state.allProductsBak[0].services[0], 0);
                // this.state.allProducts = this.state.allProductsBak.slice(0, 10);
                this.state.allProducts = this.state.allProductsBak;
            } else {
                this.state.allProducts = [];
            }
        }
    }


    /* Form Builder */

    randomId(): string {
        let rand = Math.random().toString().substr(5);
        return 'new_' + rand;
    }

    productBuilder(data?) {
        return this._fb.group({
            id: '',
            product_name: '',
            products_id: data ? [data.id, Validators.required] : ['', Validators.required],
            type: data ? data.name : '',
            services: this._fb.group({})
        });
    }

    serviceBuilder(data) {
        let control: any = {};
        const arr = Object.keys(data);
        arr.map(key => {
            if (key != 'options' && key != 'isOpen' && key != 'is_check')
                control[key] = data[key];
        });
        control['is_main'] = data.is_new ? false : true;
        // control.options = this._fb.array([]);
        control.layout = 1;
        return this._fb.group(control);
    }

    addNewService(serv) {
        const key = serv.hasOwnProperty('jobs_service_revisions_id') ? serv['job_service_name'] : serv['services_name'];
        const newService = { ...serv };
        newService.old_services_name = key;
        newService.services_name = key + ' 1';
        newService.is_new = this.randomId();
        newService.selected = true;
        (<FormGroup>this.addProductForm.controls['services']).addControl(newService.is_new, this.serviceBuilder(newService));
        this.state.addList.selectedProduct.services.push(newService);
        this.isChecked(newService);
    }

    isChecked(service) {
        const key = service.hasOwnProperty('is_new') ? service['is_new'] : service['form_id'];
        const prod = this.state.addList.selectedProduct;
        const indx = prod.selectedServices.indexOf(key);
        if (indx == -1) {
            prod.selectedServices.push(key);
            (<FormGroup>this.addProductForm.controls['services']).addControl(key, this.serviceBuilder(service));
        } else {
            prod.selectedServices.splice(indx, 1);
            (<FormGroup>this.addProductForm.controls['services']).removeControl(key);
        }
    }

    changeMasterView() {
        this._commonService.onChange();
    }

    onTabChange(serv, tabIndex) {
        serv.selectedIndex = tabIndex;
        serv.options[tabIndex].framed_layout = this.generateLayout(serv.form_layout, serv.options[tabIndex].values, serv);
    }

    performActions(flag, key, prodIndx?, servIndx?) {
        let locals: any = {
            title: '',
            jobs_id: this.state.projectID
        }
        switch (key) {
            case 'clone':
                // this.state.sideNavData.title = 'Clone Product';
                // this.updateProduct('show');
                // break;
                locals.title = 'Clone Products';
                locals.flag = 'clone';
                locals.jobName = this.state.breadcrumbs[1].label;
                break;

            case 'import':
                // this.state.sideNavData.title = 'Import Product';
                // this.updateProduct('show');
                // break;
                locals.title = 'Import Products';
                locals.flag = 'import';
                locals.jobName = this.state.breadcrumbs[1].label;
                break;

            case 'addService':
                locals.title = 'Add Service';
                locals.flag = 'addService';
                locals.url = 'addJobProducts';
                locals.selectedProduct = this.state.allProducts[prodIndx];
                break;

            case 'edit':
                locals.title = 'Edit Spec Order - ' + this.state.allProducts[prodIndx].services[servIndx].services_name;
                const selectedIndex = this.state.allProducts[prodIndx].services[servIndx].selectedIndex || 0;
                locals.specs = this.state.allProducts[prodIndx].services[servIndx].options[selectedIndex];
                locals.revisionId = this.state.allProducts[prodIndx].services[servIndx].jobs_service_revisions_id;
                break;

            case 'removeProduct':
                locals.title = 'Remove Product';
                locals.action = 'remove';
                locals.tab = 'Product';
                locals.url = 'delJobPrdtSrv';
                locals.params = {
                    id: this.state.allProducts[prodIndx].products_id,
                    type: 'product'
                };
                locals.content = 'Are you sure, you want to remove this Product';
                break;
            case 'cancelProduct':
                locals.title = 'Cancel Product';
                locals.action = 'cancel';
                locals.tab = 'Product';
                locals.url = 'cancelJobPrducts';
                let jsr_ids = [];
                _.map(this.state.allProducts[prodIndx].services, (service) => {
                    jsr_ids.push(service.jobs_service_revisions_id);
                });
                locals.params = {
                    id: this.state.allProducts[prodIndx].products_id,
                    jsr_ids: jsr_ids,
                    type: 'product'
                };
                locals.content = 'Are you sure, you want to cancel this Product';
                break;

            case 'removeService':
                locals.title = 'Remove Service';
                locals.action = 'remove';
                locals.tab = 'Service';
                locals.url = 'delJobPrdtSrv';
                locals.params = {
                    id: this.state.allProducts[prodIndx].services[servIndx].jobs_service_revisions_id,
                    type: 'service'
                };
                locals.content = 'Are you sure, you want to remove this Service';
                break;
            case 'cancelService':
                locals.title = 'Cancel Service';
                locals.action = 'cancel';
                locals.tab = 'Service';
                locals.url = 'cancelJobPrducts';
                locals.params = {
                    id: this.state.allProducts[prodIndx].id,
                    jsr_ids: [this.state.allProducts[prodIndx].services[servIndx].jobs_service_revisions_id],
                    type: 'service'
                };
                locals.content = 'Are you sure, you want to cancel this Service';
                break;

            default:
                break;
        }

        if (flag == 'add') this.addDialog(locals);
        else if (flag == 'remove') this.confirmDialog(locals, key, prodIndx, servIndx);
        else if (flag == 'cancel') this.removeServicesDialog(locals, key, prodIndx, servIndx);
        else if (flag == 'order') this.editServiceOrder(locals);
        else if (flag == 'edit') this.addService(locals);
    }

    removeServicesDialog(locals, key, prodIndx?, servIndx?) {
        this._commonService.update({ type: 'overlay', action: 'start' });
        this._commonService.saveApi(locals.url, locals.params)
            .then(res => {
                if (res['result'].success) {
                    switch (key) {
                        case 'cancelProduct':
                            _.map(this.state.allProducts[prodIndx].services, (service) => {
                                service['form_status'] = "Cancelled";
                                service['form_status_id'] = 10;
                            });
                            this.state.allProducts[prodIndx].is_cancel = true;
                            break;
                        case 'cancelService':
                            this.state.allProducts[prodIndx].services[servIndx]['form_status'] = "Cancelled";
                            this.state.allProducts[prodIndx].services[servIndx]['form_status_id'] = 10;
                            break;
                    }
                }
                this._commonService.update({ type: 'overlay', action: 'stop' });
            })
        return;
        this._dialog.open(RemoveProductComponent, {
            panelClass: ['recon-dialog', 'confirmation-dialog'],
            width: '600px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    this.snackbar.openFromComponent(SnackbarComponent, {
                        data: { status: 'success', msg: 'Form Status Updated Successfully' },
                        verticalPosition: 'top',
                        horizontalPosition: 'right'
                    });
                    switch (key) {
                        case 'cancelProduct':
                            _.map(this.state.allProducts[prodIndx].services, (service) => {
                                service['form_status'] = "Cancelled";
                                service['form_status_id'] = 10;
                            });
                            this.state.allProducts[prodIndx].is_cancel = true;
                            break;
                        case 'cancelService':
                            this.state.allProducts[prodIndx].services[servIndx]['form_status'] = "Cancelled";
                            this.state.allProducts[prodIndx].services[servIndx]['form_status_id'] = 10;
                            break;
                    }
                }
            })
    }

    addDialog(locals) {
        this._dialog.open(ActionsDialogComponent, {
            panelClass: ['recon-dialog', 'clone'],
            width: '960px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    this.getProductsList(this.state.projectID);
                }
            })
    }

    confirmDialog(locals, key, prodIndx?, servIndx?) {
        this._commonService.update({ type: 'overlay', action: 'start' });
        this._commonService.deleteApi(locals.url, locals.params)
            .then(res => {
                if (res['result'].success) {
                    switch (key) {
                        case 'removeProduct':
                            this.state.allProducts.splice(prodIndx, 1);
                            break;
                        case 'removeService':
                            this.state.allProducts[prodIndx].services.splice(servIndx, 1);
                            if (!this.state.allProducts[prodIndx].services.length) {
                                this.state.allProducts.splice(prodIndx, 1);
                            }
                            break;
                    }
                }
                this._commonService.update({ type: 'overlay', action: 'stop' });
                this._commonService.update({ type: 'left-nav-count', data: null });
            }).catch(err => {
                this._commonService.update({ type: 'overlay', action: 'stop' });
            })
        return;
        this._dialog.open(ConfirmationComponent, {
            panelClass: ["recon-dialog", "confirmation-dialog"],
            width: '600px',
            // height: '400px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    switch (key) {
                        case 'removeProduct':
                            this.state.allProducts.splice(prodIndx, 1);
                            break;
                        case 'removeService':
                            this.state.allProducts[prodIndx].services.splice(servIndx, 1);
                            break;
                    }
                }
            })
    }

    editServiceOrder(locals) {
        this._dialog.open(ReorderServicesComponent, {
            panelClass: 'recon-dialog',
            width: '600px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res.success) {
                    locals.specs.values = res.data;
                }
            })
    }

    addService(locals) {
        this._dialog.open(AddServiceComponent, {
            panelClass: 'recon-dialog',
            width: '600px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    this.getProductsList(this.state.projectID);
                }
            })
    }

    loadVirtualProductsData(i: any) {
        this.state.allProductsBak.slice(i, (i + 5)).map(o => {
            o.isOpen = true;
            o.isEdit = false;
            o['cancel_product'] = false;
            o.services.map(s => {
                if (s.form_status_id != 1) {
                    o['cancel_product'] = true;
                }
                s.options[0].framed_layout = this.generateLayout(s.form_layout, s.options[0].values, s);
            })
        });
        this.state.allProducts.splice.apply(this.state.allProducts, [i, 0].concat(this.state.allProductsBak.slice(i, (i + 5))));
    }

    loadVirtualProducts() {
        let counter = 0;
        for (let i = 0; i < 20; i = i + 5) {
            counter++;
            setTimeout(() => {
                this.loadVirtualProductsData(i);
            }, counter * 50);
        }
    }

    onScrollDown() {
    }

    scrolledUp() {
    }

    getPaginationArray(val) {
        return _.range(val);
    }

    lowerLimit: number = 0;
    upperLimit: number = 10;

    getProducts() {
        const pageProducts = this.state.allProducts.slice(this.lowerLimit, this.upperLimit + 1);
        pageProducts.map(p => {
            p.isEdit = false;
            p['cancel_product'] = false;
            p.services.map(s => {
                if (s.form_status_id != 1) {
                    p['cancel_product'] = true;
                }
                s.options[0].framed_layout = this.generateLayout(s.form_layout, s.options[0].values, s);
            })
        })
    }

    bindProductData(i, counter) {
        setTimeout(() => {
            // this.state.allProducts.splice(i,1,this.state.allProductsBak[i]);
            this.state.allProducts.splice.apply(this.state.allProducts, [i, 1, this.state.allProductsBak[i]]);
        });
    }

    loadTopProducts() {
        this.state.bottom = this.state.top;
        this.state.top = this.state.top - 10;
        if (this.state.allProducts.length > 30) {
            this.state.allProducts.slice(this.state.allProducts.length - 30);
        }
    }

    showOriginalProducts(beforeLength, count) {
        setTimeout(() => {

            for (let i = beforeLength; i < this.state.allProducts.length; i++) {
                count++;
                setTimeout(() => {
                    if (this.state.allProducts[i]['is_dummy']) this.state.allProducts[i]['is_dummy'] = false;
                }, count * 50);
            }
        }, 100);
    }

    loadMoreProducts() {
        let beforeLength = this.state.allProducts.length;
        let dummyList = [];
        let count = 0;
        if (this.state.allProducts.length < this.state.allProductsBak.length && (this.state.allProducts.length + 10 <= this.state.allProductsBak.length)) {
            // this.state.allProducts.splice.apply(this.state.allProducts, [this.state.allProducts.length, 0].concat(this.state.allProductsBak.slice(this.state.allProducts.length, (this.state.allProducts.length + 10))));
            for (let i = beforeLength; i < beforeLength + 10; i++) {
                dummyList.push(Object.assign({ is_dummy: true }, this.state.allProductsBak[i]));
            }
            this.state.allProducts.splice.apply(this.state.allProducts, [this.state.allProducts.length, 0].concat(dummyList));
            this.showOriginalProducts(beforeLength, count);
        } else if (this.state.allProducts.length < this.state.allProductsBak.length) {
            let count = this.state.allProductsBak.length - this.state.allProducts.length;
            for (let i = beforeLength; i < beforeLength + count; i++) {
                dummyList.push(Object.assign({ is_dummy: true }, this.state.allProductsBak[i]));
            }
            this.state.allProducts.splice.apply(this.state.allProducts, [this.state.allProducts.length, 0].concat(dummyList));
            this.showOriginalProducts(beforeLength, count);
        }
    }

    pagination = [];
    getProductsList(id) {
        this.state.isLoading = true;
        if (this.state.projectDetails && this.state.projectDetails['is_related_to_project'] ||
            (APP.permissions.job_access.products.job_specific_others != 'none' && !this.state.projectDetails['is_related_to_project'])) {
            this._commonService.update({ type: 'left-nav-count', data: {} });
            this._commonService.getApi('jobProductList', { jobs_id: id })
                .then(res => {
                    this.state.isLoading = false;
                    if (res['result'].success) {
                        this.state.allProductsBak = res['result'].data;
                        // const totalPages = Math.floor((res['result'].data.length) / 10);
                        // const totalPages = res['result'].data.length;
                        // if (totalPages) this.pagination = this.getPaginationArray(totalPages);
                        // this.getProducts();
                        this.state.allProductsBak.map((o, k) => {
                            o.isOpen = true;
                            o.isEdit = false;
                            o['cancel_product'] = false;
                            o.services.map(s => {
                                if (s.form_status_id != 1) {
                                    o['cancel_product'] = true;
                                }
                                s.options[0].framed_layout = this.generateLayout(s.form_layout, s.options[0].values, s);
                                // if(k<10){
                                //     s.options[0].framed_layout = this.generateLayout(s.form_layout, s.options[0].values, s);
                                // }else{
                                //     s.options[0].framed_layout = [];//this.generateLayout(s.form_layout, s.options[0].values, s);
                                // }
                            });
                        });
                        if (this.state.allProductsBak.length) {
                            this.state.allProducts = this.state.allProductsBak;
                            if (this.route_product_id) {
                                let selectedProduct = _.filter(this.state.allProductsBak, (product, pIndx) => {
                                    if (product.products_id == this.route_product_id) {
                                        this.route_product_index = pIndx;
                                        return true;
                                    }
                                    return false;
                                });
                                if (selectedProduct.length) {
                                    const product = { products_id: selectedProduct[0].products_id, product_name: selectedProduct[0].product_name };
                                    this.state.selectedService = { ...selectedProduct[0].services[0], ...product };
                                    setTimeout(() => {
                                        this.scroll.scrollToIndex(this.route_product_index);
                                        this.onSelect('service', selectedProduct[0].services[0], this.route_product_index, 0);
                                    });
                                } else {
                                    const product = { products_id: this.state.allProductsBak[0].products_id, product_name: this.state.allProductsBak[0].product_name };
                                    this.state.selectedService = { ...this.state.allProductsBak[0].services[0], ...product };
                                }
                            } else {
                                const product = { products_id: this.state.allProductsBak[0].products_id, product_name: this.state.allProductsBak[0].product_name };
                                this.state.selectedService = { ...this.state.allProductsBak[0].services[0], ...product };
                            }
                        } else {
                            this.state.allProducts = [];
                        }
                        this.state.cloneProducts = _.cloneDeep(this.state.allProductsBak);
                        // this.loadVirtualProducts();
                        // this._commonService.getCustomScrolls(this.reconScroll);
                        // setTimeout(() => {
                        //     this.ps = new PerfectScrollbar(this.detailScroll.nativeElement);
                        // }, 200);
                        // setTimeout(() => {
                        //     this.applyStyle();
                        // }, 1000);
                    }
                })
        } else {
            this.state.isLoading = false;
        }
    }



    ngAfterContentInit() {
        // this.state.allProducts.map(o => {
        //     o.services.map(s => {
        //         s.options[0].framed_layout = this.generateLayout(s.form_layout, s.options[0].values, s);
        //     });
        // });
    }

    generateLayout(layout, values, service) {
        let arr = [];
        let changedValues = service.selectedIndex ? (Array.isArray(service.options[service.selectedIndex].changed_attributes) ? (service.options[service.selectedIndex].changed_attributes || []) : []) : (service.options[0].changed_attributes || []);
        for (var i = 0; i < values.length; i++) {
            values[i]['has_changed'] = (changedValues.indexOf(Number(values[i].id)) > -1) ? true : false;
            if (layout == 1 || layout == 3) {
                if (values[i].layout == 1 || values[i].layout == '') {
                    arr.push([values[i]]);
                } else {
                    if (values[i + 1]) {
                        values[i + 1]['has_changed'] = (changedValues.indexOf(Number(values[i + 1].id)) > -1) ? true : false;
                        if (values[i + 1].layout == 2) {
                            arr.push([values[i], values[i + 1]]);
                            i++;
                        } else {
                            arr.push([values[i], null]);
                        }
                    }
                }
            } else if (layout == 2) {
                if (values[i].layout == 1) {
                    arr.push([values[i]])
                } else {
                    if (values[i + 1] && values[i + 1].layout == 2) {
                        values[i + 1]['has_changed'] = (changedValues.indexOf(Number(values[i + 1].id)) > -1) ? true : false;
                        arr.push([values[i], values[i + 1]]);
                        i++;
                    } else {
                        arr.push([values[i], null])
                    }
                }
            }
        }
        return arr;
    }

    /*getRevisions(val) {
        return _.range(val + 1);
    }*/

    changeRevision(rev, prod, serv, isEnter = false) {
        if (serv.selectedRevision != rev || isEnter) {
            serv.selectedRevision = rev;
            this.onRevisionChange(serv, rev);
        }
    }

    onRevisionChange(serv, revNo = 0) {
        this._commonService.getApi('jobPrdSpecs', { jsr_id: serv.jobs_service_revisions_id, revision_no: revNo })
            .then(res => {
                if (res['result'].success) {
                    serv.options = res['result'].data || [];
                    this.onTabChange(serv, 0);
                }
            })
    }

    onSelect(flag, obj, prodIndx?, servIndx?) {
        if (flag == 'product') {
            obj.isOpen = !obj.isOpen;
        } else if (flag == 'service') {
            let preIndex = _.findIndex(this.state.allProducts, (o) => { return o.products_id == this.state.selectedService['products_id']; });
            this.state.showView = !this.state.showView;
            this.editState.toggleView = false;
            this.editState.editSpecOrder = false;
            const product = { products_id: this.state.allProducts[prodIndx].products_id, product_name: this.state.allProducts[prodIndx].product_name };
            this.state.selectedService = { ...obj, ...product };
            this.onTabChange(obj, 0);

            if (servIndx) {
                let currentIndex = this.scroll.viewPortInfo.startIndexWithBuffer + prodIndx;
                if (preIndex > currentIndex + 1) {
                    this.detailScroll.scrollToIndex(currentIndex + 1, true, 0, 500, () => {
                        const config: ScrollToConfigOptions = {
                            target: 'service_' + obj.jobs_service_revisions_id,
                            duration: 0,
                            easing: 'easeOutCubic',
                            offset: -30
                        };
                        if (!document.getElementById('service_' + obj.jobs_service_revisions_id)) {
                            while (document.getElementById('service_' + obj.jobs_service_revisions_id)) {
                                document.getElementById('products-right-view').scrollTop = document.getElementById('products-right-view').scrollHeight;
                            }
                            this._scrollToService.scrollTo({
                                offset: (<any>document.getElementsByClassName('recon-product-view')[0]).offsetHeight
                            });

                        }
                        this._scrollToService.scrollTo(config);
                    });
                } else if (preIndex < currentIndex - 1) {
                    this.detailScroll.scrollToIndex(currentIndex - 1, true, 0, 500, () => {
                        const config: ScrollToConfigOptions = {
                            target: 'service_' + obj.jobs_service_revisions_id,
                            duration: 0,
                            easing: 'easeOutCubic',
                            offset: -30
                        };
                        if (!document.getElementById('service_' + obj.jobs_service_revisions_id)) {
                            while (document.getElementById('service_' + obj.jobs_service_revisions_id)) {
                                document.getElementById('products-right-view').scrollTop = document.getElementById('products-right-view').scrollHeight;
                            }
                            this._scrollToService.scrollTo({
                                offset: (<any>document.getElementsByClassName('recon-product-view')[0]).offsetHeight
                            });

                        }
                        this._scrollToService.scrollTo(config);
                    });
                } else {
                    const config: ScrollToConfigOptions = {
                        target: 'service_' + obj.jobs_service_revisions_id,
                        duration: 500,
                        easing: 'easeInOutCubic',
                        offset: -30
                    };
                    if (!document.getElementById('service_' + obj.jobs_service_revisions_id)) {
                        while (document.getElementById('service_' + obj.jobs_service_revisions_id)) {
                            document.getElementById('products-right-view').scrollTop = document.getElementById('products-right-view').scrollHeight;
                        }
                        this._scrollToService.scrollTo({
                            offset: (<any>document.getElementsByClassName('recon-product-view')[0]).offsetHeight
                        });

                    }
                    this._scrollToService.scrollTo(config);
                }
            } else {
                this.detailScroll.scrollToIndex(this.scroll.viewPortInfo.startIndexWithBuffer + prodIndx);
            }
            // this.detailScroll.scrollToIndex(this.scroll.viewPortInfo.startIndexWithBuffer+prodIndx);
            // this.detailScroll.scrollToIndex(this.scroll.viewPortInfo.startIndexWithBuffer+prodIndx,true, 0, 500, this.triggerScroll(obj.jobs_service_revisions_id));
            // this.triggerScroll(obj.jobs_service_revisions_id);
        } else if (flag == 'service') {
            this.state.showView = !this.state.showView;
            this.editState.toggleView = false;
            this.editState.editSpecOrder = false;
            const product = { products_id: this.state.allProducts[prodIndx].products_id, product_name: this.state.allProducts[prodIndx].product_name };
            this.state.selectedService = { ...obj, ...product };
            this.onTabChange(obj, 0);
            this.triggerScroll(obj.jobs_service_revisions_id);
            // if(prodIndx > this.upperLimit) {
            //     this.lowerLimit = Math.floor(prodIndx / 10) * 10;
            //     this.upperLimit = this.lowerLimit + 10;
            //     this.getProducts();
            //     if(this.ps) {
            //         perfectScrollBarReset(this.ps);
            //     }
            //     setTimeout(() => {
            //         this.triggerScroll(obj.jobs_service_revisions_id);
            //     }, 1000);
            // } else if(prodIndx < this.lowerLimit) {
            //     this.lowerLimit = Math.floor(prodIndx / 10) * 10;
            //     this.upperLimit = this.lowerLimit + 10;
            //     this.getProducts();
            //     if(this.ps) {
            //         perfectScrollBarReset(this.ps);
            //     }
            //     setTimeout(() => {
            //         this.triggerScroll(obj.jobs_service_revisions_id);
            //     }, 1000);
            // } else {
            //     this.triggerScroll(obj.jobs_service_revisions_id);
            // }
        }
    }

    backToProducts(): void {
        this.state.showView = !this.state.showView;
    }

    backToList() {
        if (this.editState.editSpecOrder) {
            this.editState.toggleView = false;
            this.editState.editSpecOrder = false;
        } else {
            if (this.optionsGroup.pristine) {
                this.editState.toggleView = false;
                this.editState.editSpecOrder = false;
                if (this.editState.refresh) {
                    this.updateServiceStatuses();
                    this.changeRevision(this.editState.selectedRevision, this.editState.productList[this.editState.productIndex], this.editState.productList[this.editState.productIndex].services[this.editState.serviceIndex], true);
                }
            } else {
                this.changeDetection({}, (status) => {
                    if (status == 'discard') {
                        this.editState.toggleView = false;
                        this.editState.editSpecOrder = false;
                        if (this.editState.refresh) {
                            this.updateServiceStatuses();
                            this.changeRevision(this.editState.selectedRevision, this.editState.productList[this.editState.productIndex], this.editState.productList[this.editState.productIndex].services[this.editState.serviceIndex], true);
                        }
                    } else if (status == 'review') {
                    }
                })
            }
        }
    }

    updateServiceStatuses() {
        if ([5, 6, 7].indexOf(this.editState.selectedService['old_form_status_id']) > -1) {
            this._commonService.getApi('jobProductList', { jobs_id: this.state.projectID, id: this.editState.productList[this.editState.productIndex].products_id })
                .then(res => {
                    if (res['result'].success) {
                        this.editState.productList[this.editState.productIndex].services.map(s => {
                            let service = _.find(res['result'].data[0].services, ['jobs_service_revisions_id', s.jobs_service_revisions_id]);
                            if (service) {
                                s.form_status = service.form_status;
                                s.form_status_id = service.form_status_id;
                                s.form_submit = service.form_submit;
                                s.bid_received = service.bid_received;
                            }
                        })
                    }
                })
        }
    }

    triggerScroll(id) {
        const config: ScrollToConfigOptions = {
            target: 'service_' + id,
            duration: 500,
            easing: 'easeInOutCubic',
            offset: -30
        };
        if (!document.getElementById('service_' + id)) {
            while (document.getElementById('service_' + id)) {
                document.getElementById('products-right-view').scrollTop = document.getElementById('products-right-view').scrollHeight;
            }
            this._scrollToService.scrollTo({
                offset: (<any>document.getElementsByClassName('recon-product-view')[0]).offsetHeight
            });

        }
        this._scrollToService.scrollTo(config);
        // this._scrollToService.scrollTo(config);
    }

    onSelectItem(prod) {
        if (prod.hasOwnProperty('kikiki')) {
            this.getProductDetails(prod, 635);
        } else {
            this.getProductServices(prod, () => {
                setTimeout(() => {
                    this.productNameInput.nativeElement.focus();
                }, 20);
            })
        }
    }

    onSelectProject(proj) {
        if (!this.promise) {
            const params = {
                jobs_id: this.state.projectID,
                from_job_id: proj.id
            }
            this.promise = this._commonService.getApi('cloneJob', params)
                .then(res => {
                    this.promise = undefined;
                    if (res['result'].success) {
                        this.addExternalProjectData('show');
                        this.state.isLoading = true;
                        this.getProductsList(this.state.projectID);
                    }
                })
                .catch(err => {
                    this.promise = undefined;
                })
        }
    }

    goToProjects() {
        this.state.projectsList.showList = false;
        this.state.pagination.page = 1;
        this.projectSearch('', 'init');
    }

    projectsList() {
        this.state.projectsList.showList = true;
    }

    getProductServices(prod, cb?) {
        this._commonService.getApi('productServices', { id: prod.id })
            .then(res => {
                if (res['result'].success) {
                    this.state.addList.selectedProduct = { ...prod };
                    this.state.addList.selectedProduct.isNew = true;
                    this.state.addList.selectedProduct.selectedServices = [];
                    this.state.addList.selectedProduct['services'] = res['result'].data.items;
                    this.addProductForm = this.productBuilder(this.state.addList.selectedProduct);
                    if (cb) cb();
                }
            })
    }

    getProductDetails(prod, id) {
        this._commonService.getApi('productServices', { id: id })
            .then(res => {
                if (res['result'].success) {
                    this.state.addList.selectedProduct = { ...prod };
                    this.state.addList.selectedProduct['services'] = res['result'].data.items;
                }
            })
    }

    onSearch(val) {
        this.state.addList.searchValue = val;
        this.state.addList.isLoading = true;
        if (val) {
            this._commonService.getApi('products', { status: true, is_dropdown: true, search: val })
                .then(res => {
                    this.state.addList.isLoading = false;
                    if (res['result'].success) {
                        this.state.addList.searchResult = res['result'].data.items;
                    }
                })
        } else {
            this.state.addList.isLoading = false;
            this.state.addList.selectedProduct = null;
            this.state.addList.searchResult = [];
        }
    }

    onSearchProjects(val) {
        this.state.searchProjectOpts.value = val;
        this.state.searchProjectOpts.spinner = true;
        if (val) {
            this._commonService.getApi('requestCloneJobList', { jobs_id: this.state.projectID, page: 1, search: this.state.searchProjectOpts.value })
                .then(res => {
                    this.state.searchProjectOpts.spinner = false;
                    if (res['result'].success) {
                        this.state.projectsList.searchResults = res['result'].data.list;
                    }
                })
        } else {
            this.state.searchProjectOpts.spinner = false;
            this.state.projectsList.selectedProject = null;
            this.state.projectsList.searchResults = [];
        }
    }

    getProjectsList() {
        this._commonService.getApi('requestCloneJobList', { jobs_id: this.state.projectID, ...this.state.pagination })
            .then(res => {
                this.state.searchProjects.spinner = false;
                if (res['result'].success) {
                    this.state.projectsList.gridOptions.rowData = res['result'].data.list;
                }
            });
    }

    resetGrid() {
        this.state.isSort = true;
        this.state.pagination.page = 1;
    }

    projectSearch(val, flag = 'pagination') {
        this.state.pagination.search = val;
        if (flag == 'pagination') {
            this.resetGrid();
            this.gridApi.onFilterChanged();
        } else {
            this.state.searchProjects.spinner = true;
            this.getProjectsList();
        }
    }

    gridInitialize(data) {
        var dataSource = {
            rowCount: null,
            getRows: (params) => {
                if (params.sortModel.length) {
                    this.state.pagination.column = params.sortModel[0].colId;
                    this.state.pagination.sort = params.sortModel[0].sort;
                }
                if (this.state.pagination.page == 1 && !this.state.isSort) {
                    setTimeout(() => {
                        if (this.state.pagination.page == 1) {
                            this.state.jobs = data;
                        } else {
                            this.state.jobs['list'].push(data.list);
                        }
                        this.state.pagination.page++;
                        var lastRow = -1;
                        if (data.count <= params.endRow) lastRow = data.count;
                        params.successCallback(data.list, lastRow);
                        if (!this.state.jobs['list'].length) this.gridApi.showNoRowsOverlay();
                        else this.gridApi.hideOverlay();
                    }, 200);
                } else {
                    this.state.isSort = false;
                    this.gridApi.showLoadingOverlay();
                    this._commonService.getApi('requestCloneJobList', { jobs_id: this.state.projectID, ...this.state.pagination })
                        .then(res => {
                            if (res['result'].success) {
                                if (this.state.pagination.page == 1) {
                                    this.state.jobs = res['result'].data;
                                } else {
                                    this.state.jobs['list'] = [...this.state.jobs['list'], ...res['result'].data];
                                }
                                this.state.pagination.page++;
                                var lastRow = -1;
                                if (res['result'].data.count <= params.endRow) lastRow = res['result'].data.count;
                                params.successCallback(res['result'].data.list, lastRow);
                                if (!res['result'].data.list.length) this.gridApi.showNoRowsOverlay();
                                else this.gridApi.hideOverlay();
                            }
                        })
                }

            }
        };
        this.gridApi.setDatasource(dataSource);
    }

    addProduct(flag) {
        this.state.addList.searchValue = '';
        if (flag == 'show') {
            this.state.showAdd = !this.state.showAdd;
            if (!this.state.showAdd) {
                this.state.addList.selectedProduct = null;
                this.state.addList.searchResult = [];
            } else {
                setTimeout(() => {
                    PiSearchInputFocus(this.searchInput);
                }, 20);
            }
        } else if (flag == 'save') {
            if (!this.promise) {
                this._commonService.update({ type: 'overlay', action: 'start' });
                const selectedServices = [];
                this.state.addList.selectedProduct.selectedServices.map(serv => {
                    selectedServices.push(this.addProductForm.value.services[serv]);
                })
                this.addProductForm.value.services = selectedServices;
                this.addProductForm.value.services = objectToArray(Object.keys(this.addProductForm.value.services), this.addProductForm.value.services);
                const params = {
                    jobs_id: this.state.projectID,
                    products: [this.addProductForm.value]
                }
                this.promise = this._commonService.saveApi('saveJobPrdForm', params)
                    .then(res => {
                        this.promise = undefined;
                        if (res['result'].success) {
                            this.addProduct('show');
                            this.route_product_id = res['result'].data[0];
                            this.state.isLoading = true;
                            this.getProductsList(this.state.projectID);
                            this._commonService.update({ type: 'overlay', action: 'stop' });
                        }
                    })
                    .catch(err => {
                        this.promise = undefined;
                        this._commonService.update({ type: 'overlay', action: 'stop' });
                    })
            }
        }
    }

    updateProduct(flag) {
        if (flag == 'show') {
            this.state.showImport = !this.state.showImport;
        }
    }

    addExternalProjectData(flag) {
        if (flag == 'show') {
            this.state.showExternalProjects = !this.state.showExternalProjects;
            if (!this.state.showExternalProjects) {
                this.state.projectsList.selectedProject = {};
                this.state.projectsList.searchResults = [];
                this.state.searchProjectOpts.value = '';
                this.state.projectsList.showList = true;
            } else {
                setTimeout(() => {
                    PiSearchInputFocus(this.searchInput);
                }, 20);
            }
        } else if (flag == 'save') {
            if (this.gridApi.getSelectedRows().length) {
                this.onSelectProject(this.gridApi.getSelectedRows()[0])
            }
        }
    }

    editSpecOrder(prod, ser) {
        this.editState.editSpecOrder = !this.editState.editSpecOrder;
        if (this.editState.editSpecOrder) {
            this.editState.selectedRevision = ser.selectedRevision == null ? ser.service_revision_no : ser.selectedRevision;
            this.editState.selectedProduct = prod;
            this.editState.selectedService = _.cloneDeep(ser);
            this.editState.selectedServiceSpecs = _.cloneDeep(ser);
        }
        this._commonService.getCustomScrolls(this.reconScroll);
    }

    editProduct(prod, ser, prodInx = 0, servIndx = 0) {
        this.editState.toggleView = !this.editState.toggleView;
        this.editState.productList = [...this.state.allProducts];
        this.editState.actions = [...this.state.serviceActions];
        if (this.editState.toggleView) {
            this.createForm();
            if (ser) this.onSelectService(ser, prodInx, servIndx);
        }
        this._commonService.getCustomScrolls(this.reconScroll);
        // this._dialog.open(EditProductComponent, {
        //     panelClass: 'full-width-modal',
        //     maxWidth: '100vw',
        //     width: '100vw',
        //     height: '100vh',
        //     data: {
        //         title: 'Edit Products',
        //         productList: this.state.allProducts,
        //         product: prod,
        //         service: ser,
        //         actions: this.state.serviceActions,
        //         jobs_id: this.state.projectID,
        //         indexes: {
        //             prod: prodInx,
        //             serv: servIndx
        //         },
        //         breadcrumbs: this.state.breadcrumbs
        //     }
        // })
        //     .afterClosed()
        //     .subscribe(res => {
        //         if (res && res.canRefresh) {
        //             this.state.isLoading = true;
        //             this.getProductsList(this.state.projectID);
        //         }
        //     })
    }

    frameLayout = () => {
        let arr = [];

        this.state.allProducts.map(p => {
            p.services.map(s => {
                p.options.map(o => {
                    o.framedLayout
                })
            })
        })


    }

    // editOrder = () => {
    //     this._dialog.open(ReorderComponent, {
    //         panelClass: 'recon-dialog',
    //         width: '540px',
    //         data: {
    //             title: 'Edit Order',
    //             products: _.cloneDeep(this.state.allProducts),
    //             params: {
    //                 jobs_id: this.state.projectID
    //             }
    //         }
    //     })
    //         .afterClosed()
    //         .subscribe(res => {
    //             if (res && res.success) {
    //                 this.state.isLoading = true;
    //                 this.getProductsList(this.state.projectID);
    //             }
    //         });
    // }

    editOrderProducts = [];

    editOrder = () => {
        if (this.state.allProducts.length && !this.state.DOMSearchValue) {
            this.state.editOrder = true;
            this.state.DOMSearchValue = '';
            this.state.hideCancelledProducts = false;
            this.state.cloneProducts = _.cloneDeep(this.state.allProducts);
            this.editOrderProducts = _.cloneDeep(this.state.allProducts);
            // this.state.allProductsBak = _.cloneDeep(this.state.allProducts);
            this.editOrderProducts.map((item) => {
                item.isOpen = false;
            });
        }
    }

    resetOrder() {
        this.state.editOrder = false;
        this.state.allProductsBak = _.cloneDeep(this.state.cloneProducts);
        this.state.allProducts = _.cloneDeep(this.state.allProductsBak);
        this.state.allProducts.map((item) => {
            item.isOpen = true;
        });
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.editOrderProducts, this.scroll.viewPortInfo.startIndexWithBuffer + event.previousIndex, this.scroll.viewPortInfo.startIndexWithBuffer + event.currentIndex);
    }

    saveOrderPromise: any = undefined;
    saveOrder() {
        if (!this.saveOrderPromise) {
            this.state.editOrder = false;
            this.state.allProductsBak = _.cloneDeep(this.editOrderProducts);
            this.state.allProducts = _.cloneDeep(this.state.allProductsBak);
            this.state.allProducts.map((item) => {
                item.isOpen = true;
            });
            let params = [];
            this.state.allProducts.map(p => {
                let services = [];
                p.services.map(s => {
                    services.push({ jobs_service_revisions_id: s.jobs_service_revisions_id });
                });
                params.push({ product_id: p.products_id, services: services })
            })
            this.saveOrderPromise = this._commonService.saveApi('saveEstimatesOrders', { products: params })
                .then(res => {
                    this.saveOrderPromise = undefined;
                    if (res['result'].success) {
                        // this.getProductsList(this.state.projectID);
                    }
                })
                .catch(err => {
                    this.saveOrderPromise = undefined;
                })
        }
    }

    /*generateLayout() {
        for (let i = 0; i < this.selectedService.details.specs.length; i++) {
			const spec = this.selectedService.details.specs[i];
			const defaultSpec = spec ? this.defaults.controls[spec.id].value : {};
			const nextSpec = this.selectedService.details.specs[i + 1];
			const nextDefaultSpec = nextSpec ? this.defaults.controls[nextSpec.id].value : {};
			if (spec) {
				if (this.selectedService.details.layout == 1 || this.selectedService.details.layout == 3) {
					if (defaultSpec.layout == 1 || defaultSpec.layout == '') {
						arr.push([spec]);
					} else {
						if (nextDefaultSpec && nextDefaultSpec.layout == 2) {
							arr.push([spec, nextSpec]);
							i++;
						} else {
							arr.push([spec, null])
						}
					}
				} else if (this.selectedService.details.layout == 2) {
					if (defaultSpec.layout == 1) {
						arr.push([spec]);
					} else {
						if (nextDefaultSpec && nextDefaultSpec.layout == 2) {
							arr.push([spec, nextSpec]);
							i++;
						} else {
							arr.push([spec, null])
						}
					}
				}
			}
		}
		return arr;
    }*/


    /* resizer code */
    @ViewChild('myResizer') myResizer: ElementRef;

    leftWidth = 320;
    rightWidth = 420;
    oldX = 0;
    grabber = false;

    @ViewChildren("optionLayout") optionLayout: QueryList<any>

    ngAfterViewInit() {
        if (this.myResizer) {
            this.leftWidth = (50 / 100) * (this.myResizer.nativeElement.offsetWidth - 66);
            this.rightWidth = (25 / 100) * (this.myResizer.nativeElement.offsetWidth - 66);
        }
        this.optionLayout.changes.subscribe((r) => {
            this.buildFramedSpecs(r);
        });
    }

    buildFramedSpecs(r) {
        setTimeout(() => {
        }, 0);
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.grabber || event.clientX < 550 || event.clientX > 840) {
            return;
        }
        this.resizer(event.clientX - this.oldX);
        this.oldX = event.clientX;

    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.grabber = false;
        document.querySelector('body').classList.remove('disable-select');
    }

    resizer(offsetX: number) {
        this.rightWidth -= offsetX;
        this.leftWidth += offsetX;
    }

    @HostListener('document:mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        // this.grabber = (this.editState.editSpecOrder || this.editState.toggleView || this.state.editOrder) ? false : true;
        this.grabber = (event.target['className'].includes('grab-icon') || event.target['className'].includes('grabber')) ? true : false;
        if (this.grabber) document.querySelector('body').classList.add('disable-select');
        this.oldX = event.clientX;
    }


    /********************
     * Edit Selected Product Service
     *********************/

    serviceForm: FormGroup;
    selectedTabOptions = [];
    selectedTabOption = null;
    editState = {
        submitted: false,
        fetchingSpecs: true,
        productList: [],
        selectedService: {
            service_revision_no: 0,
            options: [],
            form_status_id: 1
        },
        selectedServiceSpecs: {
            service_revision_no: 0,
            options: [],
            form_status_id: 1
        },
        selectedProduct: {},
        actions: [],
        toggleView: false,
        editSpecOrder: false,
        showView1: false,
        formLayout: [],
        selectedIndex: 0,
        selectedRevision: null,
        productIndex: 0,
        serviceIndex: 0,
        refresh: false,
        dummySelectedService: {
            serv: {},
            prodIndx: null,
            servIndx: null,
            revision: null
        }
    }
    editPromise: any;

    createForm() {
        this.serviceForm = this._fb.group({
            jsr_id: '',
            name: '',
            options: this._fb.group({})
        })
    }

    get optionsGroup() {
        return this.serviceForm.get('options') as FormGroup;
    }

    getRevisions(val) {
        return _.range(val + 1);
    }

    revisionChange(rev) {
        if (this.editState.selectedRevision != rev) {
            this.editState.dummySelectedService.revision = rev;
            if (this.optionsGroup.pristine) {
                this.editState.selectedRevision = rev;
                Object.keys(this.optionsGroup.value).map(key => {
                    this.optionsGroup.removeControl(key);
                });
                this.onChangeRevision(this.editState.selectedService, rev);
            } else {
                this.changeDetection({}, (status) => {
                    if (status == 'discard') {
                        this.optionsGroup.markAsPristine();
                        this.editState.selectedIndex = 0;
                        this.revisionChange(this.editState.dummySelectedService.revision)
                    } else if (status == 'review') {
                    }
                })
            }
        }
    }

    onSelectService(serv, prodIndx, servIndx) {
        this.editState.dummySelectedService = {
            serv: serv,
            prodIndx: prodIndx,
            servIndx: servIndx,
            revision: null
        }
        if (this.optionsGroup.pristine) {
            this.editState.productIndex = prodIndx;
            this.editState.serviceIndex = servIndx;
            this.serviceForm.patchValue({
                jsr_id: serv.jobs_service_revisions_id,
                name: serv.services_name
            }, { emitEvent: false })
            this.editState.selectedService = { ...serv };
            Object.keys(this.optionsGroup.value).map(key => {
                this.optionsGroup.removeControl(key);
            });
            // this.onTabChange(this.editState.selectedService, 0);
            this.onChangeRevision(this.editState.selectedService);
            this.editState.showView1 = !this.editState.showView1;
        } else {
            this.changeDetection({}, (status) => {
                if (status == 'discard') {
                    this.optionsGroup.markAsPristine();
                    const obj = { ...this.editState.dummySelectedService };
                    this.editState.selectedIndex = 0;
                    this.onSelectService(obj.serv, obj.prodIndx, obj.servIndx);
                } else if (status == 'review') {
                }
            })
        }
    }

    onChangeRevision(serv, revNo = null, canChangeTab = true) {
        this.editState.fetchingSpecs = true;
        this.editState.selectedRevision = revNo == null ? serv.service_revision_no : revNo;
        this._commonService.getApi('jobPrdSpecs', { jsr_id: this.serviceForm.value.jsr_id, revision_no: this.editState.selectedRevision })
            .then(res => {
                this.editState.fetchingSpecs = false;
                if (res['result'].success) {
                    serv.options = res['result'].data || [];
                    serv.options.map((o, i) => {
                        this.createSpecsControls(o, i);
                    });
                    if (serv.options.length) {
                        if (canChangeTab) this.onChangeTab(0);
                        else this.onChangeTab(this.editState.selectedIndex);
                    }
                }
            })
    }

    onChangeTab(indx) {
        this.editState.selectedIndex = indx;
        this.editState.formLayout = this.layoutGeneration(indx);
    }

    createSpecsControls(option, optionIndx) {
        let controls = this._fb.group({
            id: option.id,
            jobs_service_revisions_id: option.jobs_service_revisions_id,
            option_no: option.option_no,
            form_save_values: this._fb.array([]),
            spec_ids: this._fb.array(option.spec_ids || [])
        });
        option.specs.map(spec => {
            const is_adhoc = spec.form_save_values.is_adhoc || false;
            (<FormArray>controls.controls.form_save_values).push(this._fb.group(this.createFormBuilder(spec.form_save_values, spec, is_adhoc, optionIndx)))
        });
        this.optionsGroup.addControl(option.id, controls);
    }

    createFormBuilder(data, spec, isNew = false, optionIndx = this.editState.selectedIndex) {
        const changedValues = this.editState.selectedService['options'][optionIndx].changed_attributes || [];
        let controls = {
            id: data.id,
            layout: data.layout || 1
        };

        const indx = changedValues.indexOf(Number(data.id));
        if (indx > -1) controls['has_change'] = true;

        if (isNew) controls['is_adhoc'] = true;

        const settings: any = {};
        if (spec.settings) {
            Object.keys(spec.settings).map(key => {
                settings[key] = data.settings[key] || false;
            })
        }
        controls['settings'] = this._fb.group(settings);

        if (spec.key == 'checkboxes') {
            const group = {};
            spec.options.map(option => {
                let indx = -1;
                if (data.value && Array.isArray(data.value)) {
                    indx = data.value.indexOf(option.id);
                    if (indx > -1) group[option.id] = true;
                    else group[option.id] = false;
                } else if (spec.value && Array.isArray(spec.value)) {
                    indx = spec.value.indexOf(option.id);
                    if (indx > -1) group[option.id] = true;
                    else group[option.id] = false;
                } else {
                    group[option.id] = Object.keys(data.value).length ? data.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
                }
            });
            controls['value'] = this._fb.group(group);
        } else if (spec.key == 'group') {
            const groupControls = [];
            spec.options.map((option, i) => {
                const res = _.find(data.value, ['id', option.id]);
                if (res) groupControls.push(this._fb.group((this.createFormBuilder(res, option))));
                else {
                    const defaultValues = {
                        id: option.id,
                        layout: 1,
                        settings: {},
                        value: spec.key == 'auto_suggest' ? [] : spec.key == 'checkboxes' ? {} : ''
                    }
                    if (option.settings) {
                        Object.keys(option.settings).map(key => {
                            defaultValues.settings[key] = false;
                        })
                    }
                    groupControls.push(this._fb.group((this.createFormBuilder(defaultValues, option))));
                }
            })
            controls['value'] = this._fb.array(groupControls);
        } else if (spec.template_id == 1) {
            controls['value'] = data.value ? (Array.isArray(data.value) ? (data.value.length ? data.value[0] : '') : data.value) : (Array.isArray(spec.value) ? (spec.value.length ? spec.value[0] : '') : spec.value);
        } else {
            const validators = [];
            if (settings.mandatory) validators.push(Validators.required);
            controls['value'] = spec.template_id == 3 ? new FormControl(data.value, validators) || new FormControl(spec.value, validators) : new FormControl(data.value, validators) || new FormControl(spec.value, validators);
        }
        if (spec.template_id == 3 || spec.key == 'dropdown') spec.options.map(opt => { opt.name = opt.value; })
        return controls;
    }

    layoutGeneration(indx) {
        let arr = [];
        const selectedOption: any = this.editState.selectedService['options'][indx];
        const layout = selectedOption.form_layout;
        const values = selectedOption['specs'];
        for (var i = 0; i < values.length; i++) {
            values[i].index = i;
            if (layout == 1 || layout == 3) {
                if (values[i].form_save_values.layout == 1 || values[i].form_save_values.layout == '') {
                    arr.push([values[i]]);
                } else {
                    if (values[i + 1]) {
                        if (values[i + 1].form_save_values.layout == 2) {
                            values[i + 1].index = i + 1;
                            arr.push([values[i], values[i + 1]]);
                            i++;
                        } else {
                            arr.push([values[i], null]);
                        }
                    }
                }
            } else if (layout == 2) {
                if (values[i].form_save_values.layout == 1) {
                    arr.push([values[i]])
                } else {
                    if (values[i + 1] && values[i + 1].form_save_values.layout == 2) {
                        values[i + 1].index = i + 1;
                        arr.push([values[i], values[i + 1]]);
                        i++;
                    } else {
                        arr.push([values[i], null])
                    }
                }
            }
        }
        // if (selectedOption.hasOwnProperty('specs')) {
        //     const selectedControl: FormArray = (<FormArray>(<FormGroup>this.optionsGroup.controls[selectedOption.id]).controls['form_save_values']);
        //     for (let i = 0; i < selectedOption['specs'].length; i++) {
        //         const spec = selectedOption['specs'][i];
        //         if (spec) spec.index = i;
        //         const defaultSpec = spec ? selectedControl.controls[i].value : {};
        //         const nextSpec = selectedOption['specs'][i + 1];
        //         if (nextSpec) nextSpec.index = i + 1;
        //         const nextDefaultSpec = nextSpec ? selectedControl.controls[i + 1].value : {};
        //         if (spec) {
        //             if (selectedOption.form_layout == 1 || selectedOption.form_layout == 3) {
        //                 if (spec.form_save_values.layout == 1 || spec.form_save_values.layout == '') {
        //                     arr.push([spec]);
        //                 } else {
        //                     if (nextSpec) {
        //                         if (nextSpec.form_save_values && nextSpec.form_save_values.layout == 2) {
        //                             arr.push([spec, nextSpec]);
        //                             i++;
        //                         } else {
        //                             arr.push([spec, null])
        //                         }
        //                     }
        //                 }
        //             } else if (selectedOption.form_layout == 2) {
        //                 if (spec.form_save_values.layout == 1) {
        //                     arr.push([spec]);
        //                 } else {
        //                     if (nextSpec) {
        //                         if (nextSpec.form_save_values && nextSpec.form_save_values.layout == 2) {
        //                             arr.push([spec, nextSpec]);
        //                             i++;
        //                         } else {
        //                             arr.push([spec, null])
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
        return arr;
    }

    updateFormLayout(arr) {
        const selectedOption: any = this.editState.selectedService['options'][this.editState.selectedIndex];
        for (let i = 0; i < arr.length; i++) {
            if (selectedOption.form_layout == 1 || selectedOption.form_layout == 3) {
                if (arr[i].form_save_values.layout == 1 || arr[i].form_save_values.layout == '' || arr[i].form_save_values.layout == 3) {
                    this.editState.formLayout.push([arr[i]])
                } else {
                    if (arr[i + 1]) {
                        if (arr[i + 1].form_save_values && arr[i + 1].form_save_values == 2) {
                            this.editState.formLayout.push([arr[i], arr[i + 1]]);
                            i++;
                        } else {
                            this.editState.formLayout.push([arr[i], null])
                        }
                    }
                }
            } else if (selectedOption.form_layout == 2) {
                if (arr[i].form_save_values.layout == 1) {
                    this.editState.formLayout.push([arr[i]]);
                } else {
                    if (!this.editState.formLayout[this.editState.formLayout.length - 1][1]) {
                        this.editState.formLayout[this.editState.formLayout.length - 1][1] = arr[i];
                    } else {
                        if (arr[i + 1]) {
                            if (arr[i + 1].form_save_values && arr[i + 1].form_save_values.layout == 2) {
                                this.editState.formLayout.push([arr[i], arr[i + 1]]);
                                i++;
                            } else {
                                this.editState.formLayout.push([arr[i], null])
                            }
                        } else {
                            if (arr[i].form_save_values.layout == 1 || arr[i].form_save_values.layout == '' || arr[i].form_save_values.layout == 3) {
                                this.editState.formLayout.push([arr[i]])
                            } else {
                                this.editState.formLayout.push([arr[i], null])
                            }
                        }
                    }
                }
            }
        }
    }

    // get randomId(): string {
    // 	let rand = Math.random().toString().substr(5);
    // 	return 'new_' + rand;
    // }

    addOption() {
        const options = [];
        this.editState.selectedService['options'].map((o, i) => {
            options.push({ id: i, name: i + 1 });
        })
        this._dialog.open(AddOptionComponent, {
            panelClass: ['my-dialog', 'add-options'],
            width: '600px',
            data: {
                title: 'Add Options',
                options: options
            }
        })
            .afterClosed()
            .subscribe(res => {
                if (typeof res != 'undefined' && typeof res != 'string') {
                    // const option = _.find(this.editState.selectedService['options'], ['id', res]) || {};
                    const option = this.editState.selectedService['options'][res] || {};
                    let newOption: any = { ...option };
                    newOption.id = this.randomId();
                    newOption.option_no = this.editState.selectedService['options'].length + 1;
                    if (this.editState.refresh) {
                        newOption.specs.map((o, i) => {
                            o.form_save_values = { ...(<FormArray>(<FormGroup>this.optionsGroup.controls[option.id]).controls.form_save_values).controls[i].value };
                        })
                    }
                    this.editState.selectedService['options'].push(newOption);
                    this.editState.selectedIndex = this.editState.selectedService['options'].length - 1;
                    this.createSpecsControls(this.editState.selectedService['options'][this.editState.selectedIndex], this.editState.selectedIndex);
                    this.optionsGroup.markAsDirty();
                }
            })
    }
    prePareOption() {
        this.selectedTabOptions = []
        this.editState.selectedService['options'].map((o, i) => {
            this.selectedTabOptions.push({ id: i, name: i + 1 });
        })
        this.selectedTabOption = this.selectedTabOptions[this.selectedTabOptions.length - 1].id;
    }
    addOptionTab() {

        if (typeof this.selectedTabOption != 'undefined' && typeof this.selectedTabOption != 'string') {
            // const option = _.find(this.editState.selectedService['options'], ['id', res]) || {};
            const option = this.editState.selectedService['options'][this.selectedTabOption] || {};
            let newOption: any = _.cloneDeep(option);
            newOption.changed_attributes = [];
            newOption.id = this.randomId();
            newOption.option_no = this.editState.selectedService['options'].length + 1;
            if (this.editState.refresh) {
                newOption.specs.map((o, i) => {
                    o.form_save_values = { ...(<FormArray>(<FormGroup>this.optionsGroup.controls[option.id]).controls.form_save_values).controls[i].value };
                })
            }
            this.editState.selectedService['options'].push(newOption);
            this.editState.selectedIndex = this.editState.selectedService['options'].length - 1;
            this.createSpecsControls(this.editState.selectedService['options'][this.editState.selectedIndex], this.editState.selectedIndex);
            this.optionsGroup.markAsDirty();
        }
    }

    addSpecs(serv) {
        this._dialog.open(AddSpecDialogComponent, {
            panelClass: 'my-dialog',
            width: '600px',
            data: {
                title: 'Add Form Specs',
                type: 1,
                id: serv.jobs_service_revisions_id,
                url: '',
                total: serv.options[this.editState.selectedIndex].specs.length,
                layout: serv.options[this.editState.selectedIndex].form_layout,
                spec_ids: serv.options[this.editState.selectedIndex].spec_ids
            }
        })
            .afterClosed()
            .subscribe(res => {
                if (res.success) {
                    serv.options[this.editState.selectedIndex].spec_ids = [...serv.options[this.editState.selectedIndex].spec_ids, ...res.data.spec_ids];
                    res.data.specs.map(spec => {
                        (<FormArray>(<FormGroup>this.optionsGroup.controls[serv.options[this.editState.selectedIndex].id]).controls.spec_ids).push(new FormControl(spec.id));
                        (<FormArray>(<FormGroup>this.optionsGroup.controls[serv.options[this.editState.selectedIndex].id]).controls.form_save_values).push(this._fb.group(this.createFormBuilder(spec.form_save_values, spec, true)));
                    })
                    serv.options[this.editState.selectedIndex].specs = [...serv.options[this.editState.selectedIndex].specs, ...res.data.specs];
                    this.updateFormLayout(res.data.specs);
                    this.optionsGroup.markAsDirty();
                }
            })
    }

    applyStyle() {
        //let outter = document.getElementsByClassName('ag-root')[0] as HTMLElement;
        let inner = document.getElementsByClassName('detail-info')[0] as HTMLElement;
        let element = document.getElementsByClassName('recon-product-view')[0] as HTMLElement;
        if (inner) {
            let scrollbarWidth = (inner.offsetWidth - element.scrollWidth);
            element.style.marginRight = "-" + scrollbarWidth + 'px';
        }
    }

    deleteAdhocSpec(layout, layoutIdx) {
        this._dialog.open(ConfirmationComponent, {
            panelClass: ['recon-dialog', 'confirmation-dialog'],
            width: '600px',
            data: {
                title: 'Delete Spec',
                content: 'Are you sure you want to delete this spec?'
            }
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    const spec = this.editState.selectedService['options'][this.editState.selectedIndex]['specs'].splice(layout.index, 1)[0];
                    const indx = this.editState.selectedService['options'][this.editState.selectedIndex]['spec_ids'].indexOf(spec.id);
                    if (indx > -1) this.editState.selectedService['options'][this.editState.selectedIndex]['spec_ids'].splice(indx, 1);
                    this.editState.formLayout = this.layoutGeneration(this.editState.selectedIndex);
                    (<FormArray>(<FormGroup>this.optionsGroup.controls[this.editState.selectedService['options'][this.editState.selectedIndex].id]).controls.spec_ids).removeAt(layout.index);
                    (<FormArray>(<FormGroup>this.optionsGroup.controls[this.editState.selectedService['options'][this.editState.selectedIndex].id]).controls.form_save_values).removeAt(layout.index);
                }
            });
    }

    // closeDialog() {
    // 	this._dialogRef.close({ canRefresh: this.state.refresh });
    // }

    saveSpecs(submit = false) {
        this.editState.submitted = true;
        if (this.optionsGroup.valid) {
            if (!this.promise) {
                this.editState.submitted = false;
                this._commonService.update({ type: 'overlay', action: 'start' });
                const options = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options);
                this.removeHasChanged(options);
                const params = _.find(options, ['id', this.editState.selectedService['options'][this.editState.selectedIndex].id]);
                options.map(p => {
                    let option = _.find(this.editState.selectedService['options'], ['id', p.id]);
                    p.form_save_values.map(o => {
                        const spec = _.find(option.specs, ['form_save_values.id', o.id]);
                        if (spec && spec.template_id == 1) {
                            if (spec.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
                            else o.value = o.value ? [o.value] : [];
                        }
                    })
                })
                let values = {
                    jsr_id: this.editState.selectedService['jobs_service_revisions_id'],
                    revision_no: this.editState.selectedRevision,
                    options: options
                }
                if (submit) values['form_submit'] = submit;
                this.promise = this._commonService.saveApi('saveJobFormSpecDetails', values)
                    .then(res => {
                        this.promise = undefined;
                        if (res['result'].success) {
                            this.updateJobStatus();
                            // if (submit) {
                            // 	this.editState.selectedService['form_status'] = 'Submitted';
                            // 	this.editState.selectedService['form_status_id'] = 2;
                            // 	this.editState.selectedService['form_submit'] = true;
                            // }
                            this.editState.selectedService['old_form_status_id'] = this.editState.selectedService['form_status_id'];
                            this.editState.selectedService['form_status'] = res['result'].data.form_status;
                            this.editState.selectedService['form_status_id'] = res['result'].data.form_status_id;
                            this.editState.selectedService['form_submit'] = true;

                            let serv = this.editState.productList[this.editState.productIndex].services[this.editState.serviceIndex];
                            serv.form_status = res['result'].data.form_status;
                            serv.form_status_id = res['result'].data.form_status_id;
                            serv.form_submit = true;

                            this.editState.refresh = true;
                            this.openSnackBar({ status: 'success', msg: 'Specs Updated Successfully' });
                            Object.keys(this.optionsGroup.value).map(key => {
                                this.optionsGroup.removeControl(key);
                            });
                            // this.onChangeRevision(this.editState.selectedService, this.editState.selectedRevision, false);
                            this.serviceForm.markAsPristine();
                            this.backToList();
                        }
                        this._commonService.update({ type: 'overlay', action: 'stop' });
                    })
                    .catch(err => {
                        this.promise = undefined;
                        this._commonService.update({ type: 'overlay', action: 'stop' });
                    })
            }
        } else {
            const optionIds = Object.keys(this.optionsGroup.value);
            let isEnter = true, counter = 0;
            while (counter < optionIds.length && isEnter) {
                if (!this.optionsGroup.controls[optionIds[counter]].valid) {
                    let invalid: Array<FormControl> = [];
                    (<FormArray>(<FormGroup>this.optionsGroup.controls[optionIds[counter]]).controls.form_save_values).controls.map((o: FormGroup) => {
                        if (!o.controls.value.valid) invalid.push((<FormControl>o.controls.value));
                    })
                    isEnter = false;
                    const indx = _.findIndex(this.editState.selectedService['options'], ['id', Number(optionIds[counter]) ? Number(optionIds[counter]) : optionIds[counter]]);
                    if (indx > -1) {
                        if (this.editState.selectedIndex != indx)
                            this.onChangeTab(indx);
                    }
                }
                counter++;
            }
            if (!isEnter) {
                this.openSnackBar({ status: 'error', msg: 'Please fill all Mandatory fields' });
            }
        }
    }

    removeHasChanged(options) {
        options.map(o => {
            o.form_save_values.map(p => {
                delete p.has_change;
            })
        })
    }

    updateJobStatus() {
        this._commonService.getApi('getJobInfo', { id: this._route.parent.snapshot.params.id, type: 'status' })
            .then(res => {
                if (res['result'].success) {
                    this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
                }
            });
    }

    saveToNewRevision(revSubmit = false) {
        if (!this.editPromise) {
            this._commonService.update({ type: 'overlay', action: 'start' });
            const params = { ...this.serviceForm.value };
            params['options'] = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options);
            this.removeHasChanged(params['options']);
            params['is_revision'] = true;
            if (revSubmit) params['revision_submit'] = revSubmit;
            this.editPromise = this._commonService.saveApi('updateJobSrv', params)
                .then(res => {
                    this.editPromise = undefined;
                    if (res['result'].success) {
                        this.updateJobStatus();
                        this.editState.refresh = true;
                        // if (revSubmit) {
                        // 	this.editState.selectedService['form_status'] = 'Submitted';
                        // 	this.editState.selectedService['form_status_id'] = 2;
                        // 	this.editState.selectedService['form_submit'] = true;
                        // }
                        this.editState.selectedService['old_form_status_id'] = this.editState.selectedService['form_status_id'];
                        this.editState.selectedService['form_status'] = res['result'].data.form_status;
                        this.editState.selectedService['form_status_id'] = res['result'].data.form_status_id;
                        this.editState.selectedService['form_submit'] = true;
                        this.editState.selectedService['service_revision_no'] = this.editState.selectedService['service_revision_no'] + 1;
                        this.editState.selectedRevision = this.editState.selectedService['service_revision_no'];

                        let serv = this.editState.productList[this.editState.productIndex].services[this.editState.serviceIndex];
                        serv.form_status = res['result'].data.form_status;
                        serv.form_status_id = res['result'].data.form_status_id;
                        serv.form_submit = true;
                        serv.service_revision_no = this.editState.selectedService['service_revision_no'];

                        this.openSnackBar({ status: 'success', msg: 'Successfully Added to New Revision' });
                        this.serviceForm.markAsPristine();
                        // this.revisionChange(this.editState.selectedService['service_revision_no']);
                        this.backToList();
                    }
                    this._commonService.update({ type: 'overlay', action: 'stop' });
                })
                .catch(err => {
                    this.editPromise = undefined;
                    this._commonService.update({ type: 'overlay', action: 'stop' });
                })
        }
    }


    saveAndPreservePricing(revSubmit = false) {
        if (!this.editPromise) {
            this._commonService.update({ type: 'overlay', action: 'start' });
            const params = { ...this.serviceForm.value };
            params['options'] = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options);
            this.removeHasChanged(params['options']);
            params['is_revision'] = true;
            params['is_preserve'] = true;
            if (revSubmit) params['revision_submit'] = revSubmit;
            this.editPromise = this._commonService.saveApi('updateJobSrv', params)
                .then(res => {
                    this.editPromise = undefined;
                    if (res['result'].success) {
                        this.updateJobStatus();
                        this.editState.refresh = true;
                        this.editState.selectedService['old_form_status_id'] = this.editState.selectedService['form_status_id'];
                        this.editState.selectedService['form_status'] = res['result'].data.form_status;
                        this.editState.selectedService['form_status_id'] = res['result'].data.form_status_id;
                        this.editState.selectedService['form_submit'] = true;
                        this.editState.selectedService['service_revision_no'] = this.editState.selectedService['service_revision_no'] + 1;
                        this.editState.selectedRevision = this.editState.selectedService['service_revision_no'];

                        let serv = this.editState.productList[this.editState.productIndex].services[this.editState.serviceIndex];
                        serv.form_status = res['result'].data.form_status;
                        serv.form_status_id = res['result'].data.form_status_id;
                        serv.form_submit = true;
                        serv.service_revision_no = this.editState.selectedService['service_revision_no'];

                        this.openSnackBar({ status: 'success', msg: 'Successfully Added to New Revision' });
                        this.serviceForm.markAsPristine();
                        this.backToList();
                    }
                    this._commonService.update({ type: 'overlay', action: 'stop' });
                })
                .catch(err => {
                    this.editPromise = undefined;
                    this._commonService.update({ type: 'overlay', action: 'stop' });
                })
        }
    }


    submitRevision() {
    }

    resetForm() {
        const selectedOption = this.editState.selectedService['options'][this.editState.selectedIndex];
        const specValues = this.editState.selectedService['options'][this.editState.selectedIndex].specs.map(o => o.form_save_values);
        if (!this.optionsGroup.controls[selectedOption.id].pristine) {
            this.optionsGroup.controls[selectedOption.id].reset({
                id: selectedOption.id,
                jobs_service_revisions_id: selectedOption.jobs_service_revisions_id,
                option_no: selectedOption.option_no,
                form_save_values: specValues,
                spec_ids: selectedOption.spec_ids
            })
        }
    }

    resetSpecOrder() {
        this.editState.selectedServiceSpecs = _.cloneDeep(this.editState.selectedService);
    }

    saveSpecOrder() {
        let options: any = [];
        this.editState.selectedServiceSpecs['options'].map(o => {
            options.push({
                id: o.id,
                jobs_service_revisions_id: this.editState.selectedServiceSpecs['jobs_service_revisions_id'],
                option_no: o.option_no,
                spec_ids: o.framed_layout.map(o => o && o.length ? o[0].id : '')
            })
        })
        let values = {
            jsr_id: this.editState.selectedServiceSpecs['jobs_service_revisions_id'],
            revision_no: this.editState.selectedRevision,
            options: options,
            type: 'sort'
        }
        this._commonService.saveApi('saveJobFormSpecDetails', values)
            .then(res => {
                this.editState.selectedService = _.cloneDeep(this.editState.selectedServiceSpecs);
                this.editState.selectedProduct['services'].map((service) => {
                    if (service.jobs_service_revisions_id == this.editState.selectedService['jobs_service_revisions_id']) {
                        service['options'] = this.editState.selectedService['options'];
                    }
                });
                this.openSnackBar({ status: 'success', msg: 'Specs Reordered Successfully' });
                this.backToList();
            });
    }


    changeDetection(config, cb) {
        const locals = {
            title: 'Products',
            tab: 'Product',
            ...config
        }
        this._dialog.open(ChangeDetectionComponent, {
            panelClass: ['recon-dialog', 'confirmation-dialog'],
            width: '540px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res) {
                    if (cb) cb(res.status)
                }
            })
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

    updateProductName(product) {
        this.state.productWidth = this.productName.nativeElement.offsetWidth;
    }

    editProductName(product) {
        product.isEdit = true;
        product['temp_name'] = _.cloneDeep(product.name);
        setTimeout(() => {
            this.state.productWidth = this.productName.nativeElement.offsetWidth;
            this.myInput.nativeElement.focus();
        }, 20);
    }

    updateProdName(product) {
        product.isEdit = false;
        if (product['temp_name'].trim() != '') {
            if (!this.promise) {
                product['name'] = _.cloneDeep(product['temp_name']);
                this.promise = this._commonService.saveApi('saveJobPrdName', { id: product.products_id, product_name: product['temp_name'] }).then(res => {
                    this.promise = undefined;
                })
                    .catch(err => {
                        this.promise = undefined;
                    });
            }
        }
    }

    checkPermissions(key = 'products') {
        let isPartOfJob = this.state.projectDetails['is_related_to_project'];
        let status = this.state.projectDetails['job_status_id'];
        let perm = APP.permissions.job_access;
        let valid = false;
        if (status == 8 || status == 10) {
            if (perm['post-completion_estimate'] != 'yes') {
                valid = false;
                return;
            }
            if (isPartOfJob == 1 && perm[key].job_specific_user == 'edit') {
                valid = true;
            } else if (isPartOfJob != 1 && perm[key].job_specific_others == 'edit') {
                valid = true;
            }
        } else if (status == 5) {
            if (perm.edit_cancelled_jobs == 'yes') {
                if (isPartOfJob == 1 && perm[key].job_specific_user == 'edit') {
                    valid = true;
                } else if (isPartOfJob != 1 && perm[key].job_specific_others == 'edit') {
                    valid = true;
                }
            }
        } else {
            if (isPartOfJob == 1 && perm[key].job_specific_user == 'edit') {
                valid = true;
            } else if (isPartOfJob != 1 && perm[key].job_specific_others == 'edit') {
                valid = true;
            }
        }
        return valid;
    }

    /*editActions(flag, key) {
		const locals: any = {
			title: '',
			jobs_id: this.state.projectID
		}
		switch (key) {
			case 'edit':
				locals.title = 'Edit Spec Order - ' + this.editState.selectedService['services_name'];
				const selectedIndex = this.editState.selectedIndex || 0;
				locals.specs = this.editState.selectedService['options'][selectedIndex];
				break;

			case 'removeService':
			case 'cancelService':
				const stext = key == 'removeService' ? 'remove' : 'cancel';
				locals.title = stext + ' Service';
				locals.action = stext;
				locals.tab = 'Service';
				locals.url = 'delJobPrdtSrv';
				locals.params = {
					id: this.editState.selectedService['jobs_service_revisions_id'],
					type: 'service'
				};
				locals.content = 'Are you sure, you want to ' + stext + ' this Service'
				break;

			default:
				break;
		}

		if (flag == 'remove') this.confirmDialog(locals, key);
		else if (flag == 'edit') this.editServiceOrder(locals);

    }*/

}
