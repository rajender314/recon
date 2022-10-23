import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private invoiceEvent = new Subject<any>();

  constructor() { }

  update = obj => {
		this.invoiceEvent.next(obj);
	}

	onUpdate = (): Observable<any> => {
		return this.invoiceEvent.asObservable();
	}
}
