import { Validators, FormArray, FormGroup, FormControl } from "@angular/forms";
import * as _ from 'lodash';

var APP = window['APP'];

export interface FormFieldType {
    key: string,
    label: string,
    type: 'none' | 'text' | 'select' | 'textarea',
    multi?: true | false,
    options?: string,
    validations?: any,
    default: string | Array<any> | number | boolean,
    nameKey?: string
}

export interface AddDialogLocalType {
    title: string,
    label: string,
    name: string,
    apiCall: string,
    formFields: Array<FormFieldType>,
    dropdowns?: any,
    flag?: string,
    breadcrumbs?: Array<any>
}

export const ADMIN_CONFIG: any = {
    'categories': {
        name: 'Category',
        pluralName: 'Categories',
        prop: 'categories',

        export: 'exportCategories',
        getList: 'getCategories',
        save: 'saveCategories',

        icon: 'icon-categories',
        iconColor: 'orange',
        permission: APP.permissions.system_access.categories,
        breadcrumbs: [
            { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
            { label: 'Categories', type: 'text' },
        ],

        responseKey: ''
    },

    'departments': {
        name: 'Department',
        pluralName: 'Departments',
        prop: 'departments',

        export: 'exportDepartments',
        getList: 'getDepartments',
        save: 'addDepartments',

        icon: 'icon-departments',
        iconColor: 'blue',

        activeState: "Departments",
        types: [
            { label: 'Client Departments', value: 2 },
            { label: 'Company Departments', value: 1 },
            { label: 'Vendor Departments', value: 3 }
        ],
        org_type: '',
        permission: APP.permissions.system_access.departments,
        breadcrumbs: [
            { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
            { label: 'Departments', type: 'text' },
        ],

        responseKey: 'departments'
    },

    'file-categories': {
        name: 'File Category',
        pluralName: 'File Categories',
        prop: 'filecategories',

        export: 'exportFileCat',
        getList: 'getFileCategories',
        save: 'saveFileCategories',

        icon: 'icon-file-categories',
        iconColor: 'violet',
        permission: APP.permissions.system_access.file_categories,
        breadcrumbs: [
            { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
            { label: 'File Categories', type: 'text' },
        ],

        responseKey: 'filecategories'
    },

    'vendor-types': {
        name: 'Vendor Type',
        pluralName: 'Vendor Types',
        prop: 'vendor_types',

        export: 'exportVendorTypes',
        getList: 'VendorTypes',
        save: 'saveVendorTypes',

        icon: 'icon-vendor-types',
        iconColor: 'pink',
        permission: APP.permissions.system_access.vendor_types,
        breadcrumbs: [
            { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
            { label: 'Vendor Types', type: 'text' },
        ],

        responseKey: 'vendor_types'
    }
}

export const AdminDashboard = [
    {
        name: 'Accounting',
        show: (APP.permissions.system_access.accounting=='yes')?true:false,
        items: [
            { id: 'cost-codes', show: (APP.permissions.system_access.cost_codes=='none')?false:true, name: 'Cost Codes', route: '/admin/cost-codes', icon: 'icon-cost-codes', bgColor: 'yellow' },
            { id: 'markups', show: (APP.permissions.system_access.markups=='no')?false:true, name: 'Markups', route: '/admin/markups', icon: 'icon-markups', bgColor: 'pink' },
            { id: 'misc-expenses', show: (APP.permissions.system_access['misc_-_expenses']=='none')?false:true, name: 'Misc - Expenses', route: '/admin/misc-expenses', icon: 'icon-misc-expenses', bgColor: 'blue' }
        ]
    },
    {
        name: 'Company',
        show: (APP.permissions.system_access.company=='yes')?true:false,
        items: [
            { id: 'business-rules', show: (APP.permissions.system_access.business_rules=='none')?false:true, name: 'Business Rules', route: '/admin/business-rules', icon: 'icon-business-rules', bgColor: 'green' },
            { id: 'categories', show: (APP.permissions.system_access.categories=='none')?false:true, name: 'Categories', route: '/admin/categories', icon: 'icon-categories', bgColor: 'orange' },
            { id: 'company-codes', show: (APP.permissions.system_access.company_codes=='none')?false:true, name: 'Company Codes', route: '/admin/company-codes', icon: 'icon-company-codes', bgColor: 'pink' },
            {
                id: 'departments', show: (APP.permissions.system_access.departments=='none')?false:true, name: 'Departments', route: '/admin/departments', defaultValue: 1, icon: 'icon-departments', bgColor: 'blue', children: [
                    { name: 'Client Departments', icon: '', bgColor: '', value: 2 },
                    { name: 'Company Departments', icon: '', bgColor: '', value: 1 },
                    { name: 'Vendor Departments', icon: '', bgColor: '', value: 3 },
                ]
            },
            {
                id: 'designations', show: (APP.permissions.system_access.designations=='none')?false:true, name: 'Designations', route: '/admin/designations', defaultValue: 1, icon: 'icon-designations', bgColor: 'violet', children: [
                    { name: 'Client Designations', icon: '', bgColor: '', value: 2 },
                    { name: 'Company Designations', icon: '', bgColor: '', value: 1 },
                    { name: 'Vendor Designations', icon: '', bgColor: '', value: 3 },
                ]
            },
            { id: 'distribution-types', show: (APP.permissions.system_access.distribution_types=='none')?false:true, name: 'Distribution Types', route: '/admin/distribution-types', icon: 'icon-distribution-types', bgColor: 'light-violet' },
            { id: 'file-categories', show: (APP.permissions.system_access.file_categories=='none')?false:true, name: 'File Categories', route: '/admin/file-categories', icon: 'icon-file-categories', bgColor: 'violet' },
            { id: 'forms', show: (APP.permissions.system_access.forms=='none')?false:true, name: 'Forms', route: '/admin/forms', icon: 'icon-forms', bgColor: 'brown' },
            { id: 'generic-forms', show: (APP.permissions.system_access.generic_forms=='none')?false:true, name: 'Generic Forms', route: '/admin/generic-forms', icon: 'icon-forms', bgColor: 'pink' },
            { id: 'groups', show: (APP.permissions.system_access.groups=='none')?false:true, name: 'Groups', route: '/admin/groups', icon: 'icon-groups', bgColor: 'blue' },
            { id: 'products', show: (APP.permissions.system_access.products=='none')?false:true, name: 'Products', route: '/admin/products', icon: 'icon-products', bgColor: 'yellow' },
            { id: 'services', show: (APP.permissions.system_access.services=='none')?false:true, name: 'Services', route: '/admin/services', icon: 'icon-services', bgColor: 'orange' },
            {
                id: 'specifications', show: (APP.permissions.system_access.specifications=='none')?false:true, name: 'Specifications', route: '/admin/specifications', defaultValue: 1, icon: 'icon-specifications', bgColor: 'gray', children: [
                    { name: 'Form Specs', icon: '', bgColor: '', value: 1 },
                    { name: 'Generic Form Specs', icon: '', bgColor: '', value: 3 }
                ]
            },
            { id: 'vendor-types', show: (APP.permissions.system_access.vendor_types=='none')?false:true, name: 'Vendor Types', route: '/admin/vendor-types', icon: 'icon-vendor-types', bgColor: 'pink' }
        ]
    },
    {
        name: 'Workflow',
        show: (APP.permissions.system_access.workflow=='yes')?true:false,
        items: [
            { id: 'task-types', show: (APP.permissions.system_access.task_types=='none')?false:true, name: 'Task Types', route: '/admin/task-types', icon: 'icon-task-fill', bgColor: 'green' },
            { id: 'task-statuses', show: (APP.permissions.system_access.task_statuses=='none')?false:true, name: 'Task Statuses', route: '/admin/task-statuses', icon: 'icon-task-fill', bgColor: 'orange' },
        ]
    },
    {
        name: 'Schedule',
        show: (APP.permissions.system_access.schedule=='yes')?true:false,
        items: [
            { id: 'tasks', show: (APP.permissions.system_access.tasks=='none')?false:true, name: 'Tasks', route: '/admin/tasks', icon: 'icon-task-fill', bgColor: 'green' },
            { id: 'schedule-templates', show: (APP.permissions.system_access.schedule_templates=='none')?false:true, name: 'Schedule Templates', route: '/admin/schedule-templates', icon: 'icon-schedule-templates', bgColor: 'blue' },
            {
                id: 'milestones', show: (APP.permissions.system_access.milestones=='none')?false:true, name: 'Milestones', route: '/admin/milestones', defaultValue: 1, icon: 'icon-milestones', bgColor: 'yellow', children: [
                    { name: 'Project Milestones', icon: '', bgColor: '', value: 1 },
                    { name: 'Vendor Milestones', icon: '', bgColor: '', value: 2 }
                ]
            },
            { id: 'vendor-templates', name: 'Vendor Templates', show: (APP.permissions.system_access.vendor_templates=='none')?false:true, route: '/admin/vendor-templates', icon: 'icon-vendor-templates', bgColor: 'orange' }
        ]
    },
    {
        name: 'Vendor',
        show: (APP.permissions.system_access.vendors=='yes')?true:false,
        items: [
            { id: 'capabilities', show: (APP.permissions.system_access.capabilities=='none')?false:true, name: 'Capabilities', route: '/admin/capabilities', icon: 'icon-capabilities', bgColor: 'violet' },
            { id: 'capability-category', show: (APP.permissions.system_access.capability_category=='none')?false:true, name: 'Capability Category', route: '/admin/capability-category', icon: 'icon-capabilities', bgColor: 'green' },
            { id: 'equipment-category', show: (APP.permissions.system_access.equipment_category=='none')?false:true, name: 'Equipment Category', route: '/admin/equipment-category', icon: 'icon-equipments', bgColor: 'yellow' },
            { id: 'equipment-specs', show: (APP.permissions.system_access.equipment_specs=='none')?false:true, name: 'Equipment Specs', route: '/admin/equipment-specs', icon: 'icon-equipments', bgColor: 'pink' }
        ]
    }
];


export function getAdminConfig(prop: any) {
    return ADMIN_CONFIG[prop];
}

export function buildForm(formFields: Array<any>) {
    let obj = {};

    formFields.map(field => {
        let validations = [];
        if (field.validations && Object.keys(field.validations).length) {
            if (field.validations.required) validations.push(Validators.required);
            if (field.validations.maxlength) validations.push(Validators.maxLength(field.validations.maxlength));
            if (field.validations.minlength) validations.push(Validators.minLength(field.validations.minlength));
        }
        if (field.type == 'checkbox_grp') {
            let defaults = new FormGroup({});
            field.options.map(o => defaults.addControl(o.key, new FormControl(false)));
            obj[field.key] = defaults;
        } else {
            obj[field.key] = [field.default, validations];
        }
    });

    return obj;
}

export function updateForm(formFields: Array<any>, data) {
    let obj = {};

    formFields.map(field => {
        obj[field.key] = data[field.key]
    });

    return obj;
}

export function clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
        formArray.removeAt(0)
    }
}

export function clearFormGroup(formGroup: FormGroup) {
    const arr = Object.keys(formGroup.controls);
    while (arr.length !== 0) {
        formGroup.removeControl(arr[0])
        arr.splice(0, 1);
    }
}

export function objectToArray(order, obj) {
    /*let arr = [];
    arr = order.filter(key => {
        if(obj[key])
        return obj[key];
    });
    return arr;*/

    let arr = [];
    order.map(key => {
        if(obj[key])
            arr.push(obj[key])
    });
    return arr;
}

export function checkedLength(obj) {
    return _.pickBy(obj, (val, key) => {
        return val === true;
    })
}