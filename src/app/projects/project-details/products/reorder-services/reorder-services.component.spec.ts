import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReorderServicesComponent } from './reorder-services.component';

describe('ReorderServicesComponent', () => {
  let component: ReorderServicesComponent;
  let fixture: ComponentFixture<ReorderServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReorderServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReorderServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
