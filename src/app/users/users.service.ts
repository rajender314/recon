import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

var APP: any = window['APP'];

@Injectable({
	providedIn: 'root'
})
export class UsersService {

	private userRoles = {
		get: APP.api_url + 'userRoles',
		save: APP.api_url + 'saveUserRoles'
	}

	private state = {
		getUsers: APP.api_url + 'getOrgUser',
		getUserData: APP.api_url + 'users',
		saveUser: APP.api_url + 'saveUser',
		createUser: APP.api_url + 'addUser',
		searchContact: APP.api_url + 'searchContact',
		addContactUser: APP.api_url + 'addContactUser',
		getOrgGroups: APP.api_url + 'getOrgGroups',
		updateOrgGroups: APP.api_url + 'updateOrgGroups',
		userRoles: APP.api_url + 'userRoles',
		roleUsers: APP.api_url + 'roleUsers',
		saveRoleUsers: APP.api_url + 'saveRoleUsers',
		saveExternalApps: APP.api_url + 'saveExternalApps',
		uploadLogo: APP.api_url + 'saveUserLogo',
		uploadCompanyCode: APP.api_url + 'saveCompanyCodeTemplates',
		removeLogo: APP.api_url + 'deleteUserLogo',
		saveOrgLogo: APP.api_url + 'saveOrgLogo',
		delOrgLogo: APP.api_url + 'delOrgLogo',
		staticData: 'https://api.myjson.com/bins/ly7d1',
		getClientAccess: APP.api_url + 'getClientAccess',
		saveClientAccess: APP.api_url + 'saveClientAccess',
		getUserPreferences: APP.api_url + 'getUserPreferences',
		savePreferences: APP.api_url + 'saveUserPreferences',
		sendInvitation: APP.api_url + 'inviteExternalApps',
		getClientJobAccess: APP.api_url + 'getClientJobAccess',
		getVendorSystemAccess: APP.api_url + 'getVendorAccess',
		saveClientJobAccess: APP.api_url + 'saveClientJobAccess',
		saveVendorSystemAccess: APP.api_url + 'saveVendorAccess',
		getUserRoleContacts: APP.api_url + 'getUserRoleContacts',
		saveUserStatus: APP.api_url + 'saveUserStatus',
		getCompanyClientAccess: APP.api_url + 'getCompanyClientAccess',
		saveCompanyClientAccess: APP.api_url + 'saveCompanyClientAccess',
		getScheduleTemplateClients: APP.api_url + 'getScheduleTemplateClients',
		saveScheduleTemplateClients: APP.api_url + 'saveScheduleTemplateClients'
	}

	private permissions = APP.api_url + 'permissions';
	private externalApps = APP.api_url + 'getExternalApps';

	constructor(private http: HttpClient) { }

	getScheduleTemplateClients = param => {
		return this.http
			.get(this.state.getScheduleTemplateClients, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveScheduleTemplateClients = param => {
		return this.http
			.post(this.state.saveScheduleTemplateClients, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getUserRoleContacts = param => {
		return this.http
			.get(this.state.getUserRoleContacts, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getUserPreferences = param => {
		return this.http
			.get(this.state.getUserPreferences, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getCompanyClientAccess = param => {
		return this.http
			.get(this.state.getCompanyClientAccess, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveCompanyClientAccess = param => {
		return this.http
			.post(this.state.saveCompanyClientAccess, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveUserStatus = param => {
		return this.http
			.post(this.state.saveUserStatus, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	savePreferences = param => {
		return this.http
			.post(this.state.savePreferences, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveClientAccess = param => {
		return this.http
			.post(this.state.saveClientAccess, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getClientAccess = param => {
		return this.http
			.get(this.state.getClientAccess, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveOrgLogo = param => {
		return this.http
			.post(this.state.saveOrgLogo, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	delOrgLogo = param => {
		return this.http
			.delete(this.state.delOrgLogo, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	uploadLogo = param => {
		return this.http
			.post(this.state.uploadLogo, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	uploadCompanyCode = param => {
		return this.http
			.post(this.state.uploadCompanyCode, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getStaticData = param => {
		return this.http
			.get(this.state.staticData, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	removeLogo = param => {
		return this.http
			.delete(this.state.removeLogo, { params:param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	userRolesDp = param => {
		return this.http
			.get(this.state.userRoles, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	roleUsers = param => {
		return this.http
			.get(this.state.roleUsers, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveRoleUsers = param => {
		return this.http
			.post(this.state.saveRoleUsers, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveExternalApps = param => {
		return this.http
			.post(this.state.saveExternalApps, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	sendInvitation = param => {
		return this.http
			.post(this.state.sendInvitation, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getOrgGroups = param => {
		return this.http
			.get(this.state.getOrgGroups, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	updateOrgGroups = param => {
		return this.http
			.post(this.state.updateOrgGroups, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getUsers = param => {
		return this.http
			.get(this.state.getUsers, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getUserData = param => {
		return this.http
			.get(this.state.getUserData, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	searchContact = param => {
		return this.http
			.post(this.state.searchContact, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	createUser = param => {
		return this.http
			.post(this.state.createUser, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	addContactUser = param => {
		return this.http
			.post(this.state.addContactUser, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveUser = param => {
		return this.http
			.post(this.state.saveUser, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getUserRoles = param => {
		return this.http
			.get(this.userRoles.get, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveUserRole = param => {
		return this.http
			.post(this.userRoles.save, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveClientJobAccess = param => {
		return this.http
			.post(this.state.saveClientJobAccess, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	saveVendorSystemAccess = param => {
		return this.http
			.post(this.state.saveVendorSystemAccess, param)
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getPermissions = param => {
		return this.http
			.get(this.permissions, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getClientJobAccess = param => {
		return this.http
			.get(this.state.getClientJobAccess, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getVendorSystemAccess = param => {
		return this.http
			.get(this.state.getVendorSystemAccess, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}

	getExternalApps = param => {
		return this.http
			.get(this.externalApps, { params: param })
			.toPromise()
			.then(response => response)
			.catch(this.handleError)
	}


	private handleError(error: any): Promise<any> {
		console.error('An error occurred', error);
		return Promise.reject(error.message || error);
	}
}
