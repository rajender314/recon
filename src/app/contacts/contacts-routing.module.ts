import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContactsComponent } from '@app/contacts/contacts.component';

// import { ContactDetailsComponent } from '@app/contacts/contact-details/contact-details.component';
import { DetailsComponent } from './details/details.component';
import { OverviewComponent } from './details/overview/overview.component';
import { ClientInfoComponent } from './details/client-info/client-info.component';
import { VendorInfoComponent } from './details/vendor-info/vendor-info.component';
import { GridComponent } from './details/grid/grid.component';

const routes: Routes = [
  {
    path: '',
    component: ContactsComponent
  },
  {
    path: ':id',
    // component: ContactDetailsComponent
    component: DetailsComponent,
    children: [
      {
        path: 'overview', component: OverviewComponent, data: { prop: 'routes', tabIndex: 1 }
      },
      {
        path: 'address', component: GridComponent, data: { prop: 'routes', tabIndex: 2 }
      },
      {
        path: 'contacts', component: GridComponent, data: { prop: 'routes', tabIndex: 3 }
      },
      {
        path: 'sub-orgs', component: GridComponent, data: { prop: 'routes', tabIndex: 4 }
      },

      {
        path: 'custom-attributes', component: ClientInfoComponent, data: { prop: 'clientRoutes', tabIndex: 5 }
      },
      {
        path: 'internal-invoice', component: ClientInfoComponent, data: { prop: 'clientRoutes', tabIndex: 6 }
      },
      {
        path: 'business-rules', component: ClientInfoComponent, data: { prop: 'clientRoutes', tabIndex: 7 }
      },

      {
        path: 'general', component: VendorInfoComponent, data: { prop: 'vendorRoutes', tabIndex: 8 }
      },
      {
        path: 'vendor-capabilities', component: VendorInfoComponent, data: { prop: 'vendorRoutes', tabIndex: 9 }
      },
      {
        path: 'vendor-equipment', component: VendorInfoComponent, data: { prop: 'vendorRoutes', tabIndex: 10 }
      },
      {
        path: 'certifications', component: VendorInfoComponent, data: { prop: 'vendorRoutes', tabIndex: 11 }
      },

      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactsRoutingModule { }