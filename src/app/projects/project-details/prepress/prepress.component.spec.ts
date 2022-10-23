import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrepressComponent } from './prepress.component';

describe('PrepressComponent', () => {
  let component: PrepressComponent;
  let fixture: ComponentFixture<PrepressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrepressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrepressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
