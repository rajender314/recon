import * as _ from 'lodash';
import { ElementRef } from '@angular/core';
import { FormArray } from '@angular/forms';

export const MAX_ALIASES = 40;

export const CostCodes = [
    { id: 1, name: 'AA01', status: true, description: 'Photography - Stock', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 2, name: 'AA17', status: false, description: 'Photography - Stock', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 3, name: 'AA02', status: true, description: 'Creative Design - Print', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 4, name: 'AA03', status: true, description: 'Creative/Production Ivie Prepress', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 5, name: 'AA04', status: true, description: 'Creative Oris Proofs', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 6, name: 'AA05', status: true, description: 'Broadcast- TV/Video', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 7, name: 'AA06', status: true, description: 'Broadcast - Talent', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 8, name: 'AA07', status: false, description: 'Broadcast - Radio/Audio', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 9, name: 'AA08', status: true, description: 'Translations', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 10, name: 'AA09', status: true, description: 'Music', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 }
];

export const Categories = [
    { id: 1, name: 'AA01', status: true, description: 'Photography - Stock', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 2, name: 'AA17', status: false, description: 'Photography - Stock', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 3, name: 'AA02', status: true, description: 'Creative Design - Print', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 4, name: 'AA03', status: true, description: 'Creative/Production Ivie Prepress', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 5, name: 'AA04', status: true, description: 'Creative Oris Proofs', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 6, name: 'AA05', status: true, description: 'Broadcast- TV/Video', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 7, name: 'AA06', status: true, description: 'Broadcast - Talent', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 8, name: 'AA07', status: false, description: 'Broadcast - Radio/Audio', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 9, name: 'AA08', status: true, description: 'Translations', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 },
    { id: 10, name: 'AA09', status: true, description: 'Music', gl_income: 450, gl_expense: 550, category_id: 1, cost_code_type: 1, cost_code_tax_type: 1 }
];
export const DistributionTypes = [
    { id:1, name: 'DC/Warehouse', status: true, description: 'Warehouse',departments:{3 : true, 8: true, 16: true, 20: true, 66: true}},
    { id:2, name: 'Digital', status: true, description: 'digital',departments:{6 : true, 11: true, 23: true, 44: true, 49: true}},
    { id:3, name: 'Mail(Direct/solo)', status: true, description: 'Direct',departments:{56 : true, 59: true, 62: true, 19: true, 17: true}},
    { id:4, name: 'Media Purchase', status: true, description: 'Media',departments:{14 : true, 5: true, 2: true, 23: true, 35: true}},
    { id:5, name: 'Newspaper', status: true, description: 'Newspaper',departments:{39 : true, 44: true, 46: true, 51: true, 50: true}},
    { id:6, name: 'NT - Do not use!!', status: true, description: 'NT',departments:{3 : true, 8: true, 16: true, 20: true, 66: true}},
    { id:7, name: 'Office', status: true, description: 'office',departments:{6 : true, 11: true, 23: true, 44: true, 49: true}},
    { id:8, name: 'Radio', status: true, description: 'radio',departments:{56 : true, 59: true, 62: true, 19: true, 17: true}},
    { id:9, name: 'Resale', status: true, description: 'resale',departments:{14 : true, 5: true, 2: true, 23: true, 35: true}},
    { id:10, name: 'Shared Mail', status: false, description: 'shared',departments:{39 : true, 44: true, 46: true, 51: true, 50: true}},
    { id:11, name: 'Store/club', status: true, description: 'store',departments:{14 : true, 23: true, 51: true, 20: true, 17: true}},
    { id:12, name: 'TMC- Mail', status: true, description: 'TMC-Mail',departments:{11 : true, 2: true, 46: true, 19: true, 35: true}},
    { id:13, name: 'TMC - Newspaer', status: true, description: 'TMC-Newspaper',departments:{35 : true, 49: true, 11: true, 3: true, 66: true}},
    { id:14, name: 'Video(Broadcast)', status: true, description: 'Broadcast',departments:{5 : true, 23: true, 17: true, 2: true, 49: true}},
    { id:15, name: 'Video(In store)', status: false, description: 'In store',departments:{3 : true, 8: true, 16: true, 20: true, 66: true}}
];

export const GenericForms = [
    {parent_id: 1, name: 'Bid Submission', children: [
        { id: 1, name: 'Print Method' },
        { id: 2, name: 'Ship Method' },
        { id: 3, name: 'Paper Requirements' },
        { id: 4, name: 'Circular' },
        { id: 5, name: 'Circular Paper' },
        { id: 6, name: 'Test' }
    ]}
];
export const Statuses = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
];

export const StatusList = [
    { id: true, name: 'Active' },
    { id: false, name: 'Inactive' }
];

export const SortFilter = [
    { label: 'A-Z', value: 'asc' },
    { label: 'Z-A', value: 'desc' },
]

export const StatusFilter = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
]

export const MiscTypes = [
    { id: 'Markup', name: "Markup" },
    { id: 'Rate', name: "Rate" }
]

export const formBuilderTypes = [
    { id: 1, key: 'single_line_text', label: 'Single Line Text', disable: true },
    { id: 1, key: 'paragraph_text', label: 'Paragraph Text', disable: true },
    { id: 1, key: 'dropdown', label: 'Drop Down', disable: true },
    { id: 1, key: 'checkboxes', label: 'Checkboxes', disable: true },
    { id: 1, key: 'multiple_choice', label: 'Multiple Choice', disable: true },
    { id: 1, key: 'number', label: 'Number', disable: true },
    { id: 1, key: 'auto_suggest', label: 'Auto Suggest', disable: true }
]

export function checkedLength(obj) {
    return _.pickBy(obj, (val, key) => {
        return val === true;
    })
}

export function buildParam(obj) {
    let query = Object.keys(obj)
                    .map(k => k + '=' + obj[k])
                    .join('&');
    return query;
}

export function dummyCheck(obj) {
    let query = Object.keys(obj)
                    .map(k => {
                        if(typeof obj[k] == 'object') {
                            if(Array.isArray(obj[k])){
                                return obj[k].map((val, i) => k + '[' + i + ']=' + val).join('&');
                            }else {
                                return Object.keys(obj[k]).map(l => k + '[' + l + ']=' + obj[k][l]).join('&')
                            }
                        }else {
                            return k + '=' + obj[k]
                        }
                    })
                    .join('&');
    return query;
}

export function setCursorPosition(opts) {
    var config: any = {
        target: {},
        position: 0
    };
    if (opts)
        Object.assign(config, opts);

    if (config.target) {
        if (config.target.setSelectionRange) {
            config.target.focus();
            config.target.setSelectionRange(config.position, config.position);
        } else if (config.target.createTextRange) {
            var range = config.target.createTextRange();
            range.collapse(true);
            range.moveEnd('character', config.position);
            range.moveStart('character', config.position);
            range.select();
        }
    }
}

export function getCursorPosition(opts) {
    var config: any = {
        target: {}
    };
    if (opts)
        Object.assign(config, opts);

    var s = {
        start: 0,
        end: 0
    };
    if (config.target) {

        if (config.target.id) {
            config.target = document.getElementById(config.target.id);
        }

        if (typeof config.target.selectionStart == "number" && typeof config.target.selectionEnd == "number") {
            // Firefox (and others)
            s.start = config.target.selectionStart;
            s.end = config.target.selectionEnd;
        } /*else if (document.selection) {
            // IE
            var bookmark = document.selection.createRange().getBookmark();
            var sel = config.target.createTextRange();
            var bfr = sel.duplicate();
            sel.moveToBookmark(bookmark);
            bfr.setEndPoint("EndToStart", sel);
            s.start = bfr.text.length;
            s.end = s.start + sel.text.length;
        }*/
    }

    return s;
}

export function toCurrency(opts) {
    var config: any = {
        prefix: "$",
        thousandsSeparator: ",",
        value: 0,
        strictFormat: false
    };
    if (opts)
        Object.assign(config, opts);

    config.value += '';
    config.value = config.value.replace(/[^0-9\-\.]/g, '');
    if (config.value == "" || isNaN(config.value)) {
        return config.value;
    } else {
        var x = config.value.split('.');
        var x1 = x[0];
        x1 = isNaN(x1) ? "0" : Number(x1);
        if (config.strictFormat) {
            var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
        } else {
            var x2 = x.length > 1 ? '.' + x[1] : '';
        }
        var rgx = /(\d+)(\d{3})/;
        x1 = x1.toString(10);
        if (config.thousandsSeparator && config.thousandsSeparator != "") {
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + config.thousandsSeparator + '$2');
            }
        }

        if (x1.length) {
            if (x1.indexOf('-') == 0) {
                return (x1 + x2).replace('-', '-' + config.prefix);
            } else {
                return config.prefix + x1 + x2;
            }
        } else {
            return "";
        }
    }
}

export function clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
        formArray.removeAt(0)
    }
}