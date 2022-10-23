import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

import { AdminComponent } from '@app/admin/admin.component';
import { CostCodesComponent } from '@app/admin/cost-codes/cost-codes.component';
import { MiscExpensesComponent } from "@app/admin/misc-expenses/misc-expenses.component";
import { DesignationsComponent } from "@app/admin/designations/designations.component";
import { GroupsComponent } from "@app/admin/groups/groups.component";
import { TasksComponent } from '@app/admin/tasks/tasks.component';
import { ProductsComponent } from '@app/admin/products/products.component';
import { ServicesComponent } from '@app/admin/services/services.component';
import { SpecificationsComponent } from '@app/admin/specifications/specifications.component';
import { CapabilityCategoryComponent } from '@app/admin/capability-category/capability-category.component';

import { BaseAdminComponent } from '@app/admin/base-admin/base-admin.component';
import { AdminControllerComponent } from '@app/admin/admin-controller/admin-controller.component';
import { FormsComponent } from '@app/admin/forms/forms.component';
import { DistributionTypesComponent } from '@app/admin/distribution-types/distribution-types.component';
import { GenericFormsComponent } from '@app/admin/generic-forms/generic-forms.component';
import { CapabilitiesComponent } from '@app/admin/capabilities/capabilities.component';
import { EquipmentCategoryComponent } from '@app/admin/equipment-category/equipment-category.component';
import { CompanyCodesComponent } from '@app/admin/company-codes/company-codes.component';
import { MarkupsComponent } from '@app/admin/markups/markups.component';
import { BusinessRulesComponent } from '@app/admin/business-rules/business-rules.component';
import { ScheduleTemplatesComponent } from '@app/admin/schedule-templates/schedule-templates.component';
import { VendorTemplatesComponent } from '@app/admin/vendor-templates/vendor-templates.component';
import { TaskTypesComponent } from '@app/admin/workflow/task-types/task-types.component';
import { TaskStatusesComponent } from '@app/admin/workflow/task-statuses/task-statuses.component';
import { DepartmentsComponent } from '@app/admin/departments/departments.component';
import { Observable } from 'rxjs';

var APP: any = window['APP'];

@Injectable()
export class CanActivateAdmin implements CanActivate {
  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (APP.permissions.system_access[route.data.parent] == 'no' || APP.permissions.system_access[route.data.permissions] == 'none'
      || APP.permissions.system_access[route.data.permissions] == 'no') {
      this.router.navigate(['/admin']);
      return false;
    }
    return true;
  }
}

const routes: Routes = [
  {
    path: '',
    component: AdminComponent
  },
  {
    path: 'cost-codes',
    component: CostCodesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'cost_codes', parent: 'accounting' }
  },
  {
    path: 'categories',
    component: AdminControllerComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'categories',parent:'company' }
  },
  {
    path: 'company-codes',
    component: CompanyCodesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'company_codes',parent:'company' }
  },
  {
    path: 'markups',
    component: MarkupsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'markups', parent: 'accounting' }
  },
  {
    path: 'business-rules',
    component: BusinessRulesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'business_rules',parent:'company' }
  },
  {
    path: 'misc-expenses',
    component: MiscExpensesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'misc_-_expenses', parent: 'accounting' }
  },
  {
    path: 'departments',
    component: DepartmentsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'departments',parent:'company' }
  },
  {
    path: 'designations',
    component: DesignationsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'designations',parent:'company' }
  },
  {
    path: 'file-categories',
    component: AdminControllerComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'file_categories',parent:'company' }
  },
  {
    path: 'groups',
    component: GroupsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'groups',parent:'company' }
  },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [CanActivateAdmin],
    data: { is_milestone: 1, permissions: 'tasks',parent:'schedule' }
  },
  {
    path: 'schedule-templates',
    component: ScheduleTemplatesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'schedule_templates',parent:'schedule' }
  },
  {
    path: 'vendor-templates',
    component: VendorTemplatesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'vendor_templates',parent:'schedule' }
  },
  {
    path: 'milestones',
    component: TasksComponent,
    canActivate: [CanActivateAdmin],
    data: { is_milestone: 2, permissions: 'milestones',parent:'schedule' }
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'products',parent:'company' }
  },
  {
    path: 'services',
    component: ServicesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'services',parent:'company' }
  },
  {
    path: 'specifications',
    component: SpecificationsComponent,
    canActivate: [CanActivateAdmin], data: {
      permissions: 'specifications',
      parent:'company',
      type: 1,
      icon: 'icon-specifications',
      bgColor: 'gray'
    }
  },
  {
    path: 'capability-category',
    component: CapabilityCategoryComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'capability_category',parent:'vendors' }
  },
  {
    path: 'vendor-types',
    component: AdminControllerComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'vendor_types',parent:'company' }
  },
  {
    path: 'forms',
    component: FormsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'forms',parent:'company' }
  },
  {
    path: 'distribution-types',
    component: DistributionTypesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'distribution_types',parent:'company' }
  },
  {
    path: 'generic-forms',
    component: GenericFormsComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'generic_forms',parent:'company' }
  },
  {
    path: 'capabilities',
    component: CapabilitiesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'capabilities',parent:'vendors' }
  },
  {
    path: 'equipment-category',
    component: EquipmentCategoryComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'equipment_category',parent:'vendors' }
  },
  {
    path: 'equipment-specs',
    component: SpecificationsComponent,
    canActivate: [CanActivateAdmin],
    data: {
      type: 2,
      icon: 'icon-equipments',
      bgColor: 'pink',
      permissions: 'equipment_specs',
      parent:'vendors'
    }
  },
  {
    path: 'task-types',
    component: TaskTypesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'task_types',parent:'workflow' }
  },
  {
    path: 'task-statuses',
    component: TaskStatusesComponent,
    canActivate: [CanActivateAdmin], data: { permissions: 'task_statuses',parent:'workflow' } 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
