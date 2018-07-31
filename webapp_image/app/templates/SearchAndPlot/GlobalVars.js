plot_vars = {
    aspect_ratio: 4/3,
    mobile_aspect_ratio: 2/3,
    mobile_cut_offs: {
        'min': 300,
        'max': 500},
    symbolSize: 60,
    errorBarEndLength: 10,
    margin: {
        'left': 60,
        'right': 30,
        'top': 30,
        'bottom':60,
        'spacing': 5,
        'legendline': 20,
        'facetlabel': 30
    },
    tickNum: 5,
    legendWidthProportion: 0.8,
    flags: {{ flags|tojson }},
    {% if 'facets' in flags.keys() %}
        facets: {{ flags['facets']|tojson }},
    {% else %}
        facets: {},
    {% endif %}
    {% if 'timerange' in flags.keys() %}
        timeRange: {{ flags['timerange']|tojson }},
        sliderRange: {{ flags['timerange']|tojson }},
    {% else %}
        timeRange: {},
        sliderRange: {},
    {% endif %}
    axisLabels: {
        x: 'Time (days)',
        y: 'Cufflinks FPKM'
    },
    displayErrors: false
}

measurement_data = {}
