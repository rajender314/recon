import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobMessagingComponent } from './job-messaging.component';

describe('JobMessagingComponent', () => {
  let component: JobMessagingComponent;
  let fixture: ComponentFixture<JobMessagingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobMessagingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobMessagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
