import { Component, OnInit, Inject } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { SortablejsOptions } from 'angular-sortablejs';

@Component({
  selector: 'app-edit-order',
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss']
})
export class EditOrderComponent implements OnInit {

  public options: SortablejsOptions;


  public state = {
    loader: true,
    products: []
  };

  constructor(
    private commonService: CommonService,
    public dialogRef: MatDialogRef<EditOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.getProducts();
  }

  close(): void{
    this.dialogRef.close();
  }

  save(): void{
    let products = {};
    let productsList = [];
    this.state.products.map((product)=>{
      products[product.product_id] = [];
      let services = [];
      product.children.map((service)=>{
        products[product.product_id].push(service.jobs_service_revisions_id);
        services.push({jobs_service_revisions_id: service.jobs_service_revisions_id});
      });
      productsList.push({product_id: product.product_id, services: services});
    });
    this.commonService.update({ type: 'overlay', action: 'start' });
    this.commonService.saveApi('saveEstimatesOrders', {products: productsList})
    .then(res => {
      if(res['result'] && res['result'].success){
        this.dialogRef.close({success: true});
      }
      this.commonService.update({ type: 'overlay', action: 'stop' });
    }).catch(err =>{
      this.commonService.update({ type: 'overlay', action: 'stop' });
    });
  }

  getProducts = () => {
    this.state.loader = true;
    this.commonService.getApi('estimatesOrder', {
      jobs_id: this.data.jobs_id,
      id: this.data.id
    })
    .then(res => {
      if(res['result'] && res['result'].success){
        this.state.loader = false;
        this.state.products = res['result'].data.list;
      }
    });
  }

}
