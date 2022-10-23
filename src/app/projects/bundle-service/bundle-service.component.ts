import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
  selector: 'app-bundle-service',
  templateUrl: './bundle-service.component.html',
  styleUrls: ['./bundle-service.component.scss']
})
export class BundleServiceComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<BundleServiceComponent>,
    public commonService: CommonService,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

  saveDialog = () => {
    this.commonService.saveApi(this.data.saveApi, this.data.postParams)
    .then(res => {
      if(res['result'] && res['result'].success){
        this.dialogRef.close({success: true, response: res['result']});
      }
    });
  }
  
}
