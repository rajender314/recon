import { Component, OnInit } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { UploaderComponent } from '@app/shared/components/uploader/uploader.component';
import { MatDialog } from '@angular/material';
var APP: any = window['APP'];

@Component({
  selector: 'app-user-profile-info',
  templateUrl: './user-profile-info.component.html',
  styleUrls: ['./user-profile-info.component.scss']
})
export class UserProfileInfoComponent implements OnInit {

  userDetails: any;
  private imageUploadUrl = APP.api_url + 'uploadAttachments?container=images';
  constructor(private commonService: CommonService, private dialog: MatDialog) { }

  ngOnInit() {
    this.getUserDetails();
  }
  getUserDetails() {

    this.commonService.getApi('personalInfo', {}).then(resp => {
      if(resp['result'].success){
        this.userDetails =resp['result'].data;
      }
    }).catch(err => {
    })
  };


  uploadLogo(): void {
    const dialogRef = this.dialog.open(UploaderComponent, {
      panelClass: 'my-dialog',
      width: '500px',
      data: {
        title: "Upload Logo",
        id: this.userDetails.id,
        image: this.userDetails.image,
        saveUrl: 'uploadLogo',
        removeUrl: 'removeLogo',
        isUser: true,
        uploadUrl: this.imageUploadUrl
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.userDetails.image = result.data.filename;
      } else if (result && result.remove) {
        this.userDetails.image = '';
      }
    });
  }
}
