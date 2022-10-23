import { Component, OnInit, Inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';
import * as _moment from 'moment';

var APP: any = window['APP'];
declare let Box: any;

@Component({
	selector: 'app-file-preview',
	templateUrl: './file-preview.component.html',
	styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnInit, AfterViewInit {
	@ViewChild('messageListSection') private messageListContainer: ElementRef;

	public state = {
		actions: [
			{ key: 'download', label: 'Download', icon: 'download-new', is_visible: true },
			{ key: 'download-old', label: 'Download Old Version', icon: 'download-new old', is_visible: false },
			{ key: 'upload', label: 'Upload New Version', icon: 'upload-new', is_visible: true },
			{ key: 'private', label: 'Make Private', icon: 'make-private', is_visible: true },
			{ key: 'public', label: 'Make Public', icon: 'make-private', is_visible: false },
			{ key: 'remove', label: 'Remove', icon: 'delete-lined', is_visible: true },
		]
	}

	messages = {
		isNew: true,
		inProgress: true,
		noData: false,
		showButtons: false,
		userName: APP.user.first_name + ' ' + APP.user.last_name,
		uploadData: {
			error: '',
			files: []
		},
		hasThread: false,
		newMessage: '',
		thread: {},
		list: []
	}

	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
	allowedFileType = ['application', 'image', 'video', 'audio', 'pdf', 'compress', 'doc', 'xls', 'ppt'];
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedFileType: this.allowedFileType,
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	preview: any;

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<FilePreviewComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.preview = new Box.Preview()
		this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
			if (item.size >= options.maxFileSize) this.messages.uploadData.error = 'Exceeds Max. Size';
			else this.messages.uploadData.error = 'Invalid File Upload';
		}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					let type = obj.result.data.original_name.split('.').pop();
					this.messages.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
					this.messages.uploadData.error = '';
				}
			}

		this._commonService.onUpdate().subscribe(obj => {
			if (obj && obj.type == 'upload-file-from-preview') {
				this.data.selectedFile = obj.file;
			}
			if (obj && obj.type == 'remove-file-from-preview') {
				this.data.allFiles.splice(obj.index, 1);
				if(this.data.allFiles.length){
					this.data.totalLength = this.data.allFiles.length;
					if(this.data.allFiles[obj.index]){
						this.data.selectedFile = this.data.allFiles[this.data.selectedIndex];
						this.getMessages();
					}else{
						this.goPrev(obj.index);
					}
				}else{
					this._dialogRef.close({ success: true, data: this.messages.list });
				}
			}
		});
	}

	ngOnInit() {
		this.getMessages();
	}

	ngAfterViewInit() {
		// uncomment to make box preview work
		/* this.preview.show('549851822665', 'l1B7Y0CwhRSn7NDWdgkqZzDd3YLb7nHg', {
			container: '.carousel-container'
		}) */
	}

	closeDialog() {
		this._dialogRef.close({ success: true, data: this.messages.list });
	}

	goPrev(indx) {
		this.data.selectedIndex--;
		this.data.selectedFile = this.data.allFiles[this.data.selectedIndex];
		this.getMessages();
	}

	goNext(indx) {
		this.data.selectedIndex++;
		this.data.selectedFile = this.data.allFiles[this.data.selectedIndex];
		this.getMessages();
	}

	checkDiscussion(cb?) {
		this._commonService.getApi('checkPoThread', { id: this.data.selectedFile.id, type: 'files' })
			.then(res => {
				if (res['result'].success) {
					if (res['result'].data.threadStatus) {
						if (cb) cb({ success: true, data: res['result'].data });
					} else {
						if (cb) cb({ success: false, data: {} })
					}
				} else {
					this.messages.inProgress = false;
				}
			})
	}

	getMessageList(threadId) {
		this.messages.isNew = false;
		this._commonService.getApi('thread', { thread_id: threadId, type: 'thread' })
			.then((res: any) => {
				if (res.result.success) {
					if (!res.result.data.message.length) this.messages.noData = true;
					else {
						this.messages.noData = false;
						this.messages.list = res.result.data.message[0].message;
						this.messages.thread = res.result.data.message[0].thread;
						this.messages.list.reverse();
						this.messages.list.map(o => {
							o.message = o.message.replace(/\n/g, '<br/>');
						});
						setTimeout(this.scrollToBottom.bind(this), 0);
					}
				} else {
					this.messages.noData = true;
				}
				this.messages.inProgress = false;
			})
	}

	getMessages() {
		this.resetMessage();
		this.messages.inProgress = true;
		this.checkDiscussion(obj => {
			if (obj.success) {
				this.messages.hasThread = true;
				this.getMessageList(obj.data.threadId);
			} else {
				this.messages.inProgress = false;
				// this.messages.isNew = true;
				this.messages.hasThread = false;
				this.messages.isNew = false;
				this.messages.noData = true;
			}
		});

	}

	resetMessage() {
		this.messages.showButtons = false;
		this.messages.newMessage = '';
		this.messages.uploadData.files = [];
	}

	createMessage() {
		if (this.messages.hasThread) {
			this.messages.list.push((<any>{
				created: this.messages.userName,
				message: this.messages.newMessage.replace(/\n/g, '<br />'),
				created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
			}))

			let params = {
				message: this.messages.newMessage,
				thread_id: this.messages.thread['thread_id'],
				attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
			}

			this._commonService.saveApi('saveMessage', params)
				.then(res => {
					if (res['result'].success) {
						this.messages.list[this.messages.list.length - 1] = res['result'].data[0].message[0];
					}
				});

			this.resetMessage();

			this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
		} else {
			this._commonService.saveApi('saveProjectThreads', {
				jobs_id: this.data.jobs_id,
				id: this.data.selectedFile.id,
				type: 'files',
				breadcrum_type: 6,
				message: this.messages.newMessage.replace(/\n/g, '<br />'),
				users: [APP.recon_user[0].id],
				subject: this.data.selectedFile.file_name,
				attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
			})
				.then(res => {
					if (res['result'].success) {
						this.messages.hasThread = true;
						this.resetMessage();
						this.getMessageList(res['result'].data.thread_id);
						// this.snackbarModal('Discussion Created Successfully');
					}
				})
		}
	}

	scrollToBottom(): void {
		try {
			this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
		} catch (err) { }
	}

	onKeydown(e) {

		let key = e.which || e.keyCode,
			shiftKey = !!e.shiftKey;

		if (key === 13) {
			if (shiftKey) {
				setTimeout(this.scrollToBottom.bind(this), 0);
			} else if (this.messages.newMessage) {
				e.preventDefault();

				this.createMessage();

				setTimeout(this.scrollToBottom.bind(this), 0);
			}

		}
	}

	removeAttachment(i) {
		this.messages.uploadData.files.splice(i, 1);
	}

	singleDownload(file) {
		window.location.href = file.link;
	}

	downloadAll(files) {
		files.map(file => {
			setTimeout(() => {
				this.singleDownload(file);
			}, 20);
		})
	}

	enableActions() {
		if (APP.permissions.job_access.access_private_files == 'yes') {
			if (this.data.selectedFile.is_private) {
				this.state.actions[3].is_visible = false;
				this.state.actions[4].is_visible = true;
			} else {
				this.state.actions[3].is_visible = true;
				this.state.actions[4].is_visible = false;
			}
		} else {
			this.state.actions[3].is_visible = false;
			this.state.actions[4].is_visible = false;
		}
		if (this.data.selectedFile.version == 'V0') {
			this.state.actions[1].is_visible = false;
		} else {
			this.state.actions[1].is_visible = true;
		}
	}

	menuOpened() {
		this.enableActions();
	}

	performActions(act) {
		this._commonService.update({type: 'file-actions-service', file: this.data.selectedFile, action: act});
	}

}
