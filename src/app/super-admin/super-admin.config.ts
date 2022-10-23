export const SUPER_ADMIN_HEADERS = {
    emailController: [
        { headerName: 'ID', field: '_id' },
        { headerName: 'FROM', field: 'from' },
        { headerName: 'TO', field: 'to' },
        { headerName: 'SUBJECT', field: 'subject' },
        { headerName: 'SEND DATE', field: 'gt_date_added' },
        { headerName: 'STATUS', field: 'status' },
        { headerName: 'SHOW MAIL', field: 'message' },
        { headerName: 'SEND MAIL', field: 'send_mail' }
    ],
    sendMail: [
        { headerName: 'ID', field: 'id' },
        { headerName: 'EMAIL FROM', field: 'from' },
        { headerName: 'EMAIL TO', field: 'to' },
        { headerName: 'SUBJECT', field: 'subject' },
        { headerName: 'DATE', field: 'date' },
        { headerName: 'SHOW MAIL', field: 'show_mail' }
    ],
    crons: [
        { headerName: 'CRON NAME', field: 'cron_name' },
        { headerName: 'ACTION', field: 'action' }
    ],
    userLogs: [
        { headerName: 'USER', field: 'user' },
        { headerName: 'BROWSER', field: 'browser' },
        { headerName: 'OS', field: 'os' },
        { headerName: 'LOGIN TIME', field: 'login_time' },
        { headerName: 'LOGOUT TIME', field: 'logout_time' },
    ],
    errorLogs: [
        { headerName: 'FILE NAME', field: 'file_name' },
        { headerName: 'VIEW FILE', field: 'view_file' }
    ],
    importExportLogs: [
        { headerName: 'USER NAME', field: 'user_name' },
        { headerName: 'ACTION', field: 'action' },
        { headerName: 'FILE NAME', field: 'file_name' },
        { headerName: 'PARAMS', field: 'params' },
        { headerName: 'MESSAGE', field: 'message' },
        { headerName: 'RESPONSE', field: 'response' },
        { headerName: 'DATE ADDED', field: 'date_added' }
    ], 
    systemErrors: [
        { headerName: 'ID', field: 'id' },
        { headerName: 'USER NAME', field: 'user_name' },
        { headerName: 'MESSAGE', field: 'message' },
        { headerName: 'DATE ADDED', field: 'date_added' },
        { headerName: 'STATUS', field: 'status' },
    ],
    accessReport: [
        { headerName: 'Route Name', field: 'RouteName' },
        { headerName: 'Action', field: 'action' },
        { headerName: 'Micro Group Id', field: 'micro_groupid' },
        { headerName: 'Micro Id', field: 'micro_id' },
        { headerName: 'Micro Parent Id', field: 'micro_parentid' },
        { headerName: 'Path', field: 'path' },
        { headerName: 'Type', field: 'type' }
    ],
    errorReport: [
        { headerName: 'Error Message', field: 'err_msg' },
        { headerName: 'File', field: 'file' },
        { headerName: 'Line', field: 'line' },
        { headerName: 'Path', field: 'path' },
        { headerName: 'Timestamp', field: 'timestamp' },
        { headerName: 'Type', field: 'type' }
    ],
    accessCallDelay: [
        { headerName: 'Route Name', field: 'RouteName' },
        { headerName: 'Action', field: 'action' },
        { headerName: 'Micro Group Id', field: 'micro_groupid' },
        { headerName: 'Micro Id', field: 'micro_id' },
        { headerName: 'Micro Parent Id', field: 'micro_parentid' },
        { headerName: 'Path', field: 'path' },
        { headerName: 'Type', field: 'type' }
    ]
}