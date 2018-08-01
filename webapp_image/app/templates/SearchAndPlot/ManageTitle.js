var formatTitle = function() {
    if ($('.device-sm').is(':visible') || $('.device-xs').is(':visible')) {
        $('.navbar-brand')[0].innerHTML = {{ flags['short_name']|tojson }};
    } else {
        $('.navbar-brand')[0].innerHTML = {{ flags['name']|tojson }};
    };
};

$(document).ready(function(){
    formatTitle();
});

$(window).on('resize', function() {
    formatTitle();
});
