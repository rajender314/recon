import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { SessionRestoreComponent } from '@app/dialogs/session-restore/session-restore.component';
import { HttpCancelService } from './http-cancel.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  counter: number = 0;
  checkSum: any = {};
  dt = new Date();

  constructor(
    private dialog: MatDialog,
    private httpCancelService: HttpCancelService,
    public authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let key = '';
    if(request.method == 'GET') {
      key = request.url.split('/').pop();
      if(!this.checkSum[key]) this.checkSum[key] = {};
    }
    request = request.clone({
      setHeaders: {
        'X-Auth-Token': this.authService.getToken(),
        'X-Jwt-Token': this.authService.getJAuthToken()
      },
      setParams: {
        'time_zone': String(this.dt.getTimezoneOffset())
        /*'rapidium_act': this.checkSum[key] ? (this.checkSum[key].hasOwnProperty('rapidium_act') ? this.checkSum[key].rapidium_act : true) : true,
        'rapidium_checksum': this.checkSum[key] ? (this.checkSum[key].rapidium_checksum || '') : ''*/
      }
    });
    return next.handle(request)
    .pipe(
      tap(event => {
        if(event instanceof HttpResponse){
          if(event.body.hasOwnProperty('status_code') && event.body.status_code == 401){
            if(this.counter == 0)
              this.sessionDestroy(401);
            this.counter++;
          }else if(event.body.hasOwnProperty('status_code') && event.body.status_code == 502){
            if(this.counter == 0)
              this.sessionDestroy(502);
            this.counter++;
          }
          /*else {
            if(request.method == 'GET') {
              this.checkSum[key].rapidium_act = event.body.result.rapidium_act;
              this.checkSum[key].rapidium_checksum = event.body.result.rapidium_checksum;
            }
          }*/
        }
      })/*,
      takeUntil(this.httpCancelService.onCancelPendingRequests())*/
    )
  }

  sessionDestroy(type) {
    this.dialog.open(SessionRestoreComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      disableClose: true,
      data: {
        type: type
      }
    })
    .afterClosed()
    .subscribe(res => {
      this.counter = 0;
    })
  }
}