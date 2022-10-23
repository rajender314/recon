import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCapabilityComponent } from './create-capability.component';

describe('CreateCapabilityComponent', () => {
  let component: CreateCapabilityComponent;
  let fixture: ComponentFixture<CreateCapabilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCapabilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCapabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
