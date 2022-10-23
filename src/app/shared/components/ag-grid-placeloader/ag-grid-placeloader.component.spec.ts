import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgGridPlaceloaderComponent } from './ag-grid-placeloader.component';

describe('AgGridPlaceloaderComponent', () => {
  let component: AgGridPlaceloaderComponent;
  let fixture: ComponentFixture<AgGridPlaceloaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgGridPlaceloaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgGridPlaceloaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
