import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ProjectDetailsService } from '../../project-details.service';
import { CommonService } from '@app/common/common.service';
import { InvoiceService } from '../invoice.service';


var APP: any = window['APP'];

@Component({
	selector: 'app-detail-view',
	templateUrl: './detail-view.component.html',
	styleUrls: ['./detail-view.component.scss']
})
export class DetailViewComponent implements OnInit, OnDestroy {
	@ViewChild('safeHtml') safeHtml: ElementRef;

	isLoading: boolean = false;
	projectID: any;
	invoiceId: any;
	htmlContent: string = '';

	routerSubscription: Subscription;
	subscription: Subscription;
	invoiceSubscription: Subscription;
	invoiceNotifications = [];

	constructor(
		private _activeRouter: ActivatedRoute,
		private _http: HttpClient,
		private _commonService: CommonService,
		private _invoiceService: InvoiceService,
		private _projectDetailService: ProjectDetailsService
	) {
		this.routerSubscription = _activeRouter.parent.parent.params.subscribe(param => {
			this.projectID = param ? param.id : null;
		})
		this.subscription = _activeRouter.params.subscribe(param => {
			this.invoiceId = param ? Number(param.id) : null;
			if (!this._projectDetailService.getSubNav().list.length) {
				this.getInvoices(this.projectID, () => {
					if (this.invoiceId) this.getSelectedInvoice(this.invoiceId);
				});
			} else {
				if (this.invoiceId) this.getSelectedInvoice(this.invoiceId);
			}
		})
		this.invoiceSubscription = _invoiceService.onUpdate().subscribe(ev => {
			if (ev.type == 'detail-view') this.getSelectedInvoice(ev.data.est_id);
		})
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this._projectDetailService.emptyList();
		this.routerSubscription.unsubscribe();
		this.subscription.unsubscribe();
		this.invoiceSubscription.unsubscribe();
	}

	getInvoices(id, cb?) {
		this.isLoading = true;
		this._commonService.update({ type: 'left-nav-count', data: {} });
		this._commonService.getApi('getInvoices', { jobs_id: id })
			.then((res: any) => {
				this.isLoading = false;
				if (res.result.success) {
					this._invoiceService.update({ type: 'init', data: res.result.data });
					if (cb) cb();
				}
			})
	}

	getSelectedInvoice(id) {
		this.isLoading = true;
		this._invoiceService.update({ type: 'selected-invoice', data: id });

		this._http.get(APP.api_url + 'invoiceStatus', { params: { 
			estimate_id: id, jobs_id: this.projectID, is_invoice: 'true'
		}})
			.subscribe(res => {
				this.invoiceNotifications = res['result'].data;
			});
		this._http.get(APP.api_url + 'estimatePreview', { params: { id: id, jobs_id: this.projectID, is_invoice: 'true' }, responseType: 'text' })
			.subscribe(res => {
				this.htmlContent = res;
				this.isLoading = false;
			});
	}

}
