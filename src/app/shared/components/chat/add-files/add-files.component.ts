import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileItem, FileLikeObject, ParsedResponseHeaders } from 'ng2-file-upload';
import { CommonService } from '@app/common/common.service';
import { isJson } from '@app/shared/utility/config';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';

var APP: any = window['APP'];
@Component({
	selector: 'app-add-files',
	templateUrl: './add-files.component.html',
	styleUrls: ['./add-files.component.scss'],
	providers: [SafeHtmlPipe]
})
export class AddFilesComponent implements OnInit {

	files: Array<any> = [];
	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
	allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt'];
	uploader: FileUploader = new FileUploader({
		allowedFileType: this.allowedFileType,
		isHTML5: true,
		url: this.uploadUrl,
		maxFileSize: 18 * 1024 * 1024,
		autoUpload: false,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});
	errorFiles: Array<any> = [];
	isProcessing: boolean = false;
	uploadError: boolean = false;
	loader: boolean = false;

	response = {
		success: false,
		data: []
	}

	public state = {
		projects: [],
		files: [],
		fileSelected: false
	}
	products_id: string;
	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<AddFilesComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if (this.data.multiple) this.uploader.setOptions({ queueLimit: 20 });
		else this.uploader.setOptions({ queueLimit: 1 });
		this.uploader.onAfterAddingFile = (item: FileItem) => {
			item['customType'] = item.file.name.split('.').pop();
			item['is_image'] = false;
			var mimeType = item._file.type;
			if (mimeType.match(/image\/*/) != null) {
				item['is_image'] = true;
				var reader = new FileReader();
				reader.readAsDataURL(item._file);
				reader.onload = (_event) => {
					item['image_path'] = reader.result;
				}
			}
		}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				if (isJson(response)) {
					let obj = JSON.parse(response);
					if (obj.result.success) {
						item['image_path'] = obj.result.data.display_url;
						let type = obj.result.data.original_name.split('.').pop();
						this.files.push({ ...obj.result.data, ...{ type: type } });
					}
				}
			}

		this.uploader
			.onBeforeUploadItem = (item: FileItem) => {
			}

		this.uploader
			.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
				if (!this.uploader.isUploading && !this.isProcessing) {
					let errorMsg = '';
					if ((item.size / 1024 / 1024) > 18) errorMsg = ' Exceeds Max File Size(18Mb)';
					else if (this.uploader.queue.length == 20) errorMsg = ' Exceeds Max. Upload';
					else errorMsg = 'Invalid File Format(' + item.type ? item.type : 'Undefined' + ')';
					this.errorFiles.push({
						...item,
						error: errorMsg
					});
				}
			}

		this.uploader
			.onErrorItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {
				this.uploadError = true;
			}

		this.uploader.onCompleteAll = () => {
			this.uploadFiles();
		}
	}

	ngOnInit() {
		if (this.data.type == 'project') {
			this.getProjectsList();
		}
	}

	getProjectsList() {
		this.loader = true;
		this._commonService.saveApi('jobLists', {
			column: "start_date",
			page: 1,
			pageSize: 100,
			search: "",
			sort: "desc",
			type: "all"
		})
			.then(res => {
				if (res['result'].success) {
					this.state.projects = res['result'].data.list;
					this.loader = false;
					if (this.state.projects.length) {
						this.products_id = "cWpPNmVjcjUzWU5jdEdldkRxRWRJQT09";// this.data.jobs_id;
						this.getProjectFiles(this.products_id);
					}
				}
			})
	}

	checkFile(file: any) {
		file['selected'] = file['selected'] ? false : true;
		this.checkFileSelected();
	}

	checkFileSelected() {
		let selectedFiles = this.state.files.filter((file) => {
			return file['selected'];
		});
		if (selectedFiles.length) {
			this.state.fileSelected = true;
		} else {
			this.state.fileSelected = false;
		}
	}

	getProjectFiles(job_id: any) {
		this.state.fileSelected = false;
		this.loader = true;
		this._commonService.getApi('getFilesLists', { jobs_id: job_id, type: 'files' })
			.then(res => {
				if (res['result'].success) {
					this.state.files = res['result'].data.files;
					this.loader = false;
				}
			})
	}

	close() {
		if (!this.uploader.isUploading && !this.isProcessing)
			this._dialogRef.close(this.response);
	}

	onFileDrop(ev) {
		if (this.uploader.isUploading || this.isProcessing) this.uploader.setOptions({ allowedFileType: [] });
		else this.uploader.setOptions({ allowedFileType: this.allowedFileType });
	}

	uploadFiles() {
		let attachments = [];
		this.files.map(file => {
			if (!file.isUpload) attachments.push({ filename: file.filename, original_name: file.original_name });
		});
		this.isProcessing = true;
		this._commonService.saveApi(this.data.url, { ...this.data.params, ...{ attachment: attachments } })
			.then(res => {
				this.isProcessing = false;
				if (res['result'].success) {
					this.response = {
						success: true,
						data: res['result'].data
					}
					if (!this.uploadError)
						this._dialogRef.close(this.response);
				}
			})
			.catch(err => {
				this.isProcessing = false;
			})
	}

	saveProjectFile() {
		if (this.data.params.thread_id) {
			let files_ids = [];
			this.state.files.map(file => {
				if (file.selected) files_ids.push(file.attachments_id);
			});
			this.isProcessing = true;
			this._commonService.saveApi(this.data.url, { ...this.data.params, ...{ files_ids: files_ids } })
				.then(res => {
					this.isProcessing = false;
					if (res['result'].success) {
						this.response = {
							success: true,
							data: res['result'].data
						}
						if (!this.uploadError)
							this._dialogRef.close(this.response);
					}
				})
				.catch(err => {
					this.isProcessing = false;
				});
		} else {
			this._dialogRef.close({success: true, data: { ...this.data.params, ...{ files: this.state.files } }});
		}

	}

	removeErrorFile(i) {
		this.errorFiles.splice(i, 1);
	}

}
