import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OldJobStoriesComponent } from './old-job-stories.component';

describe('OldJobStoriesComponent', () => {
  let component: OldJobStoriesComponent;
  let fixture: ComponentFixture<OldJobStoriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OldJobStoriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OldJobStoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
