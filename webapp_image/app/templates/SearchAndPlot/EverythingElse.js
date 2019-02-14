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


// FUNCTIONS
// http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
var capitalizeFirstLetter = function(string) {
    return(string.charAt(0).toUpperCase() + string.slice(1));
}

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

        // clear everything in the svg
        svg.selectAll('*').remove();

        // generate a vector of the unique arabidopsis agi codes
        var unique_homology = unique(homology_array);


        // Calculate the length of the legend. There is no better way of
        // doing this than creating each of the text elements, then deleting
        // them later on.

        var legend_labels = exp_data.map(function(d) {return d.gene;})
                            .concat(unique_homology)
                            .concat(['Vernalization']);

        var legendColumns = Math.floor( (svgWidth * legendWidthProportion) / (margin.legendline+margin.spacing*2+maxLegendLabelWidth) );

        var legendNumberOfLines = Math.ceil(unique_homology.length / legendColumns) + Math.ceil(exp_data.length / legendColumns) + 1;

        // calculate the plot widths and heights
        var plotWidth  = (svgWidth  - margin.left - margin.right  - margin.spacing) / colLabels.length;
        var plotHeight = (svgHeight - margin.top  - margin.bottom - margin.spacing - (margin.legendline + margin.spacing)*legendNumberOfLines) / rowLabels.length;

        // using the maximum and minimum values determined above, this
        // section creates a plotOrder structure containing information about
        // each facet plot; which row and column it is in in the facet plot,
        // the top left corner coordinate, the scale constructs as well as
        // the tissue and accession labels

        // add the vernalization region
        individualPlots.append('rect')
            .filter(function(d) { return d.xScale.domain()[0] < 64;})
            .attr('x', function(d) { return Math.max(d.xScale(23), d.xScale.range()[0]);})
            .attr('y', function(d) { return d.y;})
            .attr('width', function(d) {return d.xScale(64)-Math.max(d.xScale(23), d.xScale.range()[0]);})
            .attr('height', plotHeight)
            .attr('class', 'vernalization');

        // For each plot, add points and lines for each gene
        individualPlots.each(function(plot_data, i) {
            var symbols = d3.svg.symbol()
                .size(symbolSize)
                .type(function(d, i) {
                    var idx = d.homology;
                    while (idx >= d3.svg.symbolTypes.length) {
                        idx = idx - d3.svg.symbolTypes.length}
                    return(d3.svg.symbolTypes[idx]);});

            genes.selectAll("path")
                .data(function(gene, gene_idx) {
                    var returnVal = gene['measurements']
                        .filter(function(measurement) {return(
                            measurement['accession'] == plot_data.accession &&
                            measurement['tissue'] == plot_data.tissue);});
                    returnVal.forEach(function(measurement) {
                        return(measurement['homology'] =
                            unique_homology.indexOf(
                                homology_array[gene_idx]));})
                    return(returnVal);})
                .enter()
                .append('path')
                .attr("transform", function(d) {
                    return("translate(" + plot_data.xScale(d.time) + "," +
                        plot_data.yScale(d.fpkm) + ")");})
                .attr("d", symbols)
                .classed("point", true);

        });
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

        geneLegend.each(function(){
                var bbox = this.getBBox();
                d3.select(this).append('rect')
                                .attr('class', 'hover-capture')
                                .attr('data-toggle', 'tooltip')
                                .attr('title', function(d) {return d.chromosome;})
                                .style('visibility', 'hidden')
                                .attr('x', function() {return bbox.x;})
                                .attr('y', function() {return bbox.y;})
                                .attr('width', function() {return bbox.width;})
                                .attr('height', function() {return bbox.height;});});

        $('[data-toggle="tooltip"]').tooltip({container: 'body'});


        // add the arabidopsis agi codes
        var agiLegend = legend.selectAll('g')
                            .filter(function(d) {return false;})
                            .data(unique_homology)
                            .enter()
                            .append('g')
                            .attr('agi', function(gene){return gene;})
                            .attr('class', 'key');

        agiLegend.append('rect')
                .attr('x', function(d, i) {while (i >= legendColumns) {i = i - legendColumns;}
                                            return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i;})
                .attr('y', function(d, i) {var n = 0;
                                            while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                            return svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n-Math.ceil(exp_data.length / legendColumns));})
                .attr('width', margin.legendline)
                .attr('height', margin.legendline)
                .attr('class', 'plotbackground');

        var symbols = d3.svg.symbol()
                            .size(symbolSize)
                            .type(function(d, i) {while (i >= d3.svg.symbolTypes.length)
                                                {i = i - d3.svg.symbolTypes.length}
                                                return d3.svg.symbolTypes[i];});
        agiLegend.append('path')
                .attr("transform", function(d, i) {var n = 0;
                                                    while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                                    return "translate(" + (svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i + (margin.legendline*0.5)) + "," + (svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n-Math.ceil(exp_data.length / legendColumns))  + (margin.legendline*0.5)) + ")"; })
                .attr("d", symbols)
                .classed("point", true);

        agiLegend.append('text')
                .text(function(d) {return d;})
                .attr("text-anchor", "middle")
                .attr('x', function(d, i) {while (i >= legendColumns) {i = i - legendColumns;}
                                            return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i + margin.legendline + margin.spacing + Math.ceil(this.getComputedTextLength())/2})
                .attr('y', function(d, i) {var n = 0;
                                        while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                        return svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n-Math.ceil(exp_data.length / legendColumns))  + (margin.legendline*0.75);});

        // add vernalization
        var vernLegend = legend.selectAll('g')
                            .filter(function(d) {return false;})
                            .data(['Vernalization'])
                            .enter()
                            .append('g')
                            .attr('class', 'key');

        vernLegend.append('rect')
                .attr('x', function(d, i) {return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i;})
                .attr('y', function(d, i) {return svgHeight - (margin.legendline + margin.spacing);})
                .attr('width', margin.legendline)
                .attr('height', margin.legendline)
                .attr('class', 'vernalization');

        vernLegend.append('text')
                .text(function(d) {return d;})
                .attr("text-anchor", "middle")
                .attr('x', function(d, i) {return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i + margin.legendline + margin.spacing + Math.ceil(this.getComputedTextLength())/2})
                .attr('y', function(d, i) {return svgHeight - (margin.legendline + margin.spacing)  + (margin.legendline*0.75);});
    } else {
        svg.selectAll('*').remove();}

}
