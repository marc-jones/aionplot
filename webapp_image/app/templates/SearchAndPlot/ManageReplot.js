$(document).on("replot", function() {
    var facet_selection = {};
    $('select').each(function() {facet_selection[$(this).attr('id')] = $(this).val();});

    var facets = plot_vars.facets;
    var facet_names = Object.keys(facets);

    var filtered_measurement_data = [];

    measurement_data.forEach(function(record) {
        var filtered_measurements = [];
        record.measurements.forEach(function(measurement) {
            var parsed_measurement = {
                time: measurement.time,
                value: measurement.value,
                hi: measurement.hi,
                lo: measurement.lo,
                row_facet: null,
                col_facet: null
            };
            var include = true;
            facet_names.forEach(function(facet_name) {
                if (facet_name == facet_selection.row_facet) {
                    parsed_measurement.row_facet = measurement[facet_name];
                }
                else if (facet_name == facet_selection.col_facet) {
                    parsed_measurement.col_facet = measurement[facet_name];
                }
                if (facet_selection[facet_name + '_facet'] != undefined) {
                    if (facet_selection[facet_name + '_facet'] != measurement[facet_name]) {
                        include = false;
                    }
                }
            });
            include = include && (
                Math.min(...plot_vars.sliderRange) <= parsed_measurement.time &&
                parsed_measurement.time <= Math.max(...plot_vars.sliderRange));
            if (include) {
                filtered_measurements.push(parsed_measurement);
            }
        });
        if (filtered_measurements.length > 0) {
            filtered_measurement_data.push({name: record.name,
                group: record.group,
                measurements: filtered_measurements});
        }
    });

    if (plot_vars.regions.length > 1) {
        var filtered_region_data = [];

        plot_vars.regions.forEach(function(region) {
            var parsed_region = {
                name: region.name,
                colour: region.colour,
                alpha: region.alpha,
                x_max: region.x_max,
                x_min: region.x_min,
                y_max: region.y_max,
                y_min: region.y_min,
                row_facet: null,
                col_facet: null
            };
            var include = true;
            facet_names.forEach(function(facet_name) {
                if (facet_name == facet_selection.row_facet) {
                    parsed_region.row_facet = region[facet_name];
                }
                else if (facet_name == facet_selection.col_facet) {
                    parsed_region.col_facet = region[facet_name];
                }
                if (facet_selection[facet_name + '_facet'] != undefined) {
                    if (facet_selection[facet_name + '_facet'] != region[facet_name]) {
                        include = false;
                    }
                }
            });
            if (include) {
                filtered_region_data.push(parsed_region);
            }
        });
        facet_plot(filtered_measurement_data, '#result_graph', filtered_region_data);
    } else {
        facet_plot(filtered_measurement_data, '#result_graph');
    }
});
