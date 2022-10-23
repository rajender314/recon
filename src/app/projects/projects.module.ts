import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectsRoutingModule, CanActivateTeam } from './projects-routing.module';
import { ProjectDashboardComponent } from './project-dashboard/project-dashboard.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { SharedModule } from '@app/shared/shared.module';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AddProductComponent } from './add-product/add-product.component';
import { ProjectInfoComponent } from './project-info/project-info.component';
import { ProductServiceComponent } from './product-service/product-service.component';
import { SpecsComponent } from './specs/specs.component';
import { ReviewComponent } from './review/review.component';
import { OverviewComponent } from '@app/projects/project-details/overview/overview.component';
import { ProjectProductsComponent } from '@app/projects/project-products/project-products.component';
import { TasksComponent } from '@app/projects/project-details/tasks/tasks.component';
import { PrepressComponent } from '@app/projects/project-details/prepress/prepress.component';
import { PostBidsComponent } from '@app/projects/post-bids/post-bids.component';
import { EstimatesComponent } from '@app/projects/estimates/estimates.component';
import { InvoicesComponent } from '@app/projects/project-details/invoices/invoices.component';
import { PurchaseOrdersComponent } from '@app/projects/project-details/purchase-orders/purchase-orders.component';
import { FilesComponent } from '@app/projects/project-details/files/files.component';
import { AgGridModule } from 'ag-grid-angular';
import { PostBidsGridComponent, PostBidsIcons, HeaderSettings, serviceCheck, serviceHeaderCheck, JobNameComponent, capabilityEquipmentComponent, ProductsServicesComponent, OptionCell, ALTOptionCell, BidScheduleSpecs, SendScheduleHeaderCell, SendScheduleRowCell } from '@app/projects/post-bids-grid//post-bids-grid.component';
import { ChangeAddressComponent } from './change-address/change-address.component';
import { ImportProjectDataComponent } from './import-project-data/import-project-data.component';
import { AnalyzeBidsComponent } from './analyze-bids/analyze-bids.component';

import { FileUploadModule } from 'ng2-file-upload';
import { ActionsDialogComponent } from '@app/projects/project-products/actions-dialog/actions-dialog.component';
import { DialogsModule } from '@app/dialogs/dialogs.module';
import { DetailViewComponent } from './project-dashboard/detail-view/detail-view.component';
import { AddOptionComponent } from './project-products/add-option/add-option.component';
import { ProductsComponent } from './project-details/products/products.component';
import { ChangeEstimateComponent } from './change-estimate/change-estimate.component';
import { ConfigureOptionsComponent } from './configure-options/configure-options.component';
import { EstimatesTimelineComponent } from './estimates-timeline/estimates-timeline.component';
import { EstimatesPreviewComponent } from './estimates-preview/estimates-preview.component';
import { EditProductComponent } from '@app/projects/project-details/products/edit-product/edit-product.component';
import { AddEstimateComponent } from './add-estimate/add-estimate.component';
import { EstimateHeaderCheck, EstimateCheck, CoProductService, CoProductServiceLineItems, displaySpecs } from './estimates-grid/estimates-grid.component';
import { DistributionListComponent } from '@app/projects/project-details/distribution-list/distribution-list.component';
import { AddDialogComponent } from '@app/projects/project-details/distribution-list/add-dialog/add-dialog.component';
import { EstimateDetailsComponent } from './estimate-details/estimate-details.component';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { ReorderServicesComponent } from './project-details/products/reorder-services/reorder-services.component';
import { AddServiceComponent } from './project-details/products/add-service/add-service.component';
import { EditDialogComponent } from './project-details/distribution-list/edit-dialog/edit-dialog.component';
import { BundleServiceComponent } from './bundle-service/bundle-service.component';
import { EditOrderComponent } from './edit-order/edit-order.component';
import { ProjectInfoComponent as EditProject } from '@app/projects/project-details/project-info/project-info.component';
import { BidScheduleComponent } from './project-details/bid-schedule/bid-schedule.component';
import { VenderQueueComponent } from './project-details/vender-queue/vender-queue.component';
import { CostAnalysisComponent } from './project-details/cost-analysis/cost-analysis.component';
import { AnalyzeBidsComponent as PDAnalyzeBids } from '@app/projects/project-details/analyze-bids/analyze-bids.component';
import { SortablejsModule } from 'angular-sortablejs';
import { ProjectDetailsModule } from '@app/projects/project-details/project-details.module';
import { SendEstimateComponent } from './send-estimate/send-estimate.component';
import { AddCreditComponent } from './add-credit/add-credit.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { JobStoriesComponent } from '@app/projects/project-details/job-stories/job-stories.component';
import { OldJobStoriesComponent } from '@app/projects/project-details/old-job-stories/old-job-stories.component';
import { EstimatesOverviewComponent } from './estimates-overview/estimates-overview.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ChangeCustomAttributesComponent } from './change-custom-attributes/change-custom-attributes.component';
import { CopySplitEstimateComponent } from './copy-split-estimate/copy-split-estimate.component';
import { ChangeDescriptionComponent } from './change-description/change-description.component';
import { AddMilestonesComponent } from './add-milestones/add-milestones.component';
import { CloneEstimateComponent } from './clone-estimate/clone-estimate.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CopyLineItemComponent } from './copy-line-item/copy-line-item.component';
import { EstimatingCompleteComponent } from './estimating-complete/estimating-complete.component';
import { LightboxModule } from 'ngx-lightbox';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProjectsRoutingModule,
    SharedModule,
    FileUploadModule,
    AgGridModule.withComponents([]),
    DialogsModule,
    ScrollToModule.forRoot(),
    SortablejsModule.forRoot({ animation: 150 }),
    EditorModule,
    ProjectDetailsModule,
    InfiniteScrollModule,
    VirtualScrollerModule,
    DragDropModule,
    LightboxModule
  ],
  providers: [
    CanActivateTeam
  ],
  declarations: [
    ProjectDashboardComponent, 
    ProjectDetailsComponent, 
    CreateProjectComponent, 
    AddProductComponent, 
    ProjectInfoComponent, 
    ProductServiceComponent, 
    SpecsComponent, 
    ReviewComponent, 
    OverviewComponent, 
    ProjectProductsComponent, 
    TasksComponent,
    DistributionListComponent, 
    PrepressComponent,
    PostBidsComponent, 
    EstimatesComponent, 
    InvoicesComponent, 
    PurchaseOrdersComponent, 
    FilesComponent,
    PostBidsGridComponent,
    PostBidsIcons,
    HeaderSettings,
    serviceCheck,
    OptionCell,
    ALTOptionCell,
    BidScheduleSpecs,
    serviceHeaderCheck,
    ChangeAddressComponent,
    ImportProjectDataComponent,
    AnalyzeBidsComponent,
    ActionsDialogComponent,
    DetailViewComponent,
    JobNameComponent,
    AddOptionComponent,
    capabilityEquipmentComponent,
    ProductsServicesComponent,
    ProductsComponent,
    ChangeEstimateComponent,
    ConfigureOptionsComponent,
    EstimatesTimelineComponent,
    EstimatesPreviewComponent,
    EditProductComponent,
    AddEstimateComponent,
    AddDialogComponent,
    EstimateHeaderCheck,
    EstimateCheck,
    EstimateDetailsComponent,
    CoProductService,
    CoProductServiceLineItems,
    ReorderServicesComponent,
    AddServiceComponent,
    EditDialogComponent,
    displaySpecs,
    BundleServiceComponent,
    EditOrderComponent,
    EditProject,
    BidScheduleComponent,
    VenderQueueComponent,
    CostAnalysisComponent,
    PDAnalyzeBids,
    SendEstimateComponent,
    AddCreditComponent,
    JobStoriesComponent,
    OldJobStoriesComponent,
    EstimatesOverviewComponent,
    ChangeCustomAttributesComponent,
    CopySplitEstimateComponent,
    ChangeDescriptionComponent,
    AddMilestonesComponent,
    CloneEstimateComponent,
    CopyLineItemComponent,
    SendScheduleHeaderCell,
    SendScheduleRowCell,
    EstimatingCompleteComponent
  ],
  entryComponents: [
    CreateProjectComponent, PostBidsGridComponent, PostBidsIcons, HeaderSettings, serviceCheck, OptionCell, ALTOptionCell, BidScheduleSpecs, serviceHeaderCheck, ChangeAddressComponent, ImportProjectDataComponent, AnalyzeBidsComponent, ActionsDialogComponent, JobNameComponent, AddOptionComponent, capabilityEquipmentComponent, ProductsServicesComponent, ChangeEstimateComponent, EditProductComponent, AddEstimateComponent, EstimateHeaderCheck, EstimateCheck, CoProductService, CoProductServiceLineItems, AddDialogComponent, ReorderServicesComponent, AddServiceComponent, EditDialogComponent, displaySpecs, BundleServiceComponent, EditOrderComponent, SendEstimateComponent, AddCreditComponent, ChangeCustomAttributesComponent, CopySplitEstimateComponent, ChangeDescriptionComponent, AddMilestonesComponent, CloneEstimateComponent, CopyLineItemComponent,
    SendScheduleHeaderCell, SendScheduleRowCell, EstimatingCompleteComponent, OldJobStoriesComponent
  ]
})
export class ProjectsModule { }
