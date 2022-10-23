import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonService } from '@app/common/common.service';
import { GridApi, ColumnApi, GridOptions } from 'ag-grid-community';
import { InvoiceCell } from '../invoices.component';
import { InvoiceService } from '../invoice.service';

@Component({
	selector: 'app-grid-view',
	templateUrl: './grid-view.component.html',
	styleUrls: ['./grid-view.component.scss']
})
export class GridViewComponent implements OnInit, OnDestroy {

	isLoading: boolean = false;
	projectID: any;
	invoiceList: Array<any> = [];
	invoiceTreeList: Array<any> = [];

	routerSubscription: Subscription;
	invoiceSubscription: Subscription;

	gridApi: GridApi;
	gridColApi: ColumnApi;
	gridOptions: GridOptions = {
		rowHeight: 62,
		headerHeight: 38,
		columnDefs: [
			// { headerName: 'products', field: 'estimate_no', cellRendererFramework: InvoiceCell },
			{
				headerName: ' ',
				field: 'products_services',
				width: 80,
				headerClass: 'products-services ',
				cellClass: 'products-services-cell ',
				cellRenderer: (param) => {
					return '<div class="user-product-service"><span class="d-flex align-items-center"><i class="pixel-icons icon-products"></i><span>' + param.data.product_cnt + '</span></span> <span class="d-flex align-items-center m-l-15"><i class="pixel-icons icon-orders"></i><span>' + param.data.services_cnt + '</span></span></div>';
				}
			},
			{
				headerName: 'Status', width: 80, cellClass: 'status-cell', field: 'invoice_status', cellRenderer: params => {
					const className = 'status-pills  status_' + params.data.invoice_status_id;
					return '<span class="' + className + '">' + params.value + '</span>';
				}
			},
			{
				headerName: 'Cost', width: 80, field: 'cost', cellClass: 'cost-cell right-text-cell color-dark', headerClass: 'right-header-cell', cellRenderer: params => {
					const className = 'costvalue';
					return '<span class="' + className + '">' + params.value + '</span>'
				}
			}
		],

		autoGroupColumnDef: {
			headerName: 'Invoices',
			field: 'estimate_no',
			cellRenderer: 'agGroupCellRenderer',
			width: 300,
			cellRendererParams: {
				innerRendererFramework: InvoiceCell,
				suppressCount: true
			}
		},

		groupDefaultExpanded: -1,
		treeData: true,
		getDataPath: data => {
			return data.hireracy;
		},
		icons: {
			groupExpanded: false,
			groupContracted: false
		},

		pagination: true,

		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		localeText: { noRowsToShow: 'No Approved Estimates in this Project' },
		suppressColumnVirtualisation: true,

		defaultColDef: {
			resizable: true
		},

		onGridReady: params => {
			this.gridApi = params.api;
			this.gridColApi = params.columnApi;
			this.gridApi.setRowData(this.invoiceTreeList);
			this.gridApi.sizeColumnsToFit();
		},
		onRowClicked: params => {
			this._router.navigate(['/projects/' + this.projectID + '/invoices/' + params.data.est_id]);
		}
	}

	constructor(
		private _router: Router,
		private _activeRoute: ActivatedRoute,
		private _commonService: CommonService,
		private _invoiceService: InvoiceService
	) {
		this.routerSubscription = _activeRoute.parent.parent.params.subscribe(param => {
			this.projectID = param.id ? param.id : null;
			this.getInvoices(this.projectID);
		});
		this.invoiceSubscription = _invoiceService.onUpdate().subscribe(ev => {
			if (ev.type == 'generate') {
				this.getInvoices(this.projectID);
			}
		})
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.routerSubscription.unsubscribe();
		this.invoiceSubscription.unsubscribe();
	}

	getInvoices(id) {
		this.isLoading = true;
		this._commonService.update({ type: 'left-nav-count', data: {} });
		this._commonService.getApi('getInvoices', { jobs_id: id })
			.then((res: any) => {
				this.isLoading = false;
				if (res.result.success) {
					this.invoiceList = res.result.data.list || [];
					this.invoiceTreeList = this.treeData(this.invoiceList);
					if (this.gridApi) this.gridApi.setRowData(this.invoiceTreeList);
					this._invoiceService.update({ type: 'init', data: res.result.data });
				}
			})
	}

	treeData(data) {
		let arr = [];
		data.map(o => {
			arr.push({ ...o, ...{ hireracy: [o.est_id] } })
			if (o.children) {
				o.children.map(p => {
					arr.push({ ...p, ...{ hireracy: [o.est_id, p.est_id] } });
				})
			}
		})
		return arr;
	}

}
