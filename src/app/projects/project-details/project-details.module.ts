import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddVendorComponent } from './bid-schedule/add-vendor/add-vendor.component';
import { SharedModule } from '@app/shared/shared.module';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddTaskComponent } from './add-task/add-task.component';
import { CostAnalysisGridComponent } from './cost-analysis-grid/cost-analysis-grid.component';
import { DialogsModule } from '@app/dialogs/dialogs.module';
import { InvoiceCell } from '@app/projects/project-details/invoices/invoices.component';
import { POCheck } from '@app/projects/project-details/purchase-orders/purchase-orders.component';
import { EditInvoiceComponent } from '@app/projects/project-details/invoices/edit-invoice/edit-invoice.component';
import { RemoveProductComponent } from './remove-product/remove-product.component';
import { AddPoComponent } from '@app/projects/project-details/purchase-orders/add-po/add-po.component';
import { AddMilestoneComponent } from './purchase-orders/add-milestone/add-milestone.component';
import { UploadInvoiceComponent } from './purchase-orders/upload-invoice/upload-invoice.component';
import { FileUploadModule } from 'ng2-file-upload';
import { CreateTaskComponent } from './tasks/create-task/create-task.component';
import { ReorderComponent } from './products/reorder/reorder.component';
import { SortablejsModule } from 'angular-sortablejs';
import { RequestApprovalComponent } from './purchase-orders/request-approval/request-approval.component';
import { DetailViewComponent, ServiceOptionsCell, IncludeCostHeaderCell, IncludeCostRowCell } from './purchase-orders/detail-view/detail-view.component';
import { RouterModule } from '@angular/router';
import { StatusMenuCell, TaskNameCell, DueDateCell, TaskSettings } from './tasks/list/list.component';
import { CheckScheduleComponent } from './tasks/check-schedule/check-schedule.component';
import { FilesGridComponent, FileOptionsComponent, FileMessagesComponent, FilesChangeComponent, FilesCategoryComponent, FilesInfoComponent, GridSelectComponent, FilesThumbnailComponent } from './files-grid/files-grid.component';
import { CostAnalysisProductCell } from './cost-analysis/cost-analysis.component';
import { DownloadOldVersionsComponent } from './files/download-old-versions/download-old-versions.component';
import { FilePreviewComponent } from './files/file-preview/file-preview.component';
// import { JobStoriesComponent } from './job-stories/job-stories.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ListComponent } from './tasks/list/list.component';
import { DetailViewComponent as TasksDetailView } from './tasks/detail-view/detail-view.component';
import { DetailViewComponent as InvoiceDetailView } from './invoices/detail-view/detail-view.component';
import { GridViewComponent } from './invoices/grid-view/grid-view.component';
import { CreateRelatedProjectsComponent } from './create-related-projects/create-related-projects.component';
import { RequestBidsComponent, ProductServiceCell, VendorDateCell, VendorHeaderDateCell } from './vender-queue/request-bids/request-bids.component';
import { AddFromTemplateComponent } from './tasks/add-from-template/add-from-template.component';
import { TemplateNameCell, AgOwlDatePickerCell, AgNoteCell, TemplateAssigneeCell, TemplateOrderCell, TemplateTaskTypeCell, TemplateProductServiceCell } from './tasks/add-from-template/add-form-template.ag-grid';
import { VendorScheduleComponent } from './vender-queue/vendor-schedule/vendor-schedule.component';
import { JobMessagingComponent } from './job-messaging/job-messaging.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
// import { OldJobStoriesComponent } from './old-job-stories/old-job-stories.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    DialogsModule,
    AgGridModule.withComponents([]),
    FileUploadModule,
    SortablejsModule.forRoot({ animation: 150 }),
    RouterModule,
    NgxDocViewerModule,
    InfiniteScrollModule,
    VirtualScrollerModule
  ],
  declarations: [AddVendorComponent, AddTaskComponent, CostAnalysisGridComponent, InvoiceCell, EditInvoiceComponent, AddPoComponent, RemoveProductComponent, AddMilestoneComponent, ServiceOptionsCell, IncludeCostHeaderCell, IncludeCostRowCell, UploadInvoiceComponent, CreateTaskComponent, ReorderComponent, RequestApprovalComponent, DetailViewComponent, StatusMenuCell, TaskNameCell, TaskSettings, DueDateCell, CheckScheduleComponent, FilesGridComponent, FileOptionsComponent, FileMessagesComponent, FilesChangeComponent, FilesCategoryComponent, FilesThumbnailComponent, FilesInfoComponent, CostAnalysisProductCell, POCheck, GridSelectComponent, DownloadOldVersionsComponent, FilePreviewComponent, ListComponent, TasksDetailView, GridViewComponent, InvoiceDetailView, CreateRelatedProjectsComponent, RequestBidsComponent, ProductServiceCell, VendorHeaderDateCell, VendorDateCell, TemplateNameCell, AddFromTemplateComponent, AgOwlDatePickerCell, AgNoteCell, TemplateAssigneeCell, TemplateOrderCell, TemplateTaskTypeCell, TemplateProductServiceCell, VendorScheduleComponent, JobMessagingComponent],
  entryComponents: [AddVendorComponent, AddTaskComponent, CostAnalysisGridComponent, InvoiceCell, EditInvoiceComponent, AddPoComponent, RemoveProductComponent, AddMilestoneComponent, ServiceOptionsCell, IncludeCostHeaderCell, IncludeCostRowCell, UploadInvoiceComponent, CreateTaskComponent, ReorderComponent, RequestApprovalComponent, StatusMenuCell, TaskNameCell, TaskSettings, DueDateCell, CheckScheduleComponent, FilesGridComponent, FileOptionsComponent, FileMessagesComponent, FilesChangeComponent, FilesCategoryComponent, FilesThumbnailComponent, FilesInfoComponent, CostAnalysisProductCell, POCheck, GridSelectComponent, DownloadOldVersionsComponent, FilePreviewComponent, CreateRelatedProjectsComponent, RequestBidsComponent, ProductServiceCell, VendorHeaderDateCell, VendorDateCell, TemplateNameCell, AddFromTemplateComponent, AgOwlDatePickerCell, AgNoteCell, TemplateAssigneeCell, TemplateOrderCell, TemplateTaskTypeCell, TemplateProductServiceCell, VendorScheduleComponent, JobMessagingComponent]
})
export class ProjectDetailsModule { }