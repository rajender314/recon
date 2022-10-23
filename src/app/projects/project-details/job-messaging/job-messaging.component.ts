import { Component, SimpleChanges, OnInit, Inject, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { AddReciepientsComponent } from '@app/dialogs/add-reciepients/add-reciepients.component';
import { ActivatedRoute } from '@angular/router';
import { Lightbox } from 'ngx-lightbox';


var APP: any = window['APP'];

@Component({
	selector: 'app-job-messaging',
	templateUrl: './job-messaging.component.html',
	styleUrls: ['./job-messaging.component.scss']
})
export class JobMessagingComponent implements OnInit {

	private userName: any = APP.user.first_name + ' ' + APP.user.last_name;

	sortList: any = [
		{ label: 'Date', value: 'date' },
		{ label: 'Subject', value: 'subject' },
		// { label: 'Job No Ascending', value: 'asc' },
		// { label: 'Job No Descending', value: 'desc' }
	];
	noItems: boolean = false;
	loader: boolean = false;
	progress: boolean = false;
	isScroll: boolean = false;
	reload: boolean = false;
	totalPages: number = 0;
	totalCount: number = 0;
	threads: Array<any> = [];
	selectedThread: any;
	params = {
		type: 'inbox', //this.selectedTab.type,
		search: '',
		sort: 'date',
		flag: false,
		read: false,
		page: 1,
		pageSize: 50,
		users_id: APP.recon_user[0].id,
		jobs_id: ''
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
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	public activedRoute;
	public attachmentImageTypes = ['jpeg', 'jpg', 'PNG', 'png', 'bmp', 'GIF', 'gif', 'svg', 'SVG'];
	public attachmentOtherTypes = ['tiff', 'ZIP', 'zip', 'pptx', 'ppsm', 'ppsx', 'ppt', 'pptm', 'TXT', 'txt', 'RAR', 'rar', 'mp4', 'pdf', 'doc', 'docx', 'xlsx', 'xls', 'csv', 'pdf'];

	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog,
		public activeRoute: ActivatedRoute,
		private _dialogRef: MatDialogRef<JobMessagingComponent>,
		private _lightbox: Lightbox,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.params.jobs_id = data.jobs_id;
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
	}

	ngOnInit() {
		this.getList();
		
	}


	ngOnDestroy() {
		this._lightbox.close();
	}
	closeDialog() {
		this._dialogRef.close({ success: false, data: null });
	}

	getList() {
		if (!this.isScroll) {
			this.loader = true;
		}
		this._commonService.getApi('thread', this.params)
			.then(res => {
				if (res['result'].success) {
					if (!res['result'].data.message.length) {
						this.noItems = true;
						this.selectedThread = null;
					} else {
						this.totalCount = res['result'].data.total;
						if (this.params.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.params.pageSize);
						this.noItems = false;
						if (this.isScroll) this.threads = [...this.threads, ...res['result'].data.message];
						else {
							this.threads = res['result'].data.message;
							this.selectedThread = null;
						}
					}
				}
				else {
					this.noItems = true;
					this.selectedThread = null;
				}
				this.loader = false;
			})
	}

	selectListItem(item) {
		this.selectedThread = item;
		this.reset();
		this.getDetails();
	}

	reset() {
		this.details.users = {
			members: [],
			groups: []
		};
		this.details.show = {
			usersCount: 15,
			groupsCount: 15
		}
	}

	resetScroll() {
		this.isScroll = false;
		this.params.page = 1;
	}

	onSearch(event) {
		this.params.search = event;
		this.resetScroll();
		this.getList();
	}

	onSort(event) {
		this.params.sort = event;
		this.resetScroll();
		this.getList();
	}

	onFlag() {
		this.params.flag = !this.params.flag;
		this.resetScroll();
		this.getList();
	}

	onUnread() {
		this.params.read = !this.params.read;
		this.resetScroll();
		this.getList();
	}

	onReload() {
		this.reload = true;
		setTimeout(() => {
			this.reload = false;
		}, 300);
		this.resetScroll();
		this.getList();
	}

	onScroll = () => {
		if (this.params.page < this.totalPages && this.totalPages != 0) {
			this.params.page++;
			this.isScroll = true;
			this.getList()
		}
	}

	lightbox(files, selected) {
		let albums: Array<any> = [];
		const etn = ['jpeg', 'jpg', 'PNG', 'png', 'bmp', 'GIF', 'gif', 'svg', 'SVG'];
		files.map(o => {
			if (etn.indexOf(o.extension) > -1) albums.push({
				id: o.id,
				src: o.preview_path,
				caption: o.original_name,
				thumb: o.preview_path
			})
		})
		const indx = _.findIndex(albums, ['id', selected.id]);
		if (indx > -1)
			this._lightbox.open(albums, indx, { disableScrolling: true });
	}
	/* Detail */
	@ViewChild('messageListSection') private messageListContainer: ElementRef;
	@Output() onThreadChange = new EventEmitter;
	details = {
		progress: false,
		noData: true,
		showRecipients: false,
		breadcrumbs: [],
		users: {
			members: [],
			groups: []
		},
		messages: [],
		selectedThread: null,
		selectedUser: null,
		selectedGroup: null,
		show: {
			usersCount: 15,
			groupsCount: 15
		}
	}

	onMessageAdd(message: any) {
		// this.list[this.list.length - 1] = message;
		this.details.messages.push(message);
		this.selectedThread['thread_count'] = this.selectedThread['thread_count'] + 1;
		this.onThreadChange.emit(this.selectedThread);
	}

	getDetails() {
		this.details.progress = true;
		this._commonService.getApi('thread', {
			thread_id: this.selectedThread.thread_id,
			type: 'thread'
		})
			.then(res => {
				if (res['result'].success) {
					this.details.breadcrumbs = res['result'].data.message[0].breadcrumbs || [];
					if (!res['result'].data.message[0].message.length) this.details.noData = true;
					else {
						this.details.noData = false;
						this.details.messages = res['result'].data.message[0].message;
						this.details.selectedThread = res['result'].data.message[0].thread;
						this.details.users.members = res['result'].data.message[0].users || [];
						this.details.users.groups = res['result'].data.message[0].groups || [];
						this.details.messages.reverse();
						this.details.messages.map(msgObj => {
							msgObj.message = msgObj.message.replace(/\n/g, '<br/>');
							if (msgObj['attachment'] && msgObj['attachment'].length) {
								let attachmentTypes = [];
								let attachmentTypesObj = {};
								msgObj['attachment'].map((attachment) => {
									if (attachmentTypes.indexOf(attachment.extension) == -1) {
										attachmentTypes.push(attachment.extension);
									}
									if (attachmentTypesObj[attachment.extension]) {
										attachmentTypesObj[attachment.extension] = attachmentTypesObj[attachment.extension] + 1;
									} else {
										attachmentTypesObj[attachment.extension] = 1;
									}
								});
								msgObj['attachment_css'] = 'multiple-formats';
								let imageFormats = 0;
								attachmentTypes.map((type) => {
									if (this.attachmentImageTypes.indexOf(type) > -1) {
										imageFormats = imageFormats + attachmentTypesObj[type];
										if (imageFormats == msgObj['attachment'].length) {
											msgObj['attachment_css'] = 'single-format image';
										}
									}
									if (attachmentTypesObj[type] == msgObj['attachment'].length) {
										msgObj['attachment_css'] = 'single-format ' + type;
									}
								});
							}
						});
						setTimeout(this.scrollToBottom.bind(this), 0);
						setTimeout(this.markAsRead.bind(this), 2000);
					}
				}
				else {
					this.details.noData = true;
				}
				this.details.progress = false;
			})
	}

	scrollToBottom(): void {
		try {
			this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
		} catch (err) { }
	}

	markAsRead(): void {
		if (this.selectedThread.unread_count != 0) {
			this._commonService.saveApi('saveRead', {
				users_id: APP.recon_user[0].id,
				thread_id: this.selectedThread.thread_id,
				status: false
			})
				.then(res => {
					if (res['result'].success) {
						this.selectedThread.unread_count = 0;
					}
				});
		}
	}

	saveRead(): void {
		this._commonService.saveApi('saveRead', {
			users_id: APP.recon_user[0].id,
			thread_id: this.selectedThread.thread_id,
			status: false
		})
			.then(res => {
				if (res['result'].success) {
					if (this.selectedThread.unread_count == 0) {
						this.selectedThread.unread_count = 1;
					} else {
						this.selectedThread.unread_count = 0;
					}
				}
			});
	}

	saveFlag(data: any): void {
		this._commonService.saveApi('saveFlag', {
			users_id: APP.recon_user[0].id,
			thread_id: this.selectedThread.thread_id,
			type: data.type,
			status: data.status ? false : true
		})
			.then(res => {
				if (res['result'].success) {
					if (data.type == 'flag') {
						this.selectedThread.is_flag = data.status ? false : true;
					} else if (data.type == 'archive') {
						this.selectedThread.is_archive = data.status ? false : true;
						this.details.progress = false;
						this.details.noData = true;
						this.details.messages = [];
						this.selectedThread = null;
						this.resetScroll();
						this.getList();
					}
				}
			})
	}

	onKeydown(e) {

		let key = e.which || e.keyCode,
			shiftKey = !!e.shiftKey;

		if (key === 13) {
			if (shiftKey) {
				setTimeout(this.scrollToBottom.bind(this), 0);
			} else if (this.messages.newMessage) {
				e.preventDefault();

				this.details.messages.push({
					created: this.userName,
					message: this.messages.newMessage.replace(/\n/g, '<br />'),
					created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
				});

				let params = {
					message: this.messages.newMessage,
					thread_id: this.selectedThread.thread_id,
					attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
				}

				this._commonService.saveApi('saveMessage', params)
					.then(res => {
						if (res['result'].success) {
							this.details.messages[this.details.messages.length - 1] = res['result'].data[0].message[0];
						}
					});
				this.close();
				//thread_count
				this.selectedThread['thread_count'] = this.selectedThread['thread_count'] + 1;
				setTimeout(this.scrollToBottom.bind(this), 0);
			}

		}
	}


	removeAttachment(i) {
		this.messages.uploadData.files.splice(i, 1);
	}

	createMessage() {

		this.details.messages.push({
			created: this.userName,
			message: this.messages.newMessage.replace(/\n/g, '<br />'),
			created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
		});

		let params = {
			message: this.messages.newMessage,
			thread_id: this.selectedThread.thread_id,
			attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
		}

		this._commonService.saveApi('saveMessage', params)
			.then(res => {
				if (res['result'].success) {
					this.details.messages[this.details.messages.length - 1] = res['result'].data[0].message[0];
				}
			});

		this.close();

		this.selectedThread['thread_count'] = this.selectedThread['thread_count'] + 1;
		setTimeout(this.scrollToBottom.bind(this), 0);
	}

	close() {
		this.messages.showButtons = false;
		this.messages.newMessage = "";
		this.messages.uploadData.files = [];
	}

	singleDownload(file) {
		window.location.href = file.link;
	}

	/* Side Nav */

	toggleSidenav(flag) {
		this.details.showRecipients = !this.details.showRecipients;
	}

	addRecipients(prop) {
		const users = [], groups = [];
		this.details.users.members.map(o => {
			users.push(o.users_id);
		})
		this.details.users.groups.map(o => {
			groups.push(o.id);
		})

		this._dialog.open(AddReciepientsComponent, {
			width: '500px',
			data: {
				title: 'Add Recipients',
				flag: prop,
				selected: {
					user: users,
					group: groups,
					thread_id: this.selectedThread.thread_id
				}
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.details.users[prop] = [...this.details.users[prop], ...res.data];
					this.selectedThread[prop == 'members' ? 'users' : prop] = _.cloneDeep(this.details.users[prop]);
				}
			})
	}

	removeUser(prop, key) {
		let id = '';
		if (prop == 'members') id = this.details.selectedUser.users_id;
		if (prop == 'groups') id = this.details.selectedGroup.id;
		this._commonService.deleteApi('removeThreadUsers', {
			thread_id: this.selectedThread.thread_id,
			users_id: id,
			type: prop
		})
			.then(res => {
				if (res['result'].success) {
					const indx = _.findIndex(this.details.users[prop], [key, id]);
					if (indx > -1) this.details.users[prop].splice(indx, 1);
				}
			});
	}

	showAll(prop, key) {
		this.details.show[key] = this.details.users[prop].length;
	}

}
