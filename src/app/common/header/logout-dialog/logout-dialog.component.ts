import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'app-logout-dialog',
	templateUrl: './logout-dialog.component.html',
	styleUrls: ['./logout-dialog.component.scss']
})
export class LogoutDialogComponent implements OnInit {

	public options = [
		{id: 0, name: 'Log out from this browser only.'},
		{id: 1, name: 'Log out from all browsers.'}
	];
	value = new FormControl(0);
	constructor(
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
	}

	logout() {
		window.location.href = this.data + '&clear_all=' + this.value.value;
	}

}
