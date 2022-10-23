import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendEstimateComponent } from './send-estimate.component';

describe('SendEstimateComponent', () => {
  let component: SendEstimateComponent;
  let fixture: ComponentFixture<SendEstimateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendEstimateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendEstimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
