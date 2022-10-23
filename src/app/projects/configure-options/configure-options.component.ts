import { Component, OnInit, Input } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { GridApi, RowNode } from 'ag-grid-community';
import { ProjectDetailsService } from '@app/projects/project-details/project-details.service';

@Component({
  selector: 'app-configure-options',
  templateUrl: './configure-options.component.html',
  styleUrls: ['./configure-options.component.scss'],
  host: {
    // class: 'app-configure-options'
  },
  animations: [
    trigger('estimatesAnimate', [
      transition(':enter', [
				query('.ag-row', [
          style({ transform: 'translateX(-100px)', opacity: 0 }),
				  animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
				])
      ])
    ]),
  ],
})
export class ConfigureOptionsComponent implements OnInit {

  @Input() options: any;
  @Input() gridApi: any;
  @Input('estimate') estimate: any;

  public state = {
    loader: false,
    showCoGrid: true,
    rowData: [],
    net: '0.00',
    grandTotal: '0.00'
  };

  constructor(
    private commonService: CommonService,
    private _projectDetailService: ProjectDetailsService
  ) {
    this.commonService.onUpdate().subscribe((obj)=>{
      if(obj.hasOwnProperty('coGridUPdate')){
          this.state.loader = true;
          setTimeout(()=>{
            this.state.loader = false;
          },10);
      }else if(obj.hasOwnProperty('coGridRowRemove')){
        this.state.loader = true;
        this.state.rowData = [];
        setTimeout(()=>{
          _.map(this.options.gridOptions.rowData, (item) => {
            if(item.children && item.children.length){
              _.map(item.children, (service)=>{
                if(service.children && service.children.length){
                  service.children = _.filter(service.children, (lineItem)=>{
                    if(lineItem.id && (lineItem.id==obj.data.id)){
                      return false;
                    }
                    return true;
                  });
                }
              });
            }
          });
          this.state.loader = false;
        },50);
      }else if(obj.hasOwnProperty('updateRowData')){
      }else if(obj.hasOwnProperty('grandTotal')){
        if(obj.hasOwnProperty('data')){
          this.calculateNetAndGross(obj.data);
        }else{
          this.calculateNetAndGross();
        }
      } else if(obj.hasOwnProperty('clearCreditCosts')){
        this.state.loader = true;
        setTimeout(()=>{
          _.map(this.options.gridOptions.rowData, (item) => {
            if(item.children && item.children.length){
              _.map(item.children, (service)=>{
                if(service.jobs_service_revisions_id && (service.jobs_service_revisions_id==obj.data.jobs_service_revisions_id)){
                  if(service.children && service.children.length){
                    service.children = _.filter(service.children, (lineItem)=>{
                      if(lineItem.type && (lineItem.type=='addCredit')){
                        return false;
                      }
                      return true;
                    });
                  }
                }
              });
            }
          });
          this.state.loader = false;
        },50);
      }
    });
  }

  ngOnInit() {
    this.calculateNetAndGrossInit();
  }

  removeRow(data){
    this.options.gridOptions['rowData'] = this.filterRowData(this.options.gridOptions.rowData, data);
  }

  filterRowData(list, data): any{
    return _.filter(list, (item)=>{
      if(item.children && item.children.length){
        item.children = this.filterRowData(item.children, data);
      }
      return item.id!=data.id
    });
  }

  calculateNetAndGross(update?: any){
    let net = 0;
    let total = 0;
    if(this.gridApi && this.gridApi.rowModel){
      _.map(this.gridApi.rowModel.rowsToDisplay, (row:RowNode)=>{
          let lineItem = row.data;
          if(lineItem && lineItem.type && lineItem.type!='product' && lineItem.type!='service'){
            if(update && update.id==lineItem.id){
              lineItem['net_amount'] = update.net_amount;
              lineItem['gross_amount'] = update.gross_amount;
            }
            if(lineItem.net_amount && lineItem.net_amount!='' && lineItem.type!='addCredit'){
              net = net + parseFloat(lineItem.net_amount);
            }
            if(lineItem.gross_amount && lineItem.gross_amount!='' && lineItem.type!='addCredit'){
              total = total + parseFloat(lineItem.gross_amount);
            }
            if(lineItem.type=='addCredit'){
              // net = net - parseFloat(lineItem.gross_amount);
              total = total + parseFloat(lineItem.gross_amount);
            }
          }
      });
    }else{
      _.map(this.options.gridOptions.rowData, (lineItem)=>{
          if(update && update.id==lineItem.id){
            lineItem['net_amount'] = update.net_amount;
            lineItem['gross_amount'] = update.gross_amount;
          }
          if(lineItem.net_amount && lineItem.net_amount!='' && lineItem.type!='addCredit'){
            net = net + parseFloat(lineItem.net_amount);
          }
          if(lineItem.gross_amount && lineItem.gross_amount!='' && lineItem.type!='addCredit'){
            total = total + parseFloat(lineItem.gross_amount);
          }
          if(lineItem.type=='addCredit'){
            // net = net - parseFloat(lineItem.gross_amount);
            total = total + parseFloat(lineItem.gross_amount);
          }
      });
    }
    if(net<0){
      this.state.net = '-$'+this.formatNumber(net.toFixed(2).toString().replace('-',''));
    }else{
      this.state.net = '$'+this.formatNumber(net.toFixed(2));
    }
    if(total<0){
      this.state.grandTotal = '-$'+this.formatNumber(total.toFixed(2).toString().replace('-',''));
    }else{
      this.state.grandTotal = '$'+this.formatNumber(total.toFixed(2));
    }
    this._projectDetailService.update({ type: 'subnav-value', data: { selected: {
      id: this.estimate.id, 
      cost: this.state.grandTotal
    } } });
  }

  calculateNetAndGrossInit(){
    let net = 0;
    let total = 0;
    _.map(this.options.gridOptions.rowData, (lineItem)=>{
        if(lineItem.net_amount && lineItem.net_amount!='' && lineItem.type!='addCredit'){
          net = net + parseFloat(lineItem.net_amount);
        }
        if(lineItem.gross_amount && lineItem.gross_amount!='' && lineItem.type!='addCredit'){
          total = total + parseFloat(lineItem.gross_amount);
        }
        if(lineItem.type=='addCredit'){
          // net = net + parseFloat(lineItem.gross_amount);
          total = total + parseFloat(lineItem.gross_amount);
        }
    });
    if(net<0){
      this.state.net = '-$'+this.formatNumber(net.toFixed(2).toString().replace('-',''));
    }else{
      this.state.net = '$'+this.formatNumber(net.toFixed(2));
    }
    if(total<0){
      this.state.grandTotal = '-$'+this.formatNumber(total.toFixed(2).toString().replace('-',''));
    }else{
      this.state.grandTotal = '$'+this.formatNumber(total.toFixed(2));
    }
    this._projectDetailService.update({ type: 'subnav-value', data: { selected: {
      id: this.estimate.id, 
      cost: this.state.grandTotal
    } } });
  }

  formatNumber(number) {
    let x = number.split('.');
    let x1 = x[0];
    x1 = isNaN(x1) ? "0" : Number(x1);
    x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
    return x1 + x2;
  }

}