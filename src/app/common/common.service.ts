import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import PerfectScrollbar from 'perfect-scrollbar';

var APP: any = window['APP'];

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  projectState: string = 'my';
  is_related_to_project: boolean;
  job_status_id: number;

  private updateEvent = new Subject<any>();

  update = obj => {
    this.updateEvent.next(obj)
  }

  onUpdate = (): Observable<any> => {
    return this.updateEvent.asObservable();
  }

  private responsiveView = new Subject<any>();

  onChange = (obj?) => {
    this.responsiveView.next(obj);
  }

  afterChange = (): Observable<any> => {
    return this.responsiveView.asObservable();
  }

  constructor(private http: HttpClient) { }

  getApi(url, param) {
    return this.http
      .get(APP.api_url + url, { params: param })
      .toPromise()
      .then(response => response)
  }

  saveApi(url, param) {
    return this.http
      .post(APP.api_url + url, param)
      .toPromise()
      .then(response => response)
  }

  deleteApi(url, param) {
    return this.http
      .delete(APP.api_url + url, {params: param})
      .toPromise()
      .then(response => response)
  }

  getCustomScrolls(reconScroll) {
    setTimeout(()=>{
      if(reconScroll._results.length){
        reconScroll._results.map((container)=>{
          new PerfectScrollbar(container.nativeElement);
        });
      }
    });
  }

}
