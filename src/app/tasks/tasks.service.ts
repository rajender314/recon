import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class TasksService {

	private taskEvent = new Subject<any>();

	constructor() { }

	update = obj => {
		this.taskEvent.next(obj);
	}

	onUpdate = (): Observable<any> => {
		return this.taskEvent.asObservable();
	}


}
