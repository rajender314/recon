import { DistributionTypesModule } from './distribution-types.module';

describe('DistributionTypesModule', () => {
  let distributionTypesModule: DistributionTypesModule;

  beforeEach(() => {
    distributionTypesModule = new DistributionTypesModule();
  });

  it('should create an instance', () => {
    expect(distributionTypesModule).toBeTruthy();
  });
});
