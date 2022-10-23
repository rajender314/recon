import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { GridOptions, GridApi, ColDef, ColumnApi, RowNode } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';

import * as _ from 'lodash';
import { buildParam } from '@app/shared/utility/dummyJson';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
var APP: any = window['APP'];

@Component({
	selector: 'app-edit-dialog',
	templateUrl: './edit-dialog.component.html',
	styleUrls: ['./edit-dialog.component.scss']
})
export class EditDialogComponent implements OnInit {

	promise: any;
	params: Array<any> = [];
	gridApi: GridApi;
	gridColumnApi: ColumnApi;
	public loader = true;
	gridOptions: GridOptions = {
		rowHeight: 38,
		columnDefs: [],
		defaultColDef: {
			editable: true,
			floatingFilterComponentParams: { suppressFilterButton: true },
			newValueHandler: (params) => {
				if (params.newValue) {
					params.data[params.colDef.field] = params.newValue;
					return true;
				}
				else return false;
			},
			resizable: true,
			filter: true
		},
		animateRows: true,
		floatingFilter: true,

		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,

		// groupIncludeTotalFooter: true,
		alignedGrids: [],
		pagination: true,

		rowData: [],
		localeText: { noRowsToShow: '<div class="no-data" style="font-size:14px;padding: 20px;text-align: center;color: rgba(23, 43, 77, 0.5);">No Data Found</div>' },
		onGridReady: (params) => {
			//'<div class="no-data" style="font-size:14px;padding: 20px;text-align: center;color: rgba(23, 43, 77, 0.5);">No Data Found</div>'
			//'<mat-spinner diameter="45" class="md" *ngIf="state.isLoading"></mat-spinner>'
			params.api.sizeColumnsToFit();
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
		},
		onCellValueChanged: (gridApi) => {
			if (gridApi.data.id) {
				let params: any = { ...gridApi.data };
				delete params.distribution_type;
				if (gridApi.oldValue != gridApi.newValue) {
					if(gridApi.colDef.filterParams.data_type == 'array') {
						const data = _.find(this.listDetails.products, ['id', gridApi.data.id]);
						params[gridApi.colDef.field] = data[gridApi.colDef.field];
						params[gridApi.colDef.field].value = gridApi.newValue;
					}
					if (gridApi.colDef.field == 'distribution_type') {
						params.distribution_type_id = _.find(this.listDetails.distribution_types, ['name', gridApi.newValue]).id;
					}
					const indx = _.findIndex(this.params, ['id', gridApi.data.id]);
					if (indx == -1) this.params.push(params)
					else this.params[indx] = params;
					this.queueRequest(this.params, 1000)
				}
			}
		},
		onCellClicked: (params) => {
			if(params.column.getColId() == 'action') {
				this.deleteRow(params.data);
			} else if (params.event.target['className'] == 'pixel-icons icon-plus') {
				this.queueRequest([params.data], 0);
			} else if (params.event.target['className'] == 'pixel-icons icon-minus') {
				this.gridApi.updateRowData({ remove: [params.data] });
			}
		}
	}
	isFooter: boolean = false;
	footerGridApi: GridApi;
	footerGid: GridOptions = {
		headerHeight: 0,
		rowHeight: 38,
		columnDefs: [],
		rowData: [],
		alignedGrids: [],
		rowStyle: { fontWeight: 'bold' },
		getRowNodeId: params => {
			return params.id;
		},
		onGridReady: params => {
			this.footerGridApi = params.api;
		}
	}
	isChange: boolean = false;

	listDetails = {
		headers: [],
		products: [],
		distribution_types: []
	}

	constructor(
		private _dialog: MatDialog,
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<EditDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { 
		_commonService.onUpdate().subscribe(obj => {
			if (obj.type && obj.type == 'updateImportDistro') {
				this.getList();
			}
		});
	}

	ngOnInit() {
		this.gridOptions.alignedGrids.push(this.footerGid);
		this.footerGid.alignedGrids.push(this.gridOptions);
		this.getList();
	}

	columnSum(values) {
		return values.reduce((a, b) => (a ? parseFloat(a) : 0) + (b ? parseFloat(b) : 0), 0).toFixed(2);
	}

	closeDialog() {
		this._dialogRef.close({ isChange: this.isChange });
	}

	addNewRow() {
		const data = { id: '' };
		this.gridOptions.columnDefs.map((o: ColDef) => {
			data[o.field] = ''
		})
		this.gridApi.updateRowData({ add: [data] })
	}

	createTotalRow(data) {
		return {
			id: 'footer-grid',
			client_code: 'Total: ' + data.rows,
			version: data.versions,
			total_quantity: data.quantity
		}
	}

	getList() {
		if (this.data.selectedRow.hasOwnProperty('kit_id')) {
			this.isFooter = false;
		} else {
			this.isFooter = true;
		}
		this.loader = true;
		this._commonService.getApi('getDistKittingProducts', {
			jobs_id: this.data.jobs_id,
			distro_id: this.data.selectedRow.distro_id,
			job_comp_id: this.data.selectedRow.job_comp_id || '',
			kitting_id: this.data.selectedRow.kit_id || ''
		})
			.then(res => {
				this.loader = false;
				if (res['result'].success) {
					this.listDetails = { ...res['result'].data };
					this.gridOptions.columnDefs = this.getGridHeaders();
					this.gridApi.setColumnDefs(this.gridOptions.columnDefs);
					if(this.isFooter) {
						this.gridOptions.suppressHorizontalScroll = true;
						this.footerGridApi.setColumnDefs(this.gridOptions.columnDefs);
						this.footerGridApi.setRowData([this.createTotalRow(this.data.selectedRow)])
					}else {
						this.gridOptions.suppressHorizontalScroll = false;
					}
					this.gridApi.sizeColumnsToFit();
					this.gridApi.setRowData(_.cloneDeep(this.listDetails.products));
					this.autoSizeAll();
				}
			})
	}

	autoSizeAll() {
		var allColumnIds = [];
		this.gridColumnApi.getAllColumns().forEach(function (column) {
			allColumnIds.push(column['colId']);
		});
		this.gridColumnApi.autoSizeColumns(allColumnIds);
	}

	getGridHeaders(): Array<ColDef> {
		const headers: Array<ColDef> = [];
		this.listDetails.headers.map(o => {
			const obj: ColDef = {
				headerName: o.headerName,
				minWidth: o.width,
				field: o.field,
				filter: 'agTextColumnFilter',
				cellClass: (o.field == 'total_quantity' || o.field == 'zip') ? 'right-text-cell' : '',
				headerClass: (o.field == 'total_quantity' || o.field == 'zip') ? 'right-header-cell' : '',
				valueGetter: params => {
					return typeof o.hasOwnProperty('data_type') && o.data_type == 'array' ? (params.data[params.colDef.field] ? params.data[params.colDef.field].value : '--') : params.data[params.colDef.field];
				},
				filterParams: {
					data_type: o.hasOwnProperty('data_type') ? o.data_type : ''
				}

			};
			if (o.field == 'total_quantity') {
				obj.aggFunc = this.columnSum;
			}
			if (o.field == 'version') {
				obj.cellRenderer = params => {
					if (params.data) {
						return params.value;
					} else {
						return `<b>${this.data.selectedRow.versions}</b>`;
					}
				}
			}
			if (o.field == 'client_code') {
				obj.cellRenderer = (params) => {
					if (params.data)
						return params.data.id ? params.value : `<div>
						<i class="pixel-icons icon-plus"></i><i class="pixel-icons icon-minus"></i>`+
							`<span>` + params.value + `</span>`;
					else return `<b>Total: ${this.gridApi.getModel().getRowCount() - 1}`;
				}
			}
			if (o.field == 'distribution_type') {
				obj.cellEditor = 'agSelectCellEditor';
				obj.cellEditorParams = (params) => {
					return {
						values: this.listDetails.distribution_types.map(o => o.name)
					}
				}
			}
			headers.push(obj);
		});
		headers.push({
			headerName: '', field: 'action', filter: false, maxWidth: 80, cellRenderer: (params) => {
				return params.data && params.data.id && params.data.id != 'footer-grid' ? '<div class="ag-cell-custome-actions"><ul><li style="min-width: 30px; min-height: 30px;"><i style="font-size: 16px; width: 16px; height: 16px;" class="pixel-icons icon-delete" /></li></ul></div>' : ''
			}, cellClass: 'action', editable: false, pinned: 'right'
		});

		return headers;
	}

	performAction(flag) {
		if (flag == 'export') {
			let url = APP.api_url + 'exportDistributions?' + buildParam({
				jobs_id: this.data.jobs_id,
				distro_id: this.data.selectedRow.distro_id,
				job_comp_id: this.data.selectedRow.job_comp_id,
				kitting_id: this.data.selectedRow.kit_id || '',
				token: APP.access_token
			});
			window.location.href = url + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		} else if (flag == 'import') {
			this._commonService.update({ type: 'importDistro', data: {}, row: this.data.selectedRow, parentRow: this.data.parentRow });
		}
	}

	queueRequest(params, duration) {
		const data = {
			jobs_id: this.data.jobs_id,
			distro_id: this.data.selectedRow.distro_id,
			kitting_id: this.data.selectedRow.kit_id || '',
			job_comp_id: this.data.selectedRow.job_comp_id || null
		}
		data['distributions'] = params;
		if (this.promise && duration) clearTimeout(this.promise);
		this.promise = setTimeout(() => {
			this._commonService.saveApi('saveDistKittingProducts', data)
				.then(res => {
					if(res['result'].success) {
						if(this.isFooter) {
							const totalRow: RowNode = this.footerGridApi.getRowNode('footer-grid');
							if(totalRow) {
								totalRow.data = this.createTotalRow(res['result'].data);
								this.footerGridApi.updateRowData({update: [totalRow.data]});
							}
						}
					}
					this.isChange = true;
					this.params = [];
				})
		}, duration);
	}

	deleteRow(data) {
		const locals = {
			title: 'Delete Distribution Product',
			action: 'delete',
			url: 'deleteDistProducts',
			tab: 'Distribution Product',
			params: {
				id: data.id
			},
			content: 'Are you sure, you want to delete this Distribution Product'
		}
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) this.gridApi.updateRowData({ remove: [data] });
			});
	}

}
