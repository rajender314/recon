import { Component, OnInit } from '@angular/core';
import { CommonService } from '@app/common/common.service';

@Component({
  selector: 'app-cost-analysis-grid',
  templateUrl: './cost-analysis-grid.component.html',
  styleUrls: ['./cost-analysis-grid.component.scss']
})
export class CostAnalysisGridComponent implements OnInit {

  public params: any;

  public options = [
    {id: 1, name: "user 1"}
  ];

  public state = {
    projectInfo: {}
  }

  constructor(
    private commonService: CommonService
  ) {
    commonService.onUpdate().subscribe(obj => {
      if (obj.hasOwnProperty('type') && obj.type == 'projectName') {
        this.state.projectInfo = obj.data;
      }
    });
  }

  ngOnInit() {
  }

  agInit(params: any): void {
    this.params = params;
  }

  userOptionChange(){
    this.commonService.saveApi('updateCostAnalysis', {
      id: this.params.data.id,
      unit: this.params.data.units,
      rate: this.params.data.rates,
      net_amount: this.params.data.net,
      gross_amount: this.params.data.gross,
      users_id: this.params.data.users_id
     }).then(res => {
      if(res['result'].success){
        // this.state.costsList = _.cloneDeep(res['result'].data);
        // this.state.gridOptions.rowData = _.cloneDeep(res['result'].data);
        // this.onTabChange(this.state.activeTab);
        this.params.data['asignee'] = res['result'].data.asignee;
        this.params.data['unit'] = res['result'].data.unit;
        this.params.data['rate'] = res['result'].data.rate;
        this.params.data['net_amount'] = res['result'].data.net_amount;
        this.params.data['gross_amount'] = res['result'].data.gross_amount;
        this.params.api.updateRowData({update: this.params.data});
      }
    });
  }

}
