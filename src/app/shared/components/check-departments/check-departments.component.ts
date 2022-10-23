import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { checkedLength } from '@app/shared/utility/dummyJson';

@Component({
	selector: 'app-check-departments',
	templateUrl: './check-departments.component.html',
	styleUrls: ['./check-departments.component.scss']
})
export class CheckDepartmentsComponent implements OnInit {

	@Input() data;
	@Input() group: FormGroup;
	@Input() readonly;

	checkAll: boolean = false;
	indeterminate: boolean = false;

	constructor() { }

	ngOnInit() {
		this.group.valueChanges.subscribe(e => {
			this.checkFlag();
			this.group.setValue(e, {emitEvent: false});
		})
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes) {
			if(changes.group){
				this.checkFlag();
			}
		}
	}

	createDepartmentControls = (isChecked?) => {
		let departmentIds = {};
		this.data.map(dept => {
			if (isChecked) departmentIds[dept.id] = true;
			else departmentIds[dept.id] = false;
		})
		return departmentIds;
	}

	selectAll = () => {
		this.group.setValue(this.createDepartmentControls(this.checkAll));
		this.group.markAsDirty();
	}

	selectDepartment = () => {
		this.checkFlag();
	}

	isAllChecked = (checked) => {
		return Object.keys(checked).length && Object.keys(checked).length == this.data.length;
	}

	checkFlag = () => {
		let checkedArra = checkedLength(this.group.value);
		this.checkAll = this.isAllChecked(checkedArra);
		this.indeterminate = Object.keys(checkedArra).length ? !this.checkAll : false;
	}

}
