import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { UploadFilesComponent } from '@app/dialogs/upload-files/upload-files.component';
import { AddFilesComponent } from '@app/shared/components/chat/add-files/add-files.component';
import { MessagingService } from '@app/messaging/messaging.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-send-box',
  templateUrl: './send-box.component.html',
  styleUrls: ['./send-box.component.scss']
})
export class SendBoxComponent implements OnInit {

  @Input() options;
  @Output() addMessage = new EventEmitter;
  @Output() newMessage = new EventEmitter;

  public state = {
    message: '',
    focus: false
  };

  constructor(
    private _dialog: MatDialog,
    private activeRoute: ActivatedRoute,
    private messagingService: MessagingService
  ) { }

  ngOnInit() {
  }

  focusChat() {
    this.state.focus = true;
  }

  blurChat() {
    this.state.focus = false;
  }

  addFiles(type: any) {
    this._dialog.open(AddFilesComponent, {
      panelClass: 'recon-dialog',
      width: '930px',
      height: '590px',
      disableClose: true,
      data: {
        title: 'Add Files',
        url: 'saveMessage',
        multiple: true,
        type: type,
        jobs_id: (this.options.jobs_id) ? this.options.jobs_id : this.activeRoute.parent.snapshot.params.id,
        params: {
          thread_id: this.options.thread_id,
          message: ''
        }
      }
    })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          if(this.options.thread_id){
            this.addMessage.emit(res.data[0].message[0]);
          }else{
            this.newMessage.emit({attachments: true, message: res.data.message, files: res.data.files});
          }
        }
      })
  }

  scrollToBottom(): void {
    try {
      this.options.container.nativeElement.scrollTop = this.options.container.nativeElement.scrollHeight;
    } catch (err) { }
  }

  createMessage() {
    if (this.state.message.replace(/\s/g, '').length) {
      if(this.options.thread_id){
        let params = {
          message: this.state.message,
          thread_id: this.options.thread_id,
          attachment: []
        }
        this.messagingService.createMessage(params)
          .subscribe(response => {
            if (response.result.success) {
              this.addMessage.emit(response.result.data[0].message[0]);
            }
          });
        this.state.focus = false;
        this.state.message = "";
      }else{
        this.newMessage.emit({message: this.state.message, attachments: false});
      }
      
    }
  }

  onKeydown(e) {
    let key = e.which || e.keyCode,
      shiftKey = !!e.shiftKey;

    if (key === 13) {
      if (shiftKey) {
        setTimeout(this.scrollToBottom.bind(this), 0);
      } else if (this.state.message) {
        e.preventDefault();
        this.createMessage();
      }

    }
  }

  checkDisabled() {
    if (this.state.message && this.state.message.replace(/\s/g, '').length) {
      return false;
    } else {
      return true;
    }
  }
}
