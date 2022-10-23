import { Injectable } from '@angular/core';
import { ProjectSubNav } from '@app/shared/utility/config';
import { Subject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ProjectDetailsService {

	subNav: ProjectSubNav = {
		icons: '',
		title: 'Back to Project',
		allText: '',
		noData: '',
		idKey: '',
		displayKey: '',
		list: []
	}

	private updateEvent = new Subject<any>();

	update = obj => {
		this.updateEvent.next(obj);
	}

	onUpdate = (): Observable<any> => {
		return this.updateEvent.asObservable();
	}

	constructor() { }

	setSubNav(data) {
		this.subNav = { ...this.subNav, ...data };
	}

	emptyList() {
		this.subNav.list = [];
	}

	getSubNav() {
		return this.subNav;
	}
}
