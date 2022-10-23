import { Injectable } from '@angular/core';

var APP: any = window['APP'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private user: any = APP.user;
  private reconUser: any = APP.recon_user[0];
  private accessToken: string = APP.access_token;
  private jAuthToken: string = APP.j_token;

  constructor() { }

  getToken(): string {
    return this.accessToken;
  }

  getJAuthToken(): string {
    return this.jAuthToken;
  }

  getUserId(): number {
    return this.user.users_id;
  }

  getReconUserId(): number {
    return this.reconUser.id;
  }
}
