import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReciepientsComponent } from './add-reciepients.component';

describe('AddReciepientsComponent', () => {
  let component: AddReciepientsComponent;
  let fixture: ComponentFixture<AddReciepientsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddReciepientsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddReciepientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
