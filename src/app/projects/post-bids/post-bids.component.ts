import { Component, OnInit } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { PostBidsGridComponent, PostBidsIcons, HeaderSettings, serviceCheck, serviceHeaderCheck, capabilityEquipmentComponent, ProductsServicesComponent } from '@app/projects/post-bids-grid/post-bids-grid.component';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

let APP = window['APP'];

@Component({
  selector: 'app-post-bids',
  templateUrl: './post-bids.component.html',
  host: {
    class: ''
  },
  styleUrls: ['./post-bids.component.scss']
})
export class PostBidsComponent implements OnInit {

  public loader = true;

  public vendorsGrid: any;
  public vendorQueueGrid: any;
  public gridOPtions: GridOptions;
  public state = {
    vendorSearch: '',
    capabilities: {
      list: [
        {id: 1, name: "Capability 1", selected: false},
        {id: 2, name: "Capability 2", selected: false},
        {id: 3, name: "Capability 3", selected: false},
        {id: 4, name: "Capability 4", selected: false},
        {id: 5, name: "Capability 5", selected: false},
      ],
      selected: {},
      checkAll: false,
      indeterminate: false
    },
    equipments: {
      list: [
        {id: 1, name: "Equipment 1", selected: false},
        {id: 2, name: "Equipment 2", selected: false},
        {id: 3, name: "Equipment 3", selected: false},
        {id: 4, name: "Equipment 4", selected: false},
        {id: 5, name: "Equipment 5", selected: false},
      ],
      selected: {},
      checkAll: false,
      indeterminate: false
    },
    vendorTypes: {
      list: [
        {id: 1, name: "Vendor Type 1", selected: false},
        {id: 2, name: "Vendor Type 2", selected: false},
        {id: 3, name: "Vendor Type 3", selected: false},
        {id: 4, name: "Vendor Type 4", selected: false},
        {id: 5, name: "Vendor Type 5", selected: false},
      ],
      selected: {},
      checkAll: false,
      indeterminate: false
    },
    activeTab: 0,
    tabs: [],
    bidDeadline: '',
    minDate: new Date(),
    filterSelection : [
      { label: 'AND', value: 'AND' },
      { label: 'OR', value: 'OR' }
    ],
    selectedFilter: 'AND',
    vendors: {
      options: {
        columnDefs: [
          {
            headerName: 'Vendor Name',
            field: 'name',
            /*suppressResize: true,*/
            width: 280,
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: {
              checkbox: true
            },
            headerCheckboxSelection: true,
            headerCheckboxSelectionFilteredOnly: true
          },
          {
            headerName: ' ',
            field: 'products_services',
            cellRendererFramework: ProductsServicesComponent,
            cellRendererParams: {
              edit: false
            }
          },
          {
            headerName: 'City',
            field: 'city'
          },
          {
            headerName: 'State',
            field: 'state'
          },
          {
            headerName: 'Country',
            field: 'country'
          },
          {
            headerName: ' ',
            field: 'capability_equipment',
            cellRendererFramework: capabilityEquipmentComponent
          }
        ],
        suppressDragLeaveHidesColumns: true,
        animateRows: true,
        groupSelectsChildren: true,
        rowSelection: 'multiple',
        icons: {
          groupExpanded: false,
          groupContracted: false
        },
        defaultColDef: {
          resizable: true
        },
        onGridReady: (params) => {
          this.vendorsGrid = params.api;
        },
        getRowHeight: (params) => {
            if (params.data.type && params.data.type=='avg') {
              if(params.data.show){
                return 38;
              }else{
                return 0;
              }
            } else {
                return 38;
            }
        },
        rowData: [
            // {id: 2, name: "4 All Promos", city: "Chicago", state: "CA", country: "United States"},
            // {id: 3, name: "3 Angels Printing", city: "Chicago", state: "CT", country: "United States"},
            // {id: 4, name: "360IT Services", city: "Chicago", state: "TX", country: "United States"},
            // {id: 5, name: "Test Vendor", city: "Chicago", state: "CA", country: "United States"},
            // {id: 7, name: "4 Color Press", city: "Chicago", state: "CT", country: "United States"},
            // {id: 8, name: "3 Angels Printing", city: "Chicago", state: "TX", country: "United States"},
            // {id: 9, name: "4 All Promos", city: "Chicago", state: "CA", country: "United States"},
            // {id: 10, name: "Test Vendor", city: "Chicago", state: "CT", country: "United States"},
            // {id: 12, name: "4 Color Press", city: "Chicago", state: "TX", country: "United States"},
            // {id: 13, name: "3 Angels Printing", city: "Chicago", state: "CA", country: "United States"},
            // {id: 14, name: "360IT Services", city: "Chicago", state: "CT", country: "United States"},
            // {id: 15, name: "Test Vendor", city: "Chicago", state: "TX", country: "United States"}
        ],
        // getNodeChildDetails: this.getNodeChildDetails
      }
    },
    vendorQueue: {
      options: {
        columnDefs: [
          {
            headerName: 'Vendor Name',
            field: 'name',
            /*suppressResize: true,*/
            width: 200,
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: {
              checkbox: true
            },
            headerCheckboxSelection: true,
            headerCheckboxSelectionFilteredOnly: true
          },
          {
            headerName: ' ',
            field: 'products_services',
            cellRendererFramework: ProductsServicesComponent,
            cellRendererParams: {
              edit: false
            }
          },
          // {
          //   headerName: 'Send Schedule',
          //   field: 'schedule'
          // },
          {
            headerName: 'City',
            field: 'city'
          },
          {
            headerName: 'State',
            field: 'state'
          },
          {
            headerName: 'Country',
            field: 'country'
          },
          {
            headerName: ' ',
            field: 'capability_equipment',
            cellRendererFramework: capabilityEquipmentComponent
          }
        ],
        suppressDragLeaveHidesColumns: true,
        animateRows: true,
        groupSelectsChildren: true,
        rowSelection: 'multiple',
        icons: {
          groupExpanded: false,
          groupContracted: false
        },
        defaultColDef: {
          resizable: true
        },
        onGridReady: (params) => {
          this.vendorQueueGrid = params.api;
          this.vendorQueueGrid.sizeColumnsToFit();
        },
        getRowHeight: (params) => {
            if (params.data.type && params.data.type=='avg') {
              if(params.data.show){
                return 38;
              }else{
                return 0;
              }
            } else {
                return 38;
            }
        },
        rowData: [
            {id: 2, schedule: '', name: "4 All Promos", city: "Chicago", state: "CA", country: "United States"},
            {id: 3, schedule: '', name: "3 Angels Printing", city: "Chicago", state: "CT", country: "United States"},
            {id: 4, schedule: '', name: "360IT Services", city: "Chicago", state: "TX", country: "United States"},
            {id: 5, schedule: '', name: "Test Vendor", city: "Chicago", state: "CA", country: "United States"},
            {id: 7, schedule: '', name: "4 Color Press", city: "Chicago", state: "CT", country: "United States"},
            {id: 8, schedule: '', name: "3 Angels Printing", city: "Chicago", state: "TX", country: "United States"},
            {id: 9, schedule: '', name: "4 All Promos", city: "Chicago", state: "CA", country: "United States"},
            {id: 10, schedule: '', name: "Test Vendor", city: "Chicago", state: "CT", country: "United States"},
            {id: 12, schedule: '', name: "4 Color Press", city: "Chicago", state: "TX", country: "United States"},
            {id: 13, schedule: '', name: "3 Angels Printing", city: "Chicago", state: "CA", country: "United States"},
            {id: 14, schedule: '', name: "360IT Services", city: "Chicago", state: "CT", country: "United States"},
            {id: 15, schedule: '', name: "Test Vendor", city: "Chicago", state: "TX", country: "United States"}
        ],
        // rowData: this.vendorsGrid.getSelectedRows()
        // getNodeChildDetails: this.getNodeChildDetails
      }
    },
    checkAllProducts: false,
    bidDeadlines: [
      { name: "Tv Brochure Banner", selected: false, services: [
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") },
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") }
      ]},
      { name: "Tv Brochure Banner", selected: false, services: [
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") },
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") },
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") }
      ]},
      { name: "Tv Brochure Banner", selected: false, services: [
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") },
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") },
        { name: "Creative", selected: false, revision: "R0", date: new Date("Mar 31, 2018") }
      ]}
    ],
    showBidDeadlineFooter: false,
    templates: [
      {id: '', name: "Select Template"},
      {id: 1, name: "Template 1"},
      {id: 2, name: "Template 2"},
      {id: 3, name: "Template 3"}
    ],
    selectedTemplate: 1,
    milestonesDropdown: [
      {id: 1, name: "Milestone 1"},
      {id: 2, name: "Milestone 2"},
      {id: 3, name: "Milestone 3"}
    ],
    unlockAddVendors: false,
    milestones: [
      { id: 1, name: "Paper LDC Date", date: new Date("Mar 31, 2018"), new: false }
    ],
    maxOptions: 3,
    analyzeBids: [
      {id: 1, name: "Creative with Printing", rev: 0, type: "product", children: [
        {id: 2, name: "Market Average", option: "$451", type: "avg", show: true},
        {id: 3, name: "3 Angels Printing", option: "$451.00", type: "service", hasBid: true, selected: false, plant: "--", spec: "--"},
        {id: 4, name: "360IT Services", option: "--", type: "service", hasBid: false, selected: false, plant: "--", spec: "--"},
        {id: 5, name: "Test Vendor", option1: "$451.00", type: "service", hasBid: true, selected: false, plant1: "--", spec1: "--"},
        {id: 5, name: "Test Vendor", option1: "$451.00", type: "service", hasBid: true, selected: false, plant1: "--", spec1: "--"}
      ]},
      {id: 6, name: "Creative without Printing", rev: 0, type: "product", children: [], vendors: [{type: 'empty', msg: "No Vendors Found"}]},
      {id: 11, name: "Freight Ivie", rev: 0, type: "product", children: [
        {id: 12, name: "Market Average", option: "$451", type: "avg", show: true},
        {id: 13, name: "3 Angels Printing", option: "--", type: "service", hasBid: false, selected: false, plant: "--", spec: "--"},
        {id: 14, name: "360IT Services", option: "--", type: "service", hasBid: false, selected: false, plant: "--", spec: "--"},
        {id: 15, name: "Test Vendor", option1: "--", type: "service", hasBid: false, selected: false, plant1: "--", spec1: "--"},
        {id: 5, name: "Test Vendor", option1: "$451.00", type: "service", hasBid: true, selected: false, plant1: "--", spec1: "--"}
      ]}
    ],
    allowPostBids: false
  };
  public vendorFormsGroup: FormGroup;
  public gridApi: any;

  constructor(
    private commonService: CommonService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.commonService.onUpdate().subscribe((obj)=>{
      if(obj.hasOwnProperty('checkAnalyzebids')){
        this.changeGridSelection(obj.checkAnalyzebids);
      }else if(obj.hasOwnProperty('checkAnalyzebidService')){
        this.changeServiceGridSelection(obj.checkAnalyzebidService);
      }else if(obj.hasOwnProperty('updateGrid')){
        // let rowData = _.deepcopy(this.gridOptions.rowData);
        // this.gridOptions.rowData = [];
        // this.gridOptions.rowData = this.gridOptions.rowData;
        // this.gridApi.refreshView();
        
        setTimeout(()=>{
          this.loader = true;
          setTimeout(()=>{
            this.loader = false;
          },10);
          // this.gridOptions.rowData = this.gridOptions.rowData;
        },10);
      }else if(obj.hasOwnProperty('reloadGrid')){
        setTimeout(()=>{
          this.loader = true;
          setTimeout(()=>{
            this.getAnalyzeBids();
            // this.loader = false;
          },10);
        },10);
      }else if(obj.hasOwnProperty('reloadVendorsQueueGrid')){
        setTimeout(()=>{
          this.loader = true;
          setTimeout(()=>{
            this.getVendorsQueue();
          },10);
        },10);
      }
    });
  }

  ngOnInit() {
    setTimeout(()=>{
      this.commonService.update({showView: true});
    },1000);
    this.getFiltersData();
    this.getTabData();
  }

  getFiltersData(){
    forkJoin(
      this.commonService.getApi('capabilities', {status: true}),
      this.commonService.getApi('equipmentCategory', {status: true}),
      this.commonService.getApi('VendorTypes', {status: true})
    ).subscribe(([response1, response2, response3]) => {
      if(response1['result'].success){
        this.state.capabilities.list = response1['result'].data.items;
      }
      if(response2['result'].success){
        this.state.equipments.list = response2['result'].data.items;
      }
      if(response3['result'].success){
        this.state.vendorTypes.list = response3['result'].data.vendor_types;
      }
    });
  }

  checkFiltersApplied(){
    let capabilities = this.state.capabilities.list.filter((value) => {
      return value.selected;
    });
    let equipments = this.state.equipments.list.filter((value) => {
      return value.selected;
    });
    let vendorTypes = this.state.vendorTypes.list.filter((value) => {
      return value.selected;
    });
    if(capabilities.length && (equipments.length || vendorTypes.length)){
      return true;
    }else{
      return false;
    }
  }

  clearVendorFilter(){
    this.state.capabilities.list.map((value) => {
      value.selected = false;
    });
    this.state.equipments.list.map((value) => {
      value.selected = false;
    });
    this.state.vendorTypes.list.map((value) => {
      value.selected = false;
    });
    this.getVendors();    
  }

  applyVendorFilter(){
    this.getVendors();    
  }

  onSearch(val, flag?) {
    if (val) this.state.vendorSearch = val;
    else delete this.state.vendorSearch;
    this.getVendors();    
  }

  allowPostBids(status){
    this.state.allowPostBids = status;
  }

  changeGridSelection(status){
    let selected = false;
    _.map(this.gridOptions.rowData, (parent) => {
      if(parent.children && parent.children.length){
        _.map(parent.children, (child) => {
          if(child['hasBid']){
            if(status){
              selected = true;
            }
            child['selected'] = status;
          }
        });
      }
    });
    this.allowPostBids(selected);
  }

  changeServiceGridSelection(status){
    let selected = false;
    _.map(this.gridOptions.rowData, (parent) => {
      if(parent.children && parent.children.length){
        _.map(parent.children, (child) => {
          if(child['hasBid'] && child.selected){
            selected = true;
          }
        });
      }
    });
    this.allowPostBids(selected);
  }

  getTabData(){
    switch(this.state.activeTab){
      case 0: 
        this.getProducts();
        this.vendorScheduleForm();
        break;
      case 1:
        this.getVendors();
        break;
      case 2:
        this.getVendorsQueue();
        break;
      case 3:
        this.getAnalyzeBids();
        break;
    }
  }

  getProducts(): void{
    this.loader = true;
    this.commonService.saveApi('getVendorServicesBidDeadline', {
        job_id:this.route.parent.snapshot.params.id
      })
      .then(res => {
        this.loader = false;
        if(res['result'] && res['result'].success){
          this.state.bidDeadlines = res['result'].data.products;
        }
      });
  }

  getVendors(): void{
    this.loader = true;
    // setTimeout(()=>{
    //   this.loader = false;
    // },1000);
    let capabilities = [];
    let equipments = [];
    let vendorTypes = [];
    this.state.capabilities.list.map((value) => {
      if(value.selected){
        capabilities.push(value.id);
      }
    });
    this.state.equipments.list.map((value) => {
      if(value.selected){
        equipments.push(value.id);
      }
    });
    this.state.vendorTypes.list.map((value) => {
      if(value.selected){
        vendorTypes.push(value.id);
      }
    });
    this.commonService.saveApi('getVendors', {
        job_id:this.route.parent.snapshot.params.id,
        capabilities_filter: capabilities,
        equipment_filter: equipments,
        vendor_types_filter: vendorTypes,
        filter_type: this.state.selectedFilter,
        search: this.state.vendorSearch
      })
      .then(res => {
        this.loader = false;
        if(res['result'] && res['result'].success){
          this.state.vendors.options.rowData = res['result'].data;
        }
      });
  }

  exportBids(){
    location.href = APP.api_url+'exportAnalyzeBids?jobs_id='+this.route.parent.snapshot.params.id + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
  }

  deleteBids(): void{
    let selectedVendors = [];
    let selectedVendorsList = this.vendorQueueGrid.getSelectedRows();
    _.map(selectedVendorsList, (value) => {
      selectedVendors.push(value.id);
    });
    this.commonService.saveApi('delVendorsQue', {
      jobs_id:this.route.parent.snapshot.params.id,
      selectedVendors: selectedVendors
    })
    .then(res => {
      this.loader = false;
      if(res['result'] && res['result'].success){
        this.getVendorsQueue();
      }
    });
  }

  skipExport(): void{
    let selectedVendors = [];
    let selectedVendorsList = this.vendorQueueGrid.getSelectedRows();
    _.map(selectedVendorsList, (value) => {
      selectedVendors.push(value.id);
    });
    this.commonService.saveApi('saveRequestBids', {
      jobs_id:this.route.parent.snapshot.params.id,
      selectedVendors: selectedVendors
    })
    .then(res => {
      this.loader = false;
      if(res['result'] && res['result'].success){
        this.getVendorsQueue();
      }
    });
  }

  requestBids(): void{
    let selectedVendors = [];
    let selectedVendorsList = this.vendorQueueGrid.getSelectedRows();
    _.map(selectedVendorsList, (value) => {
      selectedVendors.push(value.id);
    });
    this.commonService.saveApi('saveRequestBids', {
      jobs_id:this.route.parent.snapshot.params.id,
      selectedVendors: selectedVendors
    })
    .then(res => {
      this.loader = false;
      if(res['result'] && res['result'].success){
        this.getVendorsQueue();
      }
    });
  }

  addVendorsToQueue(): void{
    let selectedVendors = [];
    let selectedVendorsList = this.vendorsGrid.getSelectedRows();
    _.map(selectedVendorsList, (value) => {
      selectedVendors.push({
        id: value.id,
        addresses_id: value.addresses_id,
        address_types_id: value.address_types_id
      });
    });
    let services = [];
    _.map(this.state.bidDeadlines, (value) => {
      if(value.selected){
        _.map(value.services, (child) => {
          if(child.selected){
            services.push(child.job_service_revisions_id);
          }
        });
      }
    });
    this.commonService.saveApi('saveVendorsQue', {
      jobs_id:this.route.parent.snapshot.params.id,
      selectedVendors: selectedVendors,
      services: services
    })
    .then(res => {
      this.loader = false;
      if(res['result'] && res['result'].success){
        this.state.checkAllProducts = false;
        this.checkAllProducts(false);
        this.getVendors();
        // this.state.vendors.options.rowData = res['result'].data
      }
    });
  }

  getVendorsQueue(): void{
    this.loader = true;
    this.commonService.saveApi('getVendorsQue', {
        jobs_id:this.route.parent.snapshot.params.id
      })
      .then(res => {
        this.loader = false;
        if(res['result'] && res['result'].success){
          this.state.vendorQueue.options.rowData = res['result'].data;
        }
      });
  }

  getAnalyzeBids(): void{
    this.loader = true;
    // setTimeout(()=>{
    //   this.loader = false;
    //   this.gridOptions.rowData = this.state.analyzeBids;
    // },1000);
    this.commonService.getApi('getAnalyzeBids', {
      jobs_id:this.route.parent.snapshot.params.id
    })
    .then(res => {
      
      if(res['result'] && res['result'].success){
        this.state.maxOptions = res['result'].data.max_options;
        this.buildAlalyzeGrid();
        this.gridOptions.rowData = res['result'].data.products;
        _.map(res['result'].data.products, (product) => {
          _.map(product.children, (vendor) => {
            vendor['show'] = false;
            vendor['type'] = 'service';
            _.map(vendor.options, (opt, index) => {
              vendor['option'+(parseInt(index)+1)] = opt.option;
              vendor['plant'+(parseInt(index)+1)] = opt.plant;
              vendor['spec'+(parseInt(index)+1)] = opt.spec;
            });
          });
        });
        this.gridOptions.rowData = res['result'].data.products;
      }
      this.loader = false;
    });
  }

  changeParentDate(event): void{
    this.state.showBidDeadlineFooter = true;
    _.map(this.state.bidDeadlines, (value)=>{
      if(value.services && value.services.length){
        _.map(value.services, (service)=>{
          service['bid_deadline'] = event.value;
        });
      }
    });
  }

  changeServiceDate(event, service): void{
    this.state.showBidDeadlineFooter = true;
    service['bid_deadline'] = event.value;
  }

  cancelBidDeadlines(): void{
    this.state.showBidDeadlineFooter = false;
    this.getProducts();
  }

  saveBidDeadlines(): void{
    let params = [];
    _.map(this.state.bidDeadlines, (value)=>{
      if(value.services && value.services.length){
        _.map(value.services, (service)=>{
          params.push({
            job_revisions_id: service.job_service_revisions_id,
            bid_deadline: (service.bid_deadline!='')?moment(service.bid_deadline).format("YYYY-MM-DD"):""
          });
        });
      }
    });
    this.state.showBidDeadlineFooter = false;
    this.commonService.saveApi('saveVendorServicesBidDeadline', {services: params})
    .then(res => {
      if(res['result'] && res['result'].success){
        // this.state.bidDeadlines = res['result'].data.products
      }
    });
  }

  checkSelectAllProducts(): void{
    let uncheck = false;
    let selected = false;
    _.map(this.state.bidDeadlines, (value) => {
      if(!value['selected']){
        uncheck = true;
      }else{
        selected = true;
      }
      if(value.services && value.services.length){
        _.map(value.services, (child) => {
          if(!child['selected']){
            uncheck = true;
          }else{
            selected = true;
          }
        }); 
      }
    }); 
    if(uncheck){
      this.state.checkAllProducts = false;
    }else{
      this.state.checkAllProducts = true;
    }
    if(selected){
      this.state.unlockAddVendors = true;
    }else{
      this.state.unlockAddVendors = false;
    }
  }

  checkAllProducts(status: any): void{
    let selected = false;
    _.map(this.state.bidDeadlines, (value) => {
      value['selected'] = status;
      if(status){
        selected = true;
      }
      if(value.services && value.services.length){
        _.map(value.services, (child) => {
          child['selected'] = status;
          if(status){
            selected = true;
          }
        }); 
      }
    }); 
    if(selected){
      this.state.unlockAddVendors = true;
    }else{
      this.state.unlockAddVendors = false;
    }
  }

  checkAllServices(item): void{
    if(item.services && item.services.length){
      _.map(item.services, (value) => {
        value['selected'] = item.selected;
      }); 
    }
    this.checkSelectAllProducts();
  }

  checkParentProduct(item, parent): void{
    if(item.selected){
      parent['selected'] = true;
    }else{
      let parentChk = false;
      _.map(parent.services, (value) => {
        if(value['selected']){
          parentChk = true;
        }
      }); 
      parent['selected'] = parentChk;
    }
    this.checkSelectAllProducts();
  }

  addMilestone(): void{
    let added = _.filter(this.state.milestones,(value) => {
      return value.new;
    });
    if(!added.length){
      this.state.milestones.push({id: Math.round(Math.random()*100), name: "", date: new Date(), new: true});
    }
  } 

  removeMilestone(item: any): void{
    this.state.milestones = _.filter(this.state.milestones,(value) => {
      return value.id!=item.id;
    });
  } 

  vendorScheduleForm(): void{
    this.vendorFormsGroup = this.fb.group({
      selectedTemplate: '',
      selectedMilestone: ''
    });
  }

  public headers = [
    {field: 'name', name: 'Products / Services - Vendors'},
    {field: 'icons', name: 'icons'},
    {field: 'checkbox', name: 'icons'},
    {field: 'option1'},
    {field: 'plant1'},
    {field: 'spec1'},
    {field: 'option2'},
    {field: 'plant2'},
    {field: 'spec2'}
  ];

  public columnDefs = [];
  public gridOptions: GridOptions = {
    rowData: []
  };
  public analizeBidsLoader = true;

  buildAlalyzeGrid(): void{
    this.columnDefs = [
      {
        headerName: 'Products/Services - Vendors',
        field: 'name',
        pinned: 'left',
        width: 300,
        cellRendererFramework: PostBidsGridComponent
      },
      {
        headerName: 'icons',
        field: 'option',
        pinned: 'left',
        cellRendererFramework: PostBidsIcons,
        headerComponentFramework: HeaderSettings,
        autoHeight: true,
        plants: false,
        specs: false,
        width: 140
      },
      {
        headerName: 'icons',
        field: 'checkbox',
        pinned: 'left',
        cellRendererFramework: serviceCheck,
        headerComponentFramework: serviceHeaderCheck,
        selected: false,
        width: 50
      }
    ];
    for(var i=1; i<=this.state.maxOptions; i++){
      this.columnDefs.push({
        headerName: 'Option '+i+' Bid',
        field: 'option'+i,
        type: 'option'
      });
      this.columnDefs.push({
        headerName: 'Option '+i+' Plant',
        field: 'plant'+i,
        type: 'plant',
        hide: true
      });
      this.columnDefs.push({
        headerName: 'Option '+i+' Bid Submission Specs',
        field: 'spec'+i,
        type: 'spec',
        hide: true
      });
    }
    this.gridOptions = {
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      animateRows: true,
      groupSelectsChildren: true,
      rowSelection: 'multiple',
      icons: {
        groupExpanded: false,
        groupContracted: false
      },
      defaultColDef: {
        resizable: true
      },
      onGridReady: (params) => {
        this.gridApi = params.api;
      },
      getRowHeight: (params) => {
          if (params.data.type && params.data.type=='avg') {
            if(params.data.show){
              return 38;
            }else{
              return 0;
            }
          } else {
              return 38;
          }
      },
      rowData: [],
      getNodeChildDetails: this.getNodeChildDetails
    };
    this.analizeBidsLoader = false;
  }

  onTabChange = (index) => {
    this.state.activeTab = index;
    this.getTabData();
  }

  changeMasterView() {
    this.commonService.onChange();
  }

  getNodeChildDetails(rowItem) {
    if (rowItem.children) {
      return {
        group: true,
        children: (rowItem.children && rowItem.children.length)?rowItem.children:(rowItem.vendors && rowItem.vendors.length)?rowItem.vendors:[],
        expanded: true,
        empty: (rowItem.children && rowItem.children.length)?false:true,
        key: rowItem.label
      };
    } else {
      return null;
    }
  };

  menuActions(flag, key: any) {
    if (flag == 'all') {
      this.state[key].list.map(ctg => {
        ctg['selected'] = this.state[key].checkAll
      });
    } else if (flag == 'apply' || flag == 'cancel') {
      const values = this.state[key].list.filter(ctg => {
        return ctg.selected;
      });
      // this.getProductServices(flag == 'cancel' ? [] : Object.keys(values));
      // call
    } else if (flag == 'clear') {
      this.state[key].list.map(ctg => {
        ctg['selected'] = false
      });
      this.state[key].checkAll = false;
    }
  }

  selectAll(key: any) {
    this.menuActions('all', key)
  }

  changeCategory(key: any) {
    this.checkFlag(key);
  }

  isAllChecked = (checked, key) => {
		return Object.keys(checked).length && Object.keys(checked).length == this.state[key].list.length;
	}

	checkFlag = (key: any) => {
		let checkedArra = this.state[key].list.filter(ctg => {
      return ctg.selected;
    });
		this.state[key].checkAll = this.isAllChecked(checkedArra, key);
		this.state[key].indeterminate = Object.keys(checkedArra).length ? !this.state[key].checkAll : false;
	}

}