// Sets up the search box
$(document).ready(function(){
    $('#search-box').selectize({
        valueField: 'name',
        labelField: 'name',
        searchField: ['name', 'nicknames'],
        plugins: ['remove_button'],
        options: [],
        create: false,
        load: function(query, callback) {
            if (!query.length) return(callback());
            $.ajax({
                url: "{{ url_for('autocomplete') }}" + "?term=" + query ,
                error: function() {callback();},
                success: function(res) {callback(res.json_list);}
            });
        },
        render: {
            option: function(item, escape) {
                return(
    '<div>' +
        '<span class="title">' +
            '<span class="name">' + escape(item.name) + '</span>' +
            '<br>' +
            '<span class="nicknames">' + escape(item.nicknames) + '</span>' +
        '</span>' +
    '</div>');
            }
        }
    });
})

// Sets up the Download buttons
$(document).ready(function(){
    formatTitle();
    // You can't use an AJAX call to do this, as AJAX doesn't accept pdf files
    // as a response datatype. Instead, I have to make this dummy form and send
    // the svg string as an input. I then remove the element. What a joke.
    $('#plot_download').on('click', function()
    {
        var form = document.createElement('form');
        form.setAttribute('action', "{{ url_for('downloadpdf') }}");
        form.setAttribute('method', 'post');
        form.setAttribute('name', 'hiddenForm');

        var svg = document.createElement('input');
        svg.setAttribute('type', 'hidden');
        svg.setAttribute('name', 'svg');
        svg.setAttribute('value', $('#result_graph')[0].innerHTML);

        form.appendChild(svg);

        $('body').append(form);

        document.hiddenForm.submit();
        document.hiddenForm.remove();
    });
    var send_checked_genes = function(event)
    {
        var form = document.createElement('form');
        form.setAttribute('action', event.data);
        form.setAttribute('method', 'post');
        form.setAttribute('name', 'hiddenForm');
        var checked_genes = [];
        $("input[type='checkbox'].record_checkbox").each(function( index, listItem ) {
            if (listItem.checked) {
                checked_genes.push(listItem.value);
            }
        });
        var checked_genes_element = document.createElement('input');
        checked_genes_element.setAttribute('type', 'hidden');
        checked_genes_element.setAttribute('name', 'checked_genes_element');
        checked_genes_element.setAttribute('value', checked_genes.join());

        form.appendChild(checked_genes_element);

        $('body').append(form);

        document.hiddenForm.submit();
        document.hiddenForm.remove();
    };
    $('#fasta_download').on('click', null, "{{ url_for('downloadfasta') }}", send_checked_genes);
    $('#ts_data_download').on('click', null, "{{ url_for('downloadtsdata') }}", send_checked_genes);
})

// Sets up slider
$(document).ready(function(){
    var slider = document.getElementById('slider-range');

    noUiSlider.create(slider, {
            start: [ 20, 90 ],
            step: 1,
            connect: true,
            orientation: 'horizontal',
            range: {
                    'min': 20,
                    'max': 90
            },
            pips: {
                mode: 'positions',
                values: [0, 14.29, 28.57, 42.86, 57.14, 71.43, 85.71, 100],
                density: 4
            }
    });

    slider.noUiSlider.on('slide', function() {
        var accessions = plot_vars.accessions;
        var tissues = plot_vars.tissues;
        var min_time = slider.noUiSlider.get()[0];
        var max_time = slider.noUiSlider.get()[1];
        exp_data = remove_time_points_out_of_range(exp_data_original, min_time, max_time)
        var flipped = false;
        if ($('#flip_axis')[0].checked) {
            flipped = true;}
        var display_errors = false;
        if ($('#error_bars')[0].checked) {
            display_errors = true;}
        if (flipped)
        {
            var rowLabels = accessions;
            var colLabels = tissues;
        } else {
            var rowLabels = tissues;
            var colLabels = accessions;
        }
        min_max_arrays_global = return_min_max_arrays(colLabels, rowLabels, exp_data, display_errors)
        if ($('#search').hasClass('active')) {
            plot_graph(flipped, display_errors, min_max_arrays_global);
        };
    });
})


// What to do when the window resizes
$(window).on('resize', function() {
    formatTitle();
    var flipped = false;
    if ($('#flip_axis')[0].checked) {
        flipped = true;}
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

var formatTitle = function() {
    if ($('.device-sm').is(':visible') || $('.device-xs').is(':visible')) {
        $('.navbar-brand')[0].innerHTML = 'ORDER';
    } else {
        $('.navbar-brand')[0].innerHTML = 'ORDER: Oilseed Rape Developmental Expression Resource';
    };
};

var formatChildRow = function(expression_data, row) {
    var bngene_name = row.data().gene.replace(/<.+?>/g, '');
    var atgene_name = row.data().arabidopsis.replace(/<.+?>/g, '');
    for (gene_idx = 0; gene_idx < expression_data.length; gene_idx++) {
        if (expression_data[gene_idx].gene == bngene_name) {
            if (typeof expression_data[gene_idx].homology == 'undefined') {
                return('<p>No <em>Arabidopsis thaliana</em> genes show sufficient sequence similarity.</p>');
            } else {
                var returnTableString =
                    '<table class="table table-striped">' +
                        '<tr>' +
                            '<td>Arabidopsis</td>' +
                            '<td>Abbreviation</td>' +
                            '<td>BLAST Identity</td>' +
                            '<td>BLAST HSP Bit Score</td>' +
                            '<td>BLAST HSP Length</td>' +
                        '</tr>'
                expression_data[gene_idx].homology.forEach(function(entry) {
                    var trClass = ''
                    if (entry.agi.replace(/\.[0-9]/, '') == atgene_name.replace(/\.[0-9]/, '')) {trClass = 'warning';}
                    if (entry.agi == atgene_name) {trClass = 'success';}
                    returnTableString = returnTableString +
                        '<tr class="' + trClass + '">' +
                            '<td>' + entry.agi + '</td>' +
                            '<td>' + entry.symbols.join('; ') + '</td>' +
                            '<td>' + entry.identity + '</td>' +
                            '<td>' + entry.hsp_bit_score + '</td>' +
                            '<td>' + entry.length_of_hsp + '</td>' +
                        '</tr>'})
                return(returnTableString + '</table>')
            }
        }
    }
}

var unique = function(list) {
    var result = [];
    $.each(list, function(i, e) {
        if ($.inArray(e, result) == -1) result.push(e);
    });
    return result;}

var return_plot_order = function(colLabels, rowLabels, margin, min_max_arrays,
    plotWidth, plotHeight, flipped) {
    var return_array = [];
    for (row_idx = 0; row_idx < rowLabels.length; row_idx++) {
        for (col_idx = 0; col_idx < colLabels.length; col_idx++) {
            if (flipped) {
                var acc = rowLabels[row_idx];
                var tis = colLabels[col_idx];}
            else {
                var tis = rowLabels[row_idx];
                var acc = colLabels[col_idx];}
            var x_val = margin.left + col_idx * (plotWidth + margin.spacing);
            var y_val = margin.top + row_idx * (plotHeight + margin.spacing);
            var xScale = d3.scale.linear()
                .domain([min_max_arrays.minTimes[col_idx],
                    min_max_arrays.maxTimes[col_idx]])
                .range([x_val, x_val+plotWidth])
                .nice();
            var yScale = d3.scale.linear()
                .domain([min_max_arrays.minFPKMs[row_idx],
                    min_max_arrays.maxFPKMs[row_idx]])
                .range([y_val+plotHeight, y_val])
                .nice();
            return_array.push({plotRow:row_idx, plotCol:col_idx, x:x_val,
                y:y_val, xScale:xScale, yScale:yScale, accession:acc,
                tissue:tis});}}
    return(return_array);}

var return_min_max_arrays = function(colLabels, rowLabels, exp_data,
                                     display_errors) {
    // The following sections goes through the data and collects the minimum and
    // maximum times and FPKMs for each column and row respectively. Because of
    // the doubled nested nature of the data, this requires two loops twice and
    // is a bloody mess.this could potentially be alleviated by using a
    // different data structure.
    var minTimes = [];
    var maxTimes = [];
    for (col_idx = 0; col_idx < colLabels.length; col_idx++) {
        var times = [];
        var measurement_min_maxes = exp_data.forEach(function(gene) {
            var filtered_times = gene['measurements']
                .filter(function(measurement) {
                    return(measurement['accession'] == colLabels[col_idx] ||
                        measurement['tissue'] == colLabels[col_idx]);
                })
                .map(function(measurement) {
                    return(measurement.time);
                });
            times = times.concat(filtered_times);
        });
        minTimes.push(d3.min(times));
        maxTimes.push(d3.max(times));
    };
    var minFPKMs = [];
    var maxFPKMs = [];
    for (row_idx = 0; row_idx < rowLabels.length; row_idx++) {
        var fpkms = [];
        var measurement_min_maxes = exp_data.map(function(gene) {
            var filtered_fpkms = gene['measurements']
                .filter(function(measurement) {
                    return(measurement['accession'] == rowLabels[row_idx] ||
                    measurement['tissue'] == rowLabels[row_idx]);
                })
                .map(function(measurement) {
                    if (display_errors) {
                        return([measurement.hi, measurement.lo]);
                    } else {
                        return([measurement.fpkm]);
                    };
                });
            fpkms = fpkms.concat([].concat.apply([], filtered_fpkms));
        });
        minFPKMs.push(d3.min(fpkms));
        maxFPKMs.push(d3.max(fpkms));
    };
    return({minTimes: minTimes, maxTimes: maxTimes, minFPKMs: minFPKMs,
        maxFPKMs: maxFPKMs});
};

var returnMinorMajorTicks = function(axis, originalTickNum) {
    var majorTicks = axis.ticks(originalTickNum);
    var tickSeparation = majorTicks[1]-majorTicks[0]
    var returnArray = [];
    for (i = 0; i < (majorTicks.length-1); i++) {
        returnArray.push(majorTicks[i]);
        returnArray.push(majorTicks[i] + tickSeparation/2);}
    returnArray.push(majorTicks[majorTicks.length-1])
    if ((axis.domain()[0] < majorTicks[0]) && (axis.domain()[0] <
        returnArray[0]-tickSeparation/2)) {
        returnArray.unshift(returnArray[0]-tickSeparation/2);}
    else if ((axis.domain()[0] > majorTicks[0]) && (axis.domain()[0] >
        returnArray[0]-tickSeparation/2)) {
        returnArray.unshift(returnArray[0]-tickSeparation/2);}
    if ((majorTicks[majorTicks.length-1] < axis.domain()[1]) &&
        (returnArray[returnArray.length-1]+tickSeparation/2 <
        axis.domain()[1])) {
        returnArray.push(returnArray[returnArray.length-1]+tickSeparation/2);}
    else if ((majorTicks[majorTicks.length-1] > axis.domain()[1]) &&
        (returnArray[returnArray.length-1]+tickSeparation/2 >
        axis.domain()[1])) {
        returnArray.push(returnArray[returnArray.length-1]+tickSeparation/2);}
    return(returnArray);}

var remove_time_points_out_of_range = function(passed_exp_data, min_time,
                                               max_time) {
    var return_array = [];
    passed_exp_data.forEach(function(gene_object) {
        var gene_object_copy = jQuery.extend(true, {}, gene_object);
        gene_object_copy['measurements'] =
            gene_object_copy['measurements'].filter(function(time_point) {
                return(time_point.time >= min_time &&
                    time_point.time <= max_time);
            });
        return_array.push(gene_object_copy);
    });
    return(return_array);}

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
    if (flipped)
    {
        var rowLabels = accessions;
        var colLabels = tissues;
    } else {
        var rowLabels = tissues;
        var colLabels = accessions;
    }


    // svg checkbox - http://jsperf.com/svg-checkbox-vs-html-checkbox
    // A great tutorial on responsive graphs - http://goo.gl/kBViYN
    var svgWidth = parseInt(d3.select('#result_graph').style('width'), 10);

    if (svgWidth < mobile_cut_offs['min']) {
        var svgHeight = parseInt(svgWidth / mobile_aspect_ratio, 10);
    } else if (mobile_cut_offs['min'] <= svgWidth && svgWidth < mobile_cut_offs['max'] ) {
        var m = (aspect_ratio - mobile_aspect_ratio) /
        (mobile_cut_offs['max'] - mobile_cut_offs['min']);
        var c = aspect_ratio - (m * mobile_cut_offs['max']);
        var y = m * svgWidth + c;
        var svgHeight = parseInt(svgWidth / y, 10);
    } else {
        var svgHeight = parseInt(svgWidth / aspect_ratio, 10);
    }

    var svg = d3.select('#result_graph')
                .select("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight);

    // create the colour function
    var hues = Array.apply(0, Array(exp_data.length)).map(
        function (x, y) {
            return(y*(360/exp_data.length) + 15);});
    var getColour = function(i) {
        return hcl2rgb(hues[i], 100, 65);}

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

        var maxLegendLabelWidth = 0.0;

        var texts = svg.selectAll('text')
                        .data(legend_labels)
                        .enter()
                        .append('text')
                        .text(function(d) {return d;})
                        .each(function() {if (Math.ceil(this.getComputedTextLength()) > maxLegendLabelWidth)
                                        {maxLegendLabelWidth = Math.ceil(this.getComputedTextLength());}});

        // clear everything in the svg
        svg.selectAll('*').remove();

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
        var plotOrder = return_plot_order(colLabels, rowLabels, margin, min_max_arrays, plotWidth, plotHeight, flipped)

        // clear everything in the svg
        svg.selectAll('*').remove();

        // add a group for each plot
        var individualPlots = svg.selectAll('g')
            .data(plotOrder)
            .enter()
            .append('g')
            .attr('accession', function(d) {return d.accession;})
            .attr('tissue', function(d) {return d.tissue;});
        // add the plot background
        individualPlots.append('rect')
            .attr('x', function(d) { return d.x;})
            .attr('y', function(d) { return d.y;})
            .attr('width', plotWidth)
            .attr('height', plotHeight)
            .attr('class', 'plotbackground');
        // add the vernalization region
        individualPlots.append('rect')
            .filter(function(d) { return d.xScale.domain()[0] < 64;})
            .attr('x', function(d) { return Math.max(d.xScale(23), d.xScale.range()[0]);})
            .attr('y', function(d) { return d.y;})
            .attr('width', function(d) {return d.xScale(64)-Math.max(d.xScale(23), d.xScale.range()[0]);})
            .attr('height', plotHeight)
            .attr('class', 'vernalization');

        // add axis, labels and gridlines for each plot
        plotOrder.forEach(function(plot_data, plot_idx) {
            var yAxis = d3.svg.axis()
                .scale(plot_data.yScale)
                .orient("left")
                .ticks(tickNum);
            var xAxis = d3.svg.axis()
                .scale(plot_data.xScale)
                .orient("bottom")
                .ticks(tickNum);

            // if the plot is in the left most column, add an axis
            if (plot_data.plotCol == 0) {
                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(" + margin.left + ",0)")
                    .call(yAxis);}

            // if the plot is in the top row, add a label
            if (plot_data.plotRow == 0) {
                var label_group = svg.append("g")
                    .attr("class", 'facetlabel')

                label_group.append('rect')
                    .attr('x', plot_data.x)
                    .attr('y', plot_data.y-margin.top)
                    .attr('width', plotWidth)
                    .attr('height', margin.top);
                label_group.append('text')
                    .attr('x', plot_data.x + (plotWidth/2))
                    .attr('y', plot_data.y - (margin.top/2))
                    .attr("text-anchor", "middle")
                    .text(capitalizeFirstLetter(colLabels[plot_data.plotCol]));}

            // if the plot is in the bottom row, add an axis
            if (plot_data.plotRow == (rowLabels.length-1)) {
                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + (svgHeight -
                        margin.bottom - (margin.legendline +
                        margin.spacing)*legendNumberOfLines) + ")")
                    .call(xAxis);}

            // if the plot is in the right most column, add a label
            if (plot_data.plotCol == (colLabels.length-1)) {
                var label_group = svg.append("g")
                    .attr("class", 'facetlabel')
                label_group.append('rect')
                    .attr('x', plot_data.x+plotWidth)
                    .attr('y', plot_data.y)
                    .attr('width', margin.right)
                    .attr('height', plotHeight);
                var textX = plot_data.x + plotWidth + (margin.right/2);
                var textY = plot_data.y + (plotHeight/2);
                label_group.append('text')
                    .attr('x', textX)
                    .attr('y', textY)
                    .attr("text-anchor", "middle")
                    .text(capitalizeFirstLetter(rowLabels[plot_data.plotRow]))
                    .attr("transform", "rotate(90,"+(plot_data.x +
                        plotWidth + (margin.right/2))+","+(plot_data.y +
                        (plotHeight/2))+")");}

            var currentPlot = d3.select(individualPlots[0][plot_idx]);

            var gridLines = currentPlot.append("g")
                .classed('grid', true);

            var verticalGridLines = gridLines.append("g")
                .classed('vertical', true);

            verticalGridLines.selectAll('line')
                .data(plot_data.xScale.ticks(tickNum),
                    function(d) {return d;})
                .enter()
                .append("line")
                .classed("major", true)
                .attr("y1", plot_data.y)
                .attr("y2", plot_data.y + plotHeight)
                .attr("x1", plot_data.xScale)
                .attr("x2", plot_data.xScale);

            verticalGridLines.selectAll('line')
                .data(returnMinorMajorTicks(plot_data.xScale, tickNum),
                    function(d) {return d;})
                .enter()
                .append("line")
                .classed("minor", true)
                .attr("y1", plot_data.y)
                .attr("y2", plot_data.y + plotHeight)
                .attr("x1", plot_data.xScale)
                .attr("x2", plot_data.xScale);

            // add the horizontal gridlines. The filter is a huge
            // hack which stops the previous vertical lines from being
            // included in the selection
            var horizontalGridLines =  gridLines.append("g")
                .classed('horizontal', true);

            horizontalGridLines.selectAll('line')
                .data(plot_data.yScale.ticks(tickNum),
                    function(d) {return d;})
                .enter()
                .append("line")
                .classed("major", true)
                .attr("y1", plot_data.yScale)
                .attr("y2", plot_data.yScale)
                .attr("x1", plot_data.x)
                .attr("x2", plot_data.x + plotWidth);


            horizontalGridLines.selectAll('line')
                .data(returnMinorMajorTicks(plot_data.yScale, tickNum),
                    function(d) { return d; })
                .enter()
                .append("line")
                .classed("minor", true)
                .attr("y1", plot_data.yScale)
                .attr("y2", plot_data.yScale)
                .attr("x1", plot_data.x)
                .attr("x2", plot_data.x + plotWidth);});

        // removes the axis lines
        d3.selectAll('path.domain').remove()

        // For each plot, add points and lines for each gene
        individualPlots.each(function(plot_data, i) {
            var genes = d3.select(this)
                .selectAll('g')
                .filter(function(d) {return false;})
                .data(exp_data)
                .enter()
                .append('g')
                .attr('gene', function(gene){return gene.gene;})
                .attr('class', 'gene');

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


            var lineFunc = d3.svg.line()
                .x(function(d2) {
                    return(plot_data.xScale(d2.time));})
                .y(function(d2) {
                    return(plot_data.yScale(d2.fpkm));});

            genes.append('path')
                .attr("class", "line")
                .attr("d", function(gene) {
                    var returnVal = gene['measurements']
                        .filter(function(measurement) {return(
                            measurement['accession'] == plot_data.accession &&
                            measurement['tissue'] == plot_data.tissue);});
                    return(lineFunc(returnVal));})
                .attr("fill", "none")
                .classed("line", true);

            if (display_errors) {
                var error_bars = genes.append('g')
                    .attr('class', 'error_bar')
                    .selectAll('line')
                    .data(function(gene) {
                        return(gene['measurements']
                        .filter(function(measurement) {return(
                            measurement['accession'] == plot_data.accession &&
                            measurement['tissue'] == plot_data.tissue);}));});
                error_bars.enter()
                    .append('line')
                    .attr('x1', function(point) {
                        return(plot_data.xScale(point.time))})
                    .attr('y1', function(point) {
                        return(plot_data.yScale(point.hi))})
                    .attr('x2', function(point) {
                        return(plot_data.xScale(point.time))})
                    .attr('y2', function(point) {
                        return(plot_data.yScale(point.lo))});

                error_bars.enter()
                    .append('line')
                    .attr('x1', function(point) {
                        return(plot_data.xScale(point.time) -
                            (errorBarEndLength/2))})
                    .attr('y1', function(point) {
                        return(plot_data.yScale(point.hi))})
                    .attr('x2', function(point) {
                        return(plot_data.xScale(point.time) +
                            (errorBarEndLength/2))})
                    .attr('y2', function(point) {
                        return(plot_data.yScale(point.hi))});

                error_bars.enter()
                    .append('line')
                    .attr('x1', function(point) {
                        return(plot_data.xScale(point.time) -
                            (errorBarEndLength/2))})
                    .attr('y1', function(point) {
                        return(plot_data.yScale(point.lo))})
                    .attr('x2', function(point) {
                        return(plot_data.xScale(point.time) +
                            (errorBarEndLength/2))})
                    .attr('y2', function(point) {
                        return(plot_data.yScale(point.lo))});}

            genes.each(function(d, i) {
                var currentGene = d3.select(this)
                currentGene.attr('defaultcolour', getColour(i));
                currentGene.selectAll('path').filter('.point')
                    .attr('fill', getColour(i));
                currentGene.selectAll('path').filter('.line')
                    .attr('stroke', getColour(i));
                currentGene.selectAll('line')
                    .attr('stroke', getColour(i));});});

        // add axis labels
        svg.append('g')
            .attr('class', 'axislabel')
            .append('text')
            .attr('x',
                  margin.left + (svgWidth - margin.left - margin.right) / 2)
            .attr('y', svgHeight - (margin.bottom / 4) - (margin.legendline +
                  margin.spacing) * legendNumberOfLines)
            .attr("text-anchor", "middle")
            .text('Time (days)');
        svg.append('g')
            .attr('class', 'axislabel')
            .append('text')
            .attr('transform',
                  'translate(' +
                  (margin.left / 4) + ',' +
                  (margin.top + (svgHeight - margin.top - margin.bottom -
                    (margin.legendline + margin.spacing) *
                    legendNumberOfLines) / 2) +
                  ')rotate(-90)')
            .attr("text-anchor", "middle")
            .text('Cufflinks FPKM');

        // legend code
        var legend = svg.append('g')
            .attr('class', 'legend');

        // add all the genes
        var geneLegend = legend.selectAll('g')
            .data(exp_data)
            .enter()
            .append('g')
            .attr('gene', function(gene) {
                return gene.gene;})
            .attr('class', 'key');

        var legendRects = geneLegend.append('rect')
            .attr('x', function(d, i) {
                while (i >= legendColumns) {
                    i = i - legendColumns;}
                return(svgWidth*((1-legendWidthProportion)/2) +
                    (margin.legendline + margin.spacing*2 +
                    maxLegendLabelWidth)*i);})
            .attr('y', function(d, i) {
                var n = 0;
                while (i >= legendColumns) {
                    i = i - legendColumns;
                    n = n + 1;}
                return(svgHeight - (margin.legendline + margin.spacing)*
                    (legendNumberOfLines-n));})
            .attr('width', margin.legendline)
            .attr('height', margin.legendline)
            .attr('class', 'plotbackground');

        geneLegend.append('circle')
                .attr('cx', function(d, i) {while (i >= legendColumns) {i = i - legendColumns;}
                                            return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i + (margin.legendline*0.5);})
                .attr('cy', function(d, i) {var n = 0;
                                                while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                                return svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n)  + (margin.legendline*0.5);});

        geneLegend.append('line')
                .attr("y1", function(d, i) {var n = 0;
                                                while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                                return svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n)  + (margin.legendline*0.5);})
                .attr("y2", function(d, i) {var n = 0;
                                                while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                                return svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n)  + (margin.legendline*0.5);})
                .attr("x1", function(d, i) {while (i >= legendColumns) {i = i - legendColumns;}
                                            return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i;})
                .attr("x2", function(d, i) {while (i >= legendColumns) {i = i - legendColumns;}
                                            return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i + margin.legendline;});

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

        geneLegend.append('text')
                .text(function(d) {return d.gene;})
                .attr("text-anchor", "middle")
                .attr('x', function(d, i) {while (i >= legendColumns) {i = i - legendColumns;}
                                            return svgWidth*((1-legendWidthProportion)/2) + (margin.legendline + margin.spacing*2 + maxLegendLabelWidth)*i + margin.legendline + margin.spacing + Math.ceil(this.getComputedTextLength())/2})
                .attr('y', function(d, i) {var n = 0;
                                            while (i >= legendColumns) {i = i - legendColumns; n = n + 1;}
                                            return svgHeight - (margin.legendline + margin.spacing)*(legendNumberOfLines-n)  + (margin.legendline*0.75);});

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

        geneLegend.on("mouseover",function() {
                            var transition = d3.select('body')
                                            .append('div')
                                            .attr('class', 'gene_transition')
                                            .style('display', 'none');

                            var selectedLegend = d3.select(this);
                            var selectedGenes = d3.selectAll('.gene')
                                                .filter(function(d) {return selectedLegend.attr('gene') == d3.select(this).attr('gene')});
                            var allOtherGenes = d3.selectAll('.gene')
                                                .filter(function(d) {return selectedLegend.attr('gene') != d3.select(this).attr('gene')})
                                                .selectAll('path')
                                                .transition()
                                                .duration(300)
                                                .style('opacity', transition.style('opacity'));
//                                                       .classed('notselected', true);
                            // http://stackoverflow.com/a/27443487
                            selectedGenes.each(function(){
                                var clone = d3.select(this.parentNode).node().appendChild(this.cloneNode(true));
                                d3.select(clone).classed('temp', true);
                            });

                            transition.remove();
                        });

        geneLegend.on('mouseout', function() {
                            var transition = d3.select('body')
                                            .append('div')
                                            .attr('class', 'gene_transition')
                                            .style('display', 'none');

                            var tempGene = d3.selectAll('.temp');

                            var selectedLegend = d3.select(this);
                            var allOtherGenes = d3.selectAll('.gene')
                                                .filter(function(d) {return selectedLegend.attr('gene') != d3.select(this).attr('gene')})
                                                .selectAll('path')
                                                .transition()
                                                .duration(300)
                                                .style('opacity', tempGene.style('opacity'));
//                                                       .classed('notselected', false);
                            tempGene.remove();

                            transition.remove();

                        });




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
                .attr('y', function(d, i) {return svgHeight - (margin.legendline + margin.spacing)  + (margin.legendline*0.75);});}
    else {
        svg.selectAll('*').remove();}}
