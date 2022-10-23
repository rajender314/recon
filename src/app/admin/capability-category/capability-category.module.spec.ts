import { CapabilityCategoryModule } from './capability-category.module';

describe('CapabilityCategoryModule', () => {
  let capabilityCategoryModule: CapabilityCategoryModule;

  beforeEach(() => {
    capabilityCategoryModule = new CapabilityCategoryModule();
  });

  it('should create an instance', () => {
    expect(capabilityCategoryModule).toBeTruthy();
  });
});
