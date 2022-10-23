import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceholderloadingComponent } from './placeholderloading.component';

describe('PlaceholderloadingComponent', () => {
  let component: PlaceholderloadingComponent;
  let fixture: ComponentFixture<PlaceholderloadingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaceholderloadingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceholderloadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
