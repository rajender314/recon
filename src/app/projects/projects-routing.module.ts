import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate } from '@angular/router';
import { ProjectDashboardComponent } from '@app/projects/project-dashboard/project-dashboard.component';
import { ProjectDetailsComponent } from '@app/projects/project-details/project-details.component';
import { ProjectInfoComponent } from '@app/projects/project-info/project-info.component';
import { OverviewComponent } from '@app/projects/project-details/overview/overview.component';
import { TasksComponent } from '@app/projects/project-details/tasks/tasks.component';
import { PrepressComponent } from '@app/projects/project-details/prepress/prepress.component';
import { PostBidsComponent } from '@app/projects/post-bids/post-bids.component';
import { EstimatesComponent } from '@app/projects/estimates/estimates.component';
import { InvoicesComponent } from '@app/projects/project-details/invoices/invoices.component';
import { PurchaseOrdersComponent } from '@app/projects/project-details/purchase-orders/purchase-orders.component';
import { FilesComponent } from '@app/projects/project-details/files/files.component';
import { DetailViewComponent } from '@app/projects/project-dashboard/detail-view/detail-view.component';
import { ProductsComponent } from '@app/projects/project-details/products/products.component';
import { DistributionListComponent } from '@app/projects/project-details/distribution-list/distribution-list.component';
import { ChangeEstimateComponent } from '@app/projects/change-estimate/change-estimate.component';
import { ProjectInfoComponent as EditProject } from '@app/projects/project-details/project-info/project-info.component';
import { CostAnalysisComponent } from '@app/projects/project-details/cost-analysis/cost-analysis.component';
import { BidScheduleComponent } from '@app/projects/project-details/bid-schedule/bid-schedule.component';
import { VenderQueueComponent } from '@app/projects/project-details/vender-queue/vender-queue.component';
import { AnalyzeBidsComponent } from '@app/projects/project-details/analyze-bids/analyze-bids.component';
import { DetailViewComponent as PODetailView } from './project-details/purchase-orders/detail-view/detail-view.component';
import { JobStoriesComponent } from '@app/projects/project-details/job-stories/job-stories.component';
import { Observable } from 'rxjs';
import { ListComponent } from './project-details/tasks/list/list.component';
import { DetailViewComponent as TasksDetailView } from './project-details/tasks/detail-view/detail-view.component';
import { GridViewComponent } from './project-details/invoices/grid-view/grid-view.component';
import { DetailViewComponent as InvoiceDetailView } from './project-details/invoices/detail-view/detail-view.component';
var APP: any = window['APP'];

@Injectable()
export class CanActivateTeam implements CanActivate {
	constructor() { }

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		if(route.data['is_system_access']){
			return (APP.permissions.system_access[route.data.permissions] == 'none' || APP.permissions.system_access[route.data.permissions] == 'no') ? false : true;
		}
		return (APP.permissions.job_access[route.data.permissions] == 'none' || APP.permissions.job_access[route.data.permissions] == 'no') ? false : true;
	}
}

const routes: Routes = [
	{ path: 'create-project', component: ProjectInfoComponent },
	{
		path: '', component: ProjectDashboardComponent, children: [
			{ path: 'favorites', component: DetailViewComponent, data: { title: 'Favorites', flag: 'favorites' } },
			{ path: 'my', component: DetailViewComponent, data: { title: 'My Projects', flag: 'my' } },
			{ path: 'all', component: DetailViewComponent, canActivate: [CanActivateTeam], data: { title: 'All Projects', flag: 'all', permissions: 'all_jobs',is_system_access:true } },
			{ path: '', redirectTo: '/projects/my' /*(APP.permissions.system_access.all_jobs == 'yes') ? '/projects/all' : '/projects/my'*/, pathMatch: 'full' }
		]
	},
	{
		path: ':id', component: ProjectDetailsComponent, children: [
			{ path: 'stories', component: JobStoriesComponent },
			{ path: 'overview', component: OverviewComponent },
			{ path: 'project-info', component: EditProject },
			{ path: 'products', component: ProductsComponent },
			{ path: 'products/:id', component: ProductsComponent },
			{
				path: 'tasks', component: TasksComponent, canActivate: [CanActivateTeam], data: { permissions: 'schedule' }, children: [
					{
						path: 'list', component: ListComponent, children: [
							{ path: ':id', component: TasksDetailView }
						]
					},
					{ path: '', redirectTo: 'list', pathMatch: 'full' }
				]
			},
			{ path: 'distribution-list', component: DistributionListComponent, canActivate: [CanActivateTeam], data: { permissions: 'distribution_lists' } },
			{ path: 'cost-analysis', component: CostAnalysisComponent, canActivate: [CanActivateTeam], data: { permissions: 'internal_estimation' } },

			{ path: 'bid-schedule', component: BidScheduleComponent },
			{ path: 'vendor-queue', component: VenderQueueComponent, canActivate: [CanActivateTeam], data: { permissions: 'vendor_queue' } },
			{ path: 'analyze-bids', component: AnalyzeBidsComponent },

			{ path: 'estimates', component: EstimatesComponent, canActivate: [CanActivateTeam], data: { permissions: 'estimates' } },
			{
				path: 'invoices', component: InvoicesComponent, canActivate: [CanActivateTeam], data: { permissions: 'invoice' }, children: [
					{ path: '', component: GridViewComponent, data: { height: '100%' } },
					{ path: ':id', component: InvoiceDetailView, data: { height: 'auto' } }
				]
			},
			{ path: 'purchase-orders', component: PurchaseOrdersComponent, canActivate: [CanActivateTeam], data: { permissions: 'purchase_order' } },
			{ path: 'purchase-orders/:id', component: PODetailView },
			{ path: 'prepress', component: PrepressComponent, canActivate: [CanActivateTeam], data: { permissions: 'prepress' } },
			{ path: 'files', component: FilesComponent, canActivate: [CanActivateTeam], data: { permissions: 'files' } },

			{ path: 'estimates/:estimate_id', component: ChangeEstimateComponent, canActivate: [CanActivateTeam], data: { permissions: 'estimates' } },

			{ path: 'post-bids', component: PostBidsComponent },
			{ path: '', redirectTo: 'overview', pathMatch: 'full' }
		]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class ProjectsRoutingModule { }
