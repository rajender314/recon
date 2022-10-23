import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  selector: 'app-description-renderer',
  template: `<i class="pixel-icons icon-forms" [class.active]="isActive"></i>`,
  styles: [`i{width: 14px;font-size: 14px;height: 14px;color: rgba(23, 43, 77, 0.6);}
  i:hover, i.active{color: #e4d056; /*f7e67e;*/}`]
})
export class DescriptionRendererComponent implements ICellRendererAngularComp {

  isActive: boolean;

  agInit(params: any): void {
    this.isActive = params.value ? true : false;
  }

  refresh(params: any): boolean {
    this.isActive = params.value ? true : false;
    return true;
  }


}
