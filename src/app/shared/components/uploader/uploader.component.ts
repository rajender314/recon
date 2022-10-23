import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { UsersService } from '@app/users/users.service';

import { FileUploader } from 'ng2-file-upload';
import { DeleteComponent } from '@app/shared/components/delete/delete.component';

var APP: any = window['APP'];

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss']
})
export class UploaderComponent implements OnInit {

  private imageUploadUrl = APP.api_url + 'uploadAttachments?container=user_profile';
  public hasDropZoneOver: boolean = false;
  public uploader: FileUploader = new FileUploader({
    url: this.imageUploadUrl,
    allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
    maxFileSize: 1 * 1024 * 1024,
    autoUpload: true,
    headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
  });
  public uploadError = false;
  public dialogReference: any;
  sizeError:boolean;
  uploads = [];
  public state = {
    disableSave: true
  }

  public isUser = true;

  constructor(
		private userService: UsersService,
    private dialogRef: MatDialogRef<UploaderComponent>,
    private dialog: MatDialog,
		@Inject(MAT_DIALOG_DATA) public data
  ) { 
    this.uploader.setOptions({url: data.uploadUrl ? data.uploadUrl : this.imageUploadUrl});
    this.uploader
    .onBeforeUploadItem = (fileItem: any) => {
      fileItem.formData.push( { 'container': 'user_profile' } );
    }
    this.uploader.onWhenAddingFileFailed = (item:any, filter:any, options:any) => {
      // this.uploadError = true;
      if(item.size >= options.maxFileSize){
        this.sizeError = true
        this.uploadError = false;
      }else{
        this.uploadError = true;
        this.sizeError = false
      }
     
      
      };
      
    this.uploader
    .onAfterAddingFile = (item: any) => {
      //this.pointerEvent = true;
  
    }
    
    this.uploader
    .onCompleteItem = (item: any, response: any, status: any, headers: any) => {
      let obj = JSON.parse(response);
      if (obj.result.success) {
        this.state.disableSave = false;
        this.uploadError = false;
        this.sizeError = false;
        this.uploads = [];
        this.uploads.push(obj.result.data);
        this.data.image = obj.result.data.display_url || obj.result.data.display_name || obj.result.data.filename;
      }
    }
  }

  ngOnInit() {
    if(this.data.isUser){
      this.isUser = true;
    }else{
      this.isUser = false;
    }
  }

  close(): void{
    this.dialogRef.close();
  }

  save(): void{
    let params = {};
    if(this.data.params){
      params = Object.assign(params, this.data.params);
    }
    params['id'] = this.data.id;
    if(this.uploads.length){
      params['filename'] = this.uploads[0].filename;
      params['original_name'] = this.uploads[0].original_name;
      params['src_name'] = this.uploads[0].source_path;
    }
    this.userService[this.data.saveUrl](params).then(response => {
        if(response.result.success){
          this.dialogRef.close({success: true, data: params});
        }
    });
  }

  remove(): void{
    

    this.dialogReference = this.dialog.open(DeleteComponent, {
			panelClass: ['my-dialog', 'upload-img'],
			width: '450px',
			data: {
				title: "Delete Image",
				msg: "Are you sure you want to delete this image?"
			}
		});
		this.dialogReference.afterClosed().subscribe(result => {
			if (result && result.success) {
          let params = {};
          if(this.data.removeParams){
            params = Object.assign(params, this.data.removeParams);
          }
          params['id'] = this.data.id;
          this.userService[this.data.removeUrl](params).then(response => {
              if(response.result.success){
                this.dialogRef.close({remove: true, data: response.result.data});
              }
          });
			}
		});
  }

  fileOverBase(ev) {}

  fileDrop(ev){}

}
