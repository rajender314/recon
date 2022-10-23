import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';
import { trigger, transition, style, stagger, animate, keyframes, query } from '@angular/animations';
import { agGridColumnAutoFit } from '@app/shared/utility/config';
import { FilesInfoComponent, FilesCategoryComponent, FilesGridComponent, FilesChangeComponent, FileMessagesComponent, FileOptionsComponent, GridSelectComponent, FilesThumbnailComponent } from '@app/projects/project-details/files-grid/files-grid.component';
import { GridApi, GridOptions, RowNode, ColDef } from 'ag-grid-community';
import { MatDialog } from '@angular/material';
import { UploadFilesComponent } from '@app/dialogs/upload-files/upload-files.component';
import { ActivatedRoute } from '@angular/router';
import { AgPiSelect, AgPiInput } from '@app/shared/components/ag-grid/custom-cell-editor';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import * as _moment from 'moment';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { DownloadOldVersionsComponent } from './download-old-versions/download-old-versions.component';
import { FilePreviewComponent } from './file-preview/file-preview.component';

var APP: any = window['APP'];

@Component({
	selector: 'app-files',
	templateUrl: './files.component.html',
	styleUrls: ['./files.component.scss'],
	animations: [
		trigger('cardAnimation', [
			transition(':enter', [
				animate('500ms ease-in', keyframes([
					style({ opacity: 0, transform: 'scale(.5)' }),
					style({ opacity: .5, transform: 'scale(1)' }),
					style({ opacity: 1, transform: 'scale(1)' }),
				]))
			]),
			// transition(':leave', [
			//   animate('500ms ease-out', keyframes([
			//     style({ opacity: 1, transform: 'scale(1)' }),
			//     style({ opacity: .5, transform: 'scale(.5)' }),
			//     style({ opacity: 0, transform: 'scale(.5)' }),
			//   ]))
			// ])
		]),
		trigger('gridAnimation', [
			transition('* => *', [
				animate('300ms ease-in', keyframes([
					style({ opacity: 0, transform: 'translateX(-100%)' }),
					style({ opacity: .5, transform: 'translateX(-100px)' }),
					style({ opacity: 1, transform: 'translateX(0)' }),
				]))
			]),
			// transition('* => *', [
			//   animate('300ms ease-out', keyframes([
			//     style({ opacity: 1, transform: 'translateX(0)' }),
			//     style({ opacity: .5, transform: 'translateX(-100px)' }),
			//     style({ opacity: 0, transform: 'translateX(-100%)' }),
			//   ]))
			// ])
		])
	]
})
export class FilesComponent implements OnInit {
	@ViewChild('messageListSection') private messageListContainer: ElementRef;
	public gridApi: GridApi;
	public state = {
		loader: true,
		showSideNav: false,
		className: 'four',
		projectID: null,
		projectNo: null,
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' }
		],
		filterBy: [
			{ label: "All", key: 0 },
			{ label: "Recent", key: 1 },
			{ label: "My Files", key: 2 }
		],
		selectedFilter: { label: "All", key: 0 },
		recentFiles: [],
		clonedRecentFiles: [],
		myFiles: [],
		clonedMyFiles: [],
		categories: [],
		is_thumbnail: false,
		thumbnails: [],
		files: [],
		clonedFiles: [],
		searchValue: '',
		listTypes: [
			{ id: 0, label: ' ', type: 'grid', css: 'icon-thumbnail' },
			{ id: 1, label: ' ', type: 'list', css: 'icon-list-view' },
		],
		selectedType: 0,
		hideFilesGrid: true,
		selectedFile: null,
		threadBreadcrumb: [],
		actions: [
			{ key: 'download', label: 'Download', icon: 'download-new', is_visible: true },
			{ key: 'download-old', label: 'Download Old Version', icon: 'download-new old', is_visible: false },
			{ key: 'upload', label: 'Upload New Version', icon: 'upload-new', is_visible: true },
			{ key: 'private', label: 'Make Private', icon: 'make-private', is_visible: true },
			{ key: 'public', label: 'Make Public', icon: 'make-private', is_visible: false },
			{ key: 'remove', label: 'Remove', icon: 'delete-lined', is_visible: true },
		]
	};

	gridOptions: GridOptions = {
		columnDefs: [
			{
				headerName: 'FILE NAME', field: 'file_name', filter: "agTextColumnFilter", editable: true, enableRowGroup: false, cellRendererFramework: FilesInfoComponent
			},
			{
				headerName: 'FILE CATEGORY', cellClass: "file-cat-grid", field: 'file_categories_id', editable: true, cellEditorFramework: AgPiSelect, cellEditorParams: (params) => {
					return {
						options: this.state.categories || []
					}
				}, onCellValueChanged: params => {
					if (params.oldValue != params.newValue) {
						(<RowNode>params.node).data.file_categories_name = this.getCategoryName(params.value);
						(<RowNode>params.node).setData((<RowNode>params.node).data);
					}
					if (document.querySelector('.pi-select-list')) {
						document.body.removeChild(document.querySelector('.pi-select-list'));
					}
				}, cellRendererFramework: FilesCategoryComponent, filter: "agTextColumnFilter", enableRowGroup: false
			},
			// cellEditorFramework: GridSelectComponent, cellRendererFramework: FilesCategoryComponent
			{ headerName: 'TAG', field: 'tag', width: 200, filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FilesGridComponent },
			{ headerName: 'LAST MODIFIED', field: 'last_modified', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FilesChangeComponent },
			{
				headerName: ' ', field: 'messages', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FileMessagesComponent, width: 50, onCellClicked: ev => {
					this.state.selectedFile = ev.data || null;
					const file = [{ label: this.state.selectedFile.file_name, type: 'text' }];
					this.state.threadBreadcrumb = [...this.state.breadcrumbs, ...file];
					this.toggleSideNav();
				}
			},
			{ headerName: ' ', field: 'options', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FileOptionsComponent, width: 50 }
		],
		rowHeight: 60,
		headerHeight: 30,
		animateRows: true,
		rowSelection: 'multiple',
		deltaRowDataMode: true,
		groupIncludeTotalFooter: false,
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		suppressMakeColumnVisibleAfterUnGroup: false,
		suppressAggFuncInHeader: true,
		autoGroupColumnDef: {
			cellRendererParams: {
			}
		},
		icons: {
			groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
			groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
		},
		defaultColDef: {
			sortable: true,
			resizable: false,
			filter: false
		},
		getRowNodeId: data => {
			return data.id;
		},
		onGridReady: (params) => {
			this.gridApi = params.api;
			setTimeout(() => {
				agGridColumnAutoFit(params.api, params.columnApi, true);
				this.state.hideFilesGrid = false;
			}, 100);
			window.onresize = () => {
				agGridColumnAutoFit(params.api, params.columnApi, true);
			};
		},
		sortingOrder: ["asc", "desc"],
		enableRangeSelection: true,
		floatingFilter: false,
		rowGroupPanelShow: 'never',
		pivotPanelShow: 'never',
		sideBar: false,
		rowData: [],
		onCellClicked: ev => {
			if (ev.data && ev.column) {
				if (ev.column['colId'] == 'file_name') {
					// this.openSelectedFile(ev.data);
				}
			}
		}
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

	public routerSubscription: any;
	public subscription: any;

	constructor(
		private commonService: CommonService,
		private _dialog: MatDialog,
		private _router: ActivatedRoute
	) {
		this.state.breadcrumbs[0].route = commonService.projectState ? ('/projects/' + commonService.projectState) : '/projects';
		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			this.getFiles();
		});
		this.subscription = commonService.onUpdate().subscribe(obj => {
			if (obj && obj.type == 'projectName' && obj.data && Object.keys(obj.data).length) {
				this.state.projectNo = obj.data.job_no;
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
			}

			if (obj && obj.type == 'file-actions-service') {
				this.performActions(obj.action, obj.file);
			}

			if (obj) {
				if (obj.type == 'file_ag_remove') {
					const selectedIndx = _.findIndex(this.state.files, ['id', obj.data.id]);
					if (selectedIndx > -1) {
						this.state.files.splice(selectedIndx, 1);
						if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
							this.updateFilesList('remove', obj.data);
						} else {
							this.setFilesList();
						}
					}
				} else if (obj.type == 'file_ag_private') {
					const selectedIndx = _.findIndex(this.state.files, ['id', obj.data.id]);
					if (selectedIndx > -1) {
						this.state.files[selectedIndx].is_private = obj.data.is_private;
						if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
							this.updateFilesList('update', obj.data);
						} else {
							this.setFilesList();
						}
					}
				} else if (obj.type == 'file_ag_upload') {
					const selectedIndx = _.findIndex(this.state.files, ['id', obj.data.remove.id]);
					if (selectedIndx > -1) {
						this.state.files.splice(selectedIndx, 1, obj.data.add[0]);
						if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
							this.updateFilesList('update', obj.data.remove, obj.data.add[0]);
						} else {
							this.setFilesList();
						}
					}
				}
			}
		});

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

		window.onresize = () => {
			this.calculateLimit();
		}
	}

	calculateLimit() {
		if (window.innerWidth <= 1000) {
			this.state.className = 'two';
		} else if (window.innerWidth <= 1400 && window.innerWidth > 1000) {
			this.state.className = 'three';
		} else if (window.innerWidth > 1400 && window.innerWidth <= 2400) {
			this.state.className = 'four';
		} else if (window.innerWidth > 2400) {
			this.state.className = 'five';
		}
	}

	ngOnInit() {
		// this.getFiles();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	enableActions(file) {
		if (APP.permissions.job_access.access_private_files == 'yes') {
			if (file.is_private) {
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
		if (file.version == 'V0') {
			this.state.actions[1].is_visible = false;
		} else {
			this.state.actions[1].is_visible = true;
		}
	}

	menuOpened(file) {
		this.state.selectedFile = file;
		this.enableActions(file);
	}

	performActions(act, file) {
		if (act.key == 'download') {
			window.location.href = file.file_path;
		} else if (act.key == 'remove') {
			let msg = 'Are you sure, you want to delete this File?';
			const locals = {
				title: 'Delete File',
				url: 'removeFilesAttachment',
				method: 'delete',
				params: {
					id: file.id,
					jobs_id: this.state.projectID
				},
				content: `<div class="po-dialog confirm-delete">
								<div class="">
									<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
								</div>
								<div class="">
									<p>${msg}</p>
								</div>
							</div>`,
				buttonText: 'Delete'
			}
			this._dialog.open(ConfirmationComponent, {
				panelClass: 'recon-dialog',
				width: '570px',
				data: { ...locals }
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						const selectedIndx = _.findIndex(this.state.files, ['id', file.id]);
						if (selectedIndx > -1) {
							this.commonService.update({ type: 'left-nav-count', data: {} });
							this.state.files.splice(selectedIndx, 1);
							if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
								this.updateFilesList('remove', file);
							} else {
								this.setFilesList();
							}
							this.commonService.update({type: 'remove-file-from-preview', file: file, index: selectedIndx});
						}
					}
				})
		} else if (act.key == 'private' || act.key == 'public') {
			this.commonService.saveApi('updateFileAccess', { jobs_id: this.state.projectID, id: file.id, flag: act.key })
				.then(res => {
					if (res['result'].success) {
						file.is_private = !file.is_private;
						this.enableActions(file);
						if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
							this.updateFilesList('update', file);
						} else {
							this.setFilesList();
						}
					}
				})
		} else if (act.key == 'download-old') {
			this._dialog.open(DownloadOldVersionsComponent, {
				width: '600px',
				data: {
					title: 'Download Files',
					url: 'getVersionFiles',
					method: 'get',
					params: { jobs_id: this.state.projectID, id: file.id }
				}
			})
				.afterClosed()
				.subscribe(res => {
				})
		} else if (act.key == 'upload') {
			this._dialog.open(UploadFilesComponent, {
				panelClass: 'recon-dialog',
				width: '930px',
				height: '590px',
				disableClose: true,
				data: {
					appendJobsId: true,
					title: 'Add Files',
					url: 'uploadNewVersion',
					multiple: false,
					params: {
						jobs_id: this.state.projectID,
						id: file.id
					}
				}
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						const selectedIndx = _.findIndex(this.state.files, ['id', file.id]);
						if (selectedIndx > -1) {
							this.state.files.splice(selectedIndx, 1, res.data[0]);
							if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
								this.updateFilesList('replace', file, res.data[0]);
							} else {
								this.setFilesList();
							}
							this.commonService.update({type: 'upload-file-from-preview', file: res.data[0]});
						}
					}
				})
		}
	}

	openSelectedFile(file) {
		const selectedIndx = _.findIndex(this.state.clonedFiles, ['id', file.id]) || 0;
		this._dialog.open(FilePreviewComponent, {
			panelClass: ['full-width-modal', 'full-modal-box-ui'],
			width: '100vw',
			height: '100vh',
			maxWidth: '100vw',
			disableClose: true,
			data: {
				title: '',
				selectedFile: file,
				jobs_id: this.state.projectID,
				selectedIndex: selectedIndx,
				allFiles: this.state.clonedFiles,
				totalLength: this.state.clonedFiles.length,
				breadcrumbs: [...this.state.breadcrumbs, ...[{ label: 'Files', type: 'link', route: '/projects/' + this.state.projectID + '/files' }]]
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					this.updateThreadCount(file, res.data.length);
				}
			})
	}

	getCategoryName(id) {
		const obj = _.find(this.state.categories, ['id', id]);
		if (obj) return obj.name;
		else return '';
	}

	getThumbnailName(id) {
		const obj = _.find(this.state.thumbnails, ['products_id', id]);
		if (obj) return obj.product_name;
		else return '';
	}

	filterBy(option) {
		this.state.selectedFilter = option;
		let filterKey = this.state.selectedFilter.key;
		this.state.files = _.cloneDeep(this.state.clonedFiles);
		switch (option.key) {
			case 0:
				break;
			default:
				this.state.files = _.filter(this.state.files, (file) => {
					// return file.type == filterKey;
					return file.type.indexOf(filterKey) > -1;
				});
				break;
		}
		let searchVal = this.state.searchValue.toLowerCase();
		if (searchVal) {
			this.searchFiles();
		}
		this.buildFilesData();
	}

	filterFiles() {
		let filterKey = this.state.selectedFilter.key;
		this.state.files = _.filter(this.state.files, (file) => {
			// return file.type == filterKey;
			return file.type.indexOf(filterKey) > -1;
		});
	}

	searchFiles() {
		let searchVal = this.state.searchValue.toLowerCase();
		this.state.files = _.filter(this.state.files, (file) => {
			return file.file_name.toLowerCase().includes(searchVal);
		});
	}

	getAccessedFiles() {
		this.state.files = _.filter(this.state.files, file => {
			if (file.is_private) {
				return APP.permissions.job_access.access_private_files == 'yes';
			}
			return true;
		});
	}

	getFiles(flag = 'init') {
		this.state.loader = true;
		this.commonService.update({ type: 'left-nav-count', data: {} });
		this.commonService.getApi('getFilesLists', { jobs_id: this.state.projectID, type: 'files' })
			.then(res => {
				this.state.categories = res['result'].data.filecategories;
				this.state.thumbnails = res['result'].data.productlist || [];
				this.state.files = res['result'].data.files;
				if (this.state.files.length) this.state.is_thumbnail = this.state.files[0].is_thumbnail || false;
				this.getAccessedFiles();
				this.setFilesList();
				this.buildFileColumns();
				if (flag == 'add') this.filterBy(this.state.selectedFilter);
				else this.calculateLimit();
				this.state.loader = false;
			});
		// setTimeout(() => {
		//   this.setFilesList();
		//   this.state.loader = false;
		// }, 1000);
	}

	buildFileColumns() {
		let columns: ColDef[] = [
			{
				headerName: 'FILE nAME', field: 'file_name', filter: "agTextColumnFilter", editable: true, enableRowGroup: false, cellRendererFramework: FilesInfoComponent,
				// cellEditorFramework: AgPiInput,
				cellEditorParams: (params) => {
					return params;
				}, onCellValueChanged: params => {
					if (params.oldValue != params.data.file_name_new) {
						(<RowNode>params.node).data.file_name = params.data.file_name_new + "." + params.data.file_type;
						(<RowNode>params.node).setData((<RowNode>params.node).data);
						const field: any = {
							id: params.data.id,
							jobs_id: this.state.projectID,
							is_thumbnail: params.data.is_thumbnail, 
							file_categories_id: params.data.file_categories_id,
							file_categories_name: params.data.file_categories_name,
							file_name: params.data.file_name_new + "." + params.data.file_type
						}
						if (params.data.is_thumbnail) {
							field.jobs_products_id = params.data.jobs_products_id;
							field.thumbnail_name = params.data.thumbnail_name
						}
						this.updateRecord('category', field, (data) => {
							if (data.success) {
							}
						})
					}
				}
			},
			{
				headerName: 'FILE CATEGORY', cellClass: 'file-cat-grid', field: 'file_categories_id', editable: true, cellEditorFramework: AgPiSelect, cellEditorParams: (params) => {
					return {
						options: this.state.categories || []
					}
				}, onCellValueChanged: params => {
					if (params.oldValue != params.newValue) {
						(<RowNode>params.node).data.file_categories_name = this.getCategoryName(params.data.file_categories_id);
						(<RowNode>params.node).setData((<RowNode>params.node).data);
						if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
							this.updateFilesList('update', params.data);
						} else {
							this.setFilesList();
						}
						const field: any = {
							id: params.data.id,
							jobs_id: this.state.projectID,
							is_thumbnail: params.data.is_thumbnail,
							file_categories_id: params.data.file_categories_id,
							file_categories_name: params.data.file_categories_name,
							file_name: params.data.file_name
						}
						if (params.data.is_thumbnail) {
							field.jobs_products_id = params.data.jobs_products_id;
							field.thumbnail_name = params.data.thumbnail_name
						}
						this.updateRecord('category', field, (data) => {
							if (data.success) {
							}
						})
					}
					if (document.querySelector('.pi-select-list')) {
						document.body.removeChild(document.querySelector('.pi-select-list'));
					}
				}, cellRendererFramework: FilesCategoryComponent, filter: "agTextColumnFilter", enableRowGroup: false
			}
		];
		if (this.state.is_thumbnail) columns.push({
			headerName: 'Thumbnail Image', cellClass: 'file-cat-grid', field: 'jobs_products_id', editable: true, cellEditorFramework: AgPiSelect, cellEditorParams: (params) => {
				return {
					idKey: 'products_id',
					nameKey: 'product_name',
					options: this.state.thumbnails || []
				}
			}, onCellValueChanged: params => {
				if (params.oldValue != params.newValue) {
					(<RowNode>params.node).data.thumbnail_name = this.getThumbnailName(params.data.jobs_products_id);
					(<RowNode>params.node).setData((<RowNode>params.node).data);
					if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
						this.updateFilesList('update', params.data);
					} else {
						this.setFilesList();
					}
					const field: any = {
						id: params.data.id,
						jobs_id: this.state.projectID,
						is_thumbnail: params.data.is_thumbnail,
						file_categories_id: params.data.file_categories_id,
						file_categories_name: params.data.file_categories_name,
						file_name: params.data.file_name
					}
					if (params.data.is_thumbnail) {
						field.jobs_products_id = params.data.jobs_products_id;
						field.thumbnail_name = params.data.thumbnail_name
					}
					this.updateRecord('category', field, (data) => {
						if (data.success) {
						}
					})
				}
				if (document.querySelector('.pi-select-list')) {
					document.body.removeChild(document.querySelector('.pi-select-list'));
				}
			}, cellRendererFramework: FilesThumbnailComponent, filter: "agTextColumnFilter", enableRowGroup: false
		})
		columns = [...columns, ...[{ headerName: 'TAG', field: 'tag', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FilesGridComponent, cellRendererParams: { job_no: this.state.projectNo } },
		{ headerName: 'LAST MODIFIED', field: 'last_modified', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FilesChangeComponent },
		{
			headerName: ' ', field: 'messages', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FileMessagesComponent, width: 50, onCellClicked: ev => {
				this.state.selectedFile = ev.data || null;
				const file = [{ label: this.state.selectedFile.file_name, type: 'text' }];
				this.state.threadBreadcrumb = [...this.state.breadcrumbs, ...file];
				this.toggleSideNav();
			}
		},
		{
			headerName: ' ', field: 'options', filter: "agTextColumnFilter", enableRowGroup: false, cellRendererFramework: FileOptionsComponent, width: 50, cellRendererParams: {
				jobs_id: this.state.projectID
			}
		}]]
		this.gridOptions.columnDefs = columns;
	}

	buildFilesData() {
		switch (this.state.selectedType) {
			case 1:
				this.state.loader = true;
				this.state.hideFilesGrid = true;
				this.gridOptions.rowData = this.state.files;
				setTimeout(() => {
					this.state.loader = false;
				}, 100);
				break;
		}
	}

	changeType(id) {
		if (this.state.selectedType != id) {
			this.state.hideFilesGrid = true;
			this.state.selectedType = id;
			this.state.selectedFile = null;
			this.buildFilesData();
		}
	}

	setFilesList() {
		this.state.clonedFiles = _.cloneDeep(this.state.files);
		this.state.myFiles = _.filter(this.state.files, (file) => { return file.type.indexOf(1) > -1 });
		this.state.recentFiles = _.filter(this.state.files, (file) => { return file.type.indexOf(2) > -1 });
		this.state.clonedMyFiles = _.cloneDeep(this.state.myFiles);
		this.state.clonedRecentFiles = _.cloneDeep(this.state.clonedMyFiles);
	}

	updateFilesList(flag, data, replaceData?) {
		const cloneFileIndx = _.findIndex(this.state.clonedFiles, ['id', data.id]);
		const myFileIndx = _.findIndex(this.state.myFiles, ['id', data.id]);
		const recentFileIndx = _.findIndex(this.state.recentFiles, ['id', data.id]);
		const clonedMyFileIndx = _.findIndex(this.state.clonedMyFiles, ['id', data.id]);
		const clonedRecentFileIndx = _.findIndex(this.state.clonedRecentFiles, ['id', data.id]);
		if (flag == 'remove') {
			if (cloneFileIndx > -1) this.state.clonedFiles.splice(cloneFileIndx, 1);
			if (myFileIndx > -1) this.state.myFiles.splice(myFileIndx, 1);
			if (recentFileIndx > -1) this.state.recentFiles.splice(recentFileIndx, 1);
			if (clonedMyFileIndx > -1) this.state.clonedMyFiles.splice(clonedMyFileIndx, 1);
			if (clonedRecentFileIndx > -1) this.state.clonedRecentFiles.splice(clonedRecentFileIndx, 1);
		} else if (flag == 'update') {
			if (cloneFileIndx > -1) this.state.clonedFiles[cloneFileIndx] = data;
			if (myFileIndx > -1) this.state.myFiles[myFileIndx] = data;
			if (recentFileIndx > -1) this.state.recentFiles[recentFileIndx] = data;
			if (clonedMyFileIndx > -1) this.state.clonedMyFiles[clonedMyFileIndx] = data;
			if (clonedRecentFileIndx > -1) this.state.clonedRecentFiles[clonedRecentFileIndx] = data;
		} else if (flag == 'replace') {
			if (cloneFileIndx > -1) this.state.clonedFiles.splice(cloneFileIndx, 1, replaceData);
			if (myFileIndx > -1) this.state.myFiles.splice(myFileIndx, 1, replaceData);
			if (recentFileIndx > -1) this.state.recentFiles.splice(recentFileIndx, 1, replaceData);
			if (clonedMyFileIndx > -1) this.state.clonedMyFiles.splice(clonedMyFileIndx, 1, replaceData);
			if (clonedRecentFileIndx > -1) this.state.clonedRecentFiles.splice(clonedRecentFileIndx, 1, replaceData);
		} else if (flag == 'thread-count') {
			if (cloneFileIndx > -1) this.state.clonedFiles[cloneFileIndx].messages = replaceData;
			if (myFileIndx > -1) this.state.myFiles[myFileIndx].messages = replaceData;
			if (recentFileIndx > -1) this.state.recentFiles[recentFileIndx].messages = replaceData;
			if (clonedMyFileIndx > -1) this.state.clonedMyFiles[clonedMyFileIndx].messages = replaceData;
			if (clonedRecentFileIndx > -1) this.state.clonedRecentFiles[clonedRecentFileIndx].messages = replaceData;
		}
	}

	updateThreadCount(file, count) {
		const indx = _.findIndex(this.state.files, ['id', file.id]);
		if (indx > -1) this.state.files[indx].messages = count;
		if (this.gridApi) {
			const row = this.gridApi.getRowNode(file.id);
			if (row) {
				row.data.messages = count;
			}
		}
		if (this.state.selectedFilter.key != 0 || this.state.searchValue) {
			this.updateFilesList('thread-count', file, count);
		} else {
			this.setFilesList();
		}
	}

	// updateFilesList(data) {
	// 	this.state.clonedFiles = _.cloneDeep(this.state.files);
	// 	this.state.myFiles = _.filter(this.state.files, (file) => { return file.type.indexOf(1) > -1 });
	// 	this.state.recentFiles = _.filter(this.state.files, (file) => { return file.type.indexOf(2) > -1 });
	// 	this.state.clonedMyFiles = _.cloneDeep(this.state.myFiles);
	// 	this.state.clonedRecentFiles = _.cloneDeep(this.state.clonedMyFiles);
	// }

	DOMSearch(val) {
		this.state.searchValue = val;
		this.state.files = _.cloneDeep(this.state.clonedFiles);
		if (val) {
			val = val.toLowerCase();
			this.state.files = _.filter(this.state.files, (file) => {
				return file.file_name.toLowerCase().includes(val) || file.modified_by.toLowerCase().includes(val);
			});
		}
		switch (this.state.selectedFilter.key) {
			case 0:
				break;
			default:
				this.filterFiles();
				break;
		}
		this.buildFilesData();
	}

	addFiles() {
		this._dialog.open(UploadFilesComponent, {
			panelClass: 'recon-dialog',
			width: '930px',
			height: '590px',
			disableClose: true,
			data: {
				title: 'Add Files',
				url: 'saveFilesAttach',
				multiple: true,
				appendJobsId: true,
				params: {
					jobs_id: this.state.projectID
				}
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.getFiles('add');
				}
			})
	}

	updateRecord(type, params, cb?) {
		if (type == 'category') {
			this.commonService.saveApi('updateFileDetails', params)
				.then(res => {
					if (cb) cb(res['result'].success);
				})
		}
	}

	toggleSideNav() {
		this.state.showSideNav = !this.state.showSideNav;
		if (this.state.showSideNav)
			this.getMessages();
	}

	checkDiscussion(cb?) {
		this.commonService.getApi('checkPoThread', { id: this.state.selectedFile.id, type: 'files' })
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
		this.commonService.getApi('thread', { thread_id: threadId, type: 'thread' })
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

			this.commonService.saveApi('saveMessage', params)
				.then(res => {
					this.messages.list[this.messages.list.length - 1] = res['result'].data[0].message[0];
				});

			this.resetMessage();

			this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;

			this.updateThreadCount(this.state.selectedFile, this.messages.list.length);
		} else {
			this.commonService.saveApi('saveProjectThreads', {
				jobs_id: this.state.projectID,
				id: this.state.selectedFile.id,
				type: 'files',
				breadcrum_type: 6,
				message: this.messages.newMessage.replace(/\n/g, '<br />'),
				users: [APP.recon_user[0].id],
				subject: this.state.selectedFile.file_name,
				attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
			})
				.then(res => {
					if (res['result'].success) {
						this.messages.hasThread = true;
						this.resetMessage();
						this.getMessageList(res['result'].data.thread_id);

						this.updateThreadCount(this.state.selectedFile, 1);
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
			this.singleDownload(file);
		})
	}

}