import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-copy-split-estimate',
  templateUrl: './copy-split-estimate.component.html',
  styleUrls: ['./copy-split-estimate.component.scss']
})
export class CopySplitEstimateComponent implements OnInit {

  loader: false;
  public state = {
    preTax: '0.00',
    tax: '0.00',
    cost: '0.00'
  }

  constructor(
    public dialogRef: MatDialogRef<CopySplitEstimateComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.calculateTotals();
  }

  calculateTotals(){
    this.data.split_estimates.map((estimate)=>{
      if(estimate.pre_tax && estimate.pre_tax!=''){
        if(estimate.pre_tax.indexOf('$')>-1){
          this.state.preTax = (<any>parseFloat(this.state.preTax)) + parseFloat(estimate.pre_tax.split('$')[1].split(',').join(''));
        }else{
          this.state.preTax = (<any>parseFloat(this.state.preTax)) + parseFloat('0.00');
        }
        this.state.preTax = (<any>this.state.preTax).toFixed(2);
      }
      if(estimate.tax && estimate.tax!=''){
        if(estimate.tax.indexOf('$')>-1){
          this.state.tax = (<any>parseFloat(this.state.tax)) + parseFloat(estimate.tax.split('$')[1].split(',').join(''));
        }else{
          this.state.tax = (<any>parseFloat(this.state.tax)) + parseFloat('0.00');
        }
        this.state.tax = (<any>this.state.tax).toFixed(2);
      }
      if(estimate.cost && estimate.cost!=''){
        if(estimate.cost.indexOf('$')>-1){
          this.state.cost = (<any>parseFloat(this.state.cost)) + parseFloat(estimate.cost.split('$')[1].split(',').join(''));
        }else{
          this.state.cost = (<any>parseFloat(this.state.cost)) + parseFloat('0.00');
        }
        this.state.cost = (<any>this.state.cost).toFixed(2);
      }
    });
  }

}
