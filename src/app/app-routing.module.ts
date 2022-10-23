import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate } from '@angular/router';
import { PageNotFoundComponent } from '@app/common/page-not-found/page-not-found.component';
import { Observable } from 'rxjs';
import { UserProfileInfoComponent } from '@app/common/user-profile-info/user-profile-info.component';
import { UserPerferencesComponent } from '@app/common/user-perferences/user-perferences.component';
var APP: any = window['APP'];
@Injectable()
export class CanActivateTeam implements CanActivate {
  constructor() {}
 
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean|UrlTree>|Promise<boolean|UrlTree>|boolean|UrlTree {
    let i = 0;
    let routeFound = false;
    while(i<route.data.permissions.length && !routeFound){
      if(APP.permissions.system_access.hasOwnProperty(route.data.permissions[i]) && APP.permissions.system_access[route.data.permissions[i]]=='yes'){
        routeFound = true;
      }
      i++;
    }
    return routeFound;
  }
}
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: '@app/admin/admin.module#AdminModule'
  },
  {
    path: 'organizations',
    loadChildren: '@app/contacts/contacts.module#ContactsModule',
    canActivate: [CanActivateTeam],
     data: {permissions: ['contacts'] }
  },
  {
    path: 'messages',
    loadChildren: '@app/messaging/messaging.module#MessagingModule'
  },
  {
    path: 'users',
    loadChildren: '@app/users/users.module#UsersModule',
    /*canActivate: [CanActivateTeam],*/ data: {permissions: ['user_roles', 'ivie_users', 'client_users', 'vendor_users'] }
  },
  {
    path: 'projects',
    loadChildren: '@app/projects/projects.module#ProjectsModule',
    data: {
      preload: true
    }
  },
  {
    path: 'tasks',
    loadChildren: '@app/tasks/tasks.module#TasksModule'
  },
  {
    path: 'super-admin',
    loadChildren: '@app/super-admin/super-admin.module#SuperAdminModule'
  },
  {
    path: 'track-time',
    loadChildren: '@app/track-time/track-time.module#TrackTimeModule'
  },
  { path: '',
    redirectTo: (APP.permissions.system_access.all_jobs=='yes')?'/projects/all':'/projects/my',
    pathMatch: 'full'
  },
  {
    path: 'userProfile',
    component: UserProfileInfoComponent
  },
  {
    path: 'userPerferences',
    component: UserPerferencesComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }