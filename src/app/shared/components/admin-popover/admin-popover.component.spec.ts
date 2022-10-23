import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPopoverComponent } from './admin-popover.component';

describe('AdminPopoverComponent', () => {
  let component: AdminPopoverComponent;
  let fixture: ComponentFixture<AdminPopoverComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminPopoverComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
