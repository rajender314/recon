import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GridOptions, ColDef, GridApi } from 'ag-grid-community';
import { PostBidsGridComponent, PostBidsIcons, HeaderSettings, serviceCheck, serviceHeaderCheck } from '@app/projects/post-bids-grid/post-bids-grid.component';
import { CommonService } from '@app/common/common.service';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-analyze-bids',
	templateUrl: './analyze-bids.component.html',
	styleUrls: ['./analyze-bids.component.scss']
})
export class AnalyzeBidsComponent implements OnInit {

	@ViewChild('topGrid') topGrid;
	@ViewChild('bottomGrid') bottomGrid;

	public analyzeBidFormsGroup: FormGroup;

	public state = {
		loader: true,
		vendorsDropdown: [
			{ id: 1, name: "Vendor 1" },
			{ id: 2, name: "Vendor 2" },
			{ id: 3, name: "Vendor 3" }
		],
		navs: [
			{ label: 'Schedule', value: false },
			{ label: 'Bids', value: true }
		],
		maxOptions: 4,
		valueChanged: false
	}

	public gridApi: any;

	public bottomGridApi: any;

	public columnDefs = [];

	public topOptions: GridOptions;

	public bottomOptions: GridOptions;

	pinnedRowData: Array<any> = [
		{ revision: 'Total', option1: '12' }
	];
	newGridApi: GridApi;
	gridOptions: GridOptions = {
		rowHeight: 40,
		columnDefs: [
			{ field: 'product', rowGroupIndex: 1, hide: true },
			{
				headerName: 'icons', field: 'revision', headerComponentFramework: HeaderSettings,
				headerComponentParams: {
					plants: false,
					specs: false
				}
			}
		],
		groupDefaultExpanded: 1,
		rememberGroupStateWhenNewData: true,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		autoGroupColumnDef: {
			headerName: 'Products/Services - Vendors',
			field: 'name',
			pinned: 'left',
			width: 200,
			cellRenderer: "agGroupCellRenderer",
			suppressSizeToFit: true,
			rowGroupIndex: 1
		},
		// pinnedBottomRowData: this.pinnedRowData,
		groupIncludeFooter: true,
		groupIncludeTotalFooter: true,
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		onGridReady: (params) => {
			params.api.sizeColumnsToFit();
			this.newGridApi = params.api;
			this.getAnalyzeBids();
		},
		onCellValueChanged: (params) => {
			if (params.oldValue != params.newValue) {
				this.saveBid(params);
			}
		}
	};
	gridHeaders: Array<ColDef> = [];
	griRowData: Array<any> = [];

	constructor(
		private dialogRef: MatDialogRef<AnalyzeBidsComponent>,
		@Inject(MAT_DIALOG_DATA) public data,
		private fb: FormBuilder,
		private commonService: CommonService,
		private route: ActivatedRoute
	) { }

	ngOnInit() {
		this.getVendorsList();
		this.analyzeBidForms();
	}

	getVendorsList(): void {
		this.commonService.getApi('getBidVendorsList', {
			jobs_id: this.data.job_id
		})
			.then(res => {
				if (res['result'] && res['result'].success) {
					this.state.vendorsDropdown = res['result'].data;
				}
			});
	}

	changeVendor(): void {
		this.getAnalyzeBids();
	}

	buildPostBidsGrid(): void {
		this.columnDefs = [
			{
				headerName: 'Products/Services - Vendors',
				field: 'name',
				/*suppressResize: true,*/
				pinned: 'left',
				width: 200,
				cellRenderer: "agGroupCellRenderer",
				aggFunc: "sum",
				enableValue: true
			},
			{
				headerName: 'icons',
				field: 'revision',
				pinned: 'left',
				headerComponentFramework: HeaderSettings,
				autoHeight: true,
				plants: false,
				specs: false,
				width: 140,
				aggFunc: "sum",
				enableValue: true
			}
		];

		for (var i = 1; i <= this.state.maxOptions; i++) {
			this.columnDefs.push({
				headerName: 'Option ' + i + ' Bid',
				field: 'option' + i,
				index: i - 1,
				cellEditorFramework: NumericCellEditorComponent,
				cellRenderer: (params) => {
					if (params.data.type != 'service' && params.data.type != 'sub') {
						return '';
					}
					return params.value ? params.value : '--'
				},
				type: 'option',
				editable: function (params) {
					return params.data.type == 'service';
				},
				aggFunc: "sum",
				enableValue: true
			});
			this.columnDefs.push({
				headerName: 'Option ' + i + ' Plant',
				field: 'plant' + i,
				type: 'plant',
				hide: true
			});
			this.columnDefs.push({
				headerName: 'Option ' + i + ' Bid Submission Specs',
				field: 'spec' + i,
				type: 'spec',
				hide: true
			});
		}

		this.topOptions = {
			columnDefs: this.columnDefs,
			suppressDragLeaveHidesColumns: true,
			animateRows: true,
			groupSelectsChildren: true,
			rowSelection: 'multiple',
			icons: {
				groupExpanded: false,
				groupContracted: false
			},
			alignedGrids: [],

			defaultColDef: {
				resizable: true
			},

			onGridReady: (params) => {
				this.gridApi = params.api;
			},
			// autoGroupColumnDef:{
			//   headerName: "Name",
			//   field: "name",
			//   width: 200,
			//   cellRenderer: "agGroupCellRenderer",
			//   cellRendererParams: { footerValueGetter: '"Total123"' }
			// },
			groupIncludeFooter: true,
			getRowHeight: (params) => {
				if (params.data.type && params.data.type == 'avg') {
					if (params.data.show) {
						return 38;
					} else {
						return 0;
					}
				} else {
					return 38;
				}
			},
			onCellValueChanged: (params) => {
				if (params.oldValue != params.newValue) {
					this.saveBid(params);
				}
			},
			rowData: [
				{
					id: 1, name: "Creative with Printing", rev: 0, type: "product", children: [
						{ id: 3, name: "3 Angels Printing", option1: "$451.00", revision: 'R0', type: "service", hasBid: true, selected: false, plant1: "--", spec1: "--" },
						{ id: 4, name: "360IT Services", option1: "", revision: 'R0', type: "service", hasBid: false, selected: false, plant1: "--", spec1: "--" },
						{ id: 5, name: "Test Vendor", option1: "$451.00", revision: 'R0', type: "service", hasBid: true, selected: false, plant1: "--", spec1: "--" },
						{ id: 8, name: "", option1: "$902.00", revision: 'Sub Total', type: "sub", hasBid: false, selected: false, plant: "--", spec: "--" }
					]
				},
				{
					id: 6, name: "Creative without Printing", rev: 0, type: "product", children: [
						{ id: 16, name: "", option1: "--", revision: 'Sub Total', type: "sub", hasBid: false, selected: false, plant: "--", spec: "--" }
					]
				},
				{
					id: 11, name: "Freight Ivie", rev: 0, type: "product", children: [
						{ id: 13, name: "3 Angels Printing", option1: "", revision: 'R0', type: "service", hasBid: false, selected: false, plant1: "--", spec1: "--" },
						{ id: 14, name: "360IT Services", option1: "", revision: 'R0', type: "service", hasBid: false, selected: false, plant1: "--", spec1: "--" },
						{ id: 15, name: "Test Vendor", option1: "", revision: 'R0', type: "service", hasBid: false, selected: false, plant1: "--", spec1: "--" },
						{ id: 16, name: "", option1: "", revision: 'Sub Total', type: "sub", hasBid: false, selected: false }
					]
				}
			],
			getNodeChildDetails: this.getNodeChildDetails
		};

		this.bottomOptions = {
			columnDefs: this.columnDefs,
			suppressDragLeaveHidesColumns: true,
			animateRows: true,
			alignedGrids: [],
			defaultColDef: {
				resizable: true
			},
			onGridReady: (params) => {
				this.bottomGridApi = params.api;
			},
			getRowHeight: () => {
				return 38;
			},
			rowData: [
				{ id: 16, name: "", option1: "--", revision: 'Total', type: "sub", hasBid: false, selected: false, plant: "--", spec: "--" }
			]
		};
	}

	buildGrid(data) {
		(<ColDef>this.gridOptions.columnDefs[1]).headerComponentParams = { ...(<ColDef>this.gridOptions.columnDefs[1]).headerComponentParams, ...{ maxOptions: data.max_options } };
		this.gridHeaders = [...this.gridOptions.columnDefs, ...this.createColumns(data.max_options)];
		this.newGridApi.setColumnDefs(this.gridHeaders);
		this.griRowData = this.flatJosn('product', data.products);
		this.newGridApi.setRowData(this.griRowData);
	}

	createColumns(max) {
		let columns: Array<ColDef> = [];
		for (let i = 1; i <= max; i++) {
			columns.push({
				headerName: 'Option ' + i + ' Bid',
				field: 'option' + i,
				cellEditorFramework: NumericCellEditorComponent,
				aggFunc: (params) => {
					return params.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) ? params.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) : '';
				},
				cellRenderer: (params) => {
					if (params.hasOwnProperty('data')) {
						if (params.data.type != 'service' && params.data.type != 'sub') {
							return '';
						} else {
							return params.data[params.colDef.field] || '--'
						}
					} else {
						return params.value ? params.value : '';
					}
				},
				cellRendererParams: {
					type: 'option',
					index: i - 1
				},
				editable: (params) => {
					return params.hasOwnProperty('data') ? params.data.type == 'service' && params.colDef.cellRendererParams.index < params.data.options.length : false;
				}
			});
			columns.push({
				headerName: 'Option ' + i + ' Plant',
				field: 'plant' + i,
				/*aggFunc: (params) => {
					return params.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
				},*/
				cellRenderer: params => {
					if (params.hasOwnProperty('data')) {
						if (params.data.type != 'service' && params.data.type != 'sub') {
							return '';
						} else {
							return params.data[params.colDef.field] || '--'
						}
					} else {
						return params.value ? params.value : '';
					}
				},
				editable: false,
				cellRendererParams: {
					type: 'plant'
				},
				hide: true
			});
			columns.push({
				headerName: 'Option ' + i + ' Bid Submission Specs',
				field: 'spec' + i,
				cellRendererParams: {
					type: 'spec'
				},
				hide: true
			});
		};
		return columns;
	}

	flatJosn(key, data) {
		let arr = [];
		data.map(p => {
			p.children.map(s => {
				let obj = {};
				if (s.type) {
					if (s.type == 'sub') {
						s.options.map((o, i) => {
							obj['option' + (parseInt(i) + 1)] = o;
						})
					} else if (s.type == 'service') {
						s.options.map((o, i) => {
							obj['option' + (parseInt(i) + 1)] = o.bid_amount;
							obj['plant' + (parseInt(i) + 1)] = o.plant;
							obj['spec' + (parseInt(i) + 1)] = o.spec;
							obj['bidId'] = o.bid_id;
						})
					}
				}
				arr.push({
					[key]: p.name,
					...s,
					...obj
				})
			})
		});
		return arr;
	}

	saveBid(params: any): void {
		this.state.valueChanged = true;
		this.commonService.saveApi('saveVendorAnalyzeBids', {
			jsr_id: params.data.jsr_id,
			vendors_id: this.analyzeBidFormsGroup.controls['selectedVendor'].value,
			bid_id: params.data.bidId,
			bid_amount: params.value
		})
			.then(res => {
				if (res['result'] && res['result'].success) {
					// this.getAnalyzeBids();
				}
			});
	}

	closeAnalyzeBids(): void {
		this.dialogRef.close({ success: true, valueChanged: this.state.valueChanged });
	}

	getAnalyzeBids(): void {
		// this.state.loader = true;
		this.commonService.getApi('vendorAnalyzeBids', {
			jobs_id: this.data.job_id,
			vendors_id: this.analyzeBidFormsGroup.controls['selectedVendor'].value
		})
			.then(res => {
				if (res['result'] && res['result'].success) {
					if (res['result'] && res['result'].success) {
						this.state.maxOptions = res['result'].data.max_options;
						// this.buildPostBidsGrid();
						this.buildGrid(res['result'].data);
						// this.topOptions.rowData = res['result'].data.products;
						/*_.map(res['result'].data.products, (product) => {
							_.map(product.children, (vendor) => {
								vendor['show'] = false;
								// vendor['type'] = 'service';
								if (vendor.type && vendor.type == 'sub') {
									_.map(vendor.options, (opt, index) => {
										vendor['option' + (parseInt(index) + 1)] = opt;
									});
								} else {
									_.map(vendor.options, (opt, index) => {
										vendor['option' + (parseInt(index) + 1)] = opt.bid_amount;
										vendor['plant' + (parseInt(index) + 1)] = opt.plant;
										vendor['spec' + (parseInt(index) + 1)] = opt.spec;
									});
								}
							});
							// if(product.sub_total && product.sub_total.length){
							//   _.map(product.sub_total, (vendor) => {
							//     _.map(vendor.options, (opt, index) => {
							//       vendor['option'+(parseInt(index)+1)] = opt;
							//     });
							//   });
							// }
							//sub_total
						});*/
						// this.topOptions.rowData = res['result'].data.products;
						// this.topOptions.alignedGrids.push(this.bottomOptions);
						// this.bottomOptions.alignedGrids.push(this.topOptions);
						this.state.loader = false;
					}
				}
			});
	}

	analyzeBidForms(): void {
		this.analyzeBidFormsGroup = this.fb.group({
			selectedVendor: this.data.vendors_id,
			nav_tab: ''
		});
	}

	getNodeChildDetails(rowItem) {
		if (rowItem.children) {
			return {
				group: true,
				children: rowItem.children,
				expanded: true,
				empty: (rowItem.children && rowItem.children.length) ? false : true,
				key: rowItem.label
			};
		} else {
			return null;
		}
	};

}
