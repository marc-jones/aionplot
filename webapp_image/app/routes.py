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
    searchScripts = render_template('SearchScripts.js')
    return(render_template('Base.html',
                           landingPage=landingPage,
                           aboutPage=aboutPage,
                           howToUsePage=howToUsePage,
                           searchPage=searchPage,
                           blastPage=blastPage,
                           searchScripts=searchScripts,
                           tablePage=tablePage))

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

@app.route('/returntranscriptcheckboxes')
def returntranscriptcheckboxes():
    return()
    #agi_codes = request.args.get('term').split(',')
    #db = mungo_client['darmor']
    #exp_collection = db['ts_data']

    ## potentially reduce the calls to the database by checking to see if they
    ## have previously downloaded the data and have it in a cookie

    #search_list = []
    #checkbox_dict = {}
    #if not agi_codes == ['']:
        #for agi in agi_codes:
            #search_results = [res for res in exp_collection.find(
                                                #{
                                                    #'homology': {
                                                        #'$elemMatch': {
                                                            #'agi': agi
                                                        #}
                                                    #}
                                                #})]
            #search_list += search_results
            #checkbox_dict[agi] = [
                #{
                    #'gene': res['gene'],
                    #'chromosome': res['chromosome'],
                    #'symbolString':
                        #returnArabidopsisSymbols(agi, res['homology']),
                    #'classLabel':
                        #returnBrassicaGeneLabelType(agi,
                                                    #res['homology'][0]['agi'])
                #} for res in search_results]

    #query_sequence = request.args.get('sequence')
    #blast_list = []
    #if not query_sequence == '':
        #blast_results = blastquery(query_sequence)
        #if len(blast_results) > 0:
            #for gene_name in blast_results.keys():
                #search_results = [res for res in
                    #exp_collection.find({'gene': gene_name})]
                #search_list += search_results
                #blast_list += [
                    #{
                        #'gene': res['gene'],
                        #'chromosome': res['chromosome']
                    #} for res in search_results]

    ## strip the _id value as it isn't serializable
    #for res in search_list:
        #if '_id' in res.keys():
            #del(res['_id'])

    ## I tried adding search results to the cache if they weren't already there
    ## to get around the problem of users having multiple instances open.
    ## however for some reason the cache wasn't being updated. I've decided that
    ## it's probably a bad idea anyway, as it could result in the cache getting
    ## huge. the implemented method should minimise the calls to the database.
    ## the exception is if a user has multiple instances of the app open and
    ## keeps switching between them
    #session['most_recent_search'] = search_list

    #return(jsonify(checkbox_html=render_template('Checkboxes.html',
        #checkbox_dict=checkbox_dict, blast_list=blast_list),
        #blast_result_summary_html=render_template('BlastResults.html',
        #blast_hits_int=len(blast_list), query_sequence=query_sequence)))

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

@app.route('/returnexpressiondata')
def returnexpressiondata():
    return()
    #gene_names = request.args.get('term').split(',')

    #if 'most_recent_search' in session:
        #current_cache = session['most_recent_search']
        #currently_cached_genes = [res['gene'] for res in current_cache]
    #else:
        #currently_cached_genes = []

    ## only open the connection to the databse if one of the genes isn't in the
    ## cache. usually this won't be the case, but if the user has more than one
    ## instance of the app open, then it will be a problem. This is also
    ## necessary if the user has turned off cookies
    #for gene in gene_names:
        #if not gene in currently_cached_genes:
            #db = mungo_client['darmor']
            #exp_collection = db['ts_data']
            #break

    #selected_genes = []

    #for gene in gene_names:
        #if gene in currently_cached_genes:
            #selected_genes.append(
                #current_cache[currently_cached_genes.index(gene)])
        #else:
            #search_results = [
                #res for res in exp_collection.find({'gene': gene})]
            #selected_genes += search_results

    #for res in selected_genes:
        #if '_id' in res.keys():
            #del(res['_id'])

    #return(jsonify(selected_genes=selected_genes))


@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    return()
    #value = request.args.get('term')
    #db = mungo_client['darmor']
    #agi_collection = db['agi_codes']

    #regx = re.compile('^' + value, re.IGNORECASE)

    #search_results = [{'agi': res['agi'], 'symbols': res['symbols']}
                      #for res in agi_collection.find(
                          #{
                              #'$or': [
                                  #{
                                      #'agi': regx
                                  #},
                                  #{
                                      #'symbols': {
                                          #'$in': [regx]
                                      #}
                                  #}
                               #]
                          #}).limit(20)]

    #return(jsonify(json_list=search_results))

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
