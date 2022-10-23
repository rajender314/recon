import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSpecDialogComponent } from './add-spec-dialog.component';

describe('AddSpecDialogComponent', () => {
  let component: AddSpecDialogComponent;
  let fixture: ComponentFixture<AddSpecDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSpecDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSpecDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
