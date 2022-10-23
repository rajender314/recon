import { Component } from "@angular/core";
import { GridApi } from "ag-grid-community";

@Component({
    template: `
        <app-search class="m-l-15" (onSearch)="onSearch($event)">
        </app-search>
    `,
    styles: []
})

export class AgSearchHeaderCell {
    params: any;
    agInit(params) {
        this.params = params;
    }
    onSearch(val) {
        (<GridApi>this.params.api).setQuickFilter(val);
    }
}