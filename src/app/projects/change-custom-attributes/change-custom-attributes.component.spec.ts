import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeCustomAttributesComponent } from './change-custom-attributes.component';

describe('ChangeCustomAttributesComponent', () => {
  let component: ChangeCustomAttributesComponent;
  let fixture: ComponentFixture<ChangeCustomAttributesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeCustomAttributesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeCustomAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
