import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseAdminComponent } from './base-admin.component';

describe('BaseAdminComponent', () => {
  let component: BaseAdminComponent;
  let fixture: ComponentFixture<BaseAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BaseAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
