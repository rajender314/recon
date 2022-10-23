import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-multi-level-grouping',
  templateUrl: './multi-level-grouping.component.html',
  styleUrls: ['./multi-level-grouping.component.scss']
})
export class MultiLevelGroupingComponent implements OnInit {

  @Input() options;
  @Input() title;

  public params = {
    data: [],
    header: 'Select All',
    selectionCheck: false,
    checkAll: false,
    search: true,
    searchList: {
      placeHolder: "Search Tasks",
      value: ''
    },
    navs : [
      { label: 'All', value: 'All' },
      { label: 'Selected', value: 'Selected' }
    ],
    selectedNav: 'All',
    listCount: []
  }

  public loader = false;

  constructor() { }

  ngOnInit() {
    this.getListCount();
  }

  getListCount(): void{
    this.params.listCount = _.filter(this.params.data, (list) => {
      return (!list.search && ((this.params.selectedNav=='All') || (this.params.selectedNav=='Selected' && list.checked)))
    });
  }

  searchList(search: string): void {
    this.loader = true;
    this.params.searchList.value = search;
    _.map(this.params.data, (field) => {
      field.search = field.name.toLowerCase().indexOf(search.toLowerCase())==-1?true:false;
    });
    this.loader = false;
    this.getListCount();
	}

  ngOnChanges(changes: SimpleChanges) {
		if (changes) {
      this.params.searchList = {...{placeHolder: "Search " + this.title, value: ''}};
			if(changes.options){
        Object.assign(this.params, this.options);
			}
		}
  }

  changeStatus(data: any, status: any) {
    _.map(data, (value) => {
      value['checked'] = status;
      if(value.children && value.children.length){
        this.changeStatus(value.children, status);
      }
    });
  }

  checkAllStatus(data: any){
    let selectedList = _.filter(data, (value) => {
      return value.checked;
    });
    return (selectedList.length==data.length);
  }

  checkParentStatus(data: any){

  }

  changeChildStatus(data: any){
    
  }
  
  selectAll() {
    this.changeStatus(this.params.data, this.params.checkAll);
  }

  listChange() {
    this.params.checkAll = this.checkAllStatus(this.params.data);
  }

}
