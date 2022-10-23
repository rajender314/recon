import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileItem, FileLikeObject, ParsedResponseHeaders } from 'ng2-file-upload';
import { CommonService } from '@app/common/common.service';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';
import { isJson } from '@app/shared/utility/config';

var APP: any = window['APP'];

@Component({
	selector: 'app-upload-files',
	templateUrl: './upload-files.component.html',
	styleUrls: ['./upload-files.component.scss'],
	providers: [SafeHtmlPipe]
})
export class UploadFilesComponent implements OnInit {

	files: Array<any> = [];
	uploadUrl = APP.api_url + 'uploadAttachments?container=jobs_files';
	allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
	allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt'];
	uploader: FileUploader = new FileUploader({
		allowedFileType: this.allowedFileType,
		isHTML5: true,
		url: this.uploadUrl + "&jobs_id=" + this.data.params.jobs_id,
		maxFileSize: 20 * 1024 * 1024,
		autoUpload: false,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});
	errorFiles: Array<any> = [];
	isProcessing: boolean = false;
	uploadError: boolean = false;

	response = {
		success: false,
		data: []
	}

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<UploadFilesComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if (this.data['appendJobsId']) {
			this.uploadUrl += `&jobs_id=${this.data.params.jobs_id}`;
			this.uploader = new FileUploader({
				url: this.uploadUrl,
				allowedFileType: this.allowedFileType,
				maxFileSize: 20 * 1024 * 1024,
				autoUpload: true,
				headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
			});
		}
		if (this.data.multiple) this.uploader.setOptions({ queueLimit: 20 });
		else this.uploader.setOptions({ queueLimit: 1 });
		this.uploader.onAfterAddingFile = (item: FileItem) => {
			let count = 0;
			this.uploader.queue.map(o => {
				if (JSON.stringify(o.file) == JSON.stringify(item.file)) {
					count++;
				}
			})
			if (count > 1) {
				this.uploader.removeFromQueue(this.uploader.queue[this.uploader.queue.length - 1]);
				return;
			}
			item['customType'] = item.file.name.split('.').pop();
			item['is_image'] = false;
			var mimeType = item._file.type;
			if (mimeType.match(/image\/*/) != null && item['customType'] != 'tiff') {
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
			// this.uploadFiles();
		}
	}

	ngOnInit() { }

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
		this._commonService.update({ type: 'overlay', action: 'start' });
		this._commonService.saveApi(this.data.url, { ...this.data.params, ...{ attachments: attachments } })
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
				this._commonService.update({ type: 'overlay', action: 'stop' });
			})
			.catch(err => {
				this.isProcessing = false;
				this._commonService.update({ type: 'overlay', action: 'stop' });
			})
	}

	removeErrorFile(i) {
		this.errorFiles.splice(i, 1);
	}

}
