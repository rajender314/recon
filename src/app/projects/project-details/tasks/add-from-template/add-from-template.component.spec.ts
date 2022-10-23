import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFromTemplateComponent } from './add-from-template.component';

describe('AddFromTemplateComponent', () => {
  let component: AddFromTemplateComponent;
  let fixture: ComponentFixture<AddFromTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFromTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFromTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
