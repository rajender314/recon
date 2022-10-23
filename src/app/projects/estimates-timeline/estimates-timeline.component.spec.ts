import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimatesTimelineComponent } from './estimates-timeline.component';

describe('EstimatesTimelineComponent', () => {
  let component: EstimatesTimelineComponent;
  let fixture: ComponentFixture<EstimatesTimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EstimatesTimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EstimatesTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
