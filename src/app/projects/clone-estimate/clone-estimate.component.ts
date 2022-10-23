import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
  selector: 'app-clone-estimate',
  templateUrl: './clone-estimate.component.html',
  styleUrls: ['./clone-estimate.component.scss']
})
export class CloneEstimateComponent implements OnInit {

  public state = {
    list: [],
    selectedEstimate: '',
    loader: true
  }

  constructor(
    private dialogRef: MatDialogRef<CloneEstimateComponent>,
    private commonService: CommonService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.state.loader = false;
    if(this.data.estimates && this.data.estimates.length){
      this.state.list = this.data.estimates.filter((estimate)=>{
        return estimate.parent_id=='0';
      });
      this.state.selectedEstimate = this.state.list[0].id;
    }
  }

  close(): void{
    this.dialogRef.close();
  }

  save(): void{
    this.commonService.update({ type: 'overlay', action: 'start' });
    this.commonService.saveApi('copyEstimate', {
      jobs_id: this.data.job_id,
      estimates_id: this.state.selectedEstimate
    })
      .then(res => {
        this.state.loader = false;
        if (res['result'] && res['result'].success) {
          this.dialogRef.close({ success: true, response: res['result'] });
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Estimate Copied Successfully.' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
        }
        this.commonService.update({ type: 'overlay', action: 'stop' });
      }).catch(err =>{
        this.commonService.update({ type: 'overlay', action: 'stop' });
      });
  }

}
