import { Component, OnInit,Input } from '@angular/core';

@Component({
  selector: 'app-modified-user-info',
  templateUrl: './modified-user-info.component.html',
  styleUrls: ['./modified-user-info.component.scss']
})
export class ModifiedUserInfoComponent implements OnInit {
 
  @Input() modifiedInfo: any;
  constructor() { }

  ngOnInit() {
  }
}
