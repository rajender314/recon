import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
  selector: 'app-download-old-versions',
  templateUrl: './download-old-versions.component.html',
  styleUrls: ['./download-old-versions.component.scss']
})
export class DownloadOldVersionsComponent implements OnInit {

  filesList: Array<any> = [];

  constructor(
    private _commonService: CommonService,
    private _dialogRef: MatDialogRef<DownloadOldVersionsComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { 
  }

  ngOnInit() {
    if(this.data.url) this.getList();
  }

  getList() {
    this._commonService.getApi(this.data.url, this.data.params)
    .then(res => {
      if(res['result'].success) {
        this.filesList = res['result'].data.files || [];
      }
    })
  }

  close() {
    this._dialogRef.close();
  }

  downloadFile(item) {
    window.location.href = item.file_path;
  }

}
