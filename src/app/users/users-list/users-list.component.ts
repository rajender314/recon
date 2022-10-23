import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  @Input() data;
  @Input() selected;
  @Output() trigger = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  getSelectedUser(item: any): void{
      this.trigger.emit(item);
  }

}
