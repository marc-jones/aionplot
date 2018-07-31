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
