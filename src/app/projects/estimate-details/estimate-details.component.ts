import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-estimate-details',
  templateUrl: './estimate-details.component.html',
  styleUrls: ['./estimate-details.component.scss']
})
export class EstimateDetailsComponent implements OnInit {

  public state = {
    loader: true,
    estimates: [],
    allowEditEstimates: false
  };

  constructor() { }

  ngOnInit() {
  }

  sendEstimate(): void{

  }

}
