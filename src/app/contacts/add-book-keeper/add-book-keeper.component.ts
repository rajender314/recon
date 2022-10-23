import { Component, OnInit, Inject } from '@angular/core';
import { Validators, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-add-book-keeper',
  templateUrl: './add-book-keeper.component.html',
  styleUrls: ['./add-book-keeper.component.scss']
})
export class AddBookKeeperComponent implements OnInit {

  public othersForm: FormGroup;
  public submitted: boolean = false;

  public state = {
    company_codes: [
      {id: 5, label: "Blueleaf Digital, LLC"},
      {id: 11, label: "BuzzShift"},
      {id: 10, label: "CLM"},
      {id: 16, label: "Dev Team"},
      {id: 3, label: "Graphic Image"},
      {id: 7, label: "GreenLeaf"}
    ],
    tasks: [
      {id: 1, label: "1st Proof"},
      {id: 2, label: "2nd Proof"},
      {id: 3, label: "3602 Reports Due"},
      {id: 4, label: "3rd Proof"},
      {id: 5, label: "Account Management"}
    ],
    users: [
      {id: 1, label: "Abbi Harlin"},
      {id: 2, label: "Abby Rice"},
      {id: 3, label: "Adam Gudgeon"},
      {id: 4, label: "Adam Oldham"},
      {id: 5, label: "Al Chabayta"}
    ]
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddBookKeeperComponent>,
    private contactsService: ContactsService,
		@Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    Object.assign(this.state, this.data.state);
    this.state.company_codes.map(o => o.label = o['name']);
  }

  addBookKeeper(): void{
    this.data.form.markAsDirty();
    this.state['book_keeper_array'].push(this.fb.group({
      company_codes: '',
      users: ''
    }));
  }

  removeBookKeeper(index): void{
    this.data.form.markAsDirty();
    let webIndex = 0;
    _.find(this.state['book_keeper_array'].value, function(o,i){
        if(i==index){
          webIndex = i;
        }
    });
    this.state['book_keeper_array'].removeAt(webIndex);
  }

  saveBookkeeper = () => {
    this.dialogRef.close({success: true});
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

}
