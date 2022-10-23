import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactsService } from '@app/contacts/contacts.service';

import { MatSnackBar, MatChipInputEvent } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import { forkJoin } from 'rxjs';
import * as _ from 'lodash';
import { checkedLength } from '@app/admin/admin.config';
import { GridOptions, GridApi } from 'ag-grid-community';
var APP = window['APP'];
export interface Fruit {
	name: string;
}
@Component({
	selector: 'app-general',
	templateUrl: './general.component.html',
	styleUrls: ['./general.component.scss'],
	// encapsulation: ViewEncapsulation.ShadowDom
})
export class GeneralComponent implements OnInit {
	APP = APP;
	public generalForm: FormGroup;
	@Input() organization;
	client_option: string = 'all';

	visible = true;
	selectable = true;
	removable = true;
	addOnBlur = true;
	separatorKeysCodes: number[] = [186];

	add(event: MatChipInputEvent, name: any): void {
		const input = event.input;
		const value = event.value;
		if ((value || '').trim()) {
		    let selectedVendor = this.generalForm.controls[name].value.filter((vendor)=>{
				return (vendor==value.trim());
			});
			if(!selectedVendor.length){
				this.generalForm.controls[name].value.push(value.trim());
			}
		}
		this.state.errorMessage = '';
		this.generalForm.markAsDirty();
		this.state.editable = true;
		if (input) {
			input.value = '';
		}
	}

	remove(fruit: Fruit, name: any): void {
		const index = this.generalForm.controls[name].value.indexOf(fruit);
		this.state.errorMessage = '';
		this.generalForm.markAsDirty();
		this.state.editable = true;
		if (index >= 0) {
			this.generalForm.controls[name].value.splice(index, 1);
		}
	}

	counter: number = 0;
	public state = {
		isReset: false,
		organization: {},
		attributes: [],
		vendorTyeps: {},
		section: [],
		errorMessage: '',
		modelValues: {
			departments_ids: [],
			equip_catg_ids: {
				selected: {},
				defaults: {},
				selected_ids: []
			},
			capabilities_ids: {
				selected: {},
				defaults: {},
				selected_ids: []
			}
		},
		cloneValues: {
			equip_catg_ids: {
				selected: {},
				defaults: {},
				selected_ids: []
			},
			capabilities_ids: {
				selected: {},
				defaults: {},
				selected_ids: []
			}
		},
		loader: true,
		showFooter: false,
		editable: false,
		dropdowns: {
			departments: [],
			equipments: [],
			capabilities: [],
			vendorTypes: []
		}
	};

	public gridApi: GridApi;
	public clientOrgs: Array<any>;
	public cloneOrgs: Array<any>;
	public gridSearch: string = '';
	public gridOptions: GridOptions = {
		headerHeight: 0,
		columnDefs: [
			{
				headerName: '',
				field: 'name',
				width: 100,
				cellRenderer: "agGroupCellRenderer",
				cellRendererParams: {
					checkbox: (p)=>this.state.editable
				},
				headerCheckboxSelection: false
			}
		],
		animateRows: false,
		groupSelectsChildren: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		rowHeight: 38,
		rowData: [],
		getNodeChildDetails: this.getNodeChildDetails,

		/*treeData: true,
		getDataPath: params => {
			return params.hierarcy;
		},*/

		defaultColDef: {
			resizable: true,
			filter: true
		},

		/*autoGroupColumnDef: {
			field: 'name',
			cellRenderer: "agGroupCellRenderer",
				cellRendererParams: {
					checkbox: true
				},
				headerCheckboxSelection: false
		},*/

		onGridReady: (params) => {
			this.gridApi = params.api;
			params.api.sizeColumnsToFit();
			this.defaultCheck();
		},
		onSelectionChanged: (ev) => {
			if (!this.state.isReset)
				this.state.showFooter = true;
		}
	};

	constructor(
		private fb: FormBuilder,
		private contactsService: ContactsService,
		private snackbar: MatSnackBar
	) { }

	getApiCalls(cb?) {
		forkJoin(
			this.contactsService.getApi('getDepartments', { status: true, org_type: 1 }),
			this.contactsService.getApi('equipmentCategory', { status: true }),
			this.contactsService.getApi('capabilities', { status: true }),
			this.contactsService.getApi('VendorTypes', { status: true })
		)
			.subscribe(data => {
				if (data[0].result.success) this.state.dropdowns['departments'] = data[0].result.data.departments;
				else this.state.dropdowns['departments'] = [];
				if (data[1].result.success) this.state.dropdowns['equipments'] = data[1].result.data.items;
				else this.state.dropdowns['equipments'] = [];
				if (data[2].result.success) this.state.dropdowns['capabilities'] = data[2].result.data.items;
				else this.state.dropdowns['capabilities'] = [];
				this.state.dropdowns['copyDepartments'] = [...this.state.dropdowns['departments']];
				if (data[3].result.success) this.state.dropdowns['vendorTypes'] = data[3].result.data.vendor_types;
				else this.state.dropdowns['vendorTypes'] = [];
				if (cb) cb();
			})
	}

	ngOnChanges() {
		if (this.organization) {
			this.state.organization = Object.assign([], this.organization);
			if (this.counter == 0) {
				this.counter++;
				this.getApiCalls(() => {
					this.getGeneralData();
				})
			} else {
				this.getGeneralData();
			}
			if (this.state.organization['org_type'] == 2) {
				this.state.editable = APP.permissions.system_access.client == 'edit';
			} else if (this.state.organization['org_type'] == 3) {
				// IF current route is a vendor
				this.state.editable = APP.permissions.system_access.vendor == 'edit';
			}
		}
	}

	ngOnInit() {
		this.getOrgs();
	}

	getOrgs() {
		this.contactsService.getApi('getOrgs', { status: true, org_type: 2 })
			.then(res => {
				if (res.result.success) {
					this.clientOrgs = res.result.data;
					this.cloneOrgs = _.cloneDeep([...this.clientOrgs]);
					/* Tree Data */
					let rows = [];
					/*this.clientOrgs.map(o => {
						o.hierarcy = [o.id];
						rows.push(o);
						if(o.hasOwnProperty('children') && o.children.length) rows = [...rows, ...this.frameTreeData(o.children, o.hierarcy)];
					})*/
					this.gridOptions.rowData = [...this.clientOrgs];
				}
			})
	}

	frameTreeData(child, hierarcy): Array<any> {
		let rows = [];
		child.map(o => {
			o.hierarcy = [...hierarcy, o.id];
			rows.push(o);
			if (o.hasOwnProperty('children') && o.children.length) rows = [...rows, ...this.frameTreeData(o.children, o.hierarcy)];
		});
		return rows;
	}

	getNodeChildDetails(rowItem) {
		if (rowItem) {
			if (rowItem.children) {
				return {
					group: true,
					children: rowItem.children,
					expanded: true,
					key: rowItem.name
				};
			} else {
				return null;
			}
		} else {
			return null;
		}
	};

	selectedOrgs() {
		this.gridApi.getSelectedNodes().map(o => {
			if (o.data.parent_id != 0) {
				if (o.parent.data.parent_id == 0) {
					if (this.selectedParent.indexOf(o.parent.data.id) == -1) {
						this.selectedParent.push(o.parent.data.id);
						const cloneDeep = _.cloneDeep(o.parent.data);
						cloneDeep.children = [o.data];
						this.framedJson.push(cloneDeep);
					} else {
						const row = _.find(this.framedJson, ['id', o.parent.data.id]);
						if (row)
							row.children.push(o.data);
					}
				} else {
					if (this.selectedChild.indexOf(o.parent.data.id) == -1) {
						this.selectedChild.push(o.parent.data.id);
						const cloneDeep = _.cloneDeep(o.parent.data);
						cloneDeep.children = [o.data];
						const parent = _.cloneDeep(_.find(this.cloneOrgs, ['id', o.parent.data.parent_id]));
						if (parent) {
							if (this.selectedParent.indexOf(o.parent.data.parent_id) == -1) {
								this.selectedParent.push(o.parent.data.parent_id);
								parent.children = [cloneDeep];
								this.framedJson.push(parent);
							} else {
								const global = _.find(this.framedJson, ['id', o.parent.data.parent_id]);
								if (global) global.children.push(cloneDeep);
							}
						}
					} else {
						const parent = _.find(this.framedJson, ['id', o.parent.data.parent_id]);
						if (parent) {
							const child = _.find(parent.children, ['id', o.parent.data.id]);
							if (child) child.children.push(o.data);
						}
					}

				}
			} else {
				this.framedJson.push(o.data);
			}
		});
	}

	framedJson = [];
	selectedChild = [];
	selectedParent = [];

	resetSelection() {
		this.framedJson = [];
		this.selectedChild = [];
		this.selectedParent = [];
	}

	filterGrid(flag) {
		const selected_ids = this.gridApi.getSelectedRows().map(o => o.id);
		this.client_option = flag;
		this.resetSelection();
		if (flag == 'selected') {
			this.selectedOrgs();
			// const data = this.gridApi.getSelectedNodes().map(o => {
			// 	if (o.parent) return this.frameParent(o.parent.data, o.data); //o.parent.data;
			// 	else return o.data;
			// });
			// this.gridApi.setRowData(data);
			this.gridApi.setRowData(this.framedJson);
			this.defaultCheck(selected_ids);
		} else if (flag == 'all') {
			this.gridApi.setRowData(this.clientOrgs);
			this.defaultCheck(selected_ids);
		} else {
			this.gridSearch = flag;
			// this.gridApi.onFilterChanged();
			this.gridApi.setQuickFilter(flag);
		}
	}

	defaultCheck(selectedIds?) {
		let ids = selectedIds ? selectedIds : this.state.modelValues['client_ids'];
		setTimeout(() => {
			this.gridApi.forEachNodeAfterFilter((node) => {
				if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
					node.setSelected(true);
				} else {
					node.setSelected(false);
				}
			});
		}, 100);
	}

	editSection(section): void {
		section.edit = true;
	}

	cancelChanges(section): void {
		this.resetForm();
		section.edit = false;
	}

	checkAlphaNumeric(e) {
		let formVal = this.generalForm.controls[e].value;
		this.generalForm.controls[e].patchValue(formVal.replace(/\W*/g, '').replace(/_*/g, ''));
	}

	save(form, type?): void {
		if (this.state.editable) {
			this.state.modelValues.capabilities_ids.selected_ids = Object.keys(this.state.modelValues.capabilities_ids.selected).map(Number);
			this.state.modelValues.equip_catg_ids.selected_ids = Object.keys(this.state.modelValues.equip_catg_ids.selected).map(Number);
			let postData = _.cloneDeep(this.state.modelValues);
			this.state.section.map(function (group) {
				postData[group.name] = form.value[group.name];
			});
			this.state.attributes.map(function (group) {
				group.selected = form.value['attributes[' + group.id + ']'];
			});
			postData['attributes'] = this.state.attributes;
			postData['org_id'] = this.state.organization['id'];
			postData['org_type'] = this.state.organization['org_type'];

			postData['capabilities_ids']['selected'] = Object.keys(postData['capabilities_ids']['selected']).length ? postData['capabilities_ids']['selected'] : null;
			postData['capabilities_ids']['defaults'] = Object.keys(postData['capabilities_ids']['defaults']).length ? postData['capabilities_ids']['defaults'] : null;

			postData['equip_catg_ids']['selected'] = Object.keys(postData['equip_catg_ids']['selected']).length ? postData['equip_catg_ids']['selected'] : null;
			postData['equip_catg_ids']['defaults'] = Object.keys(postData['equip_catg_ids']['defaults']).length ? postData['equip_catg_ids']['defaults'] : null;

			postData['client_ids'] = this.gridApi.getSelectedRows().map(o => o.id);
			postData['departments_ids'] = _.map(this.getSelected['data'], 'id');
			postData['vendor_types_id'] = type ? type : form.value.vendor_types_id;
			this.contactsService.saveGeneralSection(postData)
				.then(response => {
					if (response.result.success) {
						this.state.showFooter = false;
						this.snackbar.openFromComponent(SnackbarComponent, {
							data: { status: 'success', msg: 'General Details Updated Successfully' },
							verticalPosition: 'top',
							horizontalPosition: 'right'
						});
						this.state.attributes = response.result.data.attributes;
						this.state.section = response.result.data.section;
						// this.createForm();
						this.resetObject(response.result.data);

						this.state.modelValues = { ...this.state.modelValues, ...response.result.data };
						this.state.cloneValues.capabilities_ids = _.cloneDeep(this.state.modelValues.capabilities_ids);
						this.state.cloneValues.equip_catg_ids = _.cloneDeep(this.state.modelValues.equip_catg_ids);
						this.setEmptyObject();
						// this.resetForm();
					} else {
						this.state.errorMessage = response.result.message;
						this.generalForm.markAsPristine();
					}
				});
		}
	}

	resetObject(obj) {
		if (obj.capabilities_ids) {
			obj.capabilities_ids.selected = obj.capabilities_ids.selected ? obj.capabilities_ids.selected : {};
			obj.capabilities_ids.defaults = obj.capabilities_ids.defaults ? obj.capabilities_ids.defaults : {};
		}
		if (obj.equip_catg_ids) {
			obj.equip_catg_ids.selected = obj.equip_catg_ids.selected ? obj.equip_catg_ids.selected : {};
			obj.equip_catg_ids.defaults = obj.equip_catg_ids.defaults ? obj.equip_catg_ids.defaults : {};
		}
	}

	resetForm(): void {
		let formGroup = {};
		this.state.section.map(function (group) {
			formGroup[group.name] = group.value;
		});
		this.generalForm.patchValue(formGroup);
	}

	createForm(): void {
		let formGroup = {};
		this.state.section.map((group) => {
			if (group.name == 'secondary_vendor_codes') {
				formGroup[group.name] = this.fb.array(group['value']);
			} else {
				formGroup[group.name] = group.value;
			}
		});
		if (Array.isArray(this.state.attributes)) {
			this.state.attributes.map(function (group) {
				formGroup['attributes[' + group.id + ']'] = group.selected ? true : false;
			});
		} else {
			this.state.attributes = [];
			Object.keys(this.state.attributes).map(key => {
				this.state.attributes.push(this.state.attributes[key]);
			})
		}
		formGroup['vendor_types_id'] = this.state.modelValues['vendor_types_id'] ? this.state.modelValues['vendor_types_id'] : '';
		this.generalForm = this.fb.group(formGroup);

		this.generalForm.get('vendor_types_id').valueChanges.subscribe(val => {
			this.save(this.generalForm, val);
		});
	}

	onSearch(ev) {
		if (ev)
			this.state.dropdowns['departments'] = _.filter(this.state.dropdowns['copyDepartments'], (o) => {
				return !o.selected && o.name.toLowerCase().indexOf(ev.toLowerCase()) > -1 || o.selected;
			});
		else this.state.dropdowns['departments'] = [...this.state.dropdowns['copyDepartments']];
	}

	setEmptyObject() {
		['capabilities_ids', 'equip_catg_ids'].map(key => {
			if (Array.isArray(this.state.modelValues[key])) {
				this.state.modelValues[key] = {};
				this.state.modelValues[key].selected = {};
				this.state.modelValues[key].defaults = {};
				this.state.modelValues[key].selected_ids = {};
			} else {
				if (!this.state.modelValues[key]) {
					this.state.modelValues[key] = {
						selected: {},
						defaults: {},
						selected_ids: []
					}
				}
			}
		})
	}

	getGeneralData(): void {
		this.state.loader = true;
		this.contactsService.getOrgOthers({
			org_id: this.state.organization['id'],
			org_type: this.state.organization['org_type']
		}).then(response => {
			if (response.result.success) {
				this.state.attributes = response.result.data.attributes;
				this.state.section = response.result.data.section;
				this.resetObject(response.result.data);

				this.state.modelValues = { ...this.state.modelValues, ...response.result.data };
				delete this.state.modelValues['attributes']; delete this.state.modelValues['section'];
				this.setEmptyObject(); this.updateCategories(this.state.modelValues.departments_ids);
				this.state.cloneValues.capabilities_ids = _.cloneDeep(this.state.modelValues.capabilities_ids);
				this.state.cloneValues.equip_catg_ids = _.cloneDeep(this.state.modelValues.equip_catg_ids);
				this.createForm();
				this.state.loader = false;
			}
		});
	}

	updateCategories(model) {
		if (this.state.dropdowns['departments'])
			this.state.dropdowns['departments'].map(dpt => {
				if (model.indexOf(dpt.id) > -1) dpt.selected = true;
				else delete dpt.selected;
			})
	}


	performAction(list, action, prop) {
		if (!this.state.editable) {
			return;
		}
		if (list) {
			if (action == 'delete') delete list[prop];
			else list[prop] = true;
		} else {
			this.state.dropdowns['departments'].map(dept => {
				if (action == 'delete') delete dept[prop];
				else dept[prop] = true;
			})
		}
		this.state.showFooter = true;
	}

	public get getSelected(): Object {
		let arr = _.filter(this.state.dropdowns['departments'], (dept) => {
			return dept.selected == true;
		});
		return {
			data: arr,
			length: arr.length
		}
	}

	public get getEquipmentCount(): any {
		return Object.keys(checkedLength(this.state.modelValues.equip_catg_ids.selected)).length;
	}

	public get getCapabilityCount(): any {
		return Object.keys(checkedLength(this.state.modelValues.capabilities_ids.selected)).length;
	}

	reset() {
		this.updateCategories(this.state.modelValues.departments_ids);
		this.state.modelValues.capabilities_ids = _.cloneDeep(this.state.cloneValues.capabilities_ids);
		this.state.modelValues.equip_catg_ids = _.cloneDeep(this.state.cloneValues.equip_catg_ids);
		this.state.isReset = true;
		this.defaultCheck();
		setTimeout(() => {
			this.state.isReset = false;
		}, 1000);
		this.state.showFooter = false;
	}

}
