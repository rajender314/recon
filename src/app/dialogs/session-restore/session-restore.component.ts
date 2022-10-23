import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
var APP = window['APP'];
@Component({
  selector: 'app-session-restore',
  templateUrl: './session-restore.component.html',
  styleUrls: ['./session-restore.component.scss']
})
export class SessionRestoreComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<SessionRestoreComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
  }

  refresh() {
    // window.location.reload();
    location.href = APP.sso_url + 'oauthlogout?access_token=' + APP.access_token;
  }

}
