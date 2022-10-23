import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder, FormControl, FormArray, Validators } from '@angular/forms';
import { buildForm, objectToArray } from '@app/admin/admin.config';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';

var APP: any = window['APP'];

@Component({
	selector: 'app-add-dialog',
	templateUrl: './add-dialog.component.html',
	styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent implements OnInit {

	sampleLink: string = APP.api_url + 'distributionsSample?token=' + APP.access_token + '&jwt=' + APP.j_token;
	countrySampleLink: string = APP.api_url + 'countryCodesSample?token=' + APP.access_token + '&jwt=' + APP.j_token;

	createFormGroup: FormGroup;
	successFormGroup: FormGroup;
	submitted: boolean = false;
	loader: boolean = false;
	dropdowns: any;
	stepper: number = 0;
	uploadUrl = APP.api_url + 'uploadDistributions';
	hasDropZoneOver: boolean = false;
	allowedMimeType = [".pdf", ".xls", ".xlsx"];
	allowedFileType = ["pdf", "xls", "xlsx"];
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedFileType: this.allowedFileType,
		maxFileSize: 3 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});
	uploadedFile: any;
	selectedFile: any = null;
	showFileError: string = '';
	validateResults: any = null;
	selectedSheet = new FormControl(0);
	selectedExtraColumns: any = {};
	kitColumns: Array<any> = [];
	promise: any;
	errorMsg: string = '';

	constructor(
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<AddDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.dropdowns = { ...this.dropdowns, ...data.dropdowns };
		this.sampleLink += '&file_type=' + (data.flag == 'kit' ? 1 : 0);
		/*this.uploader.onBuildItemForm = (fileItem: FileItem, form: any) => {
			form.append('token', APP.access_token);
		}*/

		this.uploader.onWhenAddingFileFailed = (item: any, filter: any, options: any) => {
			if (item.size >= options.maxFileSize) {
				this.showFileError = 'Exceeds Max. Size';
			} else {
				this.showFileError = 'Invalid File Type (' + item.type + ')';
			}
		}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				this.selectedFile = item._file;
				let obj = JSON.parse(response);
				if (obj.result.success) {
					this.uploadedFile = obj.result.data.file;
					this.createFormGroup.markAsDirty();
				}
			}

		this.selectedSheet.valueChanges.subscribe(val => {
			this.validate(val);
		})
	}

	fileOverBase(ev) {
		this.hasDropZoneOver = true;
	}

	fileDrop(ev) {
		this.hasDropZoneOver = false;
	}

	deleteFile() {
		this.selectedFile = null;
		this.uploadedFile = null;
	}

	ngOnInit() {
		this.createForm();
		if (this.data.selectedRow) this.setForm(this.data.selectedRow);
		if (this.data.apiCalls) {
			this.createObject();
			this.getApiCalls();
		}
	}

	closeDialog() {
		this._dialogRef.close();
	}

	createForm() {
		this.createFormGroup = this._fb.group(buildForm(this.data.formFields));
	}

	setForm(data) {
		this.createFormGroup.patchValue({
			distro_id: data.id,
			distro_name: data.name
		});
		this.createFormGroup.controls.distro_name.disable();
	}

	get columns() {
		return this.successFormGroup.get('columns') as FormArray;
	}

	createSuccessForm() {
		this.successFormGroup = this._fb.group({
			columns: this._fb.array([])
		});
	}

	columnBuilder(data) {
		return this._fb.group({
			column_letter: data.column_letter,
			lable_key: data.lable_key,
			import: 0,
			version: ''
		})
	}

	createObject() {
		this.data.apiCalls.map(api => {
			this.dropdowns[api.key] = [];
		});
	}

	setDropDownDefaults() {
		this.data.formFields.map(o => {
			if (o.type == 'select') {
				this.createFormGroup.patchValue({
					[o.key]: this.dropdowns[o.options].length ? (o.multi ? [this.dropdowns[o.options][0].id] : this.dropdowns[o.options][0].id) : (o.multi ? [] : '')
				}, { emitEvent: false });
			}
		});
		this.createFormGroup.markAsPristine();
	}

	getApiCalls() {
		let apiCalls = [];
		this.data.apiCalls.map(api => {
			if (api.url) apiCalls.push(this._commonService.getApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					this.dropdowns[this.data.apiCalls[i].key] = o['result'].data;
				});
				this.dropdowns.importOptions = [{ id: 0, name: 'Dont Import' }, ...this.dropdowns.productList];
				this.setDropDownDefaults();
			});

		/* temporary */
		this.dropdowns.jobFiles = [
			{ id: 0, name: this.data.flag == 'list' ? 'Upload Distribution List' : 'Upload Kitting List' },
			{ id: 1, name: '1.xlxs' },
			{ id: 2, name: '2.xlxs' },
			{ id: 3, name: '3.xlxs' },
			{ id: 4, name: '4.xlxs' },
			{ id: 5, name: '5.xlxs' }
		];
		this.setDropDownDefaults();
	}

	validate(sheetNo?) {
		if (!this.promise) {
			this.submitted = true;
			if (this.createFormGroup.valid) {
				this.submitted = false;
				this.loader = true;
				this.promise = this._commonService.saveApi('validateDistributions', {
					original_filename: this.uploadedFile.original_filename,
					filename: this.uploadedFile.filename,
					sheet_index: sheetNo || 0,
					jobs_id: this.data.jobs_id,
					is_kitting: this.data.flag == 'kit' ? true : false
				})
					.then(res => {
						this.promise = undefined;
						if (res['result'].success) {
							if (!sheetNo) this.stepper = 1;
							this.validateResults = { ...res['result'].data };
							this.validateResults.updatedSheets = [];
							this.validateResults.sheets.map((o, i) => {
								this.validateResults.updatedSheets.push({ id: i, name: o });
							});
							this.kitColumns = [];
							if (!this.validateResults.error_status) {
								this.createSuccessForm();
								this.validateResults.uploaded_columns.map(o => {
									if (!o.is_standard) {
										this.kitColumns.push(o);
										(<FormArray>this.successFormGroup.controls.columns).push(this.columnBuilder(o));
									}
								})
							}
						}
						this.loader = false;
					})
					.catch(err => {
						this.promise = undefined;
						this.loader = false;
					})
			}
		}
	}

	changeImport(controlIndx, val) {
		if (val) (<FormGroup>this.columns.controls[controlIndx]).controls.version.setValidators([Validators.required]);
		else (<FormGroup>this.columns.controls[controlIndx]).controls.version.setValidators([]);
		(<FormGroup>this.columns.controls[controlIndx]).controls.version.updateValueAndValidity();
	}

	hasDuplicates(a) {
		return _.uniq(a).length !== a.length;
	}

	saveDetails(flag) {
		const isValid = this.data.flag != 'list' ? this.columns.valid : true;
		this.errorMsg = '';
		if (isValid) {
			if (!this.promise) {
				this.loader = true;
				const extraColumns = [];
				const params = {
					original_filename: this.uploadedFile.original_filename,
					filename: this.validateResults.filename,
					temp_table: this.validateResults.temp_table.table_name,
					jobs_id: this.data.jobs_id,
					import_replace: flag,
					...this.createFormGroup.value,
					is_kitting: this.data.flag == 'kit' ? true : false
				}
				let hasDuplicate = false;
				if (this.data.flag != 'list') {
					const validationCheck = [];
					this.columns.value.map(o => {
						if (o.import) {
							const isExists = _.find(validationCheck, ['id', o.import]);
							if (!isExists) {
								validationCheck.push({ id: o.import, versions: [o.version] });
							} else {
								isExists.versions.push(o.version);
							}
							extraColumns.push(o);
						}
					});
					validationCheck.map(o => {
						if (!hasDuplicate)
							hasDuplicate = this.hasDuplicates(o.versions);
					})
					params.extra_columns = extraColumns;
				} else {
					params.extra_columns = Object.keys(this.selectedExtraColumns);
				}
				if (this.data.selectedRow) {
					params['distro_id'] = this.data.selectedRow['distro_id']?this.data.selectedRow['distro_id']:this.data.selectedRow['id'];
					params['distro_name'] = this.data.selectedRow['name'];
				}
				let canProceed = this.data.flag != 'list' ? extraColumns.length && !hasDuplicate : true;
				if (canProceed) {
					this.promise = this._commonService.saveApi('importDistTemTable', params)
						.then(res => {
							if (res['result'].success) {
								this._dialogRef.close({ success: true, data: res['result'].data });
							} else {
								this.promise = undefined;
								this.loader = false;
							}
						})
						.catch(err => {
							this.promise = undefined;
							this.loader = false;
						})
				} else {
					this.errorMsg = !extraColumns.length ? 'Please Select Atleast one Column' : 'Same Product cannot have duplicate Versions';
					this.loader = false;
				}
			}
		}
	}

}
