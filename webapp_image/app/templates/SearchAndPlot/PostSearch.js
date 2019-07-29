// This code is executed after a search has been completed

var update_checkboxes = function()
{
    var checked_genes = [];
    $("input[type='checkbox'].record_checkbox").each(function(index, listItem) {
        if (listItem.checked) {checked_genes.push(listItem.name);}});
    $.ajax({
        type: "POST",
        url: "{{ url_for('postsearch') }}",
        data: JSON.stringify({
            term: $('#search-box').val(),
            sequence: $('#sequence').val()}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            $('#transcript_checkboxes').html(data.checkbox_html);
            $('[data-toggle="tooltip"]').tooltip({container: 'body'});
            $("input[type='checkbox'].record_checkbox").each(function( index, listItem ) {
                if (checked_genes.indexOf(listItem.getAttribute('name')) > -1)
                {
                    $("input[name='"+ listItem.getAttribute('name') +"']").prop('checked', true).trigger("change");
                }
            });
            $('#blast_alert').html(data.blast_alert_html);
            blast_results = data.blast_results;
        },
        failure: function(errMsg) {
            console.log('Failure: ' + errMsg);
        }
    });
};

var blast_alert_in_progress = function()
{
    $('#blast_alert').html(
        '<div class="alert alert-info" role="alert">' +
            '<p>Searching...</p>' +
        '</div>'
    )
}

$(document).ready(function(){
    $('#search-box').change(update_checkboxes);
    $('#sequence').bind('input propertychange', blast_alert_in_progress);
    $('#sequence').bind('input propertychange', update_checkboxes);
});
