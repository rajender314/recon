import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog, MatSnackBar } from '@angular/material';
import { CreateRelatedProjectsComponent } from '@app/projects/project-details/create-related-projects/create-related-projects.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  host: {
    class: ""
  },
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy {

  projectID: number;
  overviewDetails: any;
  clientsRoute: string = '';
  breadcrumbs = [
    { label: 'Projects', type: 'link', route: '/projects' },
    { label: 'Name', type: 'text' },
  ];

  public state = {
    relatedJobsLoader: true,
    relatedProjects: [
      { id: 1, job_title: 'Media Placement Buy', job_no: 'AHAIV0000045' },
      { id: 1, job_title: 'AHA - outdoor billboard', job_no: 'AHAIV0000045' },
      { id: 1, job_title: '12', job_no: 'AHAIV0000045' },
      { id: 1, job_title: 'Acc Brochure', job_no: 'AHAIV0000045' },
      { id: 1, job_title: 'AHA Email Marketing', job_no: 'AHAIV0000045' }
    ]
  }

  routerSubscription: Subscription;
  subscription: Subscription;

  constructor(
    private _router: ActivatedRoute,
    private _dialog: MatDialog,
    private _commonService: CommonService,
    private snackbar: MatSnackBar
  ) {
    this.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
    this.routerSubscription = this._router.parent.params.subscribe(param => {
      this.projectID = param.id ? param.id : null;
      this.clientsRoute = '/projects/' + this.projectID + '/project-info';
      this.getOverviewData(this.projectID);
      this.getRelatedJobs();
    });

    this.subscription = _commonService.onUpdate().subscribe(obj => {
      if (obj.type == 'projectName' && Object.keys(obj.data).length) {
        this.breadcrumbs[1].label = obj.data.job_title || '----';
      }
    })
  }

  ngOnInit() {
    // this.getOverviewData(this.projectID);
    // this.getRelatedJobs();
  }

  getRelatedJobs(){
    this.state.relatedJobsLoader = true;
    this._commonService.getApi('getRelatedJobs', { jobs_id: this._router.parent.snapshot.params.id })
      .then(res => {
        this.state.relatedJobsLoader = false;
        if (res['result'].success) {
          this.state.relatedProjects = res['result'].data || [];
        }
    });
  }

  goToJob(job){
    location.hash = '/projects/'+job.jobs_id+'/overview';
  }

  deleteJob(job){
    this._commonService.update({ type: 'overlay', action: 'start' });
    this._commonService.deleteApi('delRelatedJob', { id: job.id })
    .then(res => {
      if (res['result'].success) {
        this.state.relatedProjects =  this.state.relatedProjects.filter((project)=>{
          return (job.id==project.id)?false:true;
        });
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Project Removed Successfully.' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
      }
      this._commonService.update({ type: 'overlay', action: 'stop' });
    }).catch(err =>{
      this._commonService.update({ type: 'overlay', action: 'stop' });
    })
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    this.subscription.unsubscribe();
  }

  changeMasterView() {
    this._commonService.onChange();
  }

  getOverviewData(id) {
    this._commonService.getApi('jobOverview', { id: id })
      .then(res => {
        if (res['result'].success) {
          this.overviewDetails = res['result'].data || {};
        }
      })
  }

  createRelatedProjects() {
    this._dialog.open(CreateRelatedProjectsComponent, {
      panelClass: 'recon-dialog',
      width: '720px',
      height: '478px',
      data: {
        title: 'Add Related Projects',
        jobs_id: this._router.parent.snapshot.params.id,
      }
    })
    .afterClosed()
    .subscribe(res => {
      if (res && res.success) {
        this.getRelatedJobs();
      }
    });
  }

}
