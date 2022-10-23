import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TasksRoutingModule, CanActivateTeam } from './tasks-routing.module';
import { TaskDashoboardComponent } from './task-dashoboard/task-dashoboard.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { SharedModule } from '@app/shared/shared.module';
import { TaskGridComponent, AssigneeCell, StatusMenuCell, userMedia } from './task-grid/task-grid.component';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogsModule } from '@app/dialogs/dialogs.module';
import { FileUploadModule } from 'ng2-file-upload';
import { TasksService } from './tasks.service';

@NgModule({
  imports: [
    CommonModule,
    TasksRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FileUploadModule,
    SharedModule,
    DialogsModule,
    AgGridModule.withComponents([]),
  ],
  providers: [TasksService,CanActivateTeam],
  declarations: [TaskDashoboardComponent, TaskListComponent, TaskDetailsComponent, TaskGridComponent, AssigneeCell, StatusMenuCell, userMedia],
  entryComponents: [AssigneeCell, StatusMenuCell, userMedia]
})
export class TasksModule { }
