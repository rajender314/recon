import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';
import { ProductsServicesComponent, capabilityEquipmentComponent, PostBidsGridComponent, PostBidsIcons, HeaderSettings, serviceCheck, serviceHeaderCheck, OptionCell, BidScheduleSpecs, ALTOptionCell } from '@app/projects/post-bids-grid/post-bids-grid.component';
import { GridOptions, GridApi, ColDef, ColumnApi } from 'ag-grid-community';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { Subscription } from 'rxjs';

let APP = window['APP'];

@Component({
	selector: 'app-analyze-bids',
	templateUrl: './analyze-bids.component.html',
	styleUrls: ['./analyze-bids.component.scss'],
	host: {
		class: 'post-bids-container'
	}
})
export class AnalyzeBidsComponent implements OnInit, OnDestroy {

	state = {
		projectID: null,
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
			/* { label: 'Analyze Bids', type: 'text' }, */
		],
		loader: false,
		maxOptions: null,
		altOption: false,
		enableButton: false,
		expandAll: true
	}

	gridApi: GridApi;
	gridColApi: ColumnApi;
	gridHeaders: Array<ColDef> = [];
	griRowData: Array<any> = [];
	gridOptions: GridOptions = {
		rowHeight: 40,
		headerHeight: 38,
		columnDefs: [
			{
				headerName: 'icons', field: 'revision', cellClass: 'message-icon-grid', headerComponentFramework: HeaderSettings,
				cellRendererFramework: PostBidsIcons, pinned: 'left',  width: 140
			},
			// {
			// 	headerName: 'icons', field: 'selected', cellClass:'cell-icon-grid', headerClass:'icon-grid', pinned: 'left', cellRendererFramework: serviceCheck, headerComponentFramework: serviceHeaderCheck, width: 50,
			// 	headerComponentParams: {
			// 		selected: false
			// 	}
			// }
		],
		groupDefaultExpanded: -1,
		rememberGroupStateWhenNewData: true,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		suppressAggFuncInHeader: true,
		autoGroupColumnDef: {
			headerName: 'Products/Services - Vendors',
			field: 'name',
			headerClass: 'p-l-0',
			cellClass: 'p-l-0',
			pinned: 'left',
			width: 300,
			cellRenderer: 'agGroupCellRenderer',
			suppressSizeToFit: true,
			cellRendererParams: {
				innerRendererFramework: PostBidsGridComponent,
				suppressCount: true
			},
			// tooltipValueGetter: params => {
			// 	// if (!params.data) return params.node.allChildrenCount ? params.node.allLeafChildren[0].data.product_name : ''
			// 	// else return params.data.options.length ? params.value || '' : '';
			// }
		},
		icons: {
			groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
			groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
		},
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		localeText: { noRowsToShow: 'No Analyze bids found' },

		pagination: true,

		treeData: true,
		getDataPath: data => {
			return data.hireracy;
		},

		getRowClass: params => {
			return params.data ? params.data.type == 'empty' ? 'no-vendors' : '' : '';
		},

		getRowNodeId: params => {
			if(params.type == 'product')
			return params.products_id;
			else if(params.type == 'service')
			return params.jsr_id;
			else if(params.type == 'vendor' || params.type == 'empty')
			return params.id;
		},

		onGridReady: params => {
			this.gridApi = params.api;
			this.gridColApi = params.columnApi;
			this.getAnalyzeBids();
		},
		onCellValueChanged: params => {
			if (params.oldValue != params.newValue) {
				if (params.newValue.length) {
					params.data.hasBid = true;
					params.data.options[params.colDef.cellRendererParams.index].type = 'm';
				}
				else {
					params.data.hasBid = false;
					params.data.options[params.colDef.cellRendererParams.index].type = null;
				}
				if (params.data.hasBid) {
					const val = this.getFormat(params.value);
					params.data[params.colDef.field] = val;
					params.data.options[params.colDef.cellRendererParams.index].option = val;
				}

				this.saveBid(params);
			} else {
				params.value = params.oldValue;
				params.data[params.colDef.field] = params.oldValue;
			}
		},
		onFilterChanged: params => {
			if (params.api.getDisplayedRowCount() == 0) {
				this.gridApi.showNoRowsOverlay();
			}
			else this.gridApi.hideOverlay();
		}
	}
	subscription: Subscription;
	routerSubscription: Subscription;

	constructor(
		private _router: ActivatedRoute,
		private _commonService: CommonService
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.subscription = _commonService.onUpdate().subscribe(obj => {
			if (obj.type == 'projectName' && obj.data && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
			}else if (obj.hasOwnProperty('reloadBids')) {
				this.getAnalyzeBids();
			}
		})

		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			if(this.gridApi) this.getAnalyzeBids();
		});
	}

	ngOnInit() {

	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.routerSubscription.unsubscribe();
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	export() {
		const url = APP.api_url + 'exportAnalyzeBids?jobs_id=' + this.state.projectID + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		location.href = url;
	}

	onSearch(val) {
		this.gridApi.setQuickFilter(val);
	}

	getAnalyzeBids(): void {
		this.state.loader = true;
		this.gridApi.showLoadingOverlay();
		this._commonService.getApi('getAnalyzeBids', {
			jobs_id: this.state.projectID
		})
			.then(res => {
				this.gridApi.hideOverlay();
				if (res['result'] && res['result'].success) {
					if (Array.isArray(res['result'].data) ? res['result'].data.length : res['result'].data) {
						this.state.maxOptions = res['result'].data.max_options;
						this.state.altOption = res['result'].data.alt_opt;
						this.buildGrid(res['result'].data);
					} else {
						this.gridApi.showNoRowsOverlay();
					}
				}
				this.state.loader = false;
			});

	}

	buildGrid(data) {
		(<ColDef>this.gridOptions.columnDefs[0]).headerComponentParams = { ...(<ColDef>this.gridOptions.columnDefs[0]).headerComponentParams, ...{ maxOptions: data.max_options, altOption: data.alt_opt } };
		this.gridHeaders = [...this.gridOptions.columnDefs, ...this.createAltColumn(data.alt_opt), ...this.createColumns(data.max_options)];
		this.gridApi.setColumnDefs(this.gridHeaders);
		this.griRowData = this.treeData(data.products_new);
		// this.griRowData = this.flatJosn('product', data.products);
		this.gridApi.setRowData(this.griRowData);
	}

	getFormat(val) {
		let decimal = val.split('.');
		if (decimal.length == 1) return val + '.00';
		else return Number(val).toFixed(2);
	}

	sum(arr) {
		return arr.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
	}

	avg(arr) {
		return this.sum(arr) / arr.length ? (this.sum(arr) / arr.length).toFixed(2) : null;
	}

	createAltColumn(alt) {
		let columns: Array<ColDef> = [];
		if(alt) {
			columns.push({
				headerName: 'ALT Options',
				field: 'alt_option',
				cellRendererFramework: ALTOptionCell,
				editable: false
			});
			columns.push({
				headerName: 'ALT Option Plant',
				field: 'alt_plant',
				cellRenderer: params => {
					if(params.data.type == 'service') {
						return params.value ? params.value : '';
					}else if(params.data.type == 'vendor') {
						return params.data[params.colDef.field] || '--'
					}else {
						return '';
					}
				},
				editable: false,
				cellRendererParams: {
					type: 'plant'
				},
				hide: true
			});
			columns.push({
				headerName: 'Bid Submission Specs',
				field: 'alt_spec',
				cellClass: 'capabilities-grid',
				cellRendererFramework: BidScheduleSpecs,
				cellRendererParams: {
					type: 'spec'
				},
				hide: true
			});
		};
		return columns;
	}

	createColumns(max) {
		let columns: Array<ColDef> = [];
		for (let i = 1; i <= max; i++) {
			columns.push({
				headerName: 'Option ' + i + ' Bid',
				field: 'option' + i,
				cellEditorFramework: NumericCellEditorComponent,
				aggFunc: (params) => {
					params = params.filter((o) => o != 0 && o != '0.00' && o != '' && o != undefined);
					return this.avg(params) ? this.avg(params) : '';
				},
				cellRendererFramework: OptionCell,
				cellRendererParams: {
					index: i - 1,
					type: 'option',
					allowZero: false,
					decimalLimit: 2,
					limit: 10
				},
				cellClassRules: {
					'editable-bid-cell' : params => { return  (params.data.type == 'vendor' && params.data.form_status != 10 && params.colDef.cellRendererParams.index < params.data.options.length && (params.data.revision_no==params.node.parent.data.rev)); }
				},
				editable: (params) => {
					return  (params.data.type == 'vendor' && params.data.form_status != 10 && params.colDef.cellRendererParams.index < params.data.options.length && (params.data.revision_no==params.node.parent.data.rev));
				}
			});
			columns.push({
				headerName: 'Option ' + i + ' Plant',
				field: 'plant' + i,
				cellRenderer: params => {
					if(params.data.type == 'service') {
						return params.value ? params.value : '';
					}else if(params.data.type == 'vendor') {
						return params.data[params.colDef.field] || '--'
					}else {
						return '';
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
				cellClass: 'capabilities-grid',
				cellRendererFramework: BidScheduleSpecs,
				cellRendererParams: {
					index: i - 1,
					type: 'spec'
				},
				// autoHeight: true,
				hide: true
			});
		};
		return columns;
	}

	treeData(data): Array<any> {
		let rows = [];
		data.map(p => {
			rows.push({...p, ...{hireracy: [p.products_id], type: 'product',name: p.product_name}});
			p.services.map(s => {
				rows.push({...s, ...{hireracy: [p.products_id, s.jsr_id], type: 'service', name: s.service_name}});
				if(s.children.length){
					s.children.map(v => {
						let obj = {
							jsr_id: s.jsr_id,
							form_status: s.form_status,
							type: 'vendor'
						};
						v.alt_options.map((o, i) => {
							obj['alt_option'] = o.option;
							obj['alt_plant'] = o.plant;
							obj['alt_spec'] = o.specs;
							obj['alt_id'] = o.alt_id;
						});
						v.options.map((o, i) => {
							obj['option' + (parseInt(i) + 1)] = o.option;
							obj['plant' + (parseInt(i) + 1)] = o.plant;
							obj['spec' + (parseInt(i) + 1)] = o.spec;
							obj['bidId'] = o.bid_id;
						});
						rows.push({...v, ...obj, ...{hireracy: [p.products_id, s.jsr_id, v.id]}})
					})
				}else {
					const dummy = {
						id: 'no_vendors_' + s.jsr_id,
						type: 'empty',
						revision_no: s.rev || 0,
						name: 'No Vendors Selected',
						options: [],
						alt_options: []
					}
					rows.push({jsr_id: s.jsr_id, ...dummy, ...{hireracy: [p.products_id, s.jsr_id, 'no_vendors_' + s.jsr_id]}});
				}
			})
		})
		return rows;
	}

	flatJosn(key, data) {
		let arr = [];
		data.map(p => {
			if (p.children.length) {
				p.children.map(s => {
					let obj = {};
					s.type = 'service';
					s.options.map((o, i) => {
						obj['option' + (parseInt(i) + 1)] = o.option;
						obj['plant' + (parseInt(i) + 1)] = o.plant;
						obj['spec' + (parseInt(i) + 1)] = o.spec;
						obj['bidId'] = o.bid_id;
					})
					arr.push({
						[key]: p.jsr_id,
						product_name: p.name,
						revision: p.rev,
						jsr_id: p.jsr_id,
						...s,
						...obj
					})
				})
			} else {
				const dummy = {
					type: 'empty',
					revision_no: p.rev || 0,
					name: 'No Vendors Selected',
					options: []
				}
				arr.push({
					[key]: p.jsr_id,
					product_name: p.name,
					revision: p.rev,
					jsr_id: p.jsr_id,
					...dummy
				})
			}
		});
		return arr;
	}

	enableButton(flag) {
		this.state.enableButton = flag;
	}

	postBids() {
		this.gridApi.forEachNode(node => {
		})
	}

	saveBid(params: any): void {
		this._commonService.saveApi('saveVendorAnalyzeBids', {
			jsr_id: params.data.jsr_id,
			vendors_id: params.data.vendors_id,
			bid_id: params.data.options[params.colDef.cellRendererParams.index].bid_id, // params.data.id,
			bid_amount: params.value
		})
			.then(res => {
				if (res['result'] && res['result'].success) {
					// Do Nothing
				}
			});
	}

	shortView(){
		this.state.expandAll = !this.state.expandAll;
		this.gridApi.forEachNode((node) => {
			if(node.data.type=='product'){
				node.setExpanded(this.state.expandAll);
			}
		});
	}

}
