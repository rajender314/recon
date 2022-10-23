import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactsRoutingModule } from '@app/contacts/contacts-routing.module';
import { ContactsComponent } from '@app/contacts/contacts.component';
import { SharedModule } from '@app/shared/shared.module';
import { ContactDetailsComponent } from './contact-details/contact-details.component';
import { HotTableModule } from '@handsontable/angular';
import { OrganizationsComponent } from './organizations/organizations.component';
import { AddOrganizationComponent } from './add-organization/add-organization.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddAddressComponent } from './add-address/add-address.component';
import { AddContactComponent } from './add-contact/add-contact.component';
import { AddSubOrgComponent } from './add-sub-org/add-sub-org.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DeleteComponent } from './delete/delete.component';
import { VirtualScrollModule } from 'angular2-virtual-scroll';
import { FileUploadModule } from 'ng2-file-upload';
import { CertificationsDirective } from './certifications.directive';
import { CertificationsComponent } from './certifications/certifications.component';
import { GeneralComponent } from './general/general.component';
// import { OverviewComponent } from './overview/overview.component';
import { OthersComponent } from './others/others.component';
import { DeleteWebsiteComponent } from './delete-website/delete-website.component';
import { AgGridModule } from 'ag-grid-angular';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { SortablejsModule } from 'angular-sortablejs';
import { VendorEquipmentsComponent } from './vendor-equipments/vendor-equipments.component';
import { MenuComponentComponent } from './menu-component/menu-component.component';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { AddBookKeeperComponent } from './add-book-keeper/add-book-keeper.component';
import { DetailsComponent } from './details/details.component';
import { OverviewComponent } from './details/overview/overview.component';
import { ClientInfoComponent } from './details/client-info/client-info.component';
import { VendorInfoComponent } from './details/vendor-info/vendor-info.component';
import { GridComponent } from './details/grid/grid.component';

@NgModule({
  imports: [
    CommonModule,
    ContactsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    VirtualScrollModule,
    FileUploadModule,
    HotTableModule.forRoot(),
    AgGridModule.withComponents([]),
    SortablejsModule.forRoot({animation: 150}),
    ScrollToModule.forRoot()
  ],
  declarations: [ContactsComponent, ContactDetailsComponent, OrganizationsComponent, AddOrganizationComponent, AddAddressComponent, AddBookKeeperComponent, AddContactComponent, AddSubOrgComponent, DeleteComponent, CertificationsDirective, CertificationsComponent, GeneralComponent, OverviewComponent, OthersComponent, DeleteWebsiteComponent, AddDialogComponent, VendorEquipmentsComponent, MenuComponentComponent, AddBookKeeperComponent, DetailsComponent, ClientInfoComponent, VendorInfoComponent, GridComponent],
  entryComponents: [AddOrganizationComponent, AddAddressComponent, AddBookKeeperComponent, AddContactComponent, AddSubOrgComponent, DeleteComponent, DeleteWebsiteComponent, AddDialogComponent, MenuComponentComponent]
})
export class ContactsModule { }