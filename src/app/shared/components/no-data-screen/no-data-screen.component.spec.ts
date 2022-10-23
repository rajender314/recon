import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoDataScreenComponent } from './no-data-screen.component';

describe('NoDataScreenComponent', () => {
  let component: NoDataScreenComponent;
  let fixture: ComponentFixture<NoDataScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoDataScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoDataScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
