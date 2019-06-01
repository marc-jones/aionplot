// Replots on resize

$(window).on('resize', function() {
    $.event.trigger({type: 'replot'});
});
