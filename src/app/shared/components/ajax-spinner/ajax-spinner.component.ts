import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-ajax-spinner',
  templateUrl: './ajax-spinner.component.html',
  styleUrls: ['./ajax-spinner.component.scss']
})
export class AjaxSpinnerComponent implements OnInit {

  @Input() isLoading: boolean = false;
  @Input() config: any;

  constructor() { }

  ngOnInit() {
  }

}
