$(document).ready(function(){
    var facets = plot_vars.facets;
    var facet_names = Object.keys(facets);

    var facet_selection = {}
    if (facet_names[0] != undefined) {facet_selection['row_facet'] = facet_names[0];}
    if (facet_names[1] != undefined) {facet_selection['col_facet'] = facet_names[1];}

    $('#facet_selectors').html(return_facet_selector_html(facet_selection));
});

// What to do when the checkboxes change
$(document).on("change", "select", function() {
    var facet_selection = {};
    $('select').each(function() {facet_selection[$(this).attr('id')] = $(this).val();});
    $('#facet_selectors').html(return_facet_selector_html(facet_selection));
    $.event.trigger({type: 'replot'});
});

var return_facet_selector_html = function(facet_selection)
{
    var facets = plot_vars.facets;
    var facet_names = Object.keys(facets);

    var returnHTML = '<label for="row_facet">Row facet:</label>' +
        '<select class="form-control" id="row_facet">'
    facet_names.concat(['None']).forEach(function(name) {
        if (name == facet_selection['row_facet']) {
            returnHTML = returnHTML + '<option selected>' + name + '</option>';
        } else {
            returnHTML = returnHTML + '<option>' + name + '</option>';
        }
    });

    var row_selection_index = facet_names.indexOf(facet_selection['row_facet']);
    if (row_selection_index > -1) {facet_names.splice(row_selection_index, 1);}

    if (facet_selection['row_facet'] == facet_selection['col_facet']) {facet_selection['col_facet'] = 'None';}

    returnHTML = returnHTML + '</select>' +
        '<label for="col_facet">Column facet:</label>' +
        '<select class="form-control" id="col_facet">';
    facet_names.concat(['None']).forEach(function(name) {
        if (name == facet_selection['col_facet']) {
            returnHTML = returnHTML + '<option selected>' + name + '</option>';
        } else {
            returnHTML = returnHTML + '<option>' + name + '</option>';
        }
    });
    returnHTML = returnHTML + '</select>';

    var col_selection_index = facet_names.indexOf(facet_selection['col_facet']);
    if (col_selection_index > -1) {facet_names.splice(col_selection_index, 1);}

    facet_names.forEach(function(name) {
        returnHTML = returnHTML +
            '<label for="' + name + '_facet">' + name + '</label>' +
            '<select class="form-control" id="' + name + '_facet">'
        facets[name].forEach(function(facet_option) {
            if (facet_option == facet_selection[name + '_facet']) {
                returnHTML = returnHTML + '<option selected>' + facet_option + '</option>';
            } else {
                returnHTML = returnHTML + '<option>' + facet_option + '</option>';
            }
        });
        returnHTML = returnHTML + '</select>';
    });
    return(returnHTML);
}
