import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import { buildForm, objectToArray } from '@app/admin/admin.config';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { forkJoin } from 'rxjs';

var APP: any = window['APP'];

@Component({
  selector: 'app-upload-insertion-order',
  templateUrl: './upload-insertion-order.component.html',
  styleUrls: ['./upload-insertion-order.component.scss']
})
export class UploadInsertionOrderComponent implements OnInit {

  sampleLink: string = APP.api_url + 'mediaInsertionSample?media_type=1&token=' + APP.access_token + '&jwt=' + APP.j_token;

	createFormGroup: FormGroup;
	successFormGroup: FormGroup;
	submitted: boolean = false;
	dropdowns: any;
	stepper: number = 0;
	uploadUrl = APP.api_url + 'uploadMediaInsertions';
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
	selectedFile: any;
	showFileError: string = '';
	validateResults: any = null;
	selectedSheet = new FormControl(0);
	selectedExtraColumns: any = {};
	kitColumns: Array<any> = [];
	promise: any;
	loader = false;
	public state = {
		fileTypes: [
			{id: 1, name: 'Media Insertion'},
			{id: 2, name: 'ROP'},
			{id: 3, name: 'Blue SoHo'}
		],
		file_type: 1,
		send_po: false,
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
			/* { label: 'Analyze Bids', type: 'text' }, */
		]
	};

	constructor(
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<UploadInsertionOrderComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.dropdowns = { ...this.dropdowns, ...data.dropdowns };

		this.state.breadcrumbs[1].label = this.data.job_title || '----';

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
				}
			}

		this.selectedSheet.valueChanges.subscribe(val => {
			this.validate(val);
		})
	}

	ngOnDestroy() {
	}

	fileTypeChange() {
		this.sampleLink = APP.api_url + 'mediaInsertionSample?token=' + APP.access_token + '&jwt=' + APP.j_token + '&media_type='+this.state.file_type;
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
	}

	closeDialog() {
		this._dialogRef.close();
	}

	createForm() {
		this.createFormGroup = this._fb.group({
			file_type: 1
		});
	}

	setForm(data) {
		this.createFormGroup.patchValue({
			file_type: 1
		});
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
			lable_key: data.lable_key,
			import: 0,
			version: ''
		})
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

	validate(sheetNo?) {
		if (!this.promise) {
			this.submitted = true;
			if (this.createFormGroup.valid) {
				this.submitted = false;
				this.loader = true;
				this.promise = this._commonService.saveApi('validateMediaInsertions', {
					original_filename: this.uploadedFile.original_filename,
					filename: this.uploadedFile.filename,
					sheet_index: sheetNo || 0,
					jobs_id: this.data.jobs_id,
					media_type: this.state.file_type
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

	saveDetails(flag) {
		if (!this.promise) {
			const extraColumns = [];
			this.loader = true;
			const params = {
				original_filename: this.uploadedFile.original_filename,
				filename: this.validateResults.filename,
				temp_table: this.validateResults.temp_table.table_name,
				jobs_id: this.data.jobs_id,
				media_type: this.state.file_type,
				send_po: this.state.send_po,
				...this.createFormGroup.value
			}
			if (this.data.flag != 'list') {
				this.columns.value.map(o => {
					if (o.import) extraColumns.push(o);
				});
				params.extra_columns = extraColumns;
			} else {
				params.extra_columns = Object.keys(this.selectedExtraColumns);
			}
			this.promise = this._commonService.saveApi('importMediaInsertionsTemTable', params)
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
		}
	}

}
