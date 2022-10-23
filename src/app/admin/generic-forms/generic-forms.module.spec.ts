import { GenericFormsModule } from './generic-forms.module';

describe('GenericFormsModule', () => {
  let genericFormsModule: GenericFormsModule;

  beforeEach(() => {
    genericFormsModule = new GenericFormsModule();
  });

  it('should create an instance', () => {
    expect(genericFormsModule).toBeTruthy();
  });
});
