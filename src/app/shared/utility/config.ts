import { GridApi, ColumnApi } from "ag-grid-community";
import { Validators, FormGroup, FormControl } from "@angular/forms";
import { CommonService } from "@app/common/common.service";
import { HttpClient } from "@angular/common/http";
import * as _moment from 'moment';

export function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export const TimeIntervalSteps = [
    { value: 0, legend: '00:00 AM' },
    { value: 0.15, legend: '00:15 AM' },
    { value: 0.30, legend: '00:30 AM' },
    { value: 0.45, legend: '0:45 AM' },
    { value: 1, legend: '01:00 AM' },
    { value: 1.15, legend: '01:15 AM' },
    { value: 1.30, legend: '01:30 AM' },
    { value: 1.45, legend: '01:45 AM' },
    { value: 2, legend: '02:00 AM' },
    { value: 2.15, legend: '02:15 AM' },
    { value: 2.30, legend: '02:30 AM' },
    { value: 2.45, legend: '02:45 AM' },
    { value: 3, legend: '03:00 AM' },
    { value: 3.15, legend: '03:15 AM' },
    { value: 3.30, legend: '03:30 AM' },
    { value: 3.45, legend: '03:45 AM' },
    { value: 4, legend: '04:00 AM' },
    { value: 4.15, legend: '04:15 AM' },
    { value: 4.30, legend: '04:30 AM' },
    { value: 4.45, legend: '04:45 AM' },
    { value: 5, legend: '05:00 AM' },
    { value: 5.15, legend: '05:15 AM' },
    { value: 5.30, legend: '05:30 AM' },
    { value: 5.45, legend: '05:45 AM' },
    { value: 6, legend: '06:00 AM' },
    { value: 6.15, legend: '06:15 AM' },
    { value: 6.30, legend: '06:30 AM' },
    { value: 6.45, legend: '06:45 AM' },
    { value: 7, legend: '07:00 AM' },
    { value: 7.15, legend: '07:15 AM' },
    { value: 7.30, legend: '07:30 AM' },
    { value: 7.45, legend: '07:45 AM' },
    { value: 8, legend: '08:00 AM' },
    { value: 8.15, legend: '08:15 AM' },
    { value: 8.30, legend: '08:30 AM' },
    { value: 8.45, legend: '08:45 AM' },
    { value: 9, legend: '09:00 AM' },
    { value: 9.15, legend: '09:15 AM' },
    { value: 9.30, legend: '09:30 AM' },
    { value: 9.45, legend: '09:45 AM' },
    { value: 10, legend: '10:00 AM' },
    { value: 10.15, legend: '10:15 AM' },
    { value: 10.30, legend: '10:30 AM' },
    { value: 10.45, legend: '10:45 AM' },
    { value: 11, legend: '11:00 AM' },
    { value: 11.15, legend: '11:15 AM' },
    { value: 11.30, legend: '11:30 AM' },
    { value: 11.45, legend: '11:45 AM' },
    { value: 12, legend: '12:00 PM' },
    { value: 12.15, legend: '12:15 PM' },
    { value: 12.30, legend: '12:30 PM' },
    { value: 12.45, legend: '12:45 PM' },
    { value: 13, legend: '01:00 PM' },
    { value: 13.15, legend: '01:15 PM' },
    { value: 13.30, legend: '01:30 PM' },
    { value: 13.45, legend: '01:45 PM' },
    { value: 14, legend: '02:00 PM' },
    { value: 14.15, legend: '02:15 PM' },
    { value: 14.30, legend: '02:30 PM' },
    { value: 14.45, legend: '02:45 PM' },
    { value: 15, legend: '03:00 PM' },
    { value: 15.15, legend: '03:15 PM' },
    { value: 15.30, legend: '03:30 PM' },
    { value: 15.45, legend: '03:45 PM' },
    { value: 16, legend: '04:00 PM' },
    { value: 16.15, legend: '04:15 PM' },
    { value: 16.30, legend: '04:30 PM' },
    { value: 16.45, legend: '04:45 PM' },
    { value: 17, legend: '05:00 PM' },
    { value: 17.15, legend: '05:15 PM' },
    { value: 17.30, legend: '05:30 PM' },
    { value: 17.45, legend: '05:45 PM' },
    { value: 18, legend: '06:00 PM' },
    { value: 18.15, legend: '06:15 PM' },
    { value: 18.30, legend: '06:30 PM' },
    { value: 18.45, legend: '06:45 PM' },
    { value: 19, legend: '07:00 PM' },
    { value: 19.15, legend: '07:15 PM' },
    { value: 19.30, legend: '07:30 PM' },
    { value: 19.45, legend: '07:45 PM' },
    { value: 20, legend: '08:00 PM' },
    { value: 20.15, legend: '08:15 PM' },
    { value: 20.30, legend: '08:30 PM' },
    { value: 20.45, legend: '08:45 PM' },
    { value: 21, legend: '09:00 PM' },
    { value: 21.15, legend: '09:15 PM' },
    { value: 21.30, legend: '09:30 PM' },
    { value: 21.45, legend: '09:45 PM' },
    { value: 22, legend: '10:00 PM' },
    { value: 22.15, legend: '10:15 PM' },
    { value: 22.30, legend: '10:30 PM' },
    { value: 22.45, legend: '10:45 PM' },
    { value: 23, legend: '11:00 PM' },
    { value: 23.15, legend: '11:15 PM' },
    { value: 23.30, legend: '11:30 PM' },
    { value: 23.45, legend: '11:45 PM' }
]

export const AG_GRID_DEFAULT_OPTIONS = {
    rowMultiSelectWithClick: true
}

export const AG_GRID_SERVER_SIDE_ROW_MODEL = {
    pagination: true,
    paginationPageSize: 100,
    rowModelType: 'serverSide'
}

export const AG_GRID_INFINITE_ROW_MODEL = {
    rowModelType: 'infinite',
    paginationPageSize: 100,
    cacheOverflowSize: 2,
    maxConcurrentDatasourceRequests: 2,
    infiniteInitialRowCount: 1,
    maxBlocksInCache: 1
}

/***********************************
 * No Result Found Component Config Type
 ************************************/
export class NoDataConfig {
    /** To Display Icon or Not */
    isIcon?: boolean
    /** Icon Name (Default font: pixel-icons) */
    iconName?: string
    /** No Result Text */
    title: string
    /** Button Text */
    buttonText: string
}

/**
 * Project Module Side Nav List Display
 */
export class ProjectSubNav {
    title: string;
    icons: string;
    allText: string;
    className?: string;
    noData: string;
    idKey: string;
    displayKey: string;
    statusClass?: string;
    statusIdKey?: string;
    statusNameKey?: string;
    costKey?: string;
    prefix?: string;
    count?: Number;
    list: Array<any>;
}

export interface FormFieldBase {
    key: string,
    label: string,
    type: 'none' | 'text' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio',
    multi?: boolean,
    /** property name that holds all option values */
    options?: Array<any> | string,
    settings?: any,
    default: string | Array<any> | number | boolean | Date | any,
    nameKey?: string,
    idKey?: string,
    displayName?: string,
    updateKey?: string
}

export interface ApiCallBase {
    key: string,
    url: string,
    method: 'post' | 'get' | 'delete',
    responseKey?: string,
    params: {}
}

export function toFormGroup(formFields: Array<FormFieldBase>) {
    let obj = {};

    formFields.map(field => {
        let validations = [];
        if (field.settings && Object.keys(field.settings).length) {
            if (field.settings.required) validations.push(Validators.required);
            if (field.settings.maxlength) validations.push(Validators.maxLength(field.settings.maxlength));
        }
        if (field.type == 'checkbox') {
            let defaults = new FormGroup({});
            (<Array<any>>field.options).map(o => defaults.addControl(o.key, new FormControl(false)));
            obj[field.key] = defaults;
        } else {
            obj[field.key] = [field.default, validations];
        }
    });

    return obj;
}

export function toApiCalls(apiCalls: Array<ApiCallBase>) {
    let arr = [];
    apiCalls.map(api => {
        if (api.method == 'get') arr.push(CommonService.prototype.getApi(api.url, api.params))
        else if (api.method == 'post') arr.push(CommonService.prototype.saveApi(api.url, api.params))
        else if (api.method == 'delete') arr.push(CommonService.prototype.deleteApi(api.url, api.params))
    });
    return arr;
}

export function agGridColumnAutoFit(gridApi: GridApi, columnApi: ColumnApi, isFullScreen = true) {
    if (window.innerWidth > 1420 && isFullScreen) {
        gridApi.sizeColumnsToFit();
    }
    else {
        var allColumnIds = [];
        columnApi.getAllColumns().forEach((column: any) => {
            allColumnIds.push(column.colId);
        });
        columnApi.autoSizeColumns(allColumnIds);

    }
}

export function agGridDateSort(d1, d2): number {
    if (d1) return new Date(d1).getTime() < new Date(d2).getTime() ? -1 : 1;
}

export function agGridNumberSort(d1, d2) {
    return Number(d1) - Number(d2);
}

export function perfectScrollBarReset(ps) {
    ps.element.scrollTop = 0;
    ps.update();
}

export function perfectScrollBarApplystyles() {
    let inner = document.getElementsByClassName('primary-layout-detail')[0] as HTMLElement;
    let element = document.getElementsByClassName('primary-layout-detail-body')[0] as HTMLElement;
    if (inner) {
        let scrollbarWidth = (inner.offsetWidth - element.scrollWidth);
        element.style.marginRight = "-" + scrollbarWidth + 'px';
    }
}

export function TimeValidation(val) {
    if (!isNaN(val)) {
        if (val < 100) return true;
        else return false;
    } else {
        const reg = /^([0-9]|[0-9][0-9]):[0-5][0-9]$/;
        if (!reg.test(val)) return false;
        else return true;
    }
}

export function isDate(date) {
    return date instanceof Date && !isNaN(date.valueOf())
}

export function DateValidator(format = "MM/dd/YYYY", minDate = new Date(), maxDate = null): any {
    return (control: FormControl): { [key: string]: any } => {
        if (!control.value) return null;
        const val = _moment(control.value, format, true);
        if (!val.isValid()) {
            return { invalidDate: true };
        }

        if (minDate || maxDate) {
            let validation = {
                min: false, max: false
            };
            if (minDate) {
                const lessDays = _moment(_moment(val).format('MM-DD-YYYY')).diff(_moment(_moment(minDate).format('MM-DD-YYYY')), 'days');
                if (lessDays != null && lessDays < 0) validation.min = true;
                else validation.min = false;
            }
            if (maxDate) {
                const moreDays = _moment(_moment(val).format('MM-DD-YYYY')).diff(_moment(_moment(maxDate).format('MM-DD-YYYY')), 'days');
                if (moreDays != null && moreDays > 0) validation.max = true;
                else validation.max = false;
            }
            if (validation.min || validation.max)
                return validation;
            else return null;
        }

        return null;
    };
}

export function TimeValidators(format = /^([0-9]|[0-9][0-9]):[0-5][0-9]$/): any {
    return (control: FormControl): { [key: string]: any } => {
        if (!control.value) return null;
        if (!isNaN(control.value)) {
            if (control.value < 100) return null;
            else return { inValidTime: true };
        } else {
            const reg = /^([0-9]|[0-9][0-9]):[0-5][0-9]$/;
            if (!reg.test(control.value)) return { inValidTime: true };
            else return null;
        }
    }
}

export function PiSearchInputFocus(searchInput) {
    if(searchInput._results.length) {
        searchInput._results[0].searchElement.nativeElement.focus();
    }
}

export function PiSelectFocus(piSelectInput, i = 0) {
    if(piSelectInput._results.length) {
        piSelectInput._results[i].searchFocus(piSelectInput._results[0].elementRef.nativeElement)
    }
}