import { Component, OnInit } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddAddressComponent } from '@app/contacts/add-address/add-address.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { ContactsService } from '@app/contacts/contacts.service';
import { DeleteComponent } from '@app/contacts/delete/delete.component';
import { AddContactComponent } from '@app/contacts/add-contact/add-contact.component';
import { AddSubOrgComponent } from '@app/contacts/add-sub-org/add-sub-org.component';
import { CommonService } from '@app/common/common.service';

@Component({
    selector: 'app-menu-component',
    template: `
    <div #container class="mood hover-icons" tabindex="0">
    <!-- (keydown)="onKeyDown($event)" -->
    <i class="pixel-icons icon-pencil" (click)="updateRow('edit')"></i>
    <i class="pixel-icons icon-delete" (click)="updateRow('delete')"></i>
    <!--<button mat-button [matMenuTriggerFor]="menu" [disableRipple]="true"><i class="pixel-icons icon-more-horizontal"></i></button>
    <mat-menu #menu="matMenu" class="more-grid-actions">
      
    </mat-menu>-->
    </div>
  `,
    styles: [`
    .hover-icons {text-align: right;}
    .hover-icons i{cursor:pointer; color: rgba(23, 43, 77, 0.6);position: relative;top: 3px;}
    .hover-icons i:hover{color: rgba(23, 43, 77, 0.8);} 
    .hover-icons i.icon-pencil{font-size:15px;width:15px;height:15px;margin-right:20px; position:relative;top:4px;}
    .hover-icons i.icon-delete{font-size:14px;width:14px;height:14px;}
    `]
})
export class MenuComponentComponent implements OnInit {

    private params: any;
    private dialogRef;
    private address_types: any;
    private dropdowns = {};

    constructor(
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private commonService: CommonService
    ) {
        
    }

    ngOnInit() {
    }

    agInit(params: any): void {
        this.params = params;
    }

    updateAddress(type) {
        
        switch (type) {
            case 'edit':
                let defaultShippingId = '';
                this.params.api.forEachNode((node)=>{
                    if(node.data.default_shipping=='1'){
                        defaultShippingId = node.data.id;
                    }
                });
                if (this.params.colDef.address_types.length && this.params.data['address_type_id'] == '') {
                    this.params.data['address_type_id'] = this.params.colDef.address_types[0].id;
                }
                this.dialogRef = this.dialog.open(AddAddressComponent, {
                    panelClass: 'recon-dialog',
                    width: '500px',
                    data: {
                        title: 'Edit Address',
                        isEdit: true,
                        row: this.params.data,
                        org_id: this.params.colDef.org_id,
                        address_types: this.params.colDef.address_types,
                        defaultShippingId: defaultShippingId
                    }
                });
                this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                        this.snackbar.openFromComponent(SnackbarComponent, {
                            data: { status: 'success', msg: 'Address Updated Successfully' },
                            verticalPosition: 'top',
                            horizontalPosition: 'right'
                        });
                        if(result.data.default_shipping!=this.params.data.default_shipping){
                            this.commonService.update({type: 'change_shipping_address'});
                            this.params.node.setData(result.data);
                        }else{
                            this.params.node.setData(result.data);
                        }
                    }
                });
                break;
            case 'delete':
                this.dialogRef = this.dialog.open(DeleteComponent, {
                    panelClass: 'recon-dialog',
                    width: '500px',
                    data: {
                        id: this.params.data['id'],
                        org_id: this.params.colDef.org_id,
                        title: 'Delete Address',
                        name: this.params.data['address1'],
                        call: 'delOrgAddress'
                    }
                });

                this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                        this.snackbar.openFromComponent(SnackbarComponent, {
                            data: { status: 'success', msg: 'Address Deleted Successfully' },
                            verticalPosition: 'top',
                            horizontalPosition: 'right'
                        });
                        let selectedRow = [];
                        selectedRow.push(this.params.data);
                        this.params.api.updateRowData({ remove: selectedRow });
                        this.commonService.update({type: 'delete', tab: 'address'});
                    }
                });
                break;
        }
    }

    updateContact(type) {
        switch (type) {
            case 'edit':
                if (this.params.colDef.designations.length && this.params.data['designations_id'] == '') {
                    this.params.data['designations_id'] = this.params.colDef.designations[0].id;
                }

                if (this.params.colDef.departments.length && this.params.data['departments_id'] == '') {
                    this.params.data['departments_id'] = this.params.colDef.departments[0].id;
                }

                if (this.params.colDef.contact_types.length && this.params.data['contact_types_id'] == '') {
                    this.params.data['contact_types_id'] = this.params.colDef.contact_types[0].id;
                }

                this.dialogRef = this.dialog.open(AddContactComponent, {
                    panelClass: 'recon-dialog',
                    width: '600px',
                    data: {
                        title: 'Edit Contact',
                        row: this.params.data,
                        contact_types: this.params.colDef.contact_types,
                        departments: this.params.colDef.departments,
                        org_id: this.params.colDef.org_id,
                        designations: this.params.colDef.designations,
                        subOrgsList: this.params.colDef.subOrgsList,
                        timezones: [],
                        org: this.params.colDef.selectedOrganization,
                        emailAddressTypes: [
                            { id: "Email", name: "Email" },
                            { id: "Work", name: "Work" }
                        ],
                        phoneNumberTypes: [
                            { id: "Phone", name: "Phone" },
                            { id: "Fax", name: "Fax" },
                            { id: "Mobile", name: "Mobile" }
                        ]
                    }
                });

                this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                        this.snackbar.openFromComponent(SnackbarComponent, {
                            data: { status: 'success', msg: 'Contact Updated Successfully' },
                            verticalPosition: 'top',
                            horizontalPosition: 'right'
                        });
                        this.params.node.setData(result.data[0]);
                    }
                });
                break;
            case 'delete':
                this.dialogRef = this.dialog.open(DeleteComponent, {
                    panelClass: 'recon-dialog',
                    width: '500px',
                    data: {
                        id: this.params.data['id'],
                        org_id: this.params.colDef.org_id,
                        title: 'Delete Contact',
                        name: this.params.data['first_name'],
                        call: 'delContact'
                    }
                });

                this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                        this.snackbar.openFromComponent(SnackbarComponent, {
                            data: { status: 'success', msg: 'Contact Deleted Successfully' },
                            verticalPosition: 'top',
                            horizontalPosition: 'right'
                        });
                        if (this.params.colDef.orgDetails['c_count'] > 0) {
                            this.params.colDef.orgDetails['c_count'] = this.params.colDef.orgDetails['c_count'] - 1;
                        }
                        let selectedRow = [];
                        selectedRow.push(this.params.data);
                        this.params.api.updateRowData({ remove: selectedRow });
                        this.commonService.update({type: 'delete', tab: 'contact'});
                    }
                });
                break;
        }
    }

    updateSubOrg(type) {
        switch (type) {
            case 'edit':
                this.dialogRef = this.dialog.open(AddSubOrgComponent, {
                    panelClass: 'recon-dialog',
                    width: '500px',
                    data: {
                        title: 'Edit Sub Organization',
                        org_id: this.params.colDef.org_id,
                        row: this.params.data
                    }
                });

                this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                        this.snackbar.openFromComponent(SnackbarComponent, {
                            data: { status: 'success', msg: 'Sub Organization Updated Successfully' },
                            verticalPosition: 'top',
                            horizontalPosition: 'right'
                        });
                        this.params.node.setData(result.data);
                    }
                });
                break;
            case 'delete':
                this.dialogRef = this.dialog.open(DeleteComponent, {
                    panelClass: 'recon-dialog',
                    width: '500px',
                    data: {
                        id: this.params.data['id'],
                        org_id: this.params.colDef.org_id,
                        title: 'Delete Sub Organization',
                        name: this.params.data['name'],
                        call: 'delSubOrgs'
                    }
                });

                this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                        this.snackbar.openFromComponent(SnackbarComponent, {
                            data: { status: 'success', msg: 'Sub Organization Deleted Successfully' },
                            verticalPosition: 'top',
                            horizontalPosition: 'right'
                        });
                        if (this.params.colDef.orgDetails['sub_orgs'] > 0) {
                            this.params.colDef.orgDetails['sub_orgs'] = this.params.colDef.orgDetails['sub_orgs'] - 1;
                        }
                        let selectedRow = [];
                        selectedRow.push(this.params.data);
                        this.params.api.updateRowData({ remove: selectedRow });
                        this.commonService.update({type: 'delete', tab: 'subOrg'});
                    }
                });
                break;
        }
    }

    updateRow(type) {
        switch (this.params.colDef.type) {
            case 'address':
                this.updateAddress(type);
                break;
            case 'contacts':
                this.updateContact(type);
                break;
            case 'sub_orgs':
                this.updateSubOrg(type);
                break;
        }
    }

}
