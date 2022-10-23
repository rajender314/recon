import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, SimpleChange } from '@angular/core';

@Component({
  selector: 'app-search',
  host: {
    class: 'search'
  },
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  @ViewChild('search') searchElement: ElementRef;

  @Input() search;

  @Output() onSearch = new EventEmitter<any>();

  public searchOpts = {
    placeHolder: 'Search...',
    value: ''
  }

  public searching = false;

  constructor() { }

  ngOnInit() {
    this.searchOpts = Object.assign(this.searchOpts, this.search);
    this.searchElement.nativeElement.value = this.searchOpts.value;
  }

  ngOnChanges() {
    if (this.search && this.search.value != undefined) {
      this.searchOpts = Object.assign(this.searchOpts, this.search);
      this.searchElement.nativeElement.value = this.searchOpts.value;
    }
  }

  triggerSearch(event: any): void {
    event.stopPropagation();
  }

  private timeout;
  searchList(search) {
    this.searching = true;
    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.searching = false;
      this.onSearch.emit(search);
    }, 1000);

  }

}
