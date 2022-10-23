import { Directive, HostListener, ElementRef, Renderer2, Input } from '@angular/core';


@Directive({
    selector: '[appResizable]'
})
export class ResizableDirective {

    
//   @Input() resizableGrabWidth = 8;
//   @Input() resizableMinWidth = 10;

//   dragging = false;

//   constructor(private el: ElementRef) {

//     const self = this;

//     const EventListenerMode = { capture: true };

//     function preventGlobalMouseEvents() {
//       document.body.style['pointer-events'] = 'none';
//     }

//     function restoreGlobalMouseEvents() {
//       document.body.style['pointer-events'] = 'auto';
//     }


//     const newWidth = (wid) => {
//       const newWidth = Math.max(this.resizableMinWidth, wid);
//       el.nativeElement.style.width = (newWidth) + "px";
//     }

//     const newHeight = (wid) => {
//         const newHeight = Math.max(this.resizableMinWidth, wid);
//         el.nativeElement.style.height = (newHeight) + "px";
//       }


//     const mouseMoveG = (evt) => {
//       if (!this.dragging) {
//         return;
//       }
//       newWidth(evt.clientX - el.nativeElement.offsetLeft)
//       newHeight(evt.clientY - el.nativeElement.offsetHeight)
//       evt.stopPropagation();
//     };

//     // const dragMoveG = (evt) => {
//     //   if (!this.dragging) {
//     //     return;
//     //   }
//     //   const newWidth = Math.max(this.resizableMinWidth, (evt.clientX - el.nativeElement.offsetLeft)) + "px";
//     //   el.nativeElement.style.width = (evt.clientX - el.nativeElement.offsetLeft) + "px";
//     //   evt.stopPropagation();
//     // };

//     const mouseUpG = (evt) => {
//       if (!this.dragging) {
//         return;
//       }
//       restoreGlobalMouseEvents();
//       this.dragging = false;
//       evt.stopPropagation();
//     };

//     const mouseDown = (evt) => {
//       if (this.inDragRegion(evt)) {
//         this.dragging = true;
//         preventGlobalMouseEvents();
//         evt.stopPropagation();
//       }
//     };


//     const mouseMove = (evt) => {
//       if (this.inDragRegion(evt) || this.dragging) {
//         el.nativeElement.style.cursor = "col-resize";
//       } else {
//         el.nativeElement.style.cursor = "default";
//       }
//     }


//     document.addEventListener('mousemove', mouseMoveG, true);
//     document.addEventListener('mouseup', mouseUpG, true);
//     el.nativeElement.addEventListener('mousedown', mouseDown, true);
//     el.nativeElement.addEventListener('mousemove', mouseMove, true);
//   }

//   ngOnInit(): void {
//     this.el.nativeElement.style["border-right"] = this.resizableGrabWidth + "px solid darkgrey";
//   }

//   inDragRegion(evt) {
//     return this.el.nativeElement.clientWidth - evt.clientX + this.el.nativeElement.offsetLeft < this.resizableGrabWidth;
//   }
    height = 150;
    width = 150;
    y = 100;
    oldY = 0;
    oldX = 0;
    grabber = false;
    parentElement:any;
    constructor(private el:ElementRef, private renderer: Renderer2){
    }

    ngAfterViewInit() {
        const hostElem = this.el.nativeElement;
        this.parentElement = hostElem;
      }
    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.grabber) {
            return;
        }
        this.resizer(event.clientY - this.oldY);
        this.oldY = event.clientY;
        this.resizerx(event.clientX - this.oldX);
        this.oldX = event.clientX;
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.grabber = false;
    }

    resizer(offsetY: number) {

        this.height += offsetY;
        this.height = this.height < 200 ? 200 : this.height;
        if(this.parentElement)
        this.renderer.setStyle(this.parentElement, 'height', this.height + 'px');
    }
    resizerx(offsetX: number) {
        this.width += offsetX;
        this.width = this.width < 200 ? 200 : this.width;
        if(this.parentElement)
        this.renderer.setStyle(this.parentElement, 'width', this.width + 'px');
    }


    @HostListener('document:mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        this.grabber = true;
        this.oldY = event.clientY;
        this.oldX = event.clientX;
    }
}