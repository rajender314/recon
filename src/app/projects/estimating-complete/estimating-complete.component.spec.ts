import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimatingCompleteComponent } from './estimating-complete.component';

describe('EstimatingCompleteComponent', () => {
  let component: EstimatingCompleteComponent;
  let fixture: ComponentFixture<EstimatingCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EstimatingCompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EstimatingCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
