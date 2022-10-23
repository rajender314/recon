import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloneEstimateComponent } from './clone-estimate.component';

describe('CloneEstimateComponent', () => {
  let component: CloneEstimateComponent;
  let fixture: ComponentFixture<CloneEstimateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloneEstimateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloneEstimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
