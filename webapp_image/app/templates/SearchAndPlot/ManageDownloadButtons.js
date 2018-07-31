$(document).ready(function(){
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
        $("input[type='checkbox'].record_checkbox").each(
            function(index, listItem) {
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
    $('#fasta_download').on('click', null, "{{ url_for('downloadfasta') }}",
        send_checked_genes);
    $('#ts_data_download').on('click', null, "{{ url_for('downloadtsdata') }}",
        send_checked_genes);
});
