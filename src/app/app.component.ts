import { Component, AfterViewInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, ActivationEnd } from '@angular/router';
import { HttpCancelService } from './core/auth/http-cancel.service';
import { CommonService } from '@app/common/common.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public showOverlay = false;

  constructor(
    private router: Router, 
    private httpCancelService: HttpCancelService,
    private commonService: CommonService
  ) {
    commonService.onUpdate().subscribe(ev => {
      if(ev.type=='overlay' && ev.action=='start'){
        this.showOverlay = true;
      }else if(ev.type=='overlay' && ev.action=='stop'){
        this.showOverlay = false;
      }
    });
  }

  title = 'app';
  loading: boolean = false;

  ngAfterViewInit() {
    this.router.events
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.loading = true;
        }
        else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel
        ) {
          this.loading = false;
        }

        // if (event instanceof ActivationEnd) {
        //   this.httpCancelService.cancelPendingRequests()
        // }
      });
      // this.commonService.update({ type: 'overlay', action: 'start' });
      // setTimeout(()=>{
      //   this.commonService.update({ type: 'overlay', action: 'stop' });
      // },3000);
  }
}
