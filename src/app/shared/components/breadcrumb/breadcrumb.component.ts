import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-breadcrumb',
  template: `
    <ul class="breadcrumb">
      <li class="breadcrumb-item" *ngFor="let name of breadcrumbs" [class.link]="name.type == 'link'">
        <span *ngIf="name.type == 'link'" [routerLink]="name.route" [innerHtml]="name.label"></span>
        <span *ngIf="name.type == 'action'" (click)="goTo.emit()" [class.action]="name.type == 'action'" [innerHtml]="name.label"></span>
        <span *ngIf="name.type == 'text'" [innerHtml]="name.label"></span>
      </li>
    </ul>
  `,
  styles: [
    `ul.breadcrumb{
      list-style: none;display: inline-flex;
      margin: 0;padding: 0;color: #6b778c;flex-wrap: wrap;}`,
      `ul.breadcrumb .breadcrumb-item+.breadcrumb-item::before{display: inline-block;
        margin: 0 8px;content: "/";}`,
      `ul.breadcrumb li.link{display: inline-flex;font-weight: 400;align-items: center;}`,
      `ul.breadcrumb li.link span{
        color: inherit;
        display: inline-flex;
        align-items: center;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
      }`
  ],
  encapsulation: ViewEncapsulation.None
})
export class BreadcrumbComponent implements OnInit {

  @Input('list') breadcrumbs;
  @Output() goTo = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

}
