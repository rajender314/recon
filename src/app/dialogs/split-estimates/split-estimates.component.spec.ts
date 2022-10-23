import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitEstimatesComponent } from './split-estimates.component';

describe('SplitEstimatesComponent', () => {
  let component: SplitEstimatesComponent;
  let fixture: ComponentFixture<SplitEstimatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplitEstimatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitEstimatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
