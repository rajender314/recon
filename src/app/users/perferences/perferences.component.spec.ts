import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PerferencesComponent } from './perferences.component';

describe('PerferencesComponent', () => {
  let component: PerferencesComponent;
  let fixture: ComponentFixture<PerferencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PerferencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PerferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
