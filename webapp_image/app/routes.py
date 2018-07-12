from flask import (Flask, url_for, request, render_template, jsonify, session,
    make_response, Markup, render_template_string)
from main import app, mungo_client
import re
import markdown

## imports required to allow the user to download the graph as a PDF
#import pdfkit

## imports required for blast search
#import subprocess
#import tempfile
#import os
#import xml.etree.ElementTree as ET

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
    for name in list_of_names:
        if not name in cached_names:
            db = mungo_client['time_series']
            measurements_collection = db['measurements']
            break
    records = []
    for name in list_of_names:
        if name in cached_names:
            records.append(cache[cached_names.index(name)])
        else:
            search_results = [
                res for res in measurements_collection.find({'name': name})]
            records += search_results
    for res in records:
        if '_id' in res.keys():
            del(res['_id'])
    session['most_recent_search'] = records
    return(records)

# Takes search terms and then returns the names associated with each search
# term, with some added information such as nicknames
def process_search_terms(search_terms):
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
                    'tooltip': '',
                    'label_status': 'default'}]
            }
    return(results_dict)

def get_facets():
    if 'facet_info' in session:
        facet_info = session['facet_info']
    else:
        db = mungo_client['time_series']
        facet_info = [res for res in db['facets'].find({})][0]
        del(facet_info['_id'])
        session['facet_info'] = facet_info
    return(facet_info)

@app.route('/')
def landing():
    with app.open_resource('static/content/landing.md') as f:
        content = Markup(markdown.markdown(unicode(f.read(), 'utf-8')))
    landingPage = render_template('Landing.html', content=content)
    with app.open_resource('static/content/about.md') as f:
        content = Markup(markdown.markdown(unicode(f.read(), 'utf-8')))
    aboutPage = render_template('About.html', content=content)
    with app.open_resource('static/content/howtouse.md') as f:
        content = Markup(markdown.markdown(unicode(f.read(), 'utf-8')))
    howToUsePage = render_template('HowToUse.html', content=content)
    searchPage = render_template('Search.html')
    blastPage = render_template('Blast.html')
    tablePage = render_template('Table.html')
    facets=get_facets()
    searchandplotjs = render_template('SearchAndPlot.js', facets=facets)
    return(render_template('Base.html',
                           landingPage=landingPage,
                           aboutPage=aboutPage,
                           howToUsePage=howToUsePage,
                           searchPage=searchPage,
                           blastPage=blastPage,
                           searchandplotjs=searchandplotjs,
                           tablePage=tablePage))

@app.route('/postsearch')
def postsearch():
    search_terms = request.args.get('term').split(',')
    checkbox_dict = process_search_terms(search_terms)
    query_sequence = request.args.get('sequence')
    blast_list = []
    return(jsonify(
        checkbox_html=render_template('Checkboxes.html',
            checkbox_dict=checkbox_dict),
        blast_alert_html=render_template('BlastAlert.html',
            blast_hits_int=len(blast_list), query_sequence=query_sequence)
    ))

@app.route('/postcheckboxchange')
def postcheckboxchange():
    names = request.args.get('names').split(',')
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
    return()
    #svg_string = request.form['svg']

    ## yet another joke!
    #svg_string = re.sub('<svg width="[0-9]+" height="[0-9]+">',
                        #'<svg width="800" height="800">', svg_string)

    #options = {'page-height': '200mm',
               #'page-width': '200mm',
               #'margin-top': '20mm'}

    #pdf = pdfkit.from_string(svg_string,
                             #False,
                             #css=app.static_folder + '/css/plots.css',
                             #options=options)

    #response = make_response(pdf)
    #response.headers['Content-Disposition'] = "attachment; filename=plot.pdf"
    #response.mimetype = 'application/pdf'
    #return response

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
    return()
    #db = mungo_client['darmor']
    #exp_collection = db['ts_data']
    #checked_genes = list(set(request.form['checked_genes_element'].split(',')))
    #search_results = []
    #for gene_name in checked_genes:
        #search_results += [res for res in exp_collection.find(
            #{
                #'gene': gene_name
            #}
        #)]
    #response_string = '\t'.join(['gene',
                                 #'variety',
                                 #'tissue',
                                 #'time',
                                 #'value',
                                 #'type']) + '\n'
    #for res in search_results:
        #for acc in ['tapidor', 'westar']:
            #for tis in ['leaf', 'apex']:
                #for measurement in res[acc][tis]:
                    #for val_type in ['fpkm', 'hi', 'lo']:
                        #response_string += '\t'.join(str(i) for i in
                                                     #[res['gene'],
                                                      #acc,
                                                      #tis,
                                                      #measurement['time'],
                                                      #measurement[val_type],
                                                      #val_type]) + '\n'
    #response = make_response(response_string)
    #response.headers['Content-Disposition'] = (
        #'attachment; filename=time_series_data.tsv')
    #return response

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

#def blastquery(query_sequence):
    #tmp_file_link = tempfile.mkstemp()
    #tmp_fasta = os.fdopen(tmp_file_link[0], 'w')
    #tmp_fasta.write(query_sequence)
    #tmp_fasta.close()
    #subprocess.Popen(['/var/www/html/brassica-app/blast_bin/blastn',
                      #'-db',
                      #'var/www/html/brassica-app/blast_db/merged_genes.fasta',
                      #'-query', tmp_file_link[1],
                      #'-out', tmp_file_link[1] + '.xml',
                      #'-outfmt', '5',
                      #'-task', 'blastn',
                      #'-evalue', '1e-20']).communicate()
    #test = open(tmp_file_link[1]).readline()
    #tree = ET.parse(tmp_file_link[1] + '.xml')
    #root = tree.getroot()
    #search_results = {}
    #for hit in root.iter('Hit'):
        #hit_def = hit.find('Hit_def').text
        #identity = [float(e.text) for e in hit.iter('Hsp_identity')][0]
        #bit_score = [float(e.text) for e in hit.iter('Hsp_bit-score')][0]
        #hsp_length = [float(e.text) for e in hit.iter('Hsp_align-len')][0]
        #search_results[hit_def] = {'identity': identity,
                                   #'bit_score': bit_score,
                                   #'hsp_length': hsp_length}
    #return(search_results)