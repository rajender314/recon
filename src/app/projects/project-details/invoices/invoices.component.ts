import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { HttpClient } from '@angular/common/http';
import { GridOptions, GridApi, ColumnApi } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material';
import { EditInvoiceComponent } from '@app/projects/project-details/invoices/edit-invoice/edit-invoice.component';
import { ProjectSubNav } from '@app/shared/utility/config';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import * as _ from 'lodash';
import { InvoiceService } from './invoice.service';
import { ProjectDetailsService } from '@app/projects/project-details/project-details.service';

var APP: any = window['APP'];


/* Invoice Cell */
@Component({
    template: `<div class="user-media">
        <div class="figure invoices-list-icon-ui">
             <pi-icon name="icon-invoices" size="lg" background="#7d84f0" color="#fff"></pi-icon> 
        </div>
        <div class="user-media-body" style="padding-top: 0;">
                <p class="user-name" [innerHtml]="params.value"></p>
                
        </div>
		<!--<div class="figure">
			<i class="pixel-icons icon-pn-estimates"></i>
			<div class="container">
				<span [innerHtml]="params.value"></span>
				<span [innerHtml]="params.data?.description"></span>
			</div>
		</div>!-->
		<!--<div class="right">
      		<div class="product-count"><i class="pixel-icons icon-products"></i>{{params.data?.product_cnt}}</div>
      		<div class="service-count"><i class="pixel-icons icon-orders"></i>{{params.data?.services_cnt}}</div>
		</div>!-->
	</div>`,
    styles: [
        `
        <!-- .invoice-cell{display: flex;}
		.invoice-cell .left{display: flex;align-items: center;flex: 1;}
		.invoice-cell .right{display: flex;}
		.invoice-cell .left .icon-pn-estimates{color: #fff;padding: 21px;display: flex;
			align-items: center;justify-content: center;border-radius: 4px;margin-right: 10px;
			background: #8183F7;font-size: 22px;}
		.invoice-cell .left .container{display: flex;flex-direction: column;}
		.invoice-cell .right i{font-size: 16px;width: 20px;height: 18px;}
		.invoice-cell .right .product-count, .invoice-cell .right .service-count{display: flex;align-items: center;}
		.invoice-cell .right .product-count{margin-right: 18px;}
		.invoice-cell .right .icon-products{color: #5678e3;}
		.invoice-cell .right .icon-orders{color: #dc4f66;font-size: 14px;height: 14px;
			margin-right: 6px;width: 14px;} !-->
		`
    ]
})

export class InvoiceCell implements OnInit {
    public params: any;
    public checkbox = false;

    constructor(
    ) { }

    ngOnInit() {
    }

    agInit(params: any): void {
        this.params = params;
    }

}

@Component({
    selector: 'app-invoices',
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit, OnDestroy {

    APP: any = APP;
    height: string = 'auto';
    isLoading: boolean = true;
    showGenerateInvoice: boolean = false;
    public checkAvalara: any;
    breadcrumbs = [
        { label: 'Projects', type: 'link', route: '/projects' },
        { label: 'Name', type: 'text' },
        /*  { label: 'Invoices', type: 'text' } */
    ];
    tabs = [
        { id: 1, label: 'Final Invoice', disable: false },
        /*  { id: 2, label: 'Invoices in GP', disable: true } */
    ];
    previewActions = [
        { id: 1, name: '<i class="pixel-icons icon-pencil"></i>', type: 'edit', key: 'Edit Costs' }
    ];

    activeTab: number = 1;
    invoiceList: Array<any> = [];
    selectedInvoice: any;
    errorMsg: string = '';
    subNav: ProjectSubNav = {
        icons: 'icon-invoices',
        title: 'Back to Projects',
        allText: 'All Invoices',
        className: 'invoice',
        noData: 'No Invoices Generated',
        idKey: 'est_id',
        displayKey: 'estimate_no',
        statusClass: 'invoice-status',
        statusIdKey: 'invoice_status_id',
        statusNameKey: 'invoice_status',
        costKey: 'cost',
        prefix: '',
        list: []
    }
    routerSubscription: Subscription;
    subscription: Subscription;
    navBarSubscription: Subscription;
    invoiceSubscription: Subscription;

    constructor(
        private _router: Router,
        private _activeRouter: ActivatedRoute,
        private _commonService: CommonService,
        private _http: HttpClient,
        private _dialog: MatDialog,
        private _invoiceService: InvoiceService,
        private _projectDetailService: ProjectDetailsService
    ) {
        this.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
        this.routerSubscription = _router.events.subscribe(val => {
            if (val instanceof NavigationEnd) {
                if (_activeRouter.firstChild) {
                    this.height = _activeRouter.firstChild.snapshot.data.height
                }
            }
        })

        this.subscription = _commonService.onUpdate().subscribe(obj => {
            if (obj.type == 'projectName' && Object.keys(obj.data).length) {
                this.breadcrumbs[1].label = obj.data.job_title || '----';
            }
        });

        this.navBarSubscription = _commonService.onUpdate().subscribe(ev => {
            if (ev.type == 'grid-view') {
                if (ev.data.isActive) {
                    this.isLoading = true;
                    this.selectedInvoice = null;
                    _router.navigate(['/projects/' + this._activeRouter.parent.snapshot.params.id + '/invoices']);
                }
            } else if (ev.type == 'preview') {
                if (!this.selectedInvoice || this.selectedInvoice.est_id != ev.data.est_id) {
                    this.selectedInvoice = ev.data;
                    _router.navigate(['/projects/' + this._activeRouter.parent.snapshot.params.id + '/invoices/' + this.selectedInvoice.est_id]);
                }
            }
        })

        this.invoiceSubscription = _invoiceService.onUpdate().subscribe(ev => {
            if (ev.type == 'init') {
                this.isLoading = false;
                this.invoiceList = ev.data.list || [];
                this.showGenerateInvoice = ev.data.generate_invoice;
                let inv = [];
                inv.push(this.invoiceList[0]);
                this.subNav.list = this.invoiceList;
                this.subNav['selectedItem'] = null;
                this.selectedInvoice = null;
                if (this.invoiceList.length > 1) {
                    if (this.subNav.list.length > 1) this._commonService.update({ type: 'sub-nav', data: this.subNav });
                } else if (this.invoiceList.length == 1) {
                    if (this.invoiceList[0].children.length) this._commonService.update({ type: 'sub-nav', data: this.subNav });
                    else {
                        this.selectedInvoice = this.invoiceList[0];
                        _router.navigate(['/projects/' + this._activeRouter.parent.snapshot.params.id + '/invoices/' + this.invoiceList[0].est_id]);
                    }
                }
            } else if (ev.type == 'selected-invoice') {
                const selected = _.find(this.invoiceList, ['est_id', Number(ev.data)]);
                if (selected) {
                    this.selectedInvoice = selected;
                    this.subNav['selectedItem'] = this.selectedInvoice;
                    if ((this.subNav.list.length == 1 && this.subNav.list[0].children.length) || this.subNav.list.length > 1) this._commonService.update({ type: 'sub-nav', data: this.subNav });
                } else {
                    let childInvoice = null;
                    this.invoiceList.filter(o => {
                        if (o.children && o.children.length) {
                            return o.children.filter(p => {
                                if (p.est_id == ev.data) {
                                    childInvoice = p;
                                }
                            })
                        }
                    })
                    if (childInvoice) {
                        this.selectedInvoice = childInvoice;
                        this.subNav['selectedItem'] = this.selectedInvoice;
                        if ((this.subNav.list.length == 1 && this.subNav.list[0].children.length) || this.subNav.list.length > 1) this._commonService.update({ type: 'sub-nav', data: this.subNav });
                    }
                }
            }
        })
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
        this.subscription.unsubscribe();
        this.navBarSubscription.unsubscribe();
        this.invoiceSubscription.unsubscribe();
    }

    changeMasterView() {
        this._commonService.onChange();
    }

    onTabChange(tab) {
        this.activeTab = tab.id;
    }

    promise: any;
    generateInvoice(flag = 'init') {
        if (!this.promise)
            this._commonService.update({ type: 'overlay', action: 'start' });

        this.checkForSplitEstimates(this.generateInvoiceSuccess.bind(this), { jobs_id: this._activeRouter.parent.snapshot.params.id }, flag);

    }

    generateInvoiceSuccess(flag) {
        this.promise = this._commonService.getApi('generateInvoices', { jobs_id: this._activeRouter.parent.snapshot.params.id })
            .then(res => {
                this.promise = undefined;
                this._commonService.update({ type: 'overlay', action: 'stop' });
                if (res['result'].success) {
                    if (res['result'].data) {
                        this.errorMsg = '';
                        this._invoiceService.update({ type: 'generate', data: null });
                        if (flag == 'next') {
                            this._router.navigate(['/projects/' + this._activeRouter.parent.snapshot.params.id + '/invoices']);
                        }
                    }
                    else this.errorMsg = '<div class="no-data">No Approved Estimates found in this Job</div>'
                }
            })
            .catch(err => {
                this.promise = undefined;
                this._commonService.update({ type: 'overlay', action: 'stop' });
            })
    }

    printInvoice() {
        let windowPrint = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
        windowPrint.document.write(document.getElementsByClassName('preview-wrapper')[0].innerHTML);
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
    }

    exportInvoice() {
        const dt = new Date();
        window.location.href = APP.api_url + 'estimatePreviewPdf?id=' + this.selectedInvoice.est_id + '&jobs_id=' + this._activeRouter.parent.snapshot.params.id + '&token=' + APP.access_token + '&jwt=' + APP.j_token + '&time_zone=' + String(dt.getTimezoneOffset());
    }

    performActions(action) {
        switch (action.type) {
            case 'edit':
                this.editInvoice();
                break;

            default:
                break;
        }
    }

    RecalculateTaxes() {
        this._commonService.saveApi('avalaraTaxCalc', {
            estimate_ids: [this.selectedInvoice.est_id],
            jobs_id: this._activeRouter.parent.snapshot.params.id,
            is_estimate: false
        }).then(res => {
        });
    }

    checkForSplitEstimates(generate?: any, postData?: any, params?: any) {
        this._commonService.getApi('getGeneratInvoiceSplits', postData).then(res => {
            if (res['result'].success) {
                this._commonService.update({ type: 'overlay', action: 'stop' });
                if (res['result'].data && res['result'].data.length) {
                    this._dialog.open(ConfirmationComponent, {
                        panelClass: 'my-dialog',
                        width: '600px',
                        data: {
                            title: 'Generate Invoice',
                            buttons: {
                                yes: 'Generate Invoice',
                                no: 'Cancel'
                            },
                            buildHtml: true,
                            list: res["result"].data
                        }
                    })
                        .afterClosed()
                        .subscribe(res => {
                            if (res && res.success) {
                                generate(params);
                            }
                        });
                } else {
                    generate(params);
                }
            }
        });
    }

    regenerateFromEstimateSuccess(params?: any) {
        this._commonService.getApi('generateInvoices', {
            jobs_id: this._activeRouter.parent.snapshot.params.id,
            estimates_id: this.selectedInvoice.est_id,
            regenerate: true
        }).then(res => {
            if (res['result'].success) {
                if (res['result'].data && res['result'].data.error) {
                    this._dialog.open(ConfirmationComponent, {
                        panelClass: 'my-dialog',
                        width: '600px',
                        data: {
                            title: 'Regenerate Estimate',
                            content: res['result'].data.error
                        }
                    });
                } else if (res['result'].data) {
                    this._invoiceService.update({ type: 'detail-view', data: this.selectedInvoice });
                }
            }
        });
    }

    regenerateFromEstimates() {
        this.checkForSplitEstimates(this.regenerateFromEstimateSuccess.bind(this),
            {
                jobs_id: this._activeRouter.parent.snapshot.params.id,
                estimates_id: this.selectedInvoice.est_id
            });
    }

    generateTaxes(tax) {
        let taxes = '';
        for (var i in tax.state_list) {
            let item = tax.state_list[i];
            taxes = taxes + '<p><span>' + item.state + '</span><span>$' + item.tax_amount + '</span></p>'
        }
        document.querySelector('.avalara_tax').innerHTML = taxes;
        document.querySelector('.grand_total').innerHTML = '$' + tax.grand_total;
        document.querySelector('.logo-section').querySelector('.status').innerHTML = 'Finalized';
        document.querySelector('.date-info').innerHTML = '<div class="f1"><p>Finalized By: ' + tax.finalizedBy + '</p><p>on ' + tax.finalizedOn + '</p></div><div style="clear:both;"></div>';
    }

    isThereAnyEstimates() {
        this.selectedInvoice.invoice_status_id = 1;
        this._commonService.getApi('checkAvalaraStatus', {
            estimate_id: this.selectedInvoice.est_id
        }).then(res => {
            if (res && res['result'] && res['result'].success) {
                switch (res['result'].data.status) {
                    case 0:
                        document.querySelector('.avalara_tax') ? document.querySelector('.avalara_tax').innerHTML = '<span class="load_data">Taxes are being calculated, please wait�</span>' : '';
                        setTimeout(() => {
                            this.isThereAnyEstimates();
                        }, 20000);
                        break;
                    case 1:
                        document.querySelector('.avalara_tax') ? document.querySelector('.avalara_tax').innerHTML = '<span class="load_data">Taxes are being calculated, please wait�</span>' : '';
                        setTimeout(() => {
                            this.isThereAnyEstimates();
                        }, 20000);
                        break;
                    case 2:
                        this._commonService.getApi('getAvalaraDetails', {
                            estimate_id: this.selectedInvoice.est_id,
                            is_invoice: true
                        }).then(response => {
                            if (response && response['result'] && response['result'].success) {
                                this.generateTaxes(response['result'].data);
                            }
                        });
                        break;
                    default:
                        if (res['result'].data.error) {
                            document.querySelector('.avalara_tax').innerHTML = '<span class="load error">' + res['result'].data.error + '</span>';
                        }
                        break;
                }
            }
        });
    }

    finalizeInvoice() {
        // this.isLoading = true;
        // this._dialog.open(ConfirmationComponent, {
        //     panelClass: 'my-dialog',
        //     width: '600px',
        //     data: {
        //         title: 'Finalize Invoice',
        //         content: `<div class="po-dialog">
        //         <div class="">
        //           <span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
        //         </div>
        //         <div class="">
        //           <p>Are you sure, you want to finalize this invoice?</p>
        //         </div>
        //         </div>`,
        //         buttons: {
        //             yes: 'Finalize Invoice',
        //             no: 'Cancel'
        //         }
        //     }
        // })
        // .afterClosed()
        // .subscribe(res => {
        //     if (res && res.success) {
        //         this._commonService.getApi('finalizedInvoice', {
        //             estimate_id: this.selectedInvoice.est_id
        //         }).then(res => {
        //             this.isLoading = false;
        //             if (res && res['result'] && res['result'].success) {
        //                 this.invoiceAlert(res['result'].data);
        //                 // this.errorMsg = '';
        //                 // this.selectedInvoice.invoice_status_id = 1;
        //                 // this.selectedInvoice.invoice_status = 'Finalized';
        //                 // this._invoiceService.update({ type: 'detail-view', data: this.selectedInvoice });
        //             } else {
        //                 // this.invoiceAlert(res['result'].data);
        //                 //force_finalize: true
        //             }
        //         })
        //         this.isThereAnyEstimates();
        //     }
        // });
        this._commonService.getApi('finalizedInvoice', {
            estimate_id: this.selectedInvoice.est_id
        }).then(res => {
            this.isLoading = false;
            if (res && res['result'] && res['result'].success) {
                this.invoiceAlert(res['result'].data);
            }
        });
    }

    invoiceFinalizeConfirmation(content, type){
        this._dialog.open(ConfirmationComponent, {
            panelClass: 'my-dialog',
            width: '600px',
            data: {
                title: 'Finalize Invoice',
                content: `<div class="po-dialog">
                <div class="">
                  <span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
                </div>
                <div class="">
                  <p>${content}</p>
                </div>
                </div>`,
                buttons: {
                    yes: (type==1 || type==4)?false:'Finalize Invoice',
                    no: (type==1 || type==4)?'Ok':'Cancel'
                }
            }
        })
        .afterClosed()
        .subscribe(res => {
            if (res && res.success) {
                if(type==3){
                    content = 'To finalize the invoice please approve all the PO’s in the job.';
                    this.invoiceFinalizeConfirmation(content, 1);
                }else{
                    this._commonService.getApi('finalizedInvoice', {
                        estimate_id: this.selectedInvoice.est_id,
                        force_finalize: true
                    }).then(res => {
                        this.isLoading = false;
                        if (res && res['result'] && res['result'].success) {
                            this.errorMsg = '';
                            this.selectedInvoice.invoice_status_id = 1;
                            this.selectedInvoice.invoice_status = 'Finalized';
                            this._invoiceService.update({ type: 'detail-view', data: this.selectedInvoice });
                            this._projectDetailService.update({ type: 'job_status', data: {finalized_invoice: true} });
                        }
                    })
                    this.isThereAnyEstimates();
                }
            }
        });
    }

    invoiceAlert(type){
        let content = '';
        switch(type){
            case 0: 
                content = 'Are you sure, you want to finalize this invoice?';
                this.invoiceFinalizeConfirmation(content, type);
                break;
            case 1:
                content = 'Are you sure, you want to finalize this invoice? As some PO\'s are not Approved or Cancelled please fix those before finalizing the invoice.';
                this.invoiceFinalizeConfirmation(content, type);
                break;
            case 2: 
                content = 'Are you sure, you want to finalize this invoice?';
                this.invoiceFinalizeConfirmation(content, type);
                break;
            case 3:
                content = 'Are you sure, you want to finalize this invoice? As some PO’s are not Approved or Cancelled please fix those before finalizing the invoice';
                this.invoiceFinalizeConfirmation(content, type);
                break;
            case 4:
                content = 'PO\'s were not able to be processed because there was no vendor invoice found.';
                this.invoiceFinalizeConfirmation(content, type);
                break;
            default:
                break;
        }
    }

    editInvoice() {
        this._dialog.open(EditInvoiceComponent, {
            panelClass: 'my-dialog',
            width: '600px',
            disableClose: true,
            data: {
                title: 'Edit Invoice',
                jobs_id: this._activeRouter.parent.snapshot.params.id,
                row: this.selectedInvoice
            }
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.is_change) {
                    this.selectedInvoice.invoice_status_id = 0;
                    this.selectedInvoice.invoice_status = 'Draft';
                    this._invoiceService.update({ type: 'detail-view', data: this.selectedInvoice });
                }
            })
    }

}
