import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackTimeViewComponent } from './track-time-view.component';

describe('TrackTimeViewComponent', () => {
  let component: TrackTimeViewComponent;
  let fixture: ComponentFixture<TrackTimeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackTimeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackTimeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
