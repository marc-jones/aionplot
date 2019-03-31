from flask import (Flask, url_for, request, render_template, jsonify, session,
    make_response, Markup, render_template_string, send_from_directory)
from main import app, mungo_client
import re
import markdown
import yaml
import os

## imports required to allow the user to download the graph as a PDF
import pdfkit

## imports required for blast search
import subprocess
import tempfile
import xml.etree.ElementTree as ET

def get_measurement_data(list_of_names):
    if 'most_recent_search' in session:
        cache = session['most_recent_search']
        cached_names = [res['name'] for res in cache]
    else:
        cached_names = []
    # only open the connection to the database if one of the records isn't in
    # the cache. usually this won't be the case, but if the user has more than
    # one instance of the app open, then it will be a problem. This is also
    # necessary if the user has turned off cookies
    for name, group in list_of_names:
        if not name in cached_names:
            db = mungo_client['time_series']
            measurements_collection = db['measurements']
            break
    records = []
    for name, group in list_of_names:
        if name in cached_names:
            record_dict = cache[cached_names.index(name)]
            record_dict['group'] = group
            records.append(record_dict)
        else:
            search_results = [
                res for res in measurements_collection.find({'name': name})]
            for res in search_results:
                res['group'] = group
            records += search_results
    for res in records:
        if '_id' in res.keys():
            del(res['_id'])
    session['most_recent_search'] = records
    return(records)

# Takes search terms and then returns the names associated with each search
# term, with some added information such as nicknames
def process_search_terms(search_terms, blast_terms):
    db = mungo_client['time_series']
    search_terms_collection = db['search_terms']
    results_dict = {}
    for term in search_terms:
        search_results = [res for res in search_terms_collection.find(
            {'name': term})]
        if (len(search_results) == 1 and
            search_results[0]['term_type'] == 'direct'):
            results_dict[term] = {
                'heading': '',
                'subheading': '; '.join(search_results[0]['nicknames']),
                'records': [{
                    'name': search_results[0]['name'],
                    'tooltip': search_results[0]['tooltip'],
                    'label_status': search_results[0]['label_status']}]
            }
        elif (len(search_results) == 1 and
            search_results[0]['term_type'] == 'indirect'):
                results_dict[term] = {
                    'heading': term,
                    'subheading': '; '.join(search_results[0]['nicknames']),
                    'records': search_results[0]['records']
                }
    if len(blast_terms) > 0:
        results_dict['BLAST Hits'] = {
            'heading': 'BLAST Hits',
            'subheading': '',
            'records': []
        }
        for term in blast_terms:
            search_results = [res for res in search_terms_collection.find(
                {'name': term})]
            if (len(search_results) == 1 and
                search_results[0]['term_type'] == 'direct'):
                results_dict['BLAST Hits']['records'].append({
                        'name': search_results[0]['name'],
                        'tooltip': search_results[0]['tooltip'],
                        'label_status': search_results[0]['label_status']
                })
    return(results_dict)

def get_flags():
    flags_path = os.path.join(os.environ['CONTENT_LOCATION'], 'flags.yaml')
    if os.path.isfile(flags_path):
        flags = yaml.load(open(flags_path))
    else:
        flags = {
            'name': 'AionPlot',
            'short_name': 'AP'
        }
    return(flags)

@app.route('/user_content/<path:filename>')
def user_content(filename):
    return(send_from_directory(os.path.join(os.environ['CONTENT_LOCATION'],
        'user_content'), filename))

@app.route('/')
def landing():
    flags=get_flags()
    landing_markdown = 'static/content/landing.md'
    user_landing_markdown = os.path.join(os.environ['CONTENT_LOCATION'],
        'user_content', 'landing.md')
    if os.path.isfile(user_landing_markdown):
        landing_markdown = os.path.join(os.environ['CONTENT_LOCATION'],
            'user_content', 'landing.md')
    with app.open_resource(landing_markdown) as f:
        content = Markup(markdown.markdown(unicode(f.read(), 'utf-8')))
        content = render_template_string(content)
    landingPage = render_template('MarkdownBase.html', content=content)
    about_markdown = 'static/content/about.md'
    user_about_markdown = os.path.join(os.environ['CONTENT_LOCATION'],
        'user_content', 'about.md')
    if os.path.isfile(user_about_markdown):
        about_markdown = os.path.join(os.environ['CONTENT_LOCATION'],
            'user_content', 'about.md')
    with app.open_resource(about_markdown) as f:
        content = Markup(markdown.markdown(unicode(f.read(), 'utf-8')))
        content = render_template_string(content)
    aboutPage = render_template('MarkdownBase.html', content=content)
    howtouse_markdown = 'static/content/howtouse.md'
    user_howtouse_markdown = os.path.join(os.environ['CONTENT_LOCATION'],
        'user_content', 'howtouse.md')
    if os.path.isfile(user_howtouse_markdown):
        howtouse_markdown = os.path.join(os.environ['CONTENT_LOCATION'],
            'user_content', 'howtouse.md')
    with app.open_resource(howtouse_markdown) as f:
        content = Markup(markdown.markdown(unicode(f.read(), 'utf-8')))
        content = render_template_string(content)
    howToUsePage = render_template('MarkdownBase.html', content=content)
    searchPage = render_template('Search.html', flags=flags)
    blastPage = render_template('Blast.html')
    tablePage = render_template('Table.html')
    searchandplotjs = render_template('SearchAndPlot.js', flags=flags)
    favicon_location = url_for('static', filename='content/favicon.ico')
    user_favicon_location = os.path.join(os.environ['CONTENT_LOCATION'],
        'user_content', 'favicon.ico')
    if os.path.isfile(user_favicon_location):
        favicon_location = url_for('user_content', filename='favicon.ico')
    return(render_template('Base.html',
                           landingPage=landingPage,
                           aboutPage=aboutPage,
                           howToUsePage=howToUsePage,
                           searchPage=searchPage,
                           blastPage=blastPage,
                           searchandplotjs=searchandplotjs,
                           tablePage=tablePage,
                           flags=flags,
                           favicon_location=favicon_location))

@app.route('/postsearch')
def postsearch():
    search_terms = request.args.get('term').split(',')
    query_sequence = request.args.get('sequence')
    blast_list = blastquery(query_sequence)
    checkbox_dict = process_search_terms(search_terms, blast_list)
    return(jsonify(
        checkbox_html=render_template('Checkboxes.html',
            checkbox_dict=checkbox_dict),
        blast_alert_html=render_template('BlastAlert.html',
            blast_hits_int=len(blast_list), query_sequence=query_sequence)
    ))

@app.route('/postcheckboxchange')
def postcheckboxchange():
    measurement_data = []
    raw_names = request.args.get('names')
    if not raw_names == '':
        names = list(set([tuple(name_group.split(';'))
            for name_group in raw_names.split(',')]))
        measurement_data = get_measurement_data(names)
    return(jsonify(measurement_data))

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    search_term = request.args.get('term')
    db = mungo_client['time_series']
    search_terms_collection = db['search_terms']
    regx = re.compile('^' + search_term, re.IGNORECASE)
    search_results = [{'name': res['name'], 'nicknames': res['nicknames']}
        for res in search_terms_collection.find({ '$or': [{'name': regx},
        {'nicknames': {'$in': [regx]}}]}).limit(20)]
    return(jsonify(json_list=search_results))

@app.route('/downloadpdf', methods=['POST'])
def downloadpdf():
    svg_string = request.form['svg']
    ## yet another joke!
    svg_string = re.sub('<svg width="[0-9]+" height="[0-9]+">',
                        '<svg width="800" height="800">', svg_string)
    options = {'page-height': '200mm',
               'page-width': '200mm',
               'margin-top': '20mm'}
    pdf = pdfkit.from_string(svg_string, False,
        css=app.static_folder + '/css/plots.css', options=options)
    response = make_response(pdf)
    response.headers['Content-Disposition'] = "attachment; filename=plot.pdf"
    response.mimetype = 'application/pdf'
    return(response)

@app.route('/downloadfasta', methods=['POST'])
def downloadfasta():
    return()
    #db = mungo_client['darmor']
    #fasta_collection = db['fasta']
    #checked_genes = list(set(request.form['checked_genes_element'].split(',')))
    #search_results = []
    #for gene_name in checked_genes:
        #search_results += [res for res in fasta_collection.find(
            #{
                #'gene': gene_name
            #}
        #)]
    #response_string = ''
    #for res in search_results:
        #response_string += ''.join(['>', res['gene'], '\n',
                                    #res['sequence'], '\n'])
    #response = make_response(response_string)
    #response.headers['Content-Disposition'] = (
        #'attachment; filename=cdna_sequences.fasta')
    #return response

@app.route('/downloadtsdata', methods=['POST'])
def downloadtsdata():
    checked_genes = list(set(request.form['checked_genes_element'].split(',')))
    measurement_data = get_measurement_data(checked_genes)
    flags = get_flags()
    headers = ['name', 'time', 'value', 'hi', 'lo'] + flags['facets'].keys()
    response_string = '\t'.join(headers) + '\n'
    for record in measurement_data:
        for measurement in record['measurements']:
            response_string += '\t'.join(str(i) for i in [record['name']] +
                [measurement[key] for key in headers[1:]]) + '\n'
    response = make_response(response_string)
    response.headers['Content-Disposition'] = (
        'attachment; filename=time_series_data.tsv')
    return(response)

#def returnBrassicaGeneLabelType(agi, agiQuery):
    #classLabel = 'default'
    #if re.sub('\.[0-9]', '', agiQuery) in agi:
        #classLabel = 'warning'
    #if agi == agiQuery:
        #classLabel = 'success'
    #return(classLabel)

#def returnArabidopsisSymbols(agi, homology_list):
    #symbols = ''
    #for homology_entry in homology_list:
        #if homology_entry['agi'] == agi:
            #symbols = '; '.join(homology_entry['symbols'])
            #return(symbols)
    #return(symbols)

def blastquery(query_sequence):
    search_results = {}
    if len(query_sequence) > 0:
        tmp_file_link = tempfile.mkstemp()
        tmp_fasta = os.fdopen(tmp_file_link[0], 'w')
        tmp_fasta.write(query_sequence)
        tmp_fasta.close()
        subprocess.Popen(['/usr/bin/blast_bin/blastn',
                        '-db', os.path.join(os.environ['CONTENT_LOCATION'],
                                            'blast_db', 'genes.fasta'),
                        '-query', tmp_file_link[1],
                        '-out', tmp_file_link[1] + '.xml',
                        '-outfmt', '5',
                        '-task', 'blastn',
                        '-evalue', '1e-20']).communicate()
        test = open(tmp_file_link[1]).readline()
        tree = ET.parse(tmp_file_link[1] + '.xml')
        root = tree.getroot()
        for hit in root.iter('Hit'):
            hit_def = hit.find('Hit_def').text
            identity = [float(e.text) for e in hit.iter('Hsp_identity')][0]
            bit_score = [float(e.text) for e in hit.iter('Hsp_bit-score')][0]
            hsp_length = [float(e.text) for e in hit.iter('Hsp_align-len')][0]
            search_results[hit_def] = {'identity': identity,
                                    'bit_score': bit_score,
                                    'hsp_length': hsp_length}
    return(search_results)
