// An aesthetic thing which unselects the nav tabs when the brand is clicked
$(document).ready(function(){
    $('a[href="#welcome"').click(function(){
        $('a[data-toggle="tab"').each(function( index, listItem ) {
            $(listItem).parent().removeClass("active");
            $(listItem).attr("aria-expanded", "false");
        });
    });
});
