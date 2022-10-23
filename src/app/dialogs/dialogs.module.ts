import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddSpecDialogComponent } from '@app/dialogs/add-spec-dialog/add-spec-dialog.component';
import { SharedModule } from '@app/shared/shared.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { SessionRestoreComponent } from './session-restore/session-restore.component';
import { GlobalSearchComponent } from './global-search/global-search.component';
import { ChangeDetectionComponent } from './change-detection/change-detection.component';
import { CreateTaskComponent } from './create-task/create-task.component';
import { UploadInsertionOrderComponent } from './upload-insertion-order/upload-insertion-order.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { FileUploadModule } from 'ng2-file-upload';
import { AddTimeTrackComponent } from './add-time-track/add-time-track.component';
import { Ng5SliderModule } from 'ng5-slider';
import { RouterModule } from '@angular/router';
import { SplitEstimatesComponent, SplitManualFirstColumn } from './split-estimates/split-estimates.component';
import { SplitCellEditComponent, SplitCellViewComponent, BalanceViewComponent, AddOrganizationsComponent, RemoveOrganizationComponent, OrganizationComponent } from './split-estimates-grid/split-estimates-grid.component';
import { MessagesComponent } from './messages/messages.component';
import { AddReciepientsComponent } from './add-reciepients/add-reciepients.component';
import { WopNotificationsComponent } from './wop-notifications/wop-notifications.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule,
    FileUploadModule,
    AgGridModule.withComponents([]),
    Ng5SliderModule,
    VirtualScrollerModule
  ],
  declarations: [
    AddSpecDialogComponent,
    ConfirmationComponent,
    SessionRestoreComponent,
    GlobalSearchComponent,
    ChangeDetectionComponent,
    CreateTaskComponent,
    UploadInsertionOrderComponent,
    UploadFilesComponent,
    AddTimeTrackComponent,
    SplitEstimatesComponent,
    SplitCellEditComponent, 
    SplitCellViewComponent,
    BalanceViewComponent,
    AddOrganizationsComponent,
    RemoveOrganizationComponent,
    OrganizationComponent,
    MessagesComponent,

    SplitManualFirstColumn,
    AddReciepientsComponent,
    WopNotificationsComponent
  ],
  exports: [
    AddSpecDialogComponent,
    ConfirmationComponent,
    SessionRestoreComponent,
    AddTimeTrackComponent,
    AddReciepientsComponent,
    WopNotificationsComponent
  ],
  entryComponents: [
    AddSpecDialogComponent,
    ConfirmationComponent,
    SessionRestoreComponent,
    GlobalSearchComponent,
    ChangeDetectionComponent,
    CreateTaskComponent,
    UploadInsertionOrderComponent,
    UploadFilesComponent,
    SplitEstimatesComponent,
    SplitCellEditComponent, 
    SplitCellViewComponent,
    BalanceViewComponent,
    AddOrganizationsComponent,
    RemoveOrganizationComponent,
    OrganizationComponent,

    SplitManualFirstColumn,
    AddReciepientsComponent,
    WopNotificationsComponent,
    MessagesComponent
  ]
})
export class DialogsModule { }
