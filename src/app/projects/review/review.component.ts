import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit {

  tasks = [
    { task: 'Art Due to Printer', due_date: '2018-08-18 16:10:00'},
    { task: 'Postage Due in CAPS', due_date: '2018-09-18 16:10:00'},
    { task: 'First Off Samples Due', due_date: '2018-06-18 16:10:00'},
    { task: 'Rackspace Mailgun', due_date: '2018-02-18 16:10:00'},
    { task: 'SOW Creation', due_date: '2018-09-18 16:10:00'},
    { task: 'Ship Date', due_date: '2018-07-18 16:10:00'}
  ];


  constructor() { }

  ngOnInit() {
  }

}
