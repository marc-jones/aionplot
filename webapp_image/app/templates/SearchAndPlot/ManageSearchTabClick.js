$(document).on('shown.bs.tab', 'a[href="#search"]', function () {
    $.event.trigger({type: 'check_inputs'});
});
