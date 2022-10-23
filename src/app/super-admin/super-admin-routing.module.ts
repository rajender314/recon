import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SuperAdminComponent } from '@app/super-admin/super-admin.component';
import { DetailViewComponent } from '@app/super-admin/detail-view/detail-view.component';

const routes: Routes = [
  { path: '', component: SuperAdminComponent, children: [
    { path: 'settings', component: DetailViewComponent, data: {prop: 'settings', name: 'General Settings', grid: false} },
    { path: 'emails', component: DetailViewComponent, data: {prop: 'emails', name: 'Email Controller', grid: true, header_key: 'emailController', url: 'emailController'} },
    { path: 'sent-mail', component: DetailViewComponent, data: {prop: 'sent-mail', name: 'Sent Mail', grid: true, header_key: 'sendMail', url: 'emailController'} },
    { path: 'crons', component: DetailViewComponent, data: {prop: 'crons', name: 'Crons', grid: true, header_key: 'crons', url: 'getCronsList'} },
    { path: 'system-errors', component: DetailViewComponent, data: {prop: 'system-errors', name: 'System Errors', grid: true, header_key: 'systemErrors', url: 'emailController'} },
    { path: 'access-report', component: DetailViewComponent, data: {prop: 'access-report', name: 'Access Report', grid: true, header_key: 'accessReport', url: 'accessReport'} },
    { path: 'error-report', component: DetailViewComponent, data: {prop: 'error-report', name: 'Error Report', grid: true, header_key: 'errorReport', url: 'errorReport'} },
    { path: 'access-call-delay', component: DetailViewComponent, data: {prop: 'access-call-delay', name: 'Access Call Delay', grid: true, header_key: 'accessCallDelay', url: 'accessCallDelay'} },
    { path: '', redirectTo: 'settings', pathMatch: 'full' }
  ] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperAdminRoutingModule {}
