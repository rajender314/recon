import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule, MatFormFieldModule, MatProgressSpinnerModule, MatInputModule } from '@angular/material';

import { MaterialModule } from '@app/shared/material/material.module';
import { PixelKitModule } from 'pixel-kit';

import { SearchComponent } from './search/search.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminPopoverComponent } from './admin-popover/admin-popover.component';
import { PermissionComponent } from './permission/permission.component';
import { MsgNotificationsComponent } from './msg-notifications/msg-notifications.component';
import { CheckDepartmentsComponent } from './check-departments/check-departments.component';
import { DirectivesModule } from '@app/shared/directives/directives.module';
import { ListHeaderComponent } from './list-header/list-header.component';
import { UploaderComponent } from './uploader/uploader.component';
import { FileUploadModule } from 'ng2-file-upload';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { DescriptionRendererComponent } from '@app/shared/components/ag-grid/cell-renderers/description-renderer/description-renderer.component';
import { MultiLevelSelectComponent } from './multi-level-select/multi-level-select.component';
import { MultiLevelGroupingComponent } from './multi-level-grouping/multi-level-grouping.component';
import { DeleteComponent } from './delete/delete.component';
import { PlaceholderloadingComponent } from './placeholderloading/placeholderloading.component';
import { AgGridPlaceloaderComponent } from './ag-grid-placeloader/ag-grid-placeloader.component';
import { SelectCellEditorComponent } from './ag-grid/cell-editors/select-cell-editor/select-cell-editor.component';
import { NoDataScreenComponent } from './no-data-screen/no-data-screen.component';
import { DateCellEditorComponent } from './ag-grid/cell-editors/date-cell-editor/date-cell-editor.component';
import { ModifiedUserInfoComponent } from './modified-user-info/modified-user-info.component';
import { AgPiSelect, AgPiInput, AgOwlDateTimePicker, AgPiPriceFormat } from './ag-grid/custom-cell-editor';
import { StatusMenuCell, DeleteMenuCell, AgPiSelectRenderer, AgOwlDatePickerRenderer, AgProdServRenderer } from './ag-grid/custom-cell-renderer';
import { AgGridModule } from 'ag-grid-angular';
import { AgSearchHeaderCell } from './ag-grid/custom-header-renderer';
import { AjaxSpinnerComponent } from './ajax-spinner/ajax-spinner.component';
import { SendBoxComponent } from './chat/send-box/send-box.component';
import { AddFilesComponent } from './chat/add-files/add-files.component';
import { PipesModule } from '@app/shared/pipes/pipes.module';
import { NotificationsComponent } from './notifications/notifications.component';

@NgModule({
  imports: [
    CommonModule,
    DirectivesModule,
    MatFormFieldModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MaterialModule,
    PixelKitModule,
    FileUploadModule,
    RouterModule,
    PipesModule,
    AgGridModule.withComponents([]),
  ],
  declarations: [
    SearchComponent,
    AdminPopoverComponent,
    PermissionComponent,
    MsgNotificationsComponent,
    CheckDepartmentsComponent,
    ListHeaderComponent,
    UploaderComponent,
    BreadcrumbComponent,
    FormBuilderComponent,
    NumericCellEditorComponent,
    DescriptionRendererComponent,
    MultiLevelSelectComponent,
    MultiLevelGroupingComponent,
    DeleteComponent,
    PlaceholderloadingComponent,
    AgGridPlaceloaderComponent,
    SelectCellEditorComponent,
    DateCellEditorComponent,
    NoDataScreenComponent,
    ModifiedUserInfoComponent,

    AgPiSelect,
    AgPiInput,
    AgPiPriceFormat,
    AgOwlDateTimePicker,

    StatusMenuCell,
    DeleteMenuCell,
    AgPiSelectRenderer,
    AgOwlDatePickerRenderer,
    AgProdServRenderer,

    AgSearchHeaderCell,

    AjaxSpinnerComponent,

    SendBoxComponent,

    AddFilesComponent,

    NotificationsComponent
  ],
  exports: [
    SearchComponent,
    AdminPopoverComponent,
    PermissionComponent,
    MsgNotificationsComponent,
    CheckDepartmentsComponent,
    ListHeaderComponent,
    BreadcrumbComponent,
    FormBuilderComponent,
    PlaceholderloadingComponent,
    AgGridPlaceloaderComponent,
    NoDataScreenComponent,
    ModifiedUserInfoComponent,
    SendBoxComponent,
    AddFilesComponent,
    NotificationsComponent,
    AjaxSpinnerComponent
  ],
  entryComponents: [
    UploaderComponent, 
    NumericCellEditorComponent, 
    DescriptionRendererComponent, 
    MultiLevelSelectComponent, 
    DeleteComponent, 
    SelectCellEditorComponent, 
    DateCellEditorComponent, 
    
    AgPiSelect, 
    AgPiInput,
    AgPiPriceFormat,
    AgOwlDateTimePicker,

    StatusMenuCell,
    DeleteMenuCell,
    AgPiSelectRenderer,
    AgOwlDatePickerRenderer,
    AgProdServRenderer,

    AddFilesComponent,
    NotificationsComponent,
    AgSearchHeaderCell
  ]
})
export class ComponentsModule { }
