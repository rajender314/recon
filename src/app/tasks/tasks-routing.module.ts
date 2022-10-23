import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate } from '@angular/router';
import { TaskDashoboardComponent } from './task-dashoboard/task-dashoboard.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskGridComponent } from './task-grid/task-grid.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { Observable } from 'rxjs';

var APP = window['APP'];

@Injectable()
export class CanActivateTeam implements CanActivate {
  constructor() { }

  canActivate(
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return APP.permissions.system_access[route.data.permissions] == 'yes';
  }
}

const routes: Routes = [
  {
    path: '', component: TaskDashoboardComponent, children: [
      {
        path: 'all', component: TaskListComponent, data: { title: 'All Tasks', flag: 'all' }, children: [
          {
            path: 'list', component: TaskGridComponent, children: [
              { path: ':id', component: TaskDetailsComponent }
            ]
          }
        ]
      },
      { path: 'vendor', component: TaskListComponent, data: { title: 'Vendor Tasks', flag: 'vendor' } },
      {
        path: 'my', component: TaskListComponent, data: { title: 'My Tasks', flag: 'my' }, children: [
          {
            path: 'list', component: TaskGridComponent, children: [
              { path: ':id', component: TaskDetailsComponent }
            ]
          }
        ]
      },
      {
        path: 'group', component: TaskListComponent, data: { title: 'Group Tasks', flag: 'group' }, children: [
          {
            path: 'list', component: TaskGridComponent, children: [
              { path: ':id', component: TaskDetailsComponent }
            ]
          }
        ]
      },
      {
        path: 'department', component: TaskListComponent, data: { title: 'Department Tasks', flag: 'department',permissions:'department_in_global_schedule' }, 
        canActivate: [CanActivateTeam],
        children: [
          {
            path: 'list', component: TaskGridComponent, children: [
              { path: ':id', component: TaskDetailsComponent }
            ]
          }
        ]
      },
      { path: '', redirectTo: '/tasks/all/list', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TasksRoutingModule { }
