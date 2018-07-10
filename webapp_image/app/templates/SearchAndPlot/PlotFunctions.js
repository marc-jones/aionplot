
// measurement data is an array of gene objects. each gene object has a name
// field (string) and a measurements field (array). Each measurement is an
// object with the fields col_facet, row_facet, time, value, hi, lo.
// the element_selector indicates which element to build the graph in.
var facet_plot = function(measurement_data, element_selector) {

    // Establish the size of the canvas
    var svgWidth = parseInt(d3.select(element_selector).style('width'), 10);
    if (svgWidth < plot_vars.mobile_cut_offs['min']) {
        var svgHeight = parseInt(svgWidth / plot_vars.mobile_aspect_ratio, 10);
    } else if (plot_vars.mobile_cut_offs['min'] <= svgWidth &&
        svgWidth < plot_vars.mobile_cut_offs['max'] ) {
        var m = (plot_vars.aspect_ratio - plot_vars.mobile_aspect_ratio) /
            (plot_vars.mobile_cut_offs['max'] -
            plot_vars.mobile_cut_offs['min']);
        var c = aspect_ratio - (m * plot_vars.mobile_cut_offs['max']);
        var y = m * svgWidth + c;
        var svgHeight = parseInt(svgWidth / y, 10);
    } else {
        var svgHeight = parseInt(svgWidth / plot_vars.aspect_ratio, 10);
    }

    var svg = d3.select(element_selector).select("svg").attr("width", svgWidth)
        .attr("height", svgHeight);

}
