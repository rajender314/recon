import { Component, OnInit } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
// import { CreateRelatedJobComponent } from '../create-related-job/create-related-job.component';
import * as _moment from 'moment';
import { OldJobStoriesComponent } from '../old-job-stories/old-job-stories.component';
var APP: any = window['APP'];

@Component({
  selector: 'app-job-stories',
  templateUrl: './job-stories.component.html',
  styleUrls: ['./job-stories.component.scss']
})
export class JobStoriesComponent implements OnInit {
  public jobStories = [];
  public dialogRef: any;
  public clientinfo = {};
  public projectID: any;
  public isOldJobStories:boolean=false;
  public companionJobs = {};
  isLoading: boolean = true;
  public state = {
    loader: true,
    projectInfo: {},
    showView: false,
    activeTab: 0,
    jobStoriesTabs: [
      { categery_id: 0, type: 0, label: 'ALL' },
      { categery_id: 5, type: 1, icon: 'task-completed', label: 'TASKS' },
      { categery_id: 1, type: 2, icon: 'products', label: 'PRODUCTS' },
      { categery_id: 3, type: 3, icon: 'post-bids', label: 'BIDS' },
      { categery_id: 4, type: 4, icon: 'pn-estimates', label: 'ESTIMATES' },
      { categery_id: 6, type: 5, icon: 'pn-purchase-orders', label: "PO'S" },
      { categery_id: 6, type: 6, icon: 'pn-purchase-orders', label: "MIO" }
    ],
    breadcrumbs: [
      { label: 'Projects', type: 'link', route: '/projects' },
      { label: '', type: 'text' }
    ]
  };
  constructor(private dialog: MatDialog,
    private commonService: CommonService,
    private route: ActivatedRoute,
    private activatedRoute: Router,
    private snackbar: MatSnackBar,
    private _router: ActivatedRoute) {
    _router.parent.params.subscribe(param => {
      this.projectID = param.id ? param.id : null;
    });
  }

  ngOnInit() {
    this.getJobStoriesList();
    this.state.loader = false;
  }
  jobStoriesChange(type, event) {
    this.isLoading = true;
    this.state.activeTab = type;
    if (type == 6) {
      this.jobStories = [{"filename":"Blue_Soho_MIO_Sample.xls","sheetname":"Weekly Ad Upload Template-Compl","id":"40668","user":"Kyle Tompkins","user_img":"image1403131071.jpeg","time":"Mon, Oct 15, 2018 11:51 AM CST","products":[{"label":"Johnson Group-2 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"JOHGRA"},{"label":"Henry Wurst, Inc.-3 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"HENWUR"},{"label":"IntegraColor Group-4 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"INTCOL"},{"label":"JKG Group-5 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"JKGGRO"},{"label":"A. J. Bart, Inc.-6 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"AJBART"},{"label":"National Print Group, Inc.-7 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"NATPRI"},{"label":"National Print Group, Inc.-8 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"NATPRI"},{"label":"Reed &amp; Witting Co.-9 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"REEWIT"},{"label":"Reed &amp; Witting Co.-10 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"REEWIT"},{"label":"American Litho, Inc.-11 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"AMLITHO"},{"label":"American Litho, Inc.-12 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"AMLITHO"},{"label":"American Litho, Inc.-13 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"AMLITHO"},{"label":"American Litho, Inc.-14 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"AMLITHO"},{"label":"Geographics, Inc.-15 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"GEOGRAP"},{"label":"Geographics, Inc.-16 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"GEOGRAP"},{"label":"Stonehouse Marketing-17 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"STOMKT"},{"label":"Stonehouse Marketing-18 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"STOMKT"},{"label":"John Roberts Co.-19 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"JOHROB"},{"label":"John Roberts Co.-20 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"JOHROB"},{"label":"Vertis Communications-21 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"VERDAL"},{"label":"Vertis Communications-22 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"VERDAL"},{"label":"KDM POP Solutions Group-23 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"KDMPOP"},{"label":"Target Direct Mailing Services-24 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"TARDIR"},{"label":"Jay Kay Press-25 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"JAYKAY"},{"label":"Jay Kay Press-26 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"JAYKAY"},{"label":"Test Vendor-27 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"TVO"},{"label":"Test Vendor-28 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"TVO"},{"label":"Enter Pi-29 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"ENTEPI"},{"label":"3PLogic-30 full color 4.889u201d x 21u201d outside,  1 black and white 9.889u201d x 21u201d inside.-Media Insertion-Blue-So","status":"1","vendor":"3PLOGI"}],"vendor_count":18,"pos":[{"label":"GRN001414623","approved":true,"status":1},{"label":"GRN001414998","approved":true,"status":1},{"label":"GRN001414999","approved":true,"status":1},{"label":"GRN001415000","approved":true,"status":1},{"label":"GRN001415001","approved":true,"status":1},{"label":"GRN001415002","approved":true,"status":1},{"label":"GRN001415003","approved":true,"status":1},{"label":"GRN001415004","approved":true,"status":1},{"label":"GRN001415005","approved":true,"status":1},{"label":"GRN001415006","approved":true,"status":1},{"label":"GRN001415007","approved":true,"status":1},{"label":"GRN001415008","approved":true,"status":1},{"label":"GRN001415009","approved":true,"status":1},{"label":"GRN001415010","approved":true,"status":1},{"label":"GRN001415011","approved":true,"status":1},{"label":"GRN001415012","approved":true,"status":1},{"label":"GRN001415013","approved":true,"status":1},{"label":"GRN001415014","approved":true,"status":1}]}];
    } else {
      this.commonService.saveApi('getJobStoriesLst', { type: event, jobs_id: this.projectID }).then(res => {
        if (res['result'].success) {
          this.isLoading = false;
          this.jobStories = res['result'].data.stories;
          this.isOldJobStories = res['result'].data.old_stories;
          this.jobStories.map(item => {
            item.created_date = _moment.utc(item.created_date).utcOffset(APP.user.timezone_offset).format('MMM DD, YYYY h:mm A')
          });
        }
      });
    }
  }
  getJobStoriesList() {
    this.isLoading = true;
    this.commonService.saveApi('getJobStoriesLst', { type: 0, jobs_id: this.projectID }).then(res => {
      if (res['result'].success) {
        this.isLoading = false;
        this.jobStories = res['result'].data.stories;
        this.isOldJobStories = res['result'].data.old_stories;
        this.jobStories.map(item => {
          item.created_date = _moment.utc(item.created_date).utcOffset(APP.user.timezone_offset).format('MMM DD, YYYY h:mm A')
        });
      }
    });
  }
  oldactivity(){
     this.dialogRef = this.dialog.open(OldJobStoriesComponent,{
      panelClass: 'recon-dialog',
      width: '900px',
      height: '600px',
      data: {
        title: 'Project Old Activity',
        projectID: this.projectID
      }
    });
  }

}
