import { Component, OnInit, OnDestroy } from '@angular/core';
import { FileUploader } from 'ng2-file-upload';
import { CommonService } from '@app/common/common.service';
import { ContactsService } from '../contacts.service';


import * as _ from 'lodash';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

var APP: any = window['APP'];

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit, OnDestroy {
  search = { value: null };
  state = {
    isLoading: true,
    showView: false,
    noData: false,
    editable: false,
    org_id: null,

    routes: [
      { id: 1, name: "Overview", route: 'overview', type: "overview", icon: "icon-overview", add: false, search: false, listView: false },
      {
        id: 2, name: "Address", route: 'address', type: "address", icon: "icon-address-book", add: true, search: true, listView: true, textLabels: {
          addTabTitle: 'Add Address',
          addTitle: 'No Address',
          addImage: 'icon-address-book'
        }
      },
      {
        id: 3, name: "Contacts", route: 'contacts', type: "contacts", icon: "icon-contact-book", add: true, search: true, listView: true, filter: true, textLabels: {
          addTabTitle: 'Add Contact',
          addTitle: 'No Contact',
          addImage: 'icon-contact-book'
        }
      },
      {
        id: 4, name: "Sub Organizations", route: 'sub-orgs', type: "subOrgs", icon: "icon-sub-organisations", add: true, search: true, listView: true, textLabels: {
          addTabTitle: 'Add Sub Organization',
          addTitle: 'No Sub Organization',
          addImage: 'icon-sub-organisations'
        }
      }
    ],

    selectedRoute: null,

    clientRoutes: [
      {
        id: 5, type: 'custom_attributes', name: "Custom Attributes", route: 'custom-attributes', add: true, search: true, listView: false, textLabels: {
          addTabTitle: 'Add Custom Attribute',
          addTitle: 'No Custom Attribute'
        }
      },
      {
        id: 6, type: 'internal_invoice', name: "Internal Invoice", route: 'internal-invoice', add: true, search: true, listView: false, textLabels: {
          addTabTitle: 'Add Internal Invoice',
          addTitle: 'No Internal Invoice'
        }
      },
      { id: 7, type: 'others', name: "Business Rules", route: 'business-rules', add: false, search: false, listView: false }
    ],

    vendorRoutes: [
      { id: 8, name: "General", route: 'general', add: false, search: false, listView: false },
      { id: 9, type: 'vendor_capabilities', name: "Capabilities", route: 'vendor-capabilities', listView: false, footer: false },
      {
        id: 10, type: 'vendor_equipments', name: "Equipment", route: 'vendor-equipment', add: true, listView: false, textLabels: {
          addTabTitle: 'Add Equipment',
          addTitle: 'No Equipment'
        }
      },
      { id: 11, name: "Certifications", route: 'certifications', add: false, search: false, listView: false }
    ],

    org: {
      counts: null,
      isLoading: false,
      list: [],
      totalList: [],
      flatList: [],
      selected: {},
      totalPages: 500,
      search: {
        placeHolder: "Search Organization",
        value: ''
      },
      params: {
        page: 1,
        perPage: 25,
      }
    }
  };

  public hasDropZoneOver: boolean = false;
  public uploader: FileUploader = new FileUploader({
    url: 'upload',
    allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
    maxFileSize: 5 * 1024 * 1024,
    autoUpload: true,
    headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
  });

  activeRouterSubscription: Subscription;
  routerSubscription: Subscription;
  detailSubscription: Subscription;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    private _contactService: ContactsService,
    private _commonService: CommonService,
    private router: Router,
  ) {
    this.routerSubscription = _router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        _activeRoute.firstChild.data.subscribe(val => {
          const tabIndx = val ? val.tabIndex : null;
          if (tabIndx) {
            const route = _.find(this.state[val.prop], ['id', tabIndx]);
            if (route) this.state.selectedRoute = route
          }
        })
        // _contactService.getOrganizationDetailCount().subscribe(obj => { this.state.org.counts = obj; });

        this.detailSubscription = _contactService.onUpdate().subscribe(ev => {
          if (ev.type == 'no-data') {
            setTimeout(() => {
              this.state.noData = ev.data;
            });
          }
        })
      }
    })

    this.activeRouterSubscription = _activeRoute.params.subscribe(param => {
      this.state.org_id = param.id ? Number(param.id) : null;
      this.getOrganizations(true);
      this.getOrganizationsList(() => {
        this.getOrgDetails();
      });
    })
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    this.detailSubscription.unsubscribe();
    this.activeRouterSubscription.unsubscribe();
  }

  changeMasterView() {
    this.state.showView = !this.state.showView;
  }

  searchOrgList(search: string, event?: any): void {
    this.state.org.params.page = 1;
    this.state.org.search.value = search;
    this.getOrganizations(true);
  }

  closeSearch(): void {
    this.state.org.search.value = '';
  }

  appendOrganizations(): void {
    let data = this.state.org.totalList.slice(this.state.org.list.length, this.state.org.list.length + this.state.org.params.perPage)
    this.state.org.list = this.state.org.list.concat(data);
  }

  onScroll(): void {
    if (this.state.org.list.length < this.state.org.totalPages && this.state.org.totalPages != 0) {
      // this.appendOrganizations();
      this.state.org.params.page++;
      this.getOrganizations(false);
    }
  }

  goToParent(): void {
    this.router.navigate(['/organizations', this.state.org.selected['parent_id']]);
    this.getSelectedOrganization({ org_id: this.state.org.selected['parent_id'] });
  }

  selectedAction: string = 'All';
  filterAction(action) {
    if (typeof action == 'string')
      this.selectedAction = 'All';
    else if (action)
      this.selectedAction = 'Active';
    else
      this.selectedAction = 'Inactive';
    this._contactService.update({ type: 'filter', data: action })

  }

  getSelectedOrganization(data: any): void {
    this.state.org_id = data.org_id;

    this.state.org.selected = _.find(this.state.org.flatList, { id: this.state.org_id });

    if (!this.state.org.selected['status'])
      this.state.org.selected['status'] = false;
    // this.getTabDetails(this.details.selectedTab);
    // this.getOrgDetails();
  }

  getOrganizations(bol = false): void {
    if (bol) this.state.org.isLoading = true;
    this._contactService.getOrganizations({
      org_type: APP.permissions.system_access.client != 'none' && APP.permissions.system_access.vendor != 'none' ? 0 :
        (APP.permissions.system_access.client != 'none' ? 2 : (APP.permissions.system_access.vendor != 'none' ? 3 : 0)),
      search: this.state.org.search.value,
      page: this.state.org.params.page,
      perPage: this.state.org.params.perPage,
      is_elastic: true
    }).then(response => {
      if (response.result.success) {
        this.state.org.isLoading = false;
        if (bol)
          this.state.org.list = [];

        // let data = response.result.data;
        // data.map(res => {
        //   this.state.org.list.push(res);
        // });
        // this.state.org.totalList = response.result.data;
        // this.state.org.list = this.state.org.totalList.slice(0, this.state.org.params.perPage);
        // this.state.org.totalPages = response.result.data.length;

        this.state.org.totalPages = response.result.data.count;
        this.state.org.totalList = response.result.data.list;
				this.state.org.list = this.state.org.list.concat(this.state.org.totalList);
        this.resetFlatOrgList();
      }
    });
  }

  getOrganizationsList(cb?): void {
    this._contactService.getOrganizations({ 
      org_type: 0, 
      search: this.state.org.search.value,
      page: this.state.org.params.page,
      perPage: this.state.org.params.perPage,
      is_elastic: true
    }).then(response => {
      if (response.result.success) {
        this.setOrgFlat(response.result.data.list, 0);
        this.getSelectedOrg();

        // this.state.org.selected = _.find(this.state.org.flatList, { id: this.state.org_id });
        // this._contactService.setOrganization(this.state.org.selected);
        // this._contactService.update({ type: 'organization', data: this.state.org.selected });
        // if (!this.state.org.selected['status'])
        //   this.state.org.selected['status'] = false;
        // this.state.isLoading = false;
        // // IF current route is a client
        // if (this.state.org.selected['org_type'] == 2) {
        //   if (APP.permissions.system_access.client == 'none') {
        //     this.router.navigateByUrl('/')
        //   }
        //   this.state.editable = APP.permissions.system_access.client == 'edit';
        // } else if (this.state.org.selected['org_type'] == 3) {
        //   // IF current route is a vendor
        //   if (APP.permissions.system_access.vendor == 'none') {
        //     this.router.navigateByUrl('/')
        //   }
        //   this.state.editable = APP.permissions.system_access.vendor == 'edit';
        // }
        // if (cb) cb();
      }
    });
  }

  getSelectedOrg() {
		this._commonService.getApi('orgInfo', {
			org_id: this.state.org_id
		})
		.then(res => {
			if (res['result'] && res['result'].success) {
        this.state.org.selected = res['result'].data;
        this._contactService.setOrganization(this.state.org.selected);
        this._contactService.update({ type: 'organization', data: this.state.org.selected });
        if (!this.state.org.selected['status'])
          this.state.org.selected['status'] = false;
        this.state.isLoading = false;
        // IF current route is a client
        if (this.state.org.selected['org_type'] == 2) {
          if (APP.permissions.system_access.client == 'none') {
            this.router.navigateByUrl('/')
          }
          this.state.editable = APP.permissions.system_access.client == 'edit';
        } else if (this.state.org.selected['org_type'] == 3) {
          // IF current route is a vendor
          if (APP.permissions.system_access.vendor == 'none') {
            this.router.navigateByUrl('/')
          }
          this.state.editable = APP.permissions.system_access.vendor == 'edit';
        }
        this.getOrgDetails();
			}
		});
	}

  resetFlatOrgList() {
    this.setOrgFlat(this.state.org.list, 0);
    this.getSelectedOrg();

    // this.state.org.selected = _.find(this.state.org.flatList, { id: this.state.org_id });
    // this._contactService.setOrganization(this.state.org.selected);
    // this._contactService.update({ type: 'organization', data: this.state.org.selected });
    // if (!this.state.org.selected['status'])
    //   this.state.org.selected['status'] = false;
    // this.state.isLoading = false;
    // // IF current route is a client
    // if (this.state.org.selected['org_type'] == 2) {
    //   if (APP.permissions.system_access.client == 'none') {
    //     this.router.navigateByUrl('/')
    //   }
    //   this.state.editable = APP.permissions.system_access.client == 'edit';
    // } else if (this.state.org.selected['org_type'] == 3) {
    //   // IF current route is a vendor
    //   if (APP.permissions.system_access.vendor == 'none') {
    //     this.router.navigateByUrl('/')
    //   }
    //   this.state.editable = APP.permissions.system_access.vendor == 'edit';
    // }
  }

  setOrgFlat(data: any[], stage?: any): any {
    _.forEach(data, (value) => {
      let level = stage;
      value['level'] = level;
      this.state.org.flatList.push(value);
      if (value.children && value.children.length) {
        level = level + 1;
        this.setOrgFlat(value.children, level);
      }
    });
  }

  getOrgDetails(): void {
    this._contactService.getOrgDetails({ org_type: this.state.org.selected['org_type'], org_id: this.state.org_id })
      .then(response => {
        if (response.result.success) {
          this.state.org.counts = response.result.data;
          this._contactService.setOrganizationDetailCount(response.result.data);
        }
      });
  }

  getTabDetails(tab) {
    this.search = { value: "" };
    this._router.navigate([tab.route], { relativeTo: this._activeRoute })
  }

  searchList(val) {
    this._contactService.update({ type: 'search', data: val });
  }

  addRelatedTab() {
    this._contactService.update({ type: 'add', data: null });
  }

}
