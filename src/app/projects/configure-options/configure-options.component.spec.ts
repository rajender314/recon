import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureOptionsComponent } from './configure-options.component';

describe('ConfigureOptionsComponent', () => {
  let component: ConfigureOptionsComponent;
  let fixture: ComponentFixture<ConfigureOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureOptionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
