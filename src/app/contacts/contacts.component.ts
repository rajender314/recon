import { Component, OnInit, ViewChildren } from '@angular/core';
import { ContactsService } from '@app/contacts/contacts.service';
import { MatDialog } from '@angular/material';
import { AddOrganizationComponent } from './add-organization/add-organization.component';
import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { StatusFilter } from '@app/shared/utility/dummyJson';
import PerfectScrollbar from 'perfect-scrollbar';

import { ActivatedRoute, Router } from "@angular/router";
import { perfectScrollBarReset, perfectScrollBarApplystyles } from '@app/shared/utility/config';
var APP: any = window['APP'];
@Component({
    selector: 'app-contacts',
    templateUrl: './contacts.component.html',
    styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
    @ViewChildren('reconscroll') reconScroll;

    ps: any;
    showButton: boolean;
    public contacts = {
        links: [
            { label: "Clients", type: 2, route: "clients", show: (APP.permissions.system_access.client != 'none') },
            { label: "Vendors", type: 3, route: "vendors", show: (APP.permissions.system_access.vendor != 'none') },
            {
                label: "All", type: 0, route: "all", show: (APP.permissions.system_access.client != 'none' &&
                    APP.permissions.system_access.vendor != 'none')
            }
        ],
        status: StatusFilter,
        selectedStatus: { label: 'Active', value: 'true' },
        orgCount: 0,
        search: '',
        activeTab: {},
        organizations: [],
        totalOrganizations: [],
        spinner: true,
        page: 1,
        perPage: 25,
        noPermissions: false
    };

    constructor(
        private contactsService: ContactsService,
        public dialog: MatDialog,
        private router: Router,
        private snackbar: MatSnackBar
    ) { }

    ngOnInit() {
        if (APP.permissions.system_access.client != 'none') {
            this.setActiveTab(this.contacts.links[0]);
        } else if (APP.permissions.system_access.vendor != 'none') {
            this.setActiveTab(this.contacts.links[1]);
        } 
        // else if (APP.permissions.system_access.ivie != 'none') {
        //     this.setActiveTab(this.contacts.links[2]);
        // }
         else {
            this.noPermissions();
        }
        if (APP.permissions.system_access.client == 'edit' || APP.permissions.system_access.vendor == 'edit') {
            this.showButton = true;
        }
        setTimeout(() => {
            if (this.reconScroll._results.length) {
                this.reconScroll._results.map((container) => {
                    this.ps = new PerfectScrollbar(container.nativeElement);
                });
            }
        });
        setTimeout(() => {
            // this.applyStyle();
            // perfectScrollBarApplystyles();
        }, 1000);
    }

    noPermissions() {
        this.contacts.spinner = false;
        this.contacts.noPermissions = true;
    }

    setActiveTab(tab): void {
        if (this.ps) {
            perfectScrollBarReset(this.ps);
        }
        this.contacts.activeTab = tab;
        this.getOrganizations(true);
    }

    changeStatus(item: any): void {
        this.contacts.selectedStatus = item;
        this.getOrganizations(true);
    }

    getOrganizations(cb?): void {
        if (cb)
            this.contacts.spinner = true;

        this.contactsService.getOrganizations({
            org_type: this.contacts.activeTab['type'],
            search: this.contacts.search,
            page: this.contacts.page,
            perPage: this.contacts.perPage,
            status: this.contacts.selectedStatus['value'],
            is_elastic: true
        }).then(response => {
            if (response.result.success) {
                this.contacts.spinner = false;

                if (cb)
                    this.contacts.organizations = [];

                // this.contacts.orgCount = response.result.data.length;
                this.contacts.orgCount = response.result.data.count;
                this.contacts.totalOrganizations = response.result.data.list;
                // this.contacts.organizations = this.contacts.totalOrganizations.slice(0, this.contacts.perPage);
                this.contacts.organizations = this.contacts.organizations.concat(this.contacts.totalOrganizations);
            }
        });
    }

    appendOrganizations(): void {
        let data = this.contacts.totalOrganizations.slice(this.contacts.organizations.length, this.contacts.organizations.length + this.contacts.perPage)
        this.contacts.organizations = this.contacts.organizations.concat(data);
    }

    onScroll(): void {
        if (this.contacts.organizations.length < this.contacts.orgCount && this.contacts.orgCount != 0) {
            // this.appendOrganizations();
            this.contacts.page++;
            this.getOrganizations(false);
        }
    }

    searchList(search: string): void {
        this.contacts.page = 1;
        this.contacts.search = search;
        this.contacts.organizations = [];
        //this.setActiveTab(this.contacts.activeTab);
        this.getOrganizations(true);
    }

    addOrganization(): void {
        const dialogRef = this.dialog.open(AddOrganizationComponent, {
            panelClass: 'my-dialog',
            width: '500px',
            data: { title: 'Add New Organization' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.success) {
                this.snackbar.openFromComponent(SnackbarComponent, {
                    data: { status: 'success', msg: 'Organization Added Successfully' },
                    verticalPosition: 'top',
                    horizontalPosition: 'right'
                });
                //this.getOrganizations(true);
                this.router.navigate(['/organizations', result.data.id]);
                //"contacts/"+result.data.id
            }
        });
    }

    /*applyStyle() {
        //let outter = document.getElementsByClassName('ag-root')[0] as HTMLElement;
        let inner = document.getElementsByClassName('primary-layout-detail')[0] as HTMLElement;
        let element = document.getElementsByClassName('primary-layout-detail-body')[0] as HTMLElement;
        if (inner) {
            let scrollbarWidth = (inner.offsetWidth - element.scrollWidth);
            element.style.marginRight = "-" + scrollbarWidth + 'px';
        }
    }*/

}
