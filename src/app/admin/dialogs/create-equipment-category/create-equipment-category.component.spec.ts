import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEquipmentCategoryComponent } from './create-equipment-category.component';

describe('CreateEquipmentCategoryComponent', () => {
  let component: CreateEquipmentCategoryComponent;
  let fixture: ComponentFixture<CreateEquipmentCategoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateEquipmentCategoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEquipmentCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
