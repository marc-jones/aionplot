// What to do when the checkboxes change
$(document).on("change", "input[type='checkbox']", function() {
    var selected_names = '';
    $("input[type='checkbox'].record_checkbox").each(function( index, listItem ) {
        if (listItem.checked) {
            if (selected_names === '') {
                selected_names = listItem.value;
            } else {
                selected_names = selected_names + ',' + listItem.value;
            }
        }
    });
    if ($('#error_bars')[0].checked) {
        plot_vars.displayErrors = true;
    } else {
        plot_vars.displayErrors = false;
    }
    $.ajax({url: "{{ url_for('postcheckboxchange') }}" + "?names=" + selected_names}).done(
        function (new_measurement_data) {
            measurement_data = new_measurement_data;
            $.event.trigger({type: 'replot'});
            $.event.trigger({type: 'update_table'});
        })
});
