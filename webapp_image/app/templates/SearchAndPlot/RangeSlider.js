// Sets up slider
$(document).ready(function(){
    var slider = document.getElementById('slider-range');

    var orderOfMag = Math.pow(10, Math.floor(Math.log(
        Math.min(...plot_vars.timeRange)) / Math.LN10 + 0.0001));

    var minValue = orderOfMag * Math.floor(
        Math.min(...plot_vars.timeRange) / orderOfMag);

    var maxValue = orderOfMag * Math.ceil(
        Math.max(...plot_vars.timeRange) / orderOfMag);

    var numberOfMajorPositions = (maxValue - minValue) / orderOfMag;

    noUiSlider.create(slider, {
        start: [minValue, maxValue],
        step: 1,
        connect: true,
        orientation: 'horizontal',
        range: {'min': minValue, 'max': maxValue},
        pips: {
            mode: 'positions',
            values: [0].concat(Array.from(new Array(numberOfMajorPositions),
                (x,i) => (i + 1) * (100 / numberOfMajorPositions))),
            density: 4
        }
    });

    slider.noUiSlider.on('slide', function() {
        plot_vars.sliderRange = slider.noUiSlider.get();
        $.event.trigger({type: 'replot'});
    });
})
