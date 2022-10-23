import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ObservableInput, Subject, Observable } from 'rxjs';

var APP: any = window['APP'];

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  /* Update Admin List Obseravable */
  private updateEvent = new Subject<any>();

  update = obj => {
    this.updateEvent.next(obj)
  }

  onUpdate = (): Observable<any> => {
    return this.updateEvent.asObservable();
  }

  private promise: ObservableInput<any>;

  constructor(private http: HttpClient) { }

  getApi(url, param) {
    return this.http
      .get(APP.api_url + url, { params: param })
      .toPromise()
      .then(response => response)
      .catch(this.handleError)
  }

  saveApi(url, param) {
    return this.http
      .post(APP.api_url + url, param)
      .toPromise()
      .then(response => response)
      .catch(this.handleError)
  }

  deleteApi(url, param) {
    return this.http
      .delete(APP.api_url + url, {params: param})
      .toPromise()
      .then(response => response)
      .catch(this.handleError)
  }

  getOrganizationTypes = () => {
    if (!this.promise) {
      this.promise = this.http
        .get(APP.api_url + 'getOrgTypes')
        .toPromise()
        .then(response => response)
        .catch(this.handleError)
    }
    return this.promise;
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
