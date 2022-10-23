import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTimeTrackComponent } from './add-time-track.component';

describe('AddTimeTrackComponent', () => {
  let component: AddTimeTrackComponent;
  let fixture: ComponentFixture<AddTimeTrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTimeTrackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTimeTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
