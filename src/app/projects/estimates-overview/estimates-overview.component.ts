import { Component, OnInit, Input } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import * as _moment from 'moment';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar, MatDialog } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AddMilestonesComponent } from '@app/projects/add-milestones/add-milestones.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { ProjectDetailsService } from '@app/projects/project-details/project-details.service';

var APP: any = window['APP'];

@Component({
  selector: 'app-estimates-overview',
  templateUrl: './estimates-overview.component.html',
  styleUrls: ['./estimates-overview.component.scss']
})
export class EstimatesOverviewComponent implements OnInit {

  @Input('status') estimateStatus: any;
  @Input('estimate') estimate: any;
  @Input('projectStatusID') projectStatusID: any;
  @Input('allowEditable') allowEditable: boolean;
  public APP = APP;

  public state = {
    loader: true,
    unlockSave: false,
    distributionList: [],
    description: '',
    distribution_id: '',
    products: [],
    estimateDt: {
      distribution_id: '',
      description: ''
    },
    estimateDtBak: {},
    timeline: [],
    masterData: [],
    timelineLoader: true,
    minDate: new Date()
  };

  estimateDetails: FormGroup;

  constructor(
    private commonService: CommonService,
    private _projectDetailService: ProjectDetailsService,
    private activeRoute: ActivatedRoute,
    private snackbar: MatSnackBar,
    private _fb: FormBuilder,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.createForm();
    this.getEstimatesData();
  }

  createForm() {
    this.estimateDetails = this._fb.group({
      distribution_id: '',
      description: ''
    })
  }

  setForm(data) {
    this.estimateDetails.setValue(data);
  }

  getEstimatesData(): void {
    this.state.loader = true;
    forkJoin(
      this.commonService.getApi('estCstAnalysis', {
        estimate_id: this.estimate.selected_revision,//this.activeRoute.snapshot.params.estimate_id,
        jobs_id: this.activeRoute.parent.snapshot.params.id
      }),
      this.commonService.getApi('distributionsList', {
        jobs_id: this.activeRoute.parent.snapshot.params.id
      }),
      this.commonService.getApi('estTimeLine', {
        jobs_id: this.activeRoute.parent.snapshot.params.id,
        // estimates_id: this.activeRoute.snapshot.params.estimate_id
        estimates_id: this.estimate.selected_revision
      })
    ).subscribe(([response1, response2, response3]) => {
      if (response1['result'] && response1['result'].success) {
        this.state.products = response1['result'].data.products;
        this.state.estimateDt = response1['result'].data.estimateDt;
        this.setForm({ distribution_id: this.state.estimateDt.distribution_id, description: this.state.estimateDt.description });
        // this.state.estimateDtBak = _.cloneDeep(response1['result'].data.estimateDt);
      }
      if (response2['result'].success) {
        this.state.distributionList = response2['result'].data;
        if (this.state.distributionList.length && this.state.estimateDt.distribution_id == '') {
          this.state.estimateDt.distribution_id = this.state.distributionList[0].id;
        }
      }
      if (response3['result'].success) {
        this.state.timelineLoader = false;
        response3['result'].data.list.map((task)=>{
          if(task.timeline_date && task.timeline_date!=''){
            task.timeline_date = new Date(task.timeline_date);
          }
        });
        this.state.timeline = response3['result'].data.list;
        this.state.masterData = response3['result'].data.masterDt;
      }
      if (response1['result'].success && response2['result'].success) {
        this.state.loader = false;
      }
    });
  }

  estimateDistroChange(event){
    this.state.unlockSave = true;
    if(event!=this.state.estimateDt.distribution_id){
      this.dialog.open(ConfirmationComponent, {
        panelClass: 'recon-dialog',
        width: '570px',
        data: { 
          title: 'Delete Split Estimates',
          content: `<div class="po-dialog">
                <div class="">
                  <span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
                </div>
                <div class="">
                  <p>If any splits are present it will be deleted. Are you sure you want to proceed?</p>
                </div>
              </div>`,
          buttons: {
            yes: 'Ok',
            no: 'Cancel'
          }
         }
      })
        .afterClosed()
        .subscribe(res => {
          if(res && res.success){
  
          }else{
            this.resetDistro();
          }
        })
    }
  }

  estimateChange(): void {
    this.state.unlockSave = true;
  }

  resetDistro(){
    this.estimateDetails.controls.distribution_id.setValue(this.state.estimateDt.distribution_id);
  }

  reset() {
    this.estimateDetails.reset({
      distribution_id: this.state.estimateDt.distribution_id,
      description: this.state.estimateDt.description
    });
    this.estimateDetails.markAsPristine();
    // this.state.estimateDt = _.cloneDeep(this.state.estimateDtBak);
  }

  save() {
    this.commonService.saveApi('createEstimate', {
      jobs_id: this.activeRoute.parent.snapshot.params.id,
      description: this.estimateDetails.value.description,
      distribution_id: this.estimateDetails.value.distribution_id,
      // id: this.activeRoute.snapshot.params.estimate_id,
      id: this.estimate.selected_revision,
      type: 'overview'
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.state.estimateDt = { ...this.state.estimateDt, ...this.estimateDetails.value };
          this.estimateDetails.markAsPristine();
          // this.state.estimateDtBak = _.cloneDeep(this.state.estimateDt);
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Estimate Details Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          if(this.estimate.status_id==2){
            this._projectDetailService.update({
              type: 'subnav-status', data: {
                selected: {
                  id: this.estimate.id,
                  status_id: 1,
                  status_name: 'Draft',
                }
              }
            });
          }
        }
      });
  }

  addMilestones() {
    this.dialog.open(AddMilestonesComponent, {
      panelClass: 'recon-dialog',
      width: '660px',
      height: '478px',
      data: {
        title: 'Add Task/Milestone',
        jobs_id: this.activeRoute.parent.snapshot.params.id,
        // estimates_id: this.activeRoute.snapshot.params.estimate_id,
        estimates_id: this.estimate.selected_revision,
        list: this.state.masterData
      }
    })
    .afterClosed()
    .subscribe(result => {
      if (result && result.success) {
        this.state.timelineLoader = true;
        this.commonService.getApi('estTimeLine', {
          jobs_id: this.activeRoute.parent.snapshot.params.id,
          estimates_id: this.estimate.selected_revision
          // estimates_id: this.activeRoute.snapshot.params.estimate_id
        }).then(res=>{
          if(res['result'].success) {
            this.state.timelineLoader = false;
            res['result'].data.list.map((task)=>{
              if(task.timeline_date && task.timeline_date!=''){
                task.timeline_date = new Date(task.timeline_date);
              }
            });
            this.state.timeline = res['result'].data.list;
            this.state.masterData = res['result'].data.masterDt;
          }
        });
      }
    });
  }

  changeTaskDate(ev, task){
    let params = {
      id: task.id,
      jobs_id: this.activeRoute.parent.snapshot.params.id,
      // estimates_id: this.activeRoute.snapshot.params.estimate_id,
      estimates_id: this.estimate.selected_revision,
      due_date: ev.value ? _moment(ev.value).format('YYYY-MM-DD HH:mm:ss') : null,
      type: 'edit'
    };
    this.commonService.saveApi('saveEstTimeLn', params).then((res) => {
      if (res && res['result'] && res['result'].success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Milestone Updated Successfully.' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
      }
    });
  }

  deleteMilestone(task){
    this.commonService.deleteApi('rmEstTimeLine', { id: task.id })
    .then(res => {
      if (res['result'].success) {
        this.state.timeline =  this.state.timeline.filter((milestone)=>{
          return (task.id==milestone.id)?false:true;
        });
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Milestone Removed Successfully.' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
      }
    })
  }

}
