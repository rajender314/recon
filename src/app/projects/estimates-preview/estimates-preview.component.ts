import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { query } from '@angular/core/src/render3';
import { MatDialog } from '@angular/material';
import { ChangeAddressComponent } from '@app/projects/change-address/change-address.component';
import { ChangeCustomAttributesComponent } from '@app/projects/change-custom-attributes/change-custom-attributes.component';
import { CopySplitEstimateComponent } from '@app/projects/copy-split-estimate/copy-split-estimate.component';
import { ChangeDescriptionComponent } from '@app/projects/change-description/change-description.component';
import { Subscription } from 'rxjs';
import { Lightbox } from 'ngx-lightbox';
import * as _ from 'lodash';
var APP: any = window['APP'];
@Component({
    selector: 'app-estimates-preview',
    templateUrl: './estimates-preview.component.html',
    styleUrls: ['./estimates-preview.component.scss'],
    animations: [
        trigger('showMoreAnimate', [
            transition(':enter', [
                style({ transform: 'translateY(-10px)', opacity: 0 }),
                animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
            ])
        ]),
    ]
})
export class EstimatesPreviewComponent implements OnInit {
    @ViewChild('avalaratax') avalaraTax: ElementRef;
    @Input() options: any;
    @Input('estimate') estimate: any;
    public previewPage: any;
    public loader = true;
    public state = {
        splitLoader: true,
        splitExists: false,
        splitEstimates: [],
        showMore: false
    }
    public selectedEstimate = this.estimate;
    // public estimate_id = this.estimate.selected_revision;
    public estimate_id = this.activeRoute.snapshot.params.estimate_id;
    public job_id = this.activeRoute.parent.snapshot.params.id;

    constructor(
        public _http: HttpClient,
        public _commonService: CommonService,
        private activeRoute: ActivatedRoute,
        private dialog: MatDialog,
        private _lightbox: Lightbox
    ) { }

    ngOnInit() {
        this.getPreview(true);
        if (this.estimate && this.estimate.parent_id && this.estimate.parent_id == '0') {
            this.getSplitEstimates();
        }
    }

    ngOnChanges(){
    }

    showMoreSplits() {
        this.state.showMore = !this.state.showMore;
    }

    downloadSplitEstimate(){
        location.href = APP.api_url+'exportSplitEstimates?jobs_id='+this.activeRoute.parent.snapshot.params.id+"&parent_id="+this.estimate.id+"&token="+APP.access_token+"&jwt="+APP.j_token;
    }

    splitEstimate() {
        this._commonService.update({ type: 'open-split-estimate', id: (this.estimate.parent_id=='0')?this.estimate.id:this.estimate.parent_id });
    }

    copySplitEstimate() {
        this.dialog
            .open(CopySplitEstimateComponent, {
                panelClass: ['recon-dialog', 'info-modal'],
                width: '660px',
                height: '478px',
                data: {
                    title: 'Split Summary - ' + this.estimate.estimate_no,
                    jobs_id: this.activeRoute.parent.snapshot.params.id,
                    estimate_id: this.estimate.selected_revision,
                    // estimate_id: this.activeRoute.snapshot.params.estimate_id,
                    split_estimates: this.state.splitEstimates
                }
            });
    }

    editDescription() {
        this.dialog
            .open(ChangeDescriptionComponent, {
                panelClass: ['recon-dialog', 'info-modal'],
                width: '660px',
                height: '478px',
                data: {
                    title: 'Edit Description - ' + this.estimate.split_org,
                    jobs_id: this.activeRoute.parent.snapshot.params.id,
                    estimate_id: this.estimate.selected_revision,
                    // estimate_id: this.activeRoute.snapshot.params.estimate_id,
                    distribution_id: this.estimate.distribution_id,
                    selectedAddress: { id: this.estimate.split_address },
                    description: this.estimate.description
                }
            })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    this.estimate['description'] = res.description;
                    this.getPreview(true);
                }
            });
    }

    editCustomAttributes() {
        this._commonService.getApi('estCustattributes', {
            id: this.estimate.selected_revision
            // id: this.activeRoute.snapshot.params.estimate_id
        })
            .then(response => {
                if (response['result'].success) {
                    this.dialog
                        .open(ChangeCustomAttributesComponent, {
                            panelClass: ['recon-dialog', 'info-modal'],
                            width: '660px',
                            height: '478px',
                            data: {
                                title: 'Select Address - ' + this.estimate.split_org,
                                jobs_id: this.activeRoute.parent.snapshot.params.id,
                                estimate_id: this.estimate.selected_revision,
                                // estimate_id: this.activeRoute.snapshot.params.estimate_id,
                                selectedAddress: { id: this.estimate.split_address },
                                formFields: response['result'].data
                            }
                        })
                        .afterClosed()
                        .subscribe(res => {
                            if (res && res.success) {
                                this.estimate.split_address = res.data.id;
                                this._commonService.saveApi('createEstimate', {
                                    jobs_id: this.activeRoute.parent.snapshot.params.id,
                                    id: this.estimate.selected_revision,
                                    // id: this.activeRoute.snapshot.params.estimate_id,
                                    split_address: res.data.id,
                                    type: 'address'
                                })
                                    .then(res => {
                                        if (res['result'] && res['result'].success) {
                                            this.getPreview(true);
                                        }
                                    });
                            }
                        });
                }
            });

    }

    changeBillingAddress() {
        this.dialog
            .open(ChangeAddressComponent, {
                panelClass: ['recon-dialog', 'info-modal'],
                width: '660px',
                height: '478px',
                data: {
                    title: 'Select Address - ' + this.estimate.split_org,
                    tabIndex: 0,
                    org_id: this.estimate.split_org_id,
                    hasTabs: true,
                    selectedAddress: { id: this.estimate.split_address }
                }
            })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    this.estimate.split_address = res.data.id;
                    this._commonService.saveApi('createEstimate', {
                        jobs_id: this.activeRoute.parent.snapshot.params.id,
                        id: this.estimate.selected_revision,
                        // id: this.activeRoute.snapshot.params.estimate_id,
                        split_address: res.data.id,
                        type: 'address'
                    })
                        .then(res => {
                            if (res['result'] && res['result'].success) {
                                this.getPreview(true);
                            }
                        });
                }
            });
    }

    getSplitEstimates() {
        this.state.splitLoader = true;
        this._commonService.getApi('estimatesLists', {
            jobs_id: this.activeRoute.parent.snapshot.params.id,
            search: '',
            parent_id: this.estimate.selected_revision
            // parent_id: this.activeRoute.snapshot.params.estimate_id
        })
            .then(res => {
                this.state.splitLoader = false;
                if (res['result'] && res['result'].success) {
                    if (res['result'].data.list.length) {
                        this.state.splitExists = true;
                        this.state.splitEstimates = res['result'].data.list;
                    }
                }
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
    }

    public avalaraSubscription: any = true;

    ngOnDestroy() {
        this.avalaraSubscription = false;
    }

    isThereAnyEstimates() {
        if(!this.avalaraSubscription) return;

        this._commonService.getApi('checkAvalaraStatus', {
            estimate_id: this.estimate.selected_revision,
            // estimate_id: this.activeRoute.snapshot.params.estimate_id,
            is_estimate: true
        }).then(res => {
            if (res && res['result'] && res['result'].success) {
                switch (res['result'].data.status) {
                    case 0:
                        if(document.querySelector('.avalara_tax')) document.querySelector('.avalara_tax').innerHTML = '<span class="load_data">Taxes are being calculated, please wait</span>';
                        setTimeout(() => {
                            this.isThereAnyEstimates();
                        }, 20000);
                        break;
                    case 1:
                    if(document.querySelector('.avalara_tax')) document.querySelector('.avalara_tax').innerHTML = '<span class="load_data">Taxes are being calculated, please wait</span>';
                        setTimeout(() => {
                            this.isThereAnyEstimates();
                        }, 20000);
                        break;
                    case 2:
                        this._commonService.getApi('getAvalaraDetails', {
                            estimate_id: this.estimate.selected_revision
                            // estimate_id: this.activeRoute.snapshot.params.estimate_id
                        }).then(response => {
                            if (response && response['result'] && response['result'].success) {
                                this.generateTaxes(response['result'].data);
                            }
                        });
                        break;
                    case 5:
                        if (res['result'].data.error) {
                            if(document.querySelector('.avalara_tax')) document.querySelector('.avalara_tax').innerHTML = '<span class="load error">Taxes are not calculated due to mismatch ,please <a class="recalculate-tax" style="color: #0052cc;cursor: pointer;">click here</a> to recalculate</span>';
                            document.querySelector('.recalculate-tax').addEventListener("click", ()=>{
                                this.recalculateTaxes();
                            });
                        }
                        break;
                    default: 
                        if (res['result'].data.error) {
                            if(document.querySelector('.avalara_tax')) document.querySelector('.avalara_tax').innerHTML = '<span class="load error" style="color: #de350b;">'+res['result'].data.error+'</span>';
                        }
                        break;
                }
            }
        });
    }

    recalculateTaxes(){
        this._commonService.saveApi('avalaraTaxCalc', {
            jobs_id: this.activeRoute.parent.snapshot.params.id,
            estimate_ids: [this.estimate.selected_revision],
            // estimate_ids: [this.activeRoute.snapshot.params.estimate_id],
            is_estimate: true,
            is_recalculate: true
        }).then(res => {
            this.isThereAnyEstimates();
        });
    }

    getPreview(check?: any): void {
        this.loader = true;
        this._http.get(APP.api_url + 'estimatePreview', {
            params: {
                'id': this.estimate.selected_revision,
                // 'id': this.activeRoute.snapshot.params.estimate_id,
                'jobs_id': this.activeRoute.parent.snapshot.params.id
            },
            responseType: 'text'
        }).subscribe(res => {
            this.loader = false;
            this.previewPage = res;
            if (check && this.estimate && this.estimate.status_id && this.estimate.status_id!=1 && this.estimate.status_id!=6 && this.estimate.status_id!=7) {
                this.isThereAnyEstimates();
            }
            setTimeout(() => {
                const images = document.querySelectorAll(".parent-set .p-row.parent span:first-child img");
                let albums = [];
                images.forEach((o, i) => {
                    const rel = o.getAttribute('rel');
                    if(rel && rel == 'image') {
                        albums.push({
                            id: i,
                            extension: o.getAttribute('ext'),
                            preview_path: o.getAttribute('src'),
                            original_name: o.getAttribute('org_name')
                        })
                    }
                    o.addEventListener('click', this.previewImage.bind(this, albums, i))
                })
            }, 1200);
        });
    }

    previewImage(albums, i, ev) {
        const selected = {
            id: i,
            extension: ev.target.getAttribute('ext'),
            preview_path: ev.target.getAttribute('src'),
            original_name: ev.target.getAttribute('org_name')
        }
        this.lightbox(albums, selected);
    }

    lightbox(files, selected) {
        let albums: Array<any> = [];
        const etn = ['jpg', 'png', 'jpeg'];
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

}
