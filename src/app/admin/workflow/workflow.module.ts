import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTypesComponent } from './task-types/task-types.component';
import { TaskStatusesComponent } from './task-statuses/task-statuses.component';
import { AgGridModule } from 'ag-grid-angular';
import 'ag-grid-enterprise';
import { RouterModule } from '@angular/router';
import { ButtonGroupComponent, ProgressBarComponent } from '@app/admin/workflow/grid-frameworks/grid-frameworks.component';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule,
    AgGridModule.withComponents([]),
  ],
  declarations: [TaskTypesComponent, TaskStatusesComponent, AddDialogComponent, ButtonGroupComponent, ProgressBarComponent],
  entryComponents: [AddDialogComponent, ButtonGroupComponent, ProgressBarComponent]
})
export class WorkflowModule { }
