import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
// import { CreateRelatedJobComponent } from '../create-related-job/create-related-job.component';
import * as _moment from 'moment';
var APP:any =window['APP'];

@Component({
  selector: 'app-old-job-stories', 
  templateUrl: './old-job-stories.component.html',
  styleUrls: ['./old-job-stories.component.scss']
})
export class OldJobStoriesComponent implements OnInit {
  public jobStories =[];
  isLoading:boolean=true;
  public projectID:any;
  constructor(
    private commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data) {}

    ngOnInit() {
      this.getJobStoriesList();
    } 
    getJobStoriesList() { 
      
      this.isLoading = true;
      this.commonService.saveApi('getMigrateJobStories', {type: 0, jobs_id: this.data.projectID }).then(res => {
        if (res['result'].success) {
          this.isLoading = false;
          this.jobStories = res['result'].data;
          this.jobStories.map(item => {
            item.created_date =  _moment.utc(item.created_date).utcOffset(APP.user.timezone_offset).format('MMM DD, YYYY h:mm A')
          });  
        } 
      });  }

}
