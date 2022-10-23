import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewChild } from '@angular/core';

import { ICellEditorAngularComp } from "ag-grid-angular";
import { CommonService } from '@app/common/common.service';

@Component({
  selector: 'app-select-cell-editor',
  template: `
    <pi-select class="grid-select-fild" label="" *ngIf="(params?.node?.data?.cost_type && params.node.data.cost_type=='Misc' && params.node.data.user_type=='2')" [minSearchLength]='3' [options]="params.column.colDef.cellRendererParams.otherUsers"
    idKey="id" nameKey="name" (onChange)="userOptionChange($event)" [(ngModel)]="params.node.data.users_id"></pi-select>
    <mat-select placeholder="" *ngIf="(params?.node?.data?.cost_type && params.node.data.cost_type=='Misc' && params.node.data.user_type=='1')" [(ngModel)]="params.node.data.users_id">
      <mat-optgroup *ngFor="let dept of params.column.colDef.cellRendererParams.ivieUsers" [label]="dept.name">
          <mat-option (click)="userOptionChange($event)" *ngFor="let user of dept.children" [value]="user.id">
              {{user.user_name}}
          </mat-option>
      </mat-optgroup>
    </mat-select>
  `,
  styles: [`
 
  `]
})
export class SelectCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {

  constructor(
    private commonService: CommonService
  ) { }

	public params: any;
	public selectedValue: any;
	public selectedId: any;
	public selectType: any;

  agInit(params): void {
		this.params = params;
    this.selectedValue = this.params.value;
    this.selectType = params.column.colDef.cellRendererParams?params.column.colDef.cellRendererParams.selectType:null;
    this.selectedId = params.node.data[this.selectType];
	}

	getValue(): any {
		return this.selectedValue;
	}

	// dont use afterGuiAttached for post gui events - hook into ngAfterViewInit instead for this
	ngAfterViewInit() {
  }
  
  userOptionChange(){
    setTimeout(() => {
      this.params.stopEditing();
    });
    this.commonService.saveApi('updateCostAnalysis', {
      id: this.params.node.data.id,
      unit: this.params.node.data.units,
      rate: this.params.node.data.rates,
      net_amount: this.params.node.data.net,
      gross_amount: this.params.node.data.gross,
      users_id: this.params.node.data.users_id
     }).then(res => {
      if(res['result'].success){
        if(document.querySelector('.pi-select-list')){
          document.body.removeChild(document.querySelector('.pi-select-list'));
        }
        this.params.node.data['asignee'] = res['result'].data.asignee;
        this.params.node.data['unit'] = res['result'].data.unit;
        this.params.node.data['rate'] = res['result'].data.rate;
        this.params.node.data['net_amount'] = res['result'].data.net_amount;
        this.params.node.data['gross_amount'] = res['result'].data.gross_amount;
        this.params.api.updateRowData({update: [this.params.node.data]});
      }
    });
  }

}
