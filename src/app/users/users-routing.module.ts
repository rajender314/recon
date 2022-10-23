import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate } from '@angular/router';

import { UserRolesComponent } from '@app/users/user-roles/user-roles.component';
import { IvieComponent } from '@app/users/ivie/ivie.component';
import { ClientsComponent } from '@app/users/clients/clients.component';
import { VendorsComponent } from '@app/users/vendors/vendors.component';
import { Observable } from 'rxjs';

var APP = window['APP'];

@Injectable()
export class CanActivateTeam implements CanActivate {
  constructor() {}
 
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean|UrlTree>|Promise<boolean|UrlTree>|boolean|UrlTree {
    return APP.permissions.system_access[route.data.parent]=='yes' && APP.permissions.system_access[route.data.permissions]=='yes';
  }
}

const routes: Routes = [
  {path: 'users', redirectTo: ((APP.permissions.system_access.user_roles=='yes')?'user_roles':
  ((APP.permissions.system_access.ivie_users=='yes')?'ivie':
  ((APP.permissions.system_access.client_users=='yes')?'clients':
  ((APP.permissions.system_access.vendor_users=='yes')?'vendors':'user_roles')))),
   pathMatch: 'full'},
  {path: 'user_roles', component: UserRolesComponent, canActivate: [CanActivateTeam], data: {permissions: 'user_roles',parent:'users'}},
  {path: 'ivie', component: IvieComponent, canActivate: [CanActivateTeam], data: {permissions: 'ivie_users',parent:'users'}},
  {path: 'clients', component: ClientsComponent, canActivate: [CanActivateTeam], data: {permissions: 'client_users',parent:'users'}},
  {path: 'vendors', component: VendorsComponent, canActivate: [CanActivateTeam], data: {permissions: 'vendor_users',parent:'users'}}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }