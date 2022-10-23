import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EditProductComponent } from '../edit-product/edit-product.component';
import { CommonService } from '@app/common/common.service';

@Component({
  selector: 'app-reorder',
  templateUrl: './reorder.component.html',
  styleUrls: ['./reorder.component.scss']
})
export class ReorderComponent implements OnInit {

  constructor(
    private _commonService: CommonService,
    private _dialogRef: MatDialogRef<EditProductComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {}

  reOrder() {
    let params = [];
    this.data.products.map(p => {
      let services = [];
      p.services.map(s => {
        services.push({ jobs_service_revisions_id: s.jobs_service_revisions_id });
      });
      params.push({ product_id: p.products_id, services: services })
    })
    this._commonService.saveApi('saveEstimatesOrders', { products: params })
      .then(res => {
        if (res['result'].success) {
          this._dialogRef.close({ success: true, data: res['result'].data });
        }
      })
  }

}
