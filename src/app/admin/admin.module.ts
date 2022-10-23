import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule as TemplateDrivenForm } from '@angular/forms';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AdminService } from "@app/admin/admin.service";

import { AdminRoutingModule, CanActivateAdmin } from '@app/admin/admin-routing.module';
import { AdminComponent } from '@app/admin/admin.component';

import { CostCodesModule } from '@app/admin/cost-codes/cost-codes.module';
import { MiscExpensesModule } from '@app/admin/misc-expenses/misc-expenses.module';
import { DesignationsModule } from './designations/designations.module';
import { GroupsModule } from "@app/admin/groups/groups.module";
import { TasksModule } from '@app/admin/tasks/tasks.module';
import { ProductsModule } from '@app/admin/products/products.module';
import { ServicesModule } from '@app/admin/services/services.module';
import { SpecificationsModule } from '@app/admin/specifications/specifications.module';
import { CapabilityCategoryModule } from '@app/admin/capability-category/capability-category.module';

import { SharedModule } from '@app/shared/shared.module';
import { BaseAdminComponent } from './base-admin/base-admin.component';
import { AdminListComponent } from './admin-list/admin-list.component';
import { AdminDetailComponent } from './admin-detail/admin-detail.component';
import { DialogsModule } from '@app/admin/dialogs/dialogs.module';
import { AdminControllerComponent } from './admin-controller/admin-controller.component';
import { FormsModule } from '@app/admin/forms/forms.module';
import { DistributionTypesModule } from '@app/admin/distribution-types/distribution-types.module';
import { GenericFormsModule } from '@app/admin/generic-forms/generic-forms.module';
import { CapabilitiesModule } from '@app/admin/capabilities/capabilities.module';
import { EquipmentCategoryModule } from '@app/admin/equipment-category/equipment-category.module';
import { CompanyCodesComponent } from './company-codes/company-codes.component';

import { EditorModule } from '@tinymce/tinymce-angular';
import { MenuComponentComponent } from './menu-component/menu-component.component';
import { MarkupsComponent } from './markups/markups.component';
import { MarkupGridComponent } from './markup-grid/markup-grid.component';
import { EditMarkupComponent } from './edit-markup/edit-markup.component';
import { AgGridModule } from 'ag-grid-angular';
import { BusinessRulesComponent } from './business-rules/business-rules.component';
import { ScheduleTemplatesComponent } from './schedule-templates/schedule-templates.component';
import { VendorTemplatesComponent } from './vendor-templates/vendor-templates.component';
// import { QuillModule } from 'ngx-quill';
import { SortablejsModule } from 'angular-sortablejs';
import { DialogsModule as CommonDialogModule } from '@app/dialogs/dialogs.module';
import { ActionsDialogComponent } from './markups/actions-dialog/actions-dialog.component';
import { FileUploadModule } from 'ng2-file-upload';
import { WorkflowModule } from '@app/admin/workflow/workflow.module';
import { DepartmentsComponent } from './departments/departments.component';

@NgModule({
  imports: [
    CommonModule,
    TemplateDrivenForm,
    ReactiveFormsModule,
    InfiniteScrollModule, 
    AdminRoutingModule,
    CostCodesModule,
    MiscExpensesModule,
    DesignationsModule,
    GroupsModule,
    TasksModule,
    ProductsModule,
    ServicesModule,
    SpecificationsModule,
    CapabilityCategoryModule,
    FormsModule,
    DialogsModule,
    DistributionTypesModule,
    SharedModule,
    GenericFormsModule,
    CapabilitiesModule,
    EquipmentCategoryModule,
    EditorModule,
    AgGridModule.withComponents([]),
    SortablejsModule.forRoot({ animation: 150 }),
    FileUploadModule,
    CommonDialogModule,
    WorkflowModule
    // QuillModule
  ],
  declarations: [
    AdminComponent, 
    BaseAdminComponent, 
    AdminListComponent, 
    AdminDetailComponent, 
    AdminControllerComponent, 
    CompanyCodesComponent, 
    MenuComponentComponent,
    MarkupsComponent,
    MarkupGridComponent,
    EditMarkupComponent,
    BusinessRulesComponent,
    ScheduleTemplatesComponent,
    VendorTemplatesComponent,
    ActionsDialogComponent,
    DepartmentsComponent
  ],
  providers: [AdminService,CanActivateAdmin],
  entryComponents: [MarkupGridComponent, EditMarkupComponent, ActionsDialogComponent]
})
export class AdminModule { }
