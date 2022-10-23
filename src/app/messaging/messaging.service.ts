import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, ObservableInput, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '@app/core/auth/auth.service';

var APP:any = window['APP'];

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  private url = {
    getUsers: APP.api_url + 'getDropdownMaster',
    saveThread: APP.api_url + 'saveThread',
    getthreadList: APP.api_url + 'thread',
    saveMessage: APP.api_url + 'saveMessage',
    saveFlag: APP.api_url + 'saveFlag',
    saveRead: APP.api_url + 'saveRead',
    jobsList: APP.api_url + 'userJobList',
    groupsList: APP.api_url + 'getGroups'
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  private createMessageEvent: Subject<any> = new Subject();
  createMessageEvent$ = this.createMessageEvent.asObservable();

  getMessage(msg): any{
    this.createMessageEvent.next(msg);
  }

  getUsers(params: any): Observable<any> {
    return this.http
      .get(this.url.getUsers, {params: params})
      .pipe(map(response => response));
  }

  getGroups(params: any): Observable<any> {
    return this.http
      .get(this.url.groupsList, {params: params})
      .pipe(map(response => response));
  }

  getJobs(params: any): Observable<any> {
    return this.http
      .post(this.url.jobsList, params)
      .pipe(map(response => response));
  }
  
  saveRead(params: any): Observable<any> {
    return this.http
      .post(this.url.saveRead, params)
      .pipe(map(response => response));
  }

  saveFlag(params: any): Observable<any> {
    return this.http
      .post(this.url.saveFlag, params)
      .pipe(map(response => response));
  }

  createThread(url, params: any): Observable<any> {
    return this.http
      .post(url, params)
      .pipe(map(response => response));
  }

  getThreadList(params): Observable<any> {
    return this.http
      // .get(this.url.getthreadList, {params: Object.assign(params, {users_id: this.authService.getUserId()})})
      .get(this.url.getthreadList, {params: Object.assign(params, {users_id: this.authService.getReconUserId()})})
      .pipe(map(response => response));
  }

  getThreadDetails(params): Observable<any> {
    return this.http
      .get(this.url.getthreadList, {params})
      .pipe(map(response => response));
  }

  createMessage(params: any): Observable<any> {
    return this.http
      .post(this.url.saveMessage, params)
      .pipe(map(response => response));
  }

  addRecipients(url, params): Observable<any> {
    return this.http
      .post(APP.api_url + url, params)
      .pipe(map(response => response));
  }

  

  /*getUsers(params: any): Promise<any> {
    return this.http
      .get(this.url.getUsers, {params: params})
      .toPromise()
      .then(response => response);
  }
  
  createThread(params: any) {
    return this.http
      .post(this.url.saveThread, params)
      .toPromise()
      .then(response => response);
  }*/
  


}
