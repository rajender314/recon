import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate } from '@angular/router';
import { TrackTimeViewComponent } from './track-time-view/track-time-view.component';
import { Observable } from 'rxjs';

var APP = window['APP'];

@Injectable()
export class CanActivateTeam implements CanActivate {
  constructor() { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    let i = 0;
    let routeFound = false;
    while (i < route.data.permissions.length && !routeFound) {
      if (['view', 'edit'].includes(APP.permissions.system_access[route.data.permissions])) {
        routeFound = true;
      }
      i++;
    }
    return routeFound;
  }
}

const routes: Routes = [
  { path: '', component: TrackTimeViewComponent, pathMatch: 'full', canActivate: [CanActivateTeam], redirectTo: 'all', data: { permissions: 'enable_time_tracking' } },
  { path: 'all', component: TrackTimeViewComponent },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrackTimeRoutingModule { }
