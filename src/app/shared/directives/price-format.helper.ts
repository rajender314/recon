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
        } else if ((<any>document).selection) {
            // IE
            var bookmark = (<any>document).selection.createRange().getBookmark();
            var sel = config.target.createTextRange();
            var bfr = sel.duplicate();
            sel.moveToBookmark(bookmark);
            bfr.setEndPoint("EndToStart", sel);
            s.start = bfr.text.length;
            s.end = s.start + sel.text.length;
        }
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