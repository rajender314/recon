export class Pagination {
    page: number;
    pageSize: number;
    search?: string;
    sort?: string | number;
    status?: boolean | string;
    org_type?: number | string;
    milestone_type?: number | string;
    type?: any;
    from?: string;
}

export class SnackBarType {
    status: boolean;
    msg: string = 'Default';
}