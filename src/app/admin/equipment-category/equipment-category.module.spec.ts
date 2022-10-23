import { EquipmentCategoryModule } from './equipment-category.module';

describe('EquipmentCategoryModule', () => {
  let equipmentCategoryModule: EquipmentCategoryModule;

  beforeEach(() => {
    equipmentCategoryModule = new EquipmentCategoryModule();
  });

  it('should create an instance', () => {
    expect(equipmentCategoryModule).toBeTruthy();
  });
});
