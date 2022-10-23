import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { GridApi, GridOptions } from 'ag-grid-community';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
	selector: 'app-edit-invoice',
	templateUrl: './edit-invoice.component.html',
	styleUrls: ['./edit-invoice.component.scss']
})
export class EditInvoiceComponent implements OnInit {

	hasChange: boolean = false;
	rowData: Array<any> = [];

	gridApi: GridApi;
	gridOptions: GridOptions = {
		rowHeight: 40,
		headerHeight: 34,
		columnDefs: [
			{ field: 'invoice', rowGroupIndex: 1, hide: true },
			{ headerName: 'Net', width:150, cellClass:"right-text-cell", headerClass:"right-header-cell", field: 'net_amount' },
			{
				headerName: 'Gross', field: 'gross_amount', width:150, cellClass:"right-text-cell", headerClass:"right-header-cell", editable: true, cellEditorFramework: NumericCellEditorComponent, cellStyle: params => {
					return params.hasOwnProperty('data') && params.data ? { backgroundColor: '#fffbef' } : {}
				},
				cellRenderer: params => {
					return params.data ? (params.value ? '$' + params.value : '--') : '';
				}
			}
		],
		groupDefaultExpanded: 1,
		rememberGroupStateWhenNewData: true,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		autoGroupColumnDef: {
			headerName: 'Products/Services',
			field: 'name',
			rowGroupIndex: 1,
			cellRenderer: 'agGroupCellRenderer',
			cellRendererParams: {
				suppressCount: true,
				innerRenderer: params => {
					let value = '';
					if (params.hasOwnProperty('data')) {
						value = params.value;
					} else {
						if (params.node.allChildrenCount) {
							const data = params.node.allLeafChildren[0].data;
							value = data.product_name;
						}
					}
					return value;
				}
			},
			tooltipValueGetter: params => {
				if (!params.data) return params.node.allChildrenCount ? params.node.allLeafChildren[0].data.product_name : ''
				else return params.value || '';
			}
		},
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		onGridReady: params => {
			this.gridApi = params.api;
			if (this.data.row)
				this.getServices(this.data.row.est_id);
		},
		onCellValueChanged: params => {
			if (params.oldValue != params.newValue) {
				this.saveInvoice(params);
			}
		}
	}

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<EditInvoiceComponent>,
		private _snackbar: MatSnackBar,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
	}

	getServices(id) {
		this._commonService.getApi('getInvoiceServices', { id: id })
			.then(res => {
				if (res['result'].success) {
					this.rowData = this.flatJson('invoice', res['result'].data);
					this.gridApi.setRowData(this.rowData);
				}
			})
	}

	flatJson(key, data): Array<any> {
		let arr = [];
		data.map((p, i) => {
			if (p.services.length) {
				p.services.map(s => {
					arr.push({
						[key]: 'product_' + i,
						product_name: p.name,
						index: i,
						...s
					})
				})
			} else {
				// Dummy JSON
			}
		})
		return arr;
	}

	closeDialog() {
		this._dialogRef.close({ is_change: this.hasChange });
	}

	saveInvoice(params) {
		this._commonService.update({ type: 'overlay', action: 'start' });
		this._commonService.saveApi('saveInvoiceFinalized', {
			jsr_id: params.data.jsr_id,
			invoice_amount: params.value,
			estimate_id: this.data.row ? this.data.row.est_id : null
		})
			.then(res => {
				this._commonService.update({ type: 'overlay', action: 'stop' });
				if (res['result'].success) {
					this.hasChange = true;
					this.snackbarModal('success');
				}
			}).catch(err =>{
				this._commonService.update({ type: 'overlay', action: 'stop' });
			})
	}

	snackbarModal(status = 'success') {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: status, msg: 'Invoice Cost Updated Successfully' },
			verticalPosition: 'top',
			horizontalPosition: 'right',
			panelClass: status
		});
	}

}
