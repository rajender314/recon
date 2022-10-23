import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionRestoreComponent } from './session-restore.component';

describe('SessionRestoreComponent', () => {
  let component: SessionRestoreComponent;
  let fixture: ComponentFixture<SessionRestoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SessionRestoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionRestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
