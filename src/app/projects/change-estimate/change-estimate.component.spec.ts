import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeEstimateComponent } from './change-estimate.component';

describe('ChangeEstimateComponent', () => {
  let component: ChangeEstimateComponent;
  let fixture: ComponentFixture<ChangeEstimateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeEstimateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeEstimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
