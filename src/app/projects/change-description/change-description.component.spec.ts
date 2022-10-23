import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeDescriptionComponent } from './change-description.component';

describe('ChangeDescriptionComponent', () => {
  let component: ChangeDescriptionComponent;
  let fixture: ComponentFixture<ChangeDescriptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
