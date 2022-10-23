import { Component, OnInit } from '@angular/core';
import { AdminDashboard } from '@app/admin/admin.config';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {


  adminDashboard = AdminDashboard;
  
  constructor() { }

  ngOnInit() {
  }

  onSearch = val => { }

}
