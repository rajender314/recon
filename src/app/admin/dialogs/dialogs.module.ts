import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddAdminDialogComponent } from './add-admin-dialog/add-admin-dialog.component';
import { MaterialModule } from '@app/shared/material/material.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CreateDesignationComponent } from '@app/admin/dialogs/create-designation/create-designation.component';
import { CreateDialogComponent } from '@app/admin/dialogs/create-dialog/create-dialog.component';
import { CreateGroupComponent } from '@app/admin/dialogs/create-group/create-group.component';
import { CreateMiscExpenseComponent } from '@app/admin/dialogs/create-misc-expense/create-misc-expense.component';
import { CreateTasksComponent } from '@app/admin/dialogs/create-tasks/create-tasks.component';
import { SharedModule } from '@app/shared/shared.module';
import { SelectModule } from 'ng2-select';
import { CreateSpecificationComponent } from './create-specification/create-specification.component';
import { CreateFormComponent } from './create-form/create-form.component';
import { CreateCapabilityCategoryComponent } from '@app/admin/dialogs/create-capability-category/create-capability-category.component';
import { CreateCapabilityComponent } from './create-capability/create-capability.component';
import { CreateEquipmentCategoryComponent } from './create-equipment-category/create-equipment-category.component';
import { AgGridModule } from 'ag-grid-angular';
import { DeleteComponent } from './delete/delete.component';

// import { CreateDistributionTypeComponent } from '@app/admin/dialogs/create-distribution-type/create-distribution-type.component';
import { AddTemplateComponent } from './add-template/add-template.component';
import { AddTaskComponent } from './add-task/add-task.component';
import { AddCompanyCodeComponent } from './add-company-code/add-company-code.component';
import { EditDependenciesComponent } from './edit-dependencies/edit-dependencies.component';
import { AddCostCodeComponent } from './add-cost-code/add-cost-code.component';
import { EditScheduleFormsComponent } from './edit-schedule-forms/edit-schedule-forms.component';
import { CreateDepartmentComponent } from './create-department/create-department.component';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    SharedModule,
    SelectModule,
    FormsModule,
    AgGridModule.withComponents([])
  ],
  declarations: [
    AddAdminDialogComponent,
    CreateDesignationComponent,
    CreateDialogComponent,
    CreateGroupComponent,
    CreateMiscExpenseComponent,
    CreateTasksComponent,
    CreateSpecificationComponent,
    CreateFormComponent,
    CreateCapabilityComponent,
    CreateCapabilityCategoryComponent,
    CreateEquipmentCategoryComponent,
    DeleteComponent,
    // CreateDistributionTypeComponent,
    AddTemplateComponent,
    AddTaskComponent,
    AddCompanyCodeComponent,
    EditDependenciesComponent,
    AddCostCodeComponent,
    EditScheduleFormsComponent,
    CreateDepartmentComponent
  ],
  entryComponents: [
    AddAdminDialogComponent,
    CreateDesignationComponent,
    CreateDialogComponent,
    CreateGroupComponent,
    CreateMiscExpenseComponent,
    CreateTasksComponent,
    CreateSpecificationComponent,
    CreateFormComponent,
    CreateCapabilityComponent,
    CreateCapabilityCategoryComponent,
    CreateEquipmentCategoryComponent,
    DeleteComponent,
    // CreateDistributionTypeComponent,
    AddTemplateComponent,
    AddTaskComponent,
    AddCompanyCodeComponent,
    EditDependenciesComponent,
    AddCostCodeComponent,
    EditScheduleFormsComponent,
    CreateDepartmentComponent
  ]
})
export class DialogsModule { }
