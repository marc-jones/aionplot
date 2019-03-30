
// measurement data is an array of record objects. each record object has a name
// field (string) and a measurements field (array). Each measurement is an
// object with the fields col_facet, row_facet, time, value, hi, lo.
// the element_selector indicates which element to build the graph in.
// region_data allows parts of the graph to be shaded different colours, and is
// optional
var facet_plot = function(measurement_data, element_selector, region_data)
{
    // Establish the size of the canvas
    var svgWidth = parseInt(d3.select(element_selector).style('width'), 10);
    if (isNaN(svgWidth)) {
        return;
    }
    var svgHeight = returnSVGHeight(svgWidth);

    // Create a blank canvas
    var svg = d3.select(element_selector).select("svg").attr("width", svgWidth)
        .attr("height", svgHeight);
    svg.selectAll('*').remove();

    // Stop if the measurement_data is empty
    if (measurement_data.length == 0) {return;}

    measurement_data = sortTimePoints(measurement_data);

    // Filter the regions for only those visible
    var filteredRegionData = filterRegionData(measurement_data, region_data);

    // Get details about the plot, essentially, derived variables
    var plotDetails = returnPlotDetailsObject(measurement_data,
        filteredRegionData, svg);

    // Get the plot object
    var plotObject = returnPlotObject(measurement_data, filteredRegionData,
        plotDetails);

    var plotSelection = svg.selectAll('g').data(plotObject).enter().append('g')
        .classed('plot', true).attr('row', function(d) {return(d.rowLabel);})
        .attr('col', function(d) {return(d.colLabel);});

    createBackgrounds(plotDetails, plotSelection);
    addRegions(plotDetails, plotSelection);
    addRecords(plotDetails, plotSelection);
    addAxisAndLabels(plotDetails, plotObject, svg);
    addLegend(plotDetails, svg);
}

var sortTimePoints = function(measurement_data) {
    measurement_data = measurement_data.map(function(record) {
        record.measurements.sort(function(a, b) {
            if (a.time < b.time) {return(-1);}
            if (a.time > b.time) {return(1);}
            return(0);})
        return(record);
    });
    return(measurement_data);
}

// Returns a function that returns ggplot2 like colours. The maximum number of
// colours is defined by number_of_colours
var returnColour = function(colour_index, total_number_of_colours)
{
    var hues = Array.apply(0, Array(total_number_of_colours)).map(
        function (x, y) {return(y*(360 / total_number_of_colours) + 15);});
    return(hcl2rgb(hues[colour_index], 100, 65));
}

// Returns the SVG height based on the aspect ratios. if the screen width is
// between the two cut offs, the size of the plot will scale linearly
var returnSVGHeight = function(svgWidthInput)
{
    var aspectRatio = plot_vars.aspect_ratio
    if (svgWidthInput < plot_vars.mobile_cut_offs['min']) {
        aspectRatio = plot_vars.mobile_aspect_ratio;
    } else if (plot_vars.mobile_cut_offs['min'] <= svgWidthInput &&
        svgWidthInput < plot_vars.mobile_cut_offs['max'] ) {
        var m = (plot_vars.aspect_ratio - plot_vars.mobile_aspect_ratio) /
            (plot_vars.mobile_cut_offs['max'] -
            plot_vars.mobile_cut_offs['min']);
        var c = plot_vars.aspect_ratio - (m * plot_vars.mobile_cut_offs['max']);
        aspectRatio = m * svgWidthInput + c;
    }
    return(parseInt(svgWidthInput / aspectRatio, 10));
}

// Returns the maximum legend text length
var returnMaximumLegendLabelWidth = function(labels, svg)
{
    var texts = svg.selectAll('text').filter('.temporary')
        .data(labels).enter().append('text').attr('class', 'temporary')
        .text(function(d) {return d;})
    var returnValue = d3.max(texts.nodes().map(function(node) {
        return(Math.ceil(node.getComputedTextLength()));}))
    texts.remove();
    return(returnValue);
}

var filterRegionData = function(measurement_data, region_data)
{
    if (region_data == undefined) {return(undefined);}

    var filteredRegions = [];

    // Determining the facets
    var rowLabels = unique([].concat(...measurement_data.map(function(record) {
        return(unique(record.measurements.map(function(measurement) {
        return(measurement.row_facet);})));})));
    var colLabels = unique([].concat(...measurement_data.map(function(record) {
        return(unique(record.measurements.map(function(measurement) {
        return(measurement.col_facet);})));})));

    for (rowIdx = 0; rowIdx < rowLabels.length; rowIdx++)
    {
        var rowValues = [];
        if (plot_vars.displayErrors) {
            rowValues = [].concat(...[].concat(...measurement_data.map(
                function(record) {return(record.measurements.filter(
                function(measurement) {return(
                measurement.row_facet == rowLabels[rowIdx]);
                }).map(function(measurement) {
                return([measurement.hi, measurement.lo]);}));})));
        } else {
            rowValues = [].concat(...measurement_data.map(function(record) {
                return(record.measurements.filter(function(measurement) {
                return(measurement.row_facet == rowLabels[rowIdx]);
                }).map(function(measurement) {return(measurement.value);}));}));
        }
        for (colIdx = 0; colIdx < colLabels.length; colIdx++)
        {
            var colTimes = [].concat(...measurement_data.map(function(record) {
                return(record.measurements.filter(function(measurement) {
                return(measurement.col_facet == colLabels[colIdx]);
                }).map(function(measurement) {return(measurement.time);}));}));

            var xScaleFunc = d3.scaleLinear().domain(d3.extent(colTimes)).nice();
            var yScaleFunc = d3.scaleLinear().domain(d3.extent(rowValues)).nice();

            var plotRegions = region_data.filter(
                    function(region) {return(
                    region.row_facet == rowLabels[rowIdx] &&
                    region.col_facet == colLabels[colIdx]);})
                .map(function(region) {
                    var returnRegion = JSON.parse(JSON.stringify(region));
                    ['x_min', 'x_max'].forEach(function(x_variabe) {
                    if (parseFloat(returnRegion[x_variabe]) <=
                        d3.min(xScaleFunc.domain()) ||
                        returnRegion[x_variabe] == 'min') {
                        returnRegion[x_variabe] = d3.min(xScaleFunc.domain());
                    } else if (d3.max(xScaleFunc.domain()) <=
                        parseFloat(returnRegion[x_variabe]) ||
                        returnRegion[x_variabe] == 'max') {
                        returnRegion[x_variabe] = d3.max(xScaleFunc.domain());
                    }});
                    ['y_min', 'y_max'].forEach(function(y_variabe) {
                    if (parseFloat(returnRegion[y_variabe]) <=
                        d3.min(yScaleFunc.domain()) ||
                        returnRegion[y_variabe] == 'min') {
                        returnRegion[y_variabe] = d3.min(yScaleFunc.domain());
                    } else if (d3.max(yScaleFunc.domain()) <=
                        parseFloat(returnRegion[y_variabe]) ||
                        returnRegion[y_variabe] == 'max') {
                        returnRegion[y_variabe] = d3.max(yScaleFunc.domain());
                    }});
                    return(returnRegion);})
                .filter(function(region) {
                    return(region.x_min != region.x_max &&
                    region.y_min != region.y_max);});

            filteredRegions = filteredRegions.concat(plotRegions);
        }
    }
    return(filteredRegions);
}

var returnPlotDetailsObject = function(measurement_data, region_data, svg)
{
    var svgWidth = parseInt(svg.attr('width'));
    var svgHeight = parseInt(svg.attr('height'));

    // Determining the size of the record legend
    var legendLabels = measurement_data.map(function(d) {return(d.name);});
    var maxLegendLabelWidth = returnMaximumLegendLabelWidth(legendLabels, svg);
    var numLegendCols = Math.floor(
        (svgWidth * plot_vars.legendWidthProportion) /
        (plot_vars.margin.legendline + (plot_vars.margin.spacing * 2) +
        maxLegendLabelWidth));
    var numLegendRows = Math.ceil(measurement_data.length / numLegendCols);

    // Determining the size of the groups legend
    var groupLabels = unique(measurement_data.map(function(record) {
        return(record.group);}));
    var maxGroupsLabelWidth = returnMaximumLegendLabelWidth(groupLabels, svg);
    var numGroupsCols = 0;
    var numGroupsRows = 0;
    if (!(groupLabels.length == 1 && groupLabels[0] == '')) {
        numGroupsCols = Math.floor(
            (svgWidth * plot_vars.legendWidthProportion) /
            (plot_vars.margin.legendline + (plot_vars.margin.spacing * 2) +
            maxGroupsLabelWidth));
        numGroupsRows = Math.ceil(groupLabels.length / numGroupsCols);
    }

    // Determining the size of the regions legend
    var uniqueRegions = [];
    var maxRegionsLabelWidth = 0;
    var numRegionsCols = 0;
    var numRegionsRows = 0;
    if (region_data != undefined) {
        var regionIDs = region_data.map(function(region) {
            return(region.name + region.colour + region.alpha);});
        var uniqueRegionIDs = unique(regionIDs);
        var uniqueIdxs = uniqueRegionIDs.map(function(uniqueID) {
            return(regionIDs.indexOf(uniqueID));});
        uniqueRegions = region_data.filter(function(region, idx) {
            return(uniqueIdxs.indexOf(idx) != -1);});
        var uniqueRegionLabels = uniqueRegions.map(function(region) {
            return(region.name);});
        maxRegionsLabelWidth = returnMaximumLegendLabelWidth(
            uniqueRegionLabels, svg);
        numRegionsCols = Math.floor(
            (svgWidth * plot_vars.legendWidthProportion) /
            (plot_vars.margin.legendline + (plot_vars.margin.spacing * 2) +
            maxRegionsLabelWidth));
        numRegionsRows = Math.ceil(measurement_data.length / numRegionsCols);
    }

    // Determining the facets
    var rowLabels = unique([].concat(...measurement_data.map(function(record) {
        return(unique(record.measurements.map(function(measurement) {
        return(measurement.row_facet);})));})));
    var colLabels = unique([].concat(...measurement_data.map(function(record) {
        return(unique(record.measurements.map(function(measurement) {
        return(measurement.col_facet);})));})));

    // The dimensions of each individual plot
    var plotWidth = (svgWidth - plot_vars.margin.left - plot_vars.margin.right -
        (plot_vars.margin.spacing * (colLabels.length - 1))) / colLabels.length;
    var plotHeight = (svgHeight - plot_vars.margin.top -
        plot_vars.margin.bottom -
        (plot_vars.margin.spacing * (rowLabels.length - 1)) -
        ((plot_vars.margin.legendline + plot_vars.margin.spacing) *
        (numLegendRows + numGroupsRows + numRegionsRows))) / rowLabels.length;

    return({svgWidth: svgWidth, svgHeight: svgHeight,
        legendLabels: legendLabels, maxLegendLabelWidth: maxLegendLabelWidth,
        numLegendCols: numLegendCols, numLegendRows: numLegendRows,
        groupLabels: groupLabels, maxGroupsLabelWidth: maxGroupsLabelWidth,
        numGroupsCols: numGroupsCols, numGroupsRows: numGroupsRows,
        uniqueRegions: uniqueRegions, maxRegionsLabelWidth: maxRegionsLabelWidth,
        numRegionsCols: numRegionsCols, numRegionsRows: numRegionsRows,
        rowLabels: rowLabels, colLabels: colLabels, plotWidth: plotWidth,
        plotHeight: plotHeight});
}

var returnPlotObject = function(measurement_data, region_data, plotDetails)
{
    var returnArray = [];
    for (rowIdx = 0; rowIdx < plotDetails.rowLabels.length; rowIdx++)
    {
        var rowValues = [];
        if (plot_vars.displayErrors) {
            rowValues = [].concat(...[].concat(...measurement_data.map(
                function(record) {return(record.measurements.filter(
                function(measurement) {return(
                measurement.row_facet == plotDetails.rowLabels[rowIdx]);
                }).map(function(measurement) {
                return([measurement.hi, measurement.lo]);}));})));
        } else {
            rowValues = [].concat(...measurement_data.map(function(record) {
                return(record.measurements.filter(function(measurement) {
                return(measurement.row_facet == plotDetails.rowLabels[rowIdx]);
                }).map(function(measurement) {return(measurement.value);}));}));
        }
        for (colIdx = 0; colIdx < plotDetails.colLabels.length; colIdx++)
        {
            var colTimes = [].concat(...measurement_data.map(function(record) {
                return(record.measurements.filter(function(measurement) {
                return(measurement.col_facet == plotDetails.colLabels[colIdx]);
                }).map(function(measurement) {return(measurement.time);}));}));

            var plotRowIdx = rowIdx;
            var plotColIdx = colIdx;
            var xPos = plot_vars.margin.left + (colIdx *
                (plotDetails.plotWidth + plot_vars.margin.spacing));
            var yPos = plot_vars.margin.top + (rowIdx *
                (plotDetails.plotHeight + plot_vars.margin.spacing));
            var plotRecords = measurement_data.map(function(record) {
                var returnRecord = JSON.parse(JSON.stringify(record));
                returnRecord.measurements = returnRecord.measurements.filter(
                    function(measurement) {return(
                    measurement.row_facet == plotDetails.rowLabels[rowIdx] &&
                    measurement.col_facet == plotDetails.colLabels[colIdx]);})
                return(returnRecord);});
            var xScaleFunc = d3.scaleLinear().domain(d3.extent(colTimes))
                .range([xPos, xPos + plotDetails.plotWidth]).nice();
            var yScaleFunc = d3.scaleLinear().domain(d3.extent(rowValues))
                .range([yPos + plotDetails.plotHeight, yPos]).nice();
            var plotRegions = [];
            if (region_data != undefined) {
                plotRegions = region_data.filter(function(region) {
                    return(region.row_facet == plotDetails.rowLabels[rowIdx] &&
                    region.col_facet == plotDetails.colLabels[colIdx]);});
            }
            returnArray.push({plotRowIdx: plotRowIdx, plotColIdx: plotColIdx,
                xPos: xPos, yPos: yPos, records: plotRecords,
                regions: plotRegions, xScaleFunc: xScaleFunc,
                yScaleFunc: yScaleFunc, rowLabel: plotDetails.rowLabels[rowIdx],
                colLabel: plotDetails.colLabels[colIdx]});
        }
    }
    return(returnArray);
}

var unique = function(list)
{
    var result = [];
    list.forEach(function(d) {if (result.indexOf(d) == -1) result.push(d);});
    return(result);
}

var passThrough = function(input)
{
    return(input);
}

var returnMinorTicks = function(axis, originalTickNum)
{
    var majorTicks = axis.ticks(originalTickNum);
    var tickSeparation = majorTicks[1] - majorTicks[0];
    var returnArray = [majorTicks[0] - (tickSeparation / 2)];
    for (i = 1; i < (majorTicks.length + 1); i++)
    {
        returnArray.push(returnArray[i - 1] + tickSeparation);
    }
    var minValue = axis.domain()[0];
    var maxValue = axis.domain()[1];
    return(returnArray.filter(function(value) {
        return(minValue <= value && value <= maxValue);}));
}

var createBackgrounds = function(plotDetails, plotsD3Selection)
{
    plotsD3Selection.append('rect').attr('x', function(d) {return(d.xPos);})
        .attr('y', function(d) {return(d.yPos);})
        .attr('width', plotDetails.plotWidth)
        .attr('height', plotDetails.plotHeight)
        .attr('class', 'plotbackground');
    var gridLines = plotsD3Selection.append('g').classed('grid', true);
    var verticalGridLines = gridLines.append('g').classed('vertical', true);
    verticalGridLines.selectAll('line')
        .data(function(d) {return(d.xScaleFunc.ticks(plot_vars.tickNum).map(
            d.xScaleFunc));})
        .enter().append('line').classed('major', true).attr('x1', passThrough)
        .attr('x2', passThrough)
        .attr('y1', function() {
            return(d3.select(this.parentNode).datum().yPos);})
        .attr('y2', function() {
            return(d3.select(this.parentNode).datum().yPos +
            plotDetails.plotHeight);});
    verticalGridLines.selectAll('line').filter(':not(.major)')
        .data(function(d) {return(returnMinorTicks(d.xScaleFunc,
            plot_vars.tickNum).map(d.xScaleFunc));})
        .enter().append('line').classed('minor', true).attr('x1', passThrough)
        .attr('x2', passThrough)
        .attr('y1', function() {
            return(d3.select(this.parentNode).datum().yPos);})
        .attr('y2', function() {
            return(d3.select(this.parentNode).datum().yPos +
            plotDetails.plotHeight);});
    var horizontalGridLines = gridLines.append("g").classed('horizontal', true);
    horizontalGridLines.selectAll('line')
        .data(function(d) {return(d.yScaleFunc.ticks(plot_vars.tickNum).map(
            d.yScaleFunc));})
        .enter().append('line').classed('major', true).attr('x1', function() {
            return(d3.select(this.parentNode).datum().xPos);})
        .attr('x2', function() {
            return(d3.select(this.parentNode).datum().xPos +
            plotDetails.plotWidth);})
        .attr('y1', passThrough)
        .attr('y2', passThrough);
    horizontalGridLines.selectAll('line').filter(':not(.major)')
        .data(function(d) {return(returnMinorTicks(d.yScaleFunc,
            plot_vars.tickNum).map(d.yScaleFunc));})
        .enter().append('line').classed('minor', true).attr('x1', function() {
            return(d3.select(this.parentNode).datum().xPos);})
        .attr('x2', function() {
            return(d3.select(this.parentNode).datum().xPos +
            plotDetails.plotWidth);})
        .attr('y1', passThrough)
        .attr('y2', passThrough);
}

var addAxisAndLabels = function(plotDetails, plotObject, svgD3Selection)
{
    svgD3Selection.selectAll('g').filter('.axis').filter('.y')
        .data(plotObject.filter(function(d) {return(d.plotColIdx==0);}))
        .enter().append('g').classed('axis', true).classed('y', true)
        .attr('transform', function(d) {return('translate(' + d.xPos + ',0)');})
        .each(function(d) {d3.select(this).call(
            d3.axisLeft().scale(d.yScaleFunc).ticks(plot_vars.tickNum));});
    svgD3Selection.selectAll('g').filter('.axis').filter('.x')
        .data(plotObject.filter(function(d) {
            return(d.plotRowIdx==(plotDetails.rowLabels.length-1));}))
        .enter().append('g').classed('axis', true).classed('x', true)
        .attr('transform', function(d) {
            return('translate(0,' + (d.yPos + plotDetails.plotHeight) + ')');})
        .each(function(d) {d3.select(this).call(
            d3.axisBottom().scale(d.xScaleFunc).ticks(plot_vars.tickNum));});
    d3.selectAll('path.domain').remove();

    var yAxes = d3.selectAll('g').filter('.axis').filter('.y').nodes();
    var yAxesWidth = d3.max(yAxes.map(function(d) {
        return(d.getBoundingClientRect().width);}))

    svgD3Selection.selectAll('g').filter('.axislabel').filter('.y')
        .data(plotObject.filter(function(d) {return(d.plotColIdx==0);}))
        .enter().append('g').classed('axislabel', true).classed('y', true)
        .append('text')
        .attr('transform', function(d) {return('translate(' +
            (d.xPos - yAxesWidth - plot_vars.margin.spacing) + ',' +
            (d.yPos + (plotDetails.plotHeight / 2)) + ')rotate(-90)');})
        .attr('text-anchor', 'middle').text(plot_vars.axisLabels.y);

    var xAxes = d3.selectAll('g').filter('.axis').filter('.x').nodes();
    var xAxesHeight = d3.max(xAxes.map(function(d) {
        return(d.getBoundingClientRect().height);}))

    svgD3Selection.selectAll('g').filter('.axislabel').filter('.x')
        .data(plotObject.filter(function(d) {
            return(d.plotRowIdx==(plotDetails.rowLabels.length-1));}))
        .enter().append('g').classed('axislabel', true).classed('x', true)
        .append('text')
        .attr('transform', function(d) {
            return('translate(' + (d.xPos + (plotDetails.plotWidth / 2)) + ',' +
            (d.yPos + plotDetails.plotHeight + xAxesHeight +
            plot_vars.margin.spacing) + ')');})
        .attr('text-anchor', 'middle').text(plot_vars.axisLabels.x)
        .attr('alignment-baseline', 'before-edge');

    var topFacetLabels = svgD3Selection.selectAll('g').filter('.facetlabel')
        .filter('.top').data(plotObject.filter(function(d) {
            return(d.plotRowIdx == 0 && d.colLabel != null);})).enter()
        .append('g').classed('facetlabel', true).classed('top', true);
    topFacetLabels.append('rect').attr('x', function(d) {return(d.xPos);})
        .attr('y', function(d) {return(d.yPos - plot_vars.margin.facetlabel);})
        .attr('width', plotDetails.plotWidth)
        .attr('height', plot_vars.margin.facetlabel);
    topFacetLabels.append('text').attr('x', function(d) {
        return(d.xPos + (plotDetails.plotWidth / 2));}).attr('y', function(d) {
        return(d.yPos - (plot_vars.margin.facetlabel / 2));})
        .attr('text-anchor', 'middle').text(function(d) {return(d.colLabel);})
        .attr('alignment-baseline', 'middle');

    var rightFacetLabels = svgD3Selection.selectAll('g').filter('.facetlabel')
        .filter('.right').data(plotObject.filter(function(d) {
            return(d.plotColIdx == (plotDetails.colLabels.length-1) &&
            d.rowLabel != null);})).enter().append('g')
        .classed('facetlabel', true).classed('right', true);
    rightFacetLabels.append('rect').attr('x', function(d) {return(d.xPos +
        plotDetails.plotWidth);}).attr('y', function(d) {return(d.yPos);})
        .attr('width', plot_vars.margin.facetlabel)
        .attr('height', plotDetails.plotHeight);
    rightFacetLabels.append('text').attr('x', function(d) {
        return(d.xPos + plotDetails.plotWidth +
        (plot_vars.margin.facetlabel / 2));}).attr('y', function(d) {
        return(d.yPos + (plotDetails.plotHeight / 2));})
        .attr('text-anchor', 'middle').text(function(d) {return(d.rowLabel);})
        .attr('transform', function(d) {return('rotate(90,' + (d.xPos +
            plotDetails.plotWidth + (plot_vars.margin.facetlabel / 2)) + ',' +
            (d.yPos + (plotDetails.plotHeight / 2)) + ')')})
        .attr('alignment-baseline', 'middle');
}

var addRecords = function(plotDetails, plotsD3Selection)
{
    var recordSelection = plotsD3Selection.selectAll('g').filter('.record')
        .data(function(d) {return(d.records);})
        .enter().append('g').attr('name', function(d) {return(d.name);})
        .attr('class', 'record');

    recordSelection.selectAll('path').filter('.point')
        .data(function(d) {return(d.measurements);}).enter().append('path')
        .attr('transform', function(d) {
            var plotData = d3.select(this.parentNode.parentNode).datum();
            return("translate(" + plotData.xScaleFunc(d.time) + "," +
                plotData.yScaleFunc(d.value) + ")");})
        .classed('point', true)
        .attr('d', d3.symbol().size(plot_vars.symbolSize).type(function(d) {
            var idx = plotDetails.groupLabels.indexOf(
                d3.select(this.parentNode).datum().group);
            while (idx >= d3.symbols.length) {
                idx = idx - d3.symbols.length;}
            return(d3.symbols[idx]);}));

    recordSelection.append('path').classed('line', true).attr('d', function(d) {
        var plotData = d3.select(this.parentNode.parentNode).datum();
        var lineFunc = d3.line()
            .x(function(measurement) {
                return(plotData.xScaleFunc(measurement.time));})
            .y(function(measurement) {
                return(plotData.yScaleFunc(measurement.value));});
        return(lineFunc(d.measurements));}).attr('fill', 'none');

    if (plot_vars.displayErrors) {
        recordSelection.selectAll('line').filter('.errorBar')
            .data(function(d) {return(d.measurements);}).enter().append('line')
            .each(function(d) {
                var plotData = d3.select(this.parentNode.parentNode).datum();
                d3.select(this).attr('x1', plotData.xScaleFunc(d.time))
                    .attr('x2', plotData.xScaleFunc(d.time))
                    .attr('y1', plotData.yScaleFunc(d.hi))
                    .attr('y2', plotData.yScaleFunc(d.lo));
            }).classed('errorBar', true);
        recordSelection.selectAll('line').filter('.errorTop')
            .data(function(d) {return(d.measurements);}).enter().append('line')
            .each(function(d) {
                var plotData = d3.select(this.parentNode.parentNode).datum();
                d3.select(this).attr('x1', plotData.xScaleFunc(d.time) -
                        (plot_vars.errorBarEndLength / 2))
                    .attr('x2', plotData.xScaleFunc(d.time) +
                        (plot_vars.errorBarEndLength / 2))
                    .attr('y1', plotData.yScaleFunc(d.hi))
                    .attr('y2', plotData.yScaleFunc(d.hi));
            }).classed('errorTop', true);
        recordSelection.selectAll('line').filter('.errorBottom')
            .data(function(d) {return(d.measurements);}).enter().append('line')
            .each(function(d) {
                var plotData = d3.select(this.parentNode.parentNode).datum();
                d3.select(this).attr('x1', plotData.xScaleFunc(d.time) -
                        (plot_vars.errorBarEndLength / 2))
                    .attr('x2', plotData.xScaleFunc(d.time) +
                        (plot_vars.errorBarEndLength / 2))
                    .attr('y1', plotData.yScaleFunc(d.lo))
                    .attr('y2', plotData.yScaleFunc(d.lo));
            }).classed('errorBottom', true);
    }

    recordSelection.each(function(d, i) {
        var currentRecord = d3.select(this);
        var totalRecordNumber = plotDetails.legendLabels.length;
        var colour = returnColour(plotDetails.legendLabels.indexOf(d.name),
            totalRecordNumber);
        currentRecord.selectAll('path').filter('.point').attr('fill', colour);
        currentRecord.selectAll('path').filter('.line').attr('stroke', colour);
        currentRecord.selectAll('line[class^=error]').attr('stroke', colour);
    });
}

var addRegions = function(plotDetails, plotsD3Selection)
{
    var regionSelection = plotsD3Selection.selectAll('rect').filter('.region')
        .data(function(d) {return(d.regions);})
        .enter().append('rect').attr('name', function(d) {return(d.name);})
        .attr('class', 'region')
        .attr('x', function(d) {
            var plotData = d3.select(this.parentNode).datum();
            return(plotData.xScaleFunc(d.x_min));})
        .attr('y', function(d) {
            var plotData = d3.select(this.parentNode).datum();
            return(plotData.yScaleFunc(d.y_max));})
        .attr('width', function(d) {
            var plotData = d3.select(this.parentNode).datum();
            return(parseFloat(plotData.xScaleFunc(d.x_max)) -
                plotData.xScaleFunc(d.x_min));})
        .attr('height', function(d) {
            var plotData = d3.select(this.parentNode).datum();
            return(parseFloat(plotData.yScaleFunc(d.y_min)) -
                plotData.yScaleFunc(d.y_max));})
        .attr('fill', function(d) {return('#' + d.colour);})
        .attr('fill-opacity', function(d) {return(d.alpha);});
}

var addLegend = function(plotDetails, svgD3Selection)
{
    var legendGroup = svgD3Selection.append('g').attr('class', 'legend');
    var recordLegendKeys = legendGroup.selectAll('g')
        .data(plotDetails.legendLabels).enter().append('g')
        .attr('name', passThrough).classed('key', true);

    recordLegendKeys.append('rect').attr('x', function(name, i) {
        return(returnLegendPosition(plotDetails, i, {x:0, y:0}).x);})
        .attr('y', function(name, i) {
            return(returnLegendPosition(plotDetails, i, {x:0, y:0}).y);})
        .attr('width', plot_vars.margin.legendline)
        .attr('height', plot_vars.margin.legendline)
        .attr('class', 'plotbackground');

    recordLegendKeys.append('path').attr('transform', function(name, i) {
        var position = returnLegendPosition(plotDetails, i,
            {x: plot_vars.margin.legendline / 2,
            y: plot_vars.margin.legendline / 2});
        return('translate(' + position.x + ',' + position.y + ')');})
        .attr('d', d3.symbol().size(plot_vars.symbolSize).type(d3.symbols[0]));

    recordLegendKeys.append('line').attr('y1', function(name, i) {
        return(returnLegendPosition(plotDetails, i, {
        x:plot_vars.margin.legendline +
        plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);})
        .attr('y2', function(name, i) {
        return(returnLegendPosition(plotDetails, i, {
        x:plot_vars.margin.legendline +
        plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);})
        .attr('x1', function(name, i) {
        return(returnLegendPosition(plotDetails, i, {x:0, y:0}).x);})
        .attr('x2', function(name, i) {
        return(returnLegendPosition(plotDetails, i, {
        x:plot_vars.margin.legendline, y:0}).x);});

    recordLegendKeys.append('text').text(passThrough)
        .attr('alignment-baseline', 'middle').attr('x', function(name, i) {
            return(returnLegendPosition(plotDetails, i, {
            x:plot_vars.margin.legendline + plot_vars.margin.spacing,
            y:plot_vars.margin.legendline / 2}).x);})
        .attr('y', function(name, i) {return(returnLegendPosition(
            plotDetails, i, {x:plot_vars.margin.legendline +
            plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);});

    recordLegendKeys.each(function(name, i) {
        var currentRecord = d3.select(this);
        var totalRecordNumber = plotDetails.legendLabels.length;
        var colour = returnColour(plotDetails.legendLabels.indexOf(name),
            totalRecordNumber);
        currentRecord.selectAll('path').attr('fill', colour);
        currentRecord.selectAll('line').attr('stroke', colour);
    });

    recordLegendKeys.on('mouseover', function(name) {

        d3.selectAll('.record').filter(function(d) {
            return(d.name != name);}).selectAll('*').transition()
            .duration(300).style('opacity', 0.1);

        var selectedGeneNodes = d3.selectAll('.record').filter(function(d) {
            return(d.name == name);}).nodes();

        selectedGeneNodes.forEach(function(node) {
            d3.select(node.parentNode.appendChild(
            node.cloneNode(true))).classed('temporary', true);})
    })

    recordLegendKeys.on('mouseout', function(name) {

        d3.selectAll('.record').filter(function(d) {
            return(d == undefined || d.name != name);}).selectAll('*')
            .transition()
            .duration(300)
            .style('opacity', 1);

        d3.selectAll('.temporary').remove();

    })

    if (plotDetails.numGroupsCols != 0 && plotDetails.numGroupsRows != 0) {

        var groupsLegendGroup = svgD3Selection.append('g').attr('class',
            'group_legend');
        var groupsLegendKeys = groupsLegendGroup.selectAll('g')
            .data(plotDetails.groupLabels).enter().append('g')
            .attr('name', passThrough).classed('key', true);

        groupsLegendKeys.append('rect').attr('x', function(name, i) {
            return(returnGroupsPosition(plotDetails, i, {x:0, y:0}).x);})
            .attr('y', function(name, i) {
                return(returnGroupsPosition(plotDetails, i, {x:0, y:0}).y);})
            .attr('width', plot_vars.margin.legendline)
            .attr('height', plot_vars.margin.legendline)
            .attr('class', 'plotbackground');

        groupsLegendKeys.append('path').attr('transform', function(name, i) {
            var position = returnGroupsPosition(plotDetails, i,
                {x: plot_vars.margin.legendline / 2,
                y: plot_vars.margin.legendline / 2});
            return('translate(' + position.x + ',' + position.y + ')');})
            .attr('d', d3.symbol().size(plot_vars.symbolSize).type(function(d) {
                var idx = plotDetails.groupLabels.indexOf(d);
                while (idx >= d3.symbols.length) {
                    idx = idx - d3.symbols.length;}
                return(d3.symbols[idx]);}));

        groupsLegendKeys.append('line').attr('y1', function(name, i) {
            return(returnGroupsPosition(plotDetails, i, {
            x:plot_vars.margin.legendline +
            plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);})
            .attr('y2', function(name, i) {
            return(returnGroupsPosition(plotDetails, i, {
            x:plot_vars.margin.legendline +
            plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);})
            .attr('x1', function(name, i) {
            return(returnGroupsPosition(plotDetails, i, {x:0, y:0}).x);})
            .attr('x2', function(name, i) {
            return(returnGroupsPosition(plotDetails, i, {
            x:plot_vars.margin.legendline, y:0}).x);});

        groupsLegendKeys.append('text')
            .text(function(name) {
                if (name == '') {return('No Group');} else {return(name);}})
            .attr('alignment-baseline', 'middle').attr('x', function(name, i) {
                return(returnGroupsPosition(plotDetails, i, {
                x:plot_vars.margin.legendline + plot_vars.margin.spacing,
                y:plot_vars.margin.legendline / 2}).x);})
            .attr('y', function(name, i) {return(returnGroupsPosition(
                plotDetails, i, {x:plot_vars.margin.legendline +
                plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);});
    }

    if (plotDetails.uniqueRegions.length != 0) {

        var regionsLegendGroup = svgD3Selection.append('g').attr('class',
            'region_legend');
        var regionsLegendKeys = regionsLegendGroup.selectAll('g')
            .data(plotDetails.uniqueRegions).enter().append('g')
            .attr('name', function(d) {return(d.name + d.colour + d.alpha);})
            .classed('key', true);

        regionsLegendKeys.append('rect').attr('x', function(name, i) {
            return(returnRegionsPosition(plotDetails, i, {x:0, y:0}).x);})
            .attr('y', function(name, i) {
                return(returnRegionsPosition(plotDetails, i, {x:0, y:0}).y);})
            .attr('width', plot_vars.margin.legendline)
            .attr('height', plot_vars.margin.legendline)
            .attr('fill', function(d) {return('#' + d.colour);})
            .attr('fill-opacity', function(d) {return(d.alpha);});

        regionsLegendKeys.append('text')
            .text(function(region) {return(region.name);})
            .attr('alignment-baseline', 'middle').attr('x', function(region, i) {
                return(returnRegionsPosition(plotDetails, i, {
                x:plot_vars.margin.legendline + plot_vars.margin.spacing,
                y:plot_vars.margin.legendline / 2}).x);})
            .attr('y', function(region, i) {return(returnRegionsPosition(
                plotDetails, i, {x:plot_vars.margin.legendline +
                plot_vars.margin.spacing, y:plot_vars.margin.legendline / 2}).y);});
    }
}

var returnLegendPosition = function(plotDetails, idx, offset)
{
    var returnValue = {x:
        (plotDetails.svgWidth * (1 - plot_vars.legendWidthProportion) / 2 ) +
        ((plot_vars.margin.legendline + (plot_vars.margin.spacing * 2) +
        plotDetails.maxLegendLabelWidth) * (idx - plotDetails.numLegendCols *
        Math.floor(idx / plotDetails.numLegendCols))) + offset.x,
        y: plotDetails.svgHeight - ((plot_vars.margin.legendline +
        plot_vars.margin.spacing) * (plotDetails.numGroupsRows +
        plotDetails.numLegendRows + plotDetails.numRegionsRows -
        Math.floor(idx / plotDetails.numLegendCols))) + offset.y};
    return(returnValue);
}

var returnGroupsPosition = function(plotDetails, idx, offset)
{
    var returnValue = {x:
        (plotDetails.svgWidth * (1 - plot_vars.legendWidthProportion) / 2 ) +
        ((plot_vars.margin.legendline + (plot_vars.margin.spacing * 2) +
        plotDetails.maxGroupsLabelWidth) * (idx - plotDetails.numGroupsCols *
        Math.floor(idx / plotDetails.numGroupsCols))) + offset.x,
        y: plotDetails.svgHeight - ((plot_vars.margin.legendline +
        plot_vars.margin.spacing) * (plotDetails.numGroupsRows +
        plotDetails.numRegionsRows -
        Math.floor(idx / plotDetails.numGroupsCols))) + offset.y};
    return(returnValue);
}

var returnRegionsPosition = function(plotDetails, idx, offset)
{
    var returnValue = {x:
        (plotDetails.svgWidth * (1 - plot_vars.legendWidthProportion) / 2 ) +
        ((plot_vars.margin.legendline + (plot_vars.margin.spacing * 2) +
        plotDetails.maxRegionsLabelWidth) * (idx - plotDetails.numRegionsCols *
        Math.floor(idx / plotDetails.numRegionsCols))) + offset.x,
        y: plotDetails.svgHeight - ((plot_vars.margin.legendline +
        plot_vars.margin.spacing) * (plotDetails.numRegionsRows -
        Math.floor(idx / plotDetails.numRegionsCols))) + offset.y};
    return(returnValue);
}
