import { CostCodesModule } from './cost-codes.module';

describe('CostCodesModule', () => {
  let costCodesModule: CostCodesModule;

  beforeEach(() => {
    costCodesModule = new CostCodesModule();
  });

  it('should create an instance', () => {
    expect(costCodesModule).toBeTruthy();
  });
});
