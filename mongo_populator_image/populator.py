from pymongo import MongoClient
import os
import yaml
import sys
import time
import shutil

dump_threshold = 10000

last_time = time.time()

measurements_dict = {}
search_terms_dict = {}
facet_dict = {}
flags_dict = {}

mungo_client = MongoClient(os.environ['MONGO_HOSTNAME'], 27017, connect=False)

# Create the time series database
mungo_client.drop_database('time_series')
db = mungo_client['time_series']

# Create the measurements collection
measurements_collection = db['measurements']

time_series_data_path = os.path.join(os.environ['DATA_LOCATION'],
    'time_series_data.tsv')

flags_dict['timerange'] = [None, None]

name_set = set([])
if os.path.isfile(time_series_data_path):
    with open(time_series_data_path) as f:
        headers = f.readline().strip().split('\t')
        assert(headers[0:5]==['name', 'time', 'value', 'hi', 'lo'])
        for line in f:
            line = line.strip().split('\t')
            name_set.add(line[0])

if os.path.isfile(time_series_data_path):
    with open(time_series_data_path) as f:
        # Read header and check that the mandatory five fields are there
        headers = f.readline().strip().split('\t')
        assert(headers[0:5]==['name', 'time', 'value', 'hi', 'lo'])
        facet_dict = {headers[idx]: set([]) for idx in range(5, len(headers))}
        current_number = 0
        for current_name in list(name_set):
            current_number += 1
            for line in f:
                line = line.strip().split('\t')
                if line[0] == current_name:
                    measurements_dict.setdefault(line[0],
                        {'name': line[0], 'measurements': []})
                    measurement_dict = {headers[idx]: line[idx] for idx in
                        range(1, len(line))}
                    for float_name in headers[1:5]:
                        measurement_dict[float_name] = float(
                            measurement_dict[float_name])
                    measurements_dict[line[0]]['measurements'].append(
                        measurement_dict)
                    search_terms_dict[line[0]] = {'name': line[0], 'nicknames': [],
                        'term_type': 'direct'}
                    for idx in range(5, len(line)):
                        facet_dict[headers[idx]].add(line[idx])
                    if (flags_dict['timerange'][0] == None or
                        measurement_dict['time'] <= flags_dict['timerange'][0]):
                        flags_dict['timerange'][0] = measurement_dict['time']
                    if (flags_dict['timerange'][1] == None or
                        flags_dict['timerange'][1] <= measurement_dict['time']):
                        flags_dict['timerange'][1] = measurement_dict['time']
            measurements_collection.insert(
                {
                    'name': measurements_dict[current_name]['name'],
                    'measurements': measurements_dict[current_name]['measurements']
                })
            print(current_name)
            print(float(current_number) / len(name_set))
            measurements_dict = {}
else:
    sys.exit('Time series data does not exist')


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
if os.path.isfile(fasta_data_path):
    flags_dict['fasta_available'] = True
else:
    flags_dict['fasta_available'] = False
    print('FASTA file not found')

groups_data_path = os.path.join(os.environ['DATA_LOCATION'], 'groups.tsv')
if os.path.isfile(groups_data_path):
    flags_dict['groups_available'] = True
else:
    flags_dict['groups_available'] = False
    print('Groups file not found')


user_content_folder_path = os.path.join(os.environ['DATA_LOCATION'],
    'user_content')
if os.path.isdir(user_content_folder_path):
    shutil.copytree(user_content_folder_path,
        os.path.join(os.environ['CONTENT_LOCATION'], 'user_content'))
else:
    print('No user content, using defaults')

# Create the search terms collection
search_terms_collection = db['search_terms']
for document in search_terms_dict.values():
    search_terms_collection.insert(document)

# Create the flags YAML
yaml_path = os.path.join(os.environ['CONTENT_LOCATION'], 'flags.yaml')
facet_dict = {name: list(facet_dict[name]) for name in facet_dict}
flags_dict['facets'] = facet_dict
yaml.dump(flags_dict, open(yaml_path, 'w'))

print('Database filling complete')
