import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-estimates-timeline',
  templateUrl: './estimates-timeline.component.html',
  styleUrls: ['./estimates-timeline.component.scss']
})
export class EstimatesTimelineComponent implements OnInit {

  @Input() options: any;
  @Input('estimate') estimate: any;

  constructor() { }

  ngOnInit() {
  }

}
