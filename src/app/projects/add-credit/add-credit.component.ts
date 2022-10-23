import { Component, OnInit, Inject } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AddEstimateComponent } from '@app/projects/add-estimate/add-estimate.component';

@Component({
  selector: 'app-add-credit',
  templateUrl: './add-credit.component.html',
  styleUrls: ['./add-credit.component.scss']
})
export class AddCreditComponent implements OnInit {
  numberConfig: any = {
		prefix: '',
		limit: 10,
		centsLimit: 2,
		isCancel: false,
		centsSeparator: false,
		thousandsSeparator: false
  };
  public state = {
    loader: true
  };
  constructor(
    private commonService: CommonService,
    public dialogRef: MatDialogRef<AddCreditComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
  }

  close(): void {
    this.dialogRef.close();
  }

  onEditorActive() {
    this.state.loader = false;
  }

  save() {
    if(this.data.data.notes!='' && this.data.data.gross_amount!=''){
      this.dialogRef.close({ success: true, data: this.data });
    }
  }

}
