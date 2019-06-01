// Sets up the Download buttons



// What to do when the window resizes
$(window).on('resize', function() {
    var flipped = false;
//     if ($('#flip_axis')[0].checked) {
//         flipped = true;}
    var display_errors = false;
    if ($('#error_bars')[0].checked) {
        display_errors = true;}
    if (typeof min_max_arrays_global != 'undefined') {
        if ($('#search').hasClass('active')) {
            plot_graph(flipped, display_errors, min_max_arrays_global);
        };
    };
});


var plot_graph = function(flipped, display_errors, min_max_arrays) {
    var aspect_ratio = plot_vars.aspect_ratio;
    var mobile_aspect_ratio = plot_vars.mobile_aspect_ratio;
    var mobile_cut_offs = plot_vars.mobile_cut_offs;
    var symbolSize = plot_vars.symbolSize;
    var errorBarEndLength = plot_vars.errorBarEndLength;
    var margin = plot_vars.margin;
    var accessions = plot_vars.accessions;
    var tissues = plot_vars.tissues;
    var tickNum = plot_vars.tickNum;
    var legendWidthProportion = plot_vars.legendWidthProportion;

    // flipped is a variable which changes the axes
    // assigned to tissues or accessions
    // svg checkbox - http://jsperf.com/svg-checkbox-vs-html-checkbox
    // A great tutorial on responsive graphs - http://goo.gl/kBViYN
    if (exp_data.length > 0) {


        var circle_dummy = d3.select('body')
            .append('div')
            .attr('class', 'ie_circle_radius')
            .style('display', 'none');

        geneLegend.each(function(d, i)
                {
                    var circles = d3.select(this).selectAll('circle')
                                .attr('fill', getColour(i));
                    circles.attr('r', parseInt(circle_dummy.style('width'), 10));
                    d3.select(this).selectAll('line')
                                .attr('stroke', getColour(i));
                });

        circle_dummy.remove();

    } else {
        svg.selectAll('*').remove();}

}
