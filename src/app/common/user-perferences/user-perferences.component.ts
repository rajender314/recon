import { Component, OnInit } from '@angular/core';
import { UsersService } from '@app/users/users.service';

var APP: any = window['APP'];

@Component({
  selector: 'app-user-perferences',
  templateUrl: './user-perferences.component.html',
  styleUrls: ['./user-perferences.component.scss']
})
export class UserPerferencesComponent implements OnInit {

  state = {
    userId: APP.recon_user[0].id,
    preferences: [],
    detailsLoader: true
  }
  constructor(private usersService: UsersService) { }

  ngOnInit() {
    this.getPreferences();
  }

  getPreferences(): void {
    this.usersService.getUserPreferences({ id: this.state.userId })
      .then(res => {
        if (res.result.success) {
          this.state.preferences = res.result.data;
          this.state.detailsLoader = false;
        }
      });
  }

}
