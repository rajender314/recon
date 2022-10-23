import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
var APP:any = window['APP'];

@Injectable({
  providedIn: 'root'
})
export class ContactsService {

  private search = new Subject<any>();
  private orgCount = new Subject<any>();
  private leftNavCount = new Subject<any>();
  private dropdownList = new Subject<any>();
  private contactSearch = '';
  private listOrganizationsApi = APP.api_url + 'getOrgs';
  private listOrganizationsFlatApi = APP.api_url + 'getOrgList';
  private addOrganizationApi = APP.api_url + 'addOrgs';

  private orgDetails = {
    address: APP.api_url + 'getOrgAddress',
    addAddress: APP.api_url + 'addOrgAddress',
    contacts: APP.api_url + 'getOrgContacts',
    addContact: APP.api_url + 'addContact',
    subOrgs: APP.api_url + 'getSubOrgs',
    addSubOrg: APP.api_url + 'addSubOrgs',
    getCountries: APP.api_url + 'getCountries',
    getStates: APP.api_url + 'getStates',
    getDropdownMaster: APP.api_url + 'getDropdownMaster',
    deleteAddress: APP.api_url + 'delOrgAddress',
    deleteContact: APP.api_url + 'delContact',
    deleteSubOrg: APP.api_url + 'delSubOrgs',
    getCertifications: APP.api_url + 'getCertifications',
    addCertifications: APP.api_url + 'addCertifications',
    saveGeneral: APP.api_url + 'addOrgOthers',
    getOverviewData: APP.api_url + 'getOrgOverview',
    addOverviewData: APP.api_url + 'addWebsites',
    getOrgOthers: APP.api_url + 'getOrgOthers',
    saveClientOthers: APP.api_url + 'addClientOthers',
    getOrgCounts: APP.api_url + 'getOrgCounts'
  }

  constructor(private http: HttpClient) { }

  private updateEvent = new Subject<any>();

  update = obj => {
    this.updateEvent.next(obj)
  }

  onUpdate = (): Observable<any> => {
    return this.updateEvent.asObservable();
  }

  selectedOrganization = null;
  selectedOrgDetails = null;

  setOrganization(data = null) {
    this.selectedOrganization = data;
  }

  getOrganization() {
    return this.selectedOrganization;
  }

  getApi(url, param): Promise<any>{
    return this.http
      .get(APP.api_url + url, { params: param })
      .toPromise()
      .then(response => response)
  }

  saveApi(url, param): Promise<any>{
    return this.http
      .post(APP.api_url + url, param)
      .toPromise()
      .then(response => response)
  }

  deleteApi(url, param): Promise<any> {
    return this.http
      .delete(APP.api_url + url, {params: param})
      .toPromise()
      .then(response => response)
  }

  getOrgOthers(param: any): Promise<any> {
    return this.http
      .get(this.orgDetails.getOrgOthers, {params: param})
      .toPromise()
      .then(response => response)
  }

  getOverviewData(param: any): Promise<any> {
    return this.http
      .get(this.orgDetails.getOverviewData, {params: param})
      .toPromise()
      .then(response => response)
  }

  addOverviewData(param: any): Promise<any> {
    return this.http
      .post(this.orgDetails.addOverviewData, param)
      .toPromise()
      .then(response => response)
  }

  saveGeneralSection(param: any): Promise<any> {
    return this.http
      .post(this.orgDetails.saveGeneral, param)
      .toPromise()
      .then(response => response)
  }

  saveClientOthers(param: any): Promise<any> {
    return this.http
      .post(this.orgDetails.saveClientOthers, param)
      .toPromise()
      .then(response => response)
  }

  getCertifications(param: any): Promise<any> {
    return this.http
      .get(this.orgDetails.getCertifications, {params: param})
      .toPromise()
      .then(response => response)
  }

  saveCertifications(param: any): Promise<any> {
    return this.http
      .post(this.orgDetails.addCertifications, param)
      .toPromise()
      .then(response => response)
  }

  deleteAddress(param: any): Promise<any> {
    return this.http
      .delete(this.orgDetails.deleteAddress, {params: param})
      .toPromise()
      .then(response => response)
  }

  deleteContact(param: any): Promise<any> {
    return this.http
      .delete(this.orgDetails.deleteContact, {params: param})
      .toPromise()
      .then(response => response)
  }

  deleteSubOrg(param: any): Promise<any> {
    return this.http
      .delete(this.orgDetails.deleteSubOrg, {params: param})
      .toPromise()
      .then(response => response)
  }
  
  getOrganizations(param: any): Promise<any> {
    return this.http
      .get(this.listOrganizationsApi, {params: param})
      .toPromise()
      .then(response => response)
  }

  getDropdownMaster(param: any): Promise<any> {
    return this.http
      .get(this.orgDetails.getDropdownMaster, {params:param})
      .toPromise()
      .then(response => response)
  }

  setDropdownMasterList(list: any) {
      this.dropdownList.next(list);
  }

  getDropdownMasterList(): Observable<any> {
      return this.dropdownList.asObservable();
  }

  getOrganizationsList(param: any): Promise<any> {
    return this.http
      .get(this.listOrganizationsFlatApi, {params:param})
      .toPromise()
      .then(response => response)
  }

  addOrganization(param: any): Promise<any> {
    return this.http
      .post(this.addOrganizationApi, param)
      .toPromise()
      .then(response => response)
  }

  addSubOrganization(param: any): Promise<any> {
    return this.http
      .post(this.orgDetails.addSubOrg, param)
      .toPromise()
      .then(response => response)
  }

  setOrgSearch(message: string) {
    this.contactSearch = message;
    this.search.next({ search: message });
  }

  getOrgSearch(): string{
    return this.contactSearch;
  }

  triggerOrgSearch(): Observable<any> {
      return this.search.asObservable();
  }

  setOrganizationCount(orgCount: any) {
    this.selectedOrgDetails = orgCount;
    //  this.orgCount.next({ count: orgCount });
  }

  getOrganizationCount(): Observable<any> {
    return this.selectedOrgDetails;
      // return this.orgCount.asObservable();
  }

  setOrganizationDetailCount(org: any) {
      this.leftNavCount.next(org);
  }

  getOrganizationDetailCount(): Observable<any> {
      return this.leftNavCount.asObservable();
  }

  getOrgDetails(param: any): Promise<any>{
    return this.http
      .get(this.orgDetails.getOrgCounts, {params:param})
      .toPromise()
      .then(response => response)
  }

  getOrgAddress(param: any): Promise<any>{
    return this.http
      .get(this.orgDetails.address, {params:param})
      .toPromise()
      .then(response => response)
  }

  addAddress(param: any): Promise<any>{
    return this.http
      .post(this.orgDetails.addAddress, param)
      .toPromise()
      .then(response => response)
  }

  addContact(param: any): Promise<any>{
    return this.http
      .post(this.orgDetails.addContact, param)
      .toPromise()
      .then(response => response)
  }

  getCountries(): Promise<any>{
    return this.http
      .get(this.orgDetails.getCountries)
      .toPromise()
      .then(response => response)
  }

  getStates(param: any): Promise<any>{
    return this.http
      .get(this.orgDetails.getStates+"/"+param.id)
      .toPromise()
      .then(response => response)
  }

  getOrgContacts(param: any): Promise<any>{
    return this.http
      .get(this.orgDetails.contacts, {params:param})
      .toPromise()
      .then(response => response)
  }

  getOrgSubOrgs(param: any): Promise<any>{
    return this.http
      .get(this.orgDetails.subOrgs, {params:param})
      .toPromise()
      .then(response => response)
  }

}
