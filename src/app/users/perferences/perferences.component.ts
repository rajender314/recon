import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { UsersService } from '@app/users/users.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-perferences',
  templateUrl: './perferences.component.html',
  styleUrls: ['./perferences.component.scss']
})
export class PerferencesComponent implements OnInit {

  @Input() id;
  @Input() preferences;

  public preferencesForm: FormGroup

  public state = {
    id: '',
    preferences: []
  }

  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private usersService: UsersService
  ) { }

  ngOnInit() {
  }

  get inputs() {
    return this.preferencesForm.get('inputs') as FormArray;
  }

  createForm = () => {
    let checkbox = [];
    this.state.preferences.map((service, index) => {
      checkbox.push(this.fb.group({
        parent: true,
        name: service.name,
        recon_inbox: (index==0)?"Recon Inbox":false,
        email: (index==0)?"Email":false
      }));
      service.data.map((value) => {
        checkbox.push(this.fb.group({
          id: value.id,
          parent: false,
          inbox_status: value.inbox_status=='1'?true:false,
          email_status: value.email_status=='1'?true:false,
          name: value.name
        }));
      });
    });
		this.preferencesForm = this.fb.group({
      inputs: this.fb.array(checkbox)
    });
  }

  cancel(): void{
    this.createForm();
  }

  save(form?:any): void{
    let preferences = [];
    form.value.inputs.map((item) => {
      if(!item.parent && (item.inbox_status || item.email_status)){
        preferences.push({id: item.id, email_status: (item.email_status)?1:0, inbox_status: (item.inbox_status)?1:0});
      }
    });
    this.usersService.savePreferences({id: this.state.id, preferences: preferences}).then(res => {
      if (res.result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Preferences Updated Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.state.preferences = res.result.data;
        this.createForm();
      }
    });
  }

  ngOnChanges(){
    if(this.id){
      this.state.id = this.id
    }
    if(this.preferences){
      this.state.preferences = this.preferences;
      this.createForm();
    }
  }

}
