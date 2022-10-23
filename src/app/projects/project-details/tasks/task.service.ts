import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  storage = {
    list: [],
    framedList: []
  }

  private taskEvent = new Subject<any>();

  constructor() { }

  storeTasks(storage) {
    this.storage = storage;
  }

  getTasks() {
    return this.storage;
  }

  breadcrumbData: Array<any> = [];
  
  /**
   * type - isLoading, list
   * data - any
   */
  update = obj => {
		this.taskEvent.next(obj);
	}

	onUpdate = (): Observable<any> => {
		return this.taskEvent.asObservable();
	}

}
