var silent_columns = ['name', 'group', 'groups', 'label_colour',
    'label_tooltip'];

var formatChildRow = function(row) {
    if (row.data().groups == undefined || row.data().groups.length == 0) {
        return('<p>No No group data to display.</p>');
    } else {
        var column_titles = []
        row.data().groups.forEach(function(group_data_object) {
            column_titles = column_titles.concat(Object.keys(group_data_object));
        });
        column_titles = column_titles.filter(function(title) {
            return(!silent_columns.includes(title));})
        column_titles = column_titles.filter(function(title, idx, self) {
            return(self.indexOf(title) == idx);
        });
        var returnTableString = '<table class="table table-striped"><tr>';
        column_titles.forEach(function(col_name) {
            returnTableString += '<td>' + col_name + '</td>';
        });
        returnTableString += '</tr>'
        row.data().groups.forEach(function(group_data_object) {
            returnTableString += '<tr class="' +
                group_data_object['label_colour'] + '">';
            column_titles.forEach(function(col_name) {
                if (!Object.keys(group_data_object).includes(col_name)) {
                    returnTableString += '<td></td>'
                } else {
                    returnTableString += '<td>' + group_data_object[col_name] +
                        '</td>';
                }
            });
        });
        returnTableString += '</tr></table>'
        return(returnTableString);
    }
}

$(document).on('update_table', function() {

    var data_table_array = [];

    var column_titles = [];

    $("input[type='checkbox'].record_checkbox").each(function( index, listItem ) {
        if (listItem.checked) {
            var name = listItem.value;
            var group = listItem.getAttribute('group');
            measurement_data.forEach(function(record) {
                if (record.name == name) {
                    var table_details = record.table_details;
                    column_titles = column_titles.concat(Object.keys(table_details));

                    var row_object = {};
                    Object.entries(table_details).forEach(
                        function(entry) {row_object[entry[0]] = entry[1];});

                    if (group != '' && group != 'BLAST Hits') {
                        table_details['groups'].forEach(function(group_record, idx) {
                            if (group_record.group == group) {
                                column_titles = column_titles.concat(Object.keys(table_details['groups'][idx]));
                                Object.entries(table_details['groups'][idx]).forEach(
                                    function(entry) {row_object[entry[0]] = entry[1];});
                                data_table_array.push(row_object);
                            }
                        });
                    } else {
                        data_table_array.push(row_object);
                    }
                }
            });
        }
    });

    column_titles = column_titles.filter(function(title) {
        return(!silent_columns.includes(title));})
    column_titles = column_titles.filter(function(title, idx, self) {
        return(self.indexOf(title) == idx);
    });

    data_table_array.forEach(function(row_object) {
        column_titles.forEach(function(col_name) {
            if (!Object.keys(row_object).includes(col_name)) {
                row_object[col_name] = '';
            }
        });
    });

    var columnDefs = [{ title: '', targets: 0, orderable: false }].concat(
        column_titles.map(function(col_name, idx) {
            return({title: col_name, targets: idx + 1});
        })
    );

    var columns = [{
        className: 'details-control',
        data: null,
        defaultContent: '<span class="glyphicon glyphicon-plus"></span>'
        }].concat(column_titles.map(function(col_name) {
            return({data: col_name });})
    );

    if ($.fn.DataTable.isDataTable($('#plot_table'))) {
        $('#plot_table').DataTable().destroy();
        $('#plot_table').empty();
    }

    if (data_table_array.length > 0) {
        var table = $('#plot_table').DataTable({
            data: data_table_array,
            columnDefs: columnDefs,
            columns: columns,
            order: [[1, 'asc']]
        });
    }

    $('#plot_table tbody').unbind();
    $('#plot_table tbody').on('click', 'td.details-control',
        function () {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
        var td = $(this).closest('td');

        if (row.child.isShown()) {
            // This row is already open - close it
            row.child.hide();
            td.empty();
            td.append('<span class="glyphicon glyphicon-plus"></span>');
        }
        else {
            // Open this row
            row.child(formatChildRow(row)).show();
            td.empty();
            td.append('<span class="glyphicon glyphicon-minus"></span>');
        }
    });


})
