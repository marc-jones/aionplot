from pymongo import MongoClient, UpdateOne
import os
import yaml
import sys
import time
import shutil
import subprocess

def check_validity_of_name(name):
    for invalid_name in ['BLAST Hits']:
        if name == invalid_name:
            sys.exit(invalid_name + ' is a reserved name')

print("Starting import")
dump_threshold = int(os.environ.get('POPULATOR_DUMP_THRESHOLD', 10000))
print("Dump threshold: {}".format(dump_threshold))

last_time = time.time()

search_terms_dict = {}
facet_dict = {}
flags_dict = {}
table_information_dict = {}

mungo_client = MongoClient(
    os.environ['MONGO_HOSTNAME'],
    27017,
    username=os.environ['MONGO_DBADMIN_USERNAME'],
    password=os.environ['MONGO_DBADMIN_PASSWORD'],
    authSource="time_series",
    connect=False
)

# Create the time series database
mungo_client.drop_database('time_series')
db = mungo_client['time_series']

# Create the measurements collection
measurements_collection = db['measurements']
search_terms_collection = db['search_terms']

time_series_data_path = os.path.join(os.environ['DATA_LOCATION'],
    'time_series_data.tsv')

flags_dict['timerange'] = [None, None]

if os.path.isfile(time_series_data_path):
    measurements_dict = {}
    required_headers = ['name', 'time', 'value', 'hi', 'lo']
    with open(time_series_data_path) as f:
        # Read header and check that the mandatory five fields are there
        headers = f.readline().strip().split('\t')
        assert(all([col_header in headers for col_header in required_headers]))
        facet_dict = {headers[idx]: set([]) for idx in range(len(headers))
            if not headers[idx] in required_headers}
        for line in f:
            line = line.strip().split('\t')
            record_name = line[headers.index('name')]
            measurements_dict.setdefault(record_name,
                {'name': record_name, 'measurements': []})
            measurement_dict = {headers[idx]: line[idx] for idx in
                range(len(line)) if not headers[idx] == 'name'}
            for float_name in ['time', 'value', 'hi', 'lo']:
                measurement_dict[float_name] = float(
                    measurement_dict[float_name])
            measurements_dict[record_name]['measurements'].append(
                measurement_dict)
            check_validity_of_name(record_name)
            search_terms_dict[record_name] = {'_id': record_name,
                'name': record_name, 'nicknames': [], 'term_type': 'direct',
                'tooltip': '', 'label_status': 'default'}
            for idx in [idx for idx in range(len(line))
                if not headers[idx] in required_headers]:
                facet_dict[headers[idx]].add(line[idx])
            if (flags_dict['timerange'][0] == None or
                measurement_dict['time'] <= flags_dict['timerange'][0]):
                flags_dict['timerange'][0] = measurement_dict['time']
            if (flags_dict['timerange'][1] == None or
                flags_dict['timerange'][1] <= measurement_dict['time']):
                flags_dict['timerange'][1] = measurement_dict['time']
            if len(measurements_dict) > dump_threshold:
                current_time = time.time()
                print('Beginning dump. Time since last dump: %s seconds' % (current_time - last_time))
                last_time = current_time
                measurements_collection.bulk_write([
                    UpdateOne({'_id': measurements_dict[name]['name']},
                        {'$push': {'measurements': {'$each':
                        measurements_dict[name]['measurements']}},
                        '$set': {'name': measurements_dict[name]['name']}},
                        upsert=True)
                    for name in measurements_dict])
                measurements_dict = {}
                current_time = time.time()
                print('Dumped! Time to dump: %s seconds' % (current_time - last_time))
                last_time = current_time
        current_time = time.time()
        print('Beginning dump. Time since last dump: %s seconds' % (current_time - last_time))
        last_time = current_time
        measurements_collection.bulk_write([
            UpdateOne({'_id': measurements_dict[name]['name']},
                {'$push': {'measurements': {'$each':
                measurements_dict[name]['measurements']}},
                '$set': {'name': measurements_dict[name]['name']}},
                upsert=True)
            for name in measurements_dict])
        measurements_dict = {}
else:
    sys.exit('Time series data does not exist')

record_data_path = os.path.join(os.environ['DATA_LOCATION'], 'record_details.tsv')
if os.path.isfile(record_data_path):
    with open(record_data_path) as f:
        headers = f.readline().strip().split('\t')
        assert('name' in headers)
        if 'groups' in headers:
            sys.exit('"groups" is a reserved column name, and cannot be used in record_details.tsv')
        for line in f:
            line = line.strip().split('\t')
            if not line[headers.index('name')] in search_terms_dict.keys():
                sys.exit(line[headers.index('name')] + ' in record_details.tsv does not exist in the time series data')
            if 'label_tooltip' in headers:
                search_terms_dict[line[headers.index('name')]]['tooltip'] = line[headers.index('label_tooltip')]
            else:
                search_terms_dict[line[headers.index('name')]]['tooltip'] = ''
            if 'label_colour' in headers:
                search_terms_dict[line[headers.index('name')]]['label_status'] = line[headers.index('label_colour')]
            else:
                search_terms_dict[line[headers.index('name')]]['label_status'] = 'default'
            if 'nicknames' in headers:
                search_terms_dict[line[headers.index('name')]]['nicknames'] = line[headers.index('nicknames')].split(',')
            else:
                search_terms_dict[line[headers.index('name')]]['nicknames'] = []
            table_information_dict.setdefault(line[headers.index('name')], {})
            for idx in range(len(headers)):
                table_information_dict[line[headers.index('name')]][headers[idx]] = line[idx]

# Create the search terms collection
for document in search_terms_dict.values():
    search_terms_collection.insert(document)
    search_terms_dict = {}

if os.path.isfile(record_data_path):
    measurements_collection.bulk_write([
        UpdateOne({'_id': key},
            {'$set': {'table_details': table_information_dict[key]}},
            upsert=True)
        for key in table_information_dict])
    table_information_dict = {}

last_time = time.time()
group_data_path = os.path.join(os.environ['DATA_LOCATION'], 'groups.tsv')
if os.path.isfile(group_data_path):
    with open(group_data_path) as f:
        headers = f.readline().strip().split('\t')
        assert('name' in headers and 'group' in headers)
        for line in f:
            line = line.strip().split('\t')
            check_validity_of_name(line[headers.index('group')])
            search_terms_dict.setdefault(line[headers.index('group')],
                {'name': line[headers.index('group')], 'nicknames': [],
                'term_type': 'indirect', 'records': []})
            temp_entry_dict = {'name': line[headers.index('name')]}
            if 'label_tooltip' in headers:
                temp_entry_dict['tooltip'] = line[headers.index('label_tooltip')]
            else:
                temp_entry_dict['tooltip'] = ''
            if 'label_colour' in headers:
                temp_entry_dict['label_status'] = line[headers.index('label_colour')]
            else:
                temp_entry_dict['label_status'] = 'default'
            if 'nicknames' in headers:
                search_terms_dict[line[headers.index('group')]]['nicknames'] = list(
                    set(line[headers.index('nicknames')].split(',')).union(
                    set(search_terms_dict[line[headers.index('group')]]['nicknames'])))
            search_terms_dict[line[headers.index('group')]]['records'].append(temp_entry_dict)
            # Table information dict
            table_information_dict.setdefault(line[headers.index('name')], {})
            table_information_dict[line[headers.index('name')]].setdefault(
                'groups', [])
            temp_table_entry_dict = {}
            for idx in range(len(headers)):
                if not headers[idx] == 'name':
                    temp_table_entry_dict[headers[idx]] = line[idx]
            table_information_dict[line[headers.index('name')]]['groups'].append(temp_table_entry_dict)
            if (len(search_terms_dict.keys()) +
                len(table_information_dict.keys())) > dump_threshold:
                current_time = time.time()
                print('Beginning search and table terms dump. Time since last dump: %s seconds' % (current_time - last_time))
                last_time = current_time
                search_terms_collection.bulk_write([
                    UpdateOne({'_id': search_terms_dict[name]['name']},
                        {'$push': {'records': {'$each':
                            search_terms_dict[name]['records']}},
                        '$set': {'name': search_terms_dict[name]['name'],
                            'nicknames': search_terms_dict[name]['nicknames'],
                            'term_type': search_terms_dict[name]['term_type']}},
                        upsert=True)
                    for name in search_terms_dict])
                search_terms_dict = {}
                measurements_collection.bulk_write([
                    UpdateOne({'_id': name},
                        {'$push': {'table_details.groups': {'$each':
                            table_information_dict[name]['groups']}}},
                        upsert=True)
                    for name in table_information_dict])
                table_information_dict = {}
                current_time = time.time()
                print('Dumped! Time to dump: %s seconds' %
                      (current_time - last_time))
                last_time = current_time
        current_time = time.time()
        print('Beginning search and table terms dump. Time since last dump: %s seconds' % (current_time - last_time))
        last_time = current_time
        search_terms_collection.bulk_write([
            UpdateOne({'_id': search_terms_dict[name]['name']},
                {'$push': {'records': {'$each':
                    search_terms_dict[name]['records']}},
                '$set': {'name': search_terms_dict[name]['name'],
                    'nicknames': search_terms_dict[name]['nicknames'],
                    'term_type': search_terms_dict[name]['term_type']}},
                upsert=True)
            for name in search_terms_dict])
        search_terms_dict = {}
        measurements_collection.bulk_write([
            UpdateOne({'_id': name},
                {'$push': {'table_details.groups': {'$each':
                    table_information_dict[name]['groups']}}},
                upsert=True)
            for name in table_information_dict])
        table_information_dict = {}
        current_time = time.time()
        print('Dumped! Time to dump: %s seconds' %
                (current_time - last_time))
        last_time = current_time

if os.path.isfile(record_data_path) or os.path.isfile(group_data_path):
    flags_dict['groups_available'] = True
else:
    flags_dict['groups_available'] = False

website_info_path = os.path.join(os.environ['DATA_LOCATION'],
    'website_information.yaml')
website_info_defaults = {
    'name': 'AionPlot',
    'short_name': 'AP',
    'x_axis_label': 'Time',
    'y_axis_label': 'Value'
}
if os.path.isfile(website_info_path):
    website_info_dict = yaml.load(open(website_info_path))
    for key in website_info_defaults.keys():
        if not key in website_info_dict.keys():
            website_info_dict[key] = website_info_defaults[key]
else:
    website_info_dict = website_info_defaults
    print('Website information does not exist')

for key in website_info_dict:
    flags_dict[key] = website_info_dict[key]

fasta_data_path = os.path.join(os.environ['DATA_LOCATION'],
    'genes.fasta')
blast_db_folder = os.path.join(os.environ['CONTENT_LOCATION'], 'blast_db')
if os.path.isfile(fasta_data_path):
    fasta_dict = {}
    with open(fasta_data_path) as fasta:
        current_record = ''
        for line in fasta:
            if line.startswith('>'):
                if len(fasta_dict) > dump_threshold:
                    measurements_collection.bulk_write([
                        UpdateOne({'_id': record_name},
                            {'$set': {'sequence': fasta_dict[record_name]}},
                            upsert=True)
                        for record_name in fasta_dict.keys()])
                    fasta_dict = {}
                current_record = line.strip().replace('>', '')
                fasta_dict[current_record] = ''
            else:
                fasta_dict[current_record] += line.strip()
    if not os.path.isdir(blast_db_folder):
        os.mkdir(blast_db_folder)
    shutil.copy(fasta_data_path, blast_db_folder)
    subprocess.call(['/usr/bin/blast_bin/makeblastdb',
                      '-in', os.path.join(blast_db_folder, 'genes.fasta'),
                      '-dbtype', 'nucl'])
    flags_dict['fasta_available'] = True
else:
    flags_dict['fasta_available'] = False
    print('FASTA file not found')

user_data_folder_path = os.path.join(os.environ['DATA_LOCATION'],
    'user_content')
if os.path.isdir(user_data_folder_path):
    user_content_folder_path = os.path.join(os.environ['CONTENT_LOCATION'],
        'user_content')
    # Wipe out pre-existing user data.
    if os.path.isdir(user_content_folder_path):
        shutil.rmtree(user_content_folder_path)
    shutil.copytree(user_data_folder_path, user_content_folder_path)
else:
    print('No user content, using defaults')

plot_regions_data_path = os.path.join(os.environ['DATA_LOCATION'],
    'plot_regions.tsv')
if os.path.isfile(plot_regions_data_path):
    flags_dict['regions'] = []
    required_headers = ['name', 'x_min', 'x_max', 'y_min', 'y_max', 'colour',
        'alpha']
    with open(plot_regions_data_path) as f:
        headers = f.readline().strip().split('\t')
        assert(all([col_header in headers for col_header in required_headers]))
        assert(all([col_header in facet_dict.keys() for col_header in headers
            if not col_header in required_headers]))
        for line in f:
            line = line.strip().split('\t')
            flags_dict['regions'].append({
                headers[idx]: line[idx] for idx in range(len(headers))})
else:
    print('No plot region data')

# Create the flags YAML
yaml_path = os.path.join(os.environ['CONTENT_LOCATION'], 'flags.yaml')
facet_dict = {name: list(facet_dict[name]) for name in facet_dict}
flags_dict['facets'] = facet_dict
yaml.dump(flags_dict, open(yaml_path, 'w'))

print('Database filling complete')
