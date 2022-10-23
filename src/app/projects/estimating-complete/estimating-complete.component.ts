import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatHorizontalStepper } from '@angular/material';
import { AddReciepientsComponent } from '@app/dialogs/add-reciepients/add-reciepients.component';
import { GridApi, ColumnApi, GridOptions, RowNode, Column } from 'ag-grid-community';
import { AgNoteCell } from '../project-details/tasks/add-from-template/add-form-template.ag-grid';
import { CommonService } from '@app/common/common.service';
import { AgPiSelectRenderer, AgOwlDatePickerRenderer, AgProdServRenderer } from '@app/shared/components/ag-grid/custom-cell-renderer';

@Component({
	selector: 'app-estimating-complete',
	templateUrl: './estimating-complete.component.html',
	styleUrls: ['./estimating-complete.component.scss']
})
export class EstimatingCompleteComponent implements OnInit {
	@ViewChild('stepper') stepper: MatHorizontalStepper;

	ajaxSpinner: boolean = false;
	gridSpinner: boolean = false;
	selectedIndex: Number = 0;
	showGrid: boolean = false;

	users: Array<any> = [];
	tasksList: Array<any> = [];
	productsList: Array<any> = [];
	estimateTasks: Array<any> = [];
	defaultParams: any;
	prebillDetails = {
		is_prebill: false,
		is_task_prebill: false
	}

	successData: any = { success: false, data: null };

	columns: Array<string> = ['task_id', 'assignee_id', 'start_date', 'due_date'];

	gridApi: GridApi;
	gridColumnApi: ColumnApi;
	gridData: Array<any> = [];
	gridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight: 38,
		columnDefs: [],
		rowData: [],

		getRowNodeId: data => {
			return data.id
		},

		onGridReady: params => {
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
			if (this.data.flag == 'Approve') {
				this.gridApi.setColumnDefs(this.getGridColumns());
				this.gridApi.setRowData([this.defaultParams]);
			}
		},

		onCellClicked: params => {
			if (params.column && params.column['colId'] == 'delete') {
				if (params.api.getDisplayedRowCount() > 1) {
					params.api.updateRowData({ remove: [params.data] });
					(<GridApi>params.api).redrawRows();
				}
			}
		}
	}

	promise: any = undefined;

	constructor(
		private _commonService: CommonService,
		public _dialogRef: MatDialogRef<AddReciepientsComponent>,
		@Inject(MAT_DIALOG_DATA) public data,
	) { }

	ngOnInit() {
		this.getUsers();
		this.getTasksList();
		this.getProductServices();
	}

	getTasksList() {
		this._commonService.getApi('getTasks', { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1, post_estimate_tasks: true })
			.then(res => {
				if (res['result'].success) {
					this.tasksList = res['result'].data.items || [];
				}
			})
	}

	getUsers() {
		this._commonService.getApi('getDropdownMaster', { org_type: 2, org_id: this.data.org_id, master_type: 5 })
			.then(res => {
				this.users = res['result'].data.users || [];
			})
	}

	getProductServices() {
		this._commonService.getApi('getVendorProdServices', {
			jobs_id: this.data.jobs_id,
			type: 'task'
		})
			.then(res => {
				if (res['result'].success) {
					this.productsList = res['result'].data || [];
				}
			})
	}

	stepperChange(ev) {
		this.selectedIndex = ev.selectedIndex;
	}

	postCosts() {
		this.ajaxSpinner = true;
		this._commonService.saveApi(this.data.url, this.data.params)
			.then(res => {
				if (res['result'].success) {
					let enter: boolean = true;
					this.ajaxSpinner = false;
					if (this.data.flag == 'Post') this._commonService.update({ type: 'estimate-posted', data: null });
					else if (this.data.flag == 'Approve') {
						if (!res['result'].data.status) {
							enter = false;
							this._dialogRef.close({ succes: false, data: res['result'].data });
						} else {
							enter = true;
							this._commonService.update({ type: 'estimate-approved', data: res['result'].data });
						}
					}
					if (enter) {
						this.stepper.next();
						this.successData.success = true;
						this.getPostEstimateTasks();
					}
				}
			})
	}

	getGridColumns() {
		return [
			{
				headerName: 'Tasks/Milestones', field: 'task_id', minWidth: 200, width: 200, cellClass: 'custome-ag-select-w-search', maxWidth: 200, cellRendererFramework: AgPiSelectRenderer, cellRendererParams: {
					options: this.tasksList,
					displayName: 'task_name',
					label: 'Task/Milestone',
					isRequired: true,
					submitted: false
				}
			},
			{
				headerName: 'Products', field: 'products', cellClass: '', cellRendererFramework: AgProdServRenderer, cellRendererParams: {
					jobs_id: this.data.jobs_id,
					options: this.productsList,
					selected: 'associate_products',
					edit: true
				}
			},
			{
				headerName: 'Assigned to', field: 'assignee_id', minWidth: 300, cellClass: 'custome-ag-select-w-search', width: 300, maxWidth: 300, cellRendererFramework: AgPiSelectRenderer, cellRendererParams: {
					options: this.users,
					displayName: 'assignee_name',
					nameKey: 'label',
					label: 'Assignee',
					checkAvailablility: true,
					isRequired: true,
					submitted: false
				}
			},
			{
				headerName: 'Activation Date', cellClass: 'lh-50 e-date', field: 'start_date', cellRendererFramework: AgOwlDatePickerRenderer, minWidth: 220, width: 220, maxWidth: 230, cellRendererParams: {
					field: 'start_date',
					label: 'Start Date',
					submitted: false,
					isVisible: true, // false
					condition: { task_type: 1 }
				}
			},
			{
				headerName: 'Due Date', field: 'due_date', cellClass: 'lh-50 e-date', cellRendererFramework: AgOwlDatePickerRenderer, minWidth: 220, width: 220, maxWidth: 230, cellRendererParams: {
					field: 'due_date',
					label: 'End Date',
					submitted: false,
					isVisible: true
				}
			},
			{ headerName: 'Notes', field: 'note', cellClass: ' lh-50 ag-customize-note-cell', cellRendererFramework: AgNoteCell, minWidth: 100, width: 100, maxWidth: 100 },
			{
				headerName: '', field: 'delete', cellClass: ' lh-50', minWidth: 80, width: 80, maxWidth: 80, cellRenderer: params => {
					return (<GridApi>params.api).getDisplayedRowCount() > 1 ? '<div class="ag-cell-custome-actions"><ul style="padding-top: 4px;"><li style="min-width: 30px; min-height: 30px;"><i style="font-size: 16px; width: 16px; height: 16px;" class="pixel-icons icon-delete" /></li></ul></div>' : '';
				}
			}
		];
	}

	getPostEstimateTasks() {
		this.gridSpinner = true;
		if (this.data.flag == 'Post') this.gridApi.setColumnDefs(this.getGridColumns());
		this._commonService.getApi('getEstTask', { est_id: this.data.estimates_id, type: this.data.flag.toLowerCase() })
			.then(res => {
				this.gridSpinner = false;
				if (res['result'].success) {
					if (this.data.flag == 'Post') {
						this.defaultParams = res['result'].data;
						this.gridData = [res['result'].data];
						this.gridApi.setRowData(this.gridData);
					} else if (this.data.flag == 'Approve') {
						this.prebillDetails = {
							is_prebill: res['result'].data.is_prebill,
							is_task_prebill: res['result'].data.is_task_prebill
						}
						this.defaultParams = res['result'].data.prebill;
						this.estimateTasks = res['result'].data.not_complete_task;
						if (res['result'].data.is_task_prebill && res['result'].data.is_threshold && !this.estimateTasks.length) this._dialogRef.close(this.successData)
					}

				}
			})
	}

	statusChange(trans, task) {
		task.isLoading = true;
		this._commonService.saveApi('taskFlow', { id: task.id, status_id: trans.id, key: trans.key, jobs_id: this.data.jobs_id, task_id: task.task_id, task_type_id: task.task_type_id })
			.then(res => {
				task.isLoading = false;
				if (res['result'].success) {
					if (res['result'].data.status) {
						task.status = res['result'].data.status_id;
						task.status_name = res['result'].data.status_name;
						task.status_ids = res['result'].data.status_ids;
						task.status_dropdown = res['result'].data.status_dropdown;
					}
				}
			})
			.catch(err => {
				task.isLoading = false;
			})
	}

	dummyTask() {
		return {
			isNew: true,
			id: 'new_' + Math.random().toString().substr(5),
			assignee_id: '',
			assignee_type: '',
			assignee_name: '',
			associate_products: [],
			due_date: null,
			is_milestone: false,
			jobs_id: this.data.jobs_id,
			note: '',
			products: {},
			slug: '',
			start_date: null,
			task_id: '',
			task_name: '',
			task_type_id: this.defaultParams.task_type_id,
			task_type_name: this.defaultParams.task_type_name,
			billing_type_id: this.defaultParams.billing_type_id,
			status_ids: this.defaultParams.status_ids
		}
	}

	addTask() {
		this.gridApi.updateRowData({ add: [this.dummyTask()] });
		this.gridApi.redrawRows();
	}

	addPrebill() {
		this.showGrid = true;
	}

	saveDetails() {
		if (!this.promise && this.gridApi) {
			let params = [], isValid = true;
			this.gridApi.forEachNode((o: RowNode) => {
				let row = {
					id: o.data.isNew ? '' : o.data.id,
					assignee_id: o.data.assignee_id,
					assignee_type: 1,
					assignee_name: o.data.assignee_name,
					associate_products: o.data.associate_products || [],
					due_date: o.data.due_date || null,
					is_milestone: false,
					jobs_id: this.data.jobs_id,
					note: o.data.note || '',
					products: o.data.products || {},
					slug: '',
					start_date: o.data.start_date || null,
					task_id: o.data.task_id,
					task_name: o.data.task_name,
					task_type_id: this.defaultParams.task_type_id,
					task_type_name: this.defaultParams.task_type_name,
					billing_type_id: this.defaultParams.billing_type_id,
					status_ids: this.defaultParams.status_ids
				}
				if (!o.data.task_id || !o.data.assignee_id || !o.data.due_date) isValid = false;
				params.push(row);
			})

			if (!params.length) isValid = false;

			this._commonService.update({ type: 'ag-grid-validation', data: !isValid });

			this.gridColumnApi.getAllColumns().map((o: Column) => {
				if (this.columns.indexOf(o.getColId()) > -1) {
					const params = o.getColDef();
					params.cellRendererParams.submitted = !isValid;
					o.setColDef(params, {})
				}
			})

			if (isValid) {
				this._commonService.update({ type: 'ag-grid-validation', data: !isValid });
				this.promise = this._commonService.saveApi('saveTemplatesTasks', { taskTemp: params, from: 'estimate' })
					.then(res => {
						this.promise = undefined;
						if (res['result'].success) {
							this._dialogRef.close({ succes: true, data: res['result'].data });
						}
					})
					.catch(err => {
						this.promise = undefined;
					})
			}
		} else {
			if (!this.gridApi) this._dialogRef.close({ succes: true, data: null });
		}
	}

	closeDialog(){
		this._dialogRef.close();
	}

}
