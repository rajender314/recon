import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { FormGroupName, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss']
})
export class FormBuilderComponent implements OnInit {

  @Input('config') spec;
  @Input('form') form: FormGroup;
  @Input('disable') disable: boolean = false;

  constructor() { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
    }
  }

}
