import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AjaxSpinnerComponent } from './ajax-spinner.component';

describe('AjaxSpinnerComponent', () => {
  let component: AjaxSpinnerComponent;
  let fixture: ComponentFixture<AjaxSpinnerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AjaxSpinnerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AjaxSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
