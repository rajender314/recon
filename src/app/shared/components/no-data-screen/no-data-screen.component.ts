import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { NoDataConfig } from '@app/shared/utility/config';

@Component({
	selector: 'no-data-screen',
	template: `
		<div class="no-data-screen">
		
      <div class="empty-screen">
				<div class="icon-info-holder" *ngIf="config.isIcon">
					<div class="icon">
						<i class="pixel-icons" [ngClass]="config.iconName"></i>
					</div>
					<p class="alert-message">{{config.title}}</p>
				</div>
				<button pi-icon-button color="primary" (click)="add()">+ {{config.buttonText}}</button>
      </div>
    </div>
  `,
	styles: []
})
export class NoDataScreenComponent implements OnChanges {

	config: NoDataConfig = {
		isIcon: false,
		title: 'Add',
		buttonText: 'Add'
	}

	@Input('config') configData;
	@Output() onAdd = new EventEmitter();

	constructor() { }

	ngOnChanges(changes: SimpleChanges) {
		this.config = { ...this.config, ...this.configData };
	}

	add() {
		this.onAdd.emit();
	}

}
