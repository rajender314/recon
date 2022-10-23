import { MiscExpensesModule } from './misc-expenses.module';

describe('MiscExpensesModule', () => {
  let miscExpensesModule: MiscExpensesModule;

  beforeEach(() => {
    miscExpensesModule = new MiscExpensesModule();
  });

  it('should create an instance', () => {
    expect(miscExpensesModule).toBeTruthy();
  });
});
