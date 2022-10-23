import { SpecificationsModule } from './specifications.module';

describe('SpecificationsModule', () => {
  let specificationsModule: SpecificationsModule;

  beforeEach(() => {
    specificationsModule = new SpecificationsModule();
  });

  it('should create an instance', () => {
    expect(specificationsModule).toBeTruthy();
  });
});
