import { Component, OnInit, HostListener, ViewChildren, QueryList, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService } from '@app/common/common.service';
import { Subscription, forkJoin } from 'rxjs';
import * as _ from 'lodash';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { ChangeAddressComponent } from '@app/projects/change-address/change-address.component';
import { MessagesComponent } from '@app/dialogs/messages/messages.component';

var APP: any = window['APP'];

@Component({
    selector: 'app-prepress',
    templateUrl: './prepress.component.html',
    styleUrls: ['../products/products.component.scss', './prepress.component.scss']
})
export class PrepressComponent implements OnInit {

    state = {
        init: true,
        isLoading: true,
        fetching: true,
        toggleView: false,
        projectID: null,
        DOMSearchValue: null,
        actions: [
            { key: 'delete', title: 'Delete Vendor', label: '<i class="pixel-icons icon-delete"></i>', type: 'icon',visible: (APP.permissions.job_access.prepress == 'edit' ? true :false) },
            { key: 'post', title: '', label: 'Post To Vendor', type: 'button',visible: (APP.permissions.job_access.prepress == 'edit' ? true :false) },
            { key: 'edit', title: '', label: 'Edit', type: 'button',visible: (APP.permissions.job_access.prepress == 'edit' ? true :false) }
        ],
        editActions: [
            { key: 'cancel', title: '', label: 'Cancel', type: 'button', color: 'default' },
            { key: 'save', title: '', label: 'Save', type: 'button', color: 'primary' }
        ],
        breadcrumbs: [
            { label: 'Projects', type: 'link', route: '/projects' },
            { label: 'Name', type: 'text' },
        ],
        allVendors: [],
        allVendorsBack: [],
        cloneVendors: [],

        selectedVendor: null,
        vendorDetails: null,
        copyProducts: [],

        dropdowns: {
            plants: [],
            primaryContacts: [],
            postingContacts: []
        },

        apiCalls: [
            { key: 'plants', url: 'getSubOrgs', method: 'get', params: { org_type: 3, parent_id: '' } }
        ]
    };

    vendorForm: FormGroup;

    subscription: Subscription;
    routerSubscription: Subscription;


    /**
     * list -> allVendors
     * listBak -> allVendorsBack
     * cloneList -> cloneVendors
     */

    constructor(
        private _fb: FormBuilder,
        private _commonService: CommonService,
        private _route: ActivatedRoute,
        private _dialog: MatDialog,
        private _snackbar: MatSnackBar
    ) {
        this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
        this.subscription = _commonService.onUpdate().subscribe(obj => {
            if (obj.type == 'projectName' && Object.keys(obj.data).length) {
                this.state.breadcrumbs[1].label = obj.data.job_title || '----';
            }
        });
        this.routerSubscription = _route.parent.params.subscribe(param => {
            this.state.projectID = param.id ? param.id : null;
            this.getPrepressList();
        });
    }

    ngOnInit() {
        this.createForm();
    }

    plantChange(event){
        this._commonService.getApi('getVendorAddr', { org_id: event, parent_id: this.state.vendorDetails.vendors_id })
            .then(res => {
                if (res['result'].success) {
                    this.state.dropdowns.postingContacts = res['result'].data.contacts;
                    this.state.dropdowns.primaryContacts = res['result'].data.primary_email;
                    this.vendorForm.controls.posting_instructions.patchValue(res['result'].data.post_inst);
                    //this.vendorForm.patchValue({posting_instructions:res['result'].data.post_inst});
                }
            });
    }

    getApiCalls(arr, cb?) {
        let apiCalls = [];
        arr.map(api => {
            if (api.method == 'get')
                apiCalls.push(this._commonService.getApi(api.url, api.params))
            else if (api.method == 'post')
                apiCalls.push(this._commonService.saveApi(api.url, api.params))
        });
        forkJoin(apiCalls)
            .subscribe(data => {
                data.map((o, i) => {
                    if (o['result'].success) {
                        if (arr[i].responseKey) {
                            this.state.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
                        } else {
                            this.state.dropdowns[arr[i].key] = o['result'].data || [];
                        }
                    }
                });
                if (cb) cb();
            })
    }

    createForm() {
        this.vendorForm = this._fb.group({
            id: '',
            jobs_id: this._route.parent.snapshot.params.id,
            plant_id: '',
            primary_contact: '',
            additional_contacts: [],
            posting_instructions: '',
            notes: '',
            plant_address_id: '',
            jsr_ids: [],
            vendors_id: ''
        })
    }

    setForm(data) {
        this.vendorForm.patchValue(data);
    }

    getPrepressList() {
        this.state.isLoading = true;
        this._commonService.getApi('getPrePressList', { jobs_id: this.state.projectID })
            .then(res => {
                this.state.isLoading = false;
                if (res['result'].success) {
                    this.state.allVendorsBack = res['result'].data;
                    if (this.state.allVendorsBack.length) {
                        this.state.init = false;
                        this.state.selectedVendor = this.state.allVendorsBack[0];
                        this.getPrePressDetails();
                    } else {
                        this.state.fetching = false;
                    }
                    this.state.cloneVendors = _.cloneDeep(this.state.allVendorsBack);
                    this.state.allVendors = _.cloneDeep(this.state.allVendorsBack);
                }
            });
    }

    getPrePressDetails() {
        this.state.fetching = true;
        this._commonService.getApi('getPrePressDetails', { jobs_id: this.state.projectID, id: this.state.selectedVendor['id'] })
            .then(res => {
                this.state.fetching = false;
                if (res['result'].success) {
                    this.state.vendorDetails = res['result'].data;
                    this.state.copyProducts = _.cloneDeep(this.state.vendorDetails.products);
                    this.state.vendorDetails.selected_count = this.getSelectedProductsLength(this.state.vendorDetails.products || []);
                    this.state.apiCalls[0].params.parent_id = this.state.vendorDetails.vendors_id;
                    this.getApiCalls(this.state.apiCalls);
                    this.frameOptions(this.state.vendorDetails);
                } else {
                    this.state.vendorDetails = null;
                }
            });
    }

    frameOptions(data) {
        this.state.dropdowns.postingContacts = [];
        if (data.primary_contact) {
            this.state.dropdowns.primaryContacts = [{ id: data.primary_contact, name: data.primary_contact }];
        }
        if (data.additional_contacts.length) {
            data.additional_contacts.map(o => {
                this.state.dropdowns.postingContacts.push({ id: o, name: o });
            })
        }
    }

    getSelectedProductsLength(products) {
        let count = 0;
        products.map(p => {
            p.services.map(s => {
                if (s.selected) {
                    p.selected = true;
                    count++;
                }
            })
        })
        return count;
    }

    checkAllServices(prod, selected) {
        prod.services.map((service) => {
            service.selected = selected;
        });
    }

    checkService(prod, selected) {
        if (selected) {
            prod.selected = selected;
        } else {
            prod.services.filter((service) => {
                return service.selected;
            }).length ? prod.selected = true : prod.selected = false;
        }
    }

    performActions(key) {
        if (key == 'delete') {
            const locals = {
                title: 'Delete Vendor',
                url: 'deletePrePress',
                method: 'delete',
                params: {
                    id: this.state.vendorDetails.id
                },
                content: `<div class="po-dialog">
									<div class="">
										<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
									</div>
									<div class="">
										<p>Are you sure, you want to remove this Vendor</p>
									</div>
								</div>`
            }

            this.confirmDialog(locals, () => {
                const i = _.findIndex(this.state.allVendors, ['id', this.state.vendorDetails.id]);
                if (i > -1) {
                    this.state.allVendors.splice(i, 1);
                    this.state.allVendorsBack.splice(i, 1);
                    this.state.cloneVendors.splice(i, 1);
                    if (this.state.allVendors.length) {
                        this.state.selectedVendor = this.state.allVendors[0];
                        this.getPrePressDetails();
                    } else {
                        this.state.selectedVendor = null;
                        this.state.vendorDetails = null;
                        this.state.init = true;
                    }
                }
            });
        } else if (key == 'post') {
            this.postVendorDialog();
        } else if (key == 'edit') {
            this.state.toggleView = !this.state.toggleView;
            if (this.state.toggleView) this.setForm(this.state.vendorDetails);
        } else if (key == 'cancel') {
            this.state.vendorDetails.products = _.cloneDeep(this.state.copyProducts);
            this.state.vendorDetails.selected_count = this.getSelectedProductsLength(this.state.vendorDetails.products || []);
            this.vendorForm.reset(this.state.vendorDetails);
            this.state.toggleView = !this.state.toggleView;
        } else if (key == 'save') {
            if (this.vendorForm.valid) {
                this.saveDetails(this.vendorForm.value);
            }
        }
    }

    postVendorDialog() {
        this._dialog.open(MessagesComponent, {
            panelClass: 'recon-dialog',
            width: '600px',
            data: {
                title: 'Post To Vendor',
                org_type: 3,
                org_id: this.state.vendorDetails.vendors_id,
                jobs_id: this.state.projectID,
                selected: this.state.vendorDetails || null
            }
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    this.snackbarModal('success', 'Vendor Posted Successfully');
                }
            })
    }

    confirmDialog(locals, cb) {
        this._dialog.open(ConfirmationComponent, {
            panelClass: ["recon-dialog", "confirmation-dialog"],
            width: '600px',
            // height: '400px',
            data: locals
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    cb();
                }
            })
    }

    changeAddress() {
        this._dialog.open(ChangeAddressComponent, {
            panelClass: 'recon-dialog',
            width: '600px',
            height: '422px',
            data: {
                title: 'Select Address - ' + this.state.vendorDetails.plant_name,
                tabIndex: null,
                org_id: (this.vendorForm.controls.plant_id.value)?this.vendorForm.controls.plant_id.value:this.state.projectID,
                hasTabs: false,
                vendor_id: (this.vendorForm.controls.plant_id.value)?this.vendorForm.controls.plant_id.value:this.state.vendorDetails.vendors_id,
                selectedAddress: { ...this.state.vendorDetails.plant_address, ...{ id: this.state.vendorDetails.plant_address_id } } || null
            }
        })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    if (this.state.vendorDetails.plant_address) this.state.vendorDetails.plant_address = res.data;
                    else this.state.vendorDetails.plant_address = { ...res.data };
                    this.vendorForm.patchValue({
                        plant_address_id: res.data.id
                    });
                }
            })
    }

    saveDetails(data) {
        this._commonService.update({ type: 'overlay', action: 'start' });
        const params = _.cloneDeep(data);
        const arr = [];
        this.state.vendorDetails.products.map(p => {
            p.services.map(s => {
                if (s.selected) arr.push(s.jsr_id);
            })
        })
        params.jsr_ids = arr;
        data.additional_contacts.map((o, i) => {
            if (o.includes('new*#*')) params.additional_contacts[i] = o.replace('new*#*', '');
        });
        this._commonService.saveApi('savePrePress', params)
            .then(res => {
                if (res['result'].success) {
                    this.snackbarModal('success', 'Prepress Updated Successfully');
                    this.performActions('edit');
                    this.getPrePressDetails();
                }
                this._commonService.update({ type: 'overlay', action: 'stop' });
            }).catch(err =>{
                this._commonService.update({ type: 'overlay', action: 'stop' });
            })
    }

    snackbarModal(status = 'success', msg?) {
        this._snackbar.openFromComponent(SnackbarComponent, {
            data: { status: status, msg: msg ? msg : ('Prepress Created Successfully') },
            verticalPosition: 'top',
            horizontalPosition: 'right',
            panelClass: status
        });
    }

    DOMSearch(val) {
        this.state.DOMSearchValue = val;
        if (!val) {
            this.state.allVendorsBack = _.cloneDeep(this.state.cloneVendors);
            if (this.state.allVendorsBack.length) {
                this.state.selectedVendor = this.state.allVendorsBack[0];
                this.state.allVendors = this.state.allVendorsBack;
                this.getPrePressDetails();
            } else {
                this.state.allVendors = [];
                this.state.selectedVendor = null;
            }
        } else {
            this.state.allVendorsBack = _.cloneDeep(this.state.cloneVendors);
            val = val.toLowerCase();
            let vendors = [];
            this.state.allVendorsBack.map(p => {
                if (p.name.toLowerCase().includes(val)) {
                    vendors.push({ ...p });
                }
            });
            this.state.allVendorsBack = vendors;
            if (this.state.allVendorsBack.length) {
                this.state.selectedVendor = this.state.allVendorsBack[0];
                this.state.allVendors = this.state.allVendorsBack;
                this.getPrePressDetails();
            } else {
                this.state.allVendors = [];
                this.state.selectedVendor = null;
            }
        }
    }

    /* resizer code */
    @ViewChild('myResizer') myResizer: ElementRef;

    leftWidth = 320;
    rightWidth = 420;
    oldX = 0;
    grabber = false;

    ngAfterViewInit() {
        if (this.myResizer) {
            this.leftWidth = (50 / 100) * (this.myResizer.nativeElement.offsetWidth - 66);
            this.rightWidth = (25 / 100) * (this.myResizer.nativeElement.offsetWidth - 66);
        }
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
        this.grabber = (event.target['className'].includes('grab-icon') || event.target['className'].includes('grabber')) ? true : false;
        if (this.grabber) document.querySelector('body').classList.add('disable-select');
        this.oldX = event.clientX;
    }

    /*  */

    onSelect(vendor: any) {
        this.state.selectedVendor = vendor;
        this.getPrePressDetails();
    }



    backToPrepress(): void {
        // this.state.showView = !this.state.showView;
    }

    changeMasterView() {
        this._commonService.onChange();
    }

}
