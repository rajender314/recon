import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrackTimeComponent } from './add-track-time.component';

describe('AddTrackTimeComponent', () => {
  let component: AddTrackTimeComponent;
  let fixture: ComponentFixture<AddTrackTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTrackTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTrackTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
