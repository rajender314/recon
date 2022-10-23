import { DialogsModule } from './dialogs.module';

describe('DialogsModule', () => {
  let dialogsModule: DialogsModule;

  beforeEach(() => {
    dialogsModule = new DialogsModule();
  });

  it('should create an instance', () => {
    expect(dialogsModule).toBeTruthy();
  });
});
