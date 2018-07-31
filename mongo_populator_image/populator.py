from pymongo import MongoClient
import os
import yaml
import sys
import time

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

flags_dict['timerange'] = [0.0, 0.0]

if os.path.isfile(time_series_data_path):
    with open(time_series_data_path) as f:
        # Read header and check that the mandatory five fields are there
        headers = f.readline().strip().split('\t')
        assert(headers[0:5]==['name', 'time', 'value', 'hi', 'lo'])
        facet_dict = {headers[idx]: set([]) for idx in range(5, len(headers))}
        for line in f:
            line = line.strip().split('\t')
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
            if measurement_dict['time'] <= flags_dict['timerange'][0]:
                flags_dict['timerange'][0] = measurement_dict['time']
            if flags_dict['timerange'][1] <= measurement_dict['time']:
                flags_dict['timerange'][1] = measurement_dict['time']
            if len(measurements_dict) > dump_threshold:
                current_time = time.time()
                print('Beginning dump. Time since last dump: %s seconds' % (current_time - last_time))
                last_time = current_time
                for name in measurements_dict:
                    measurements_collection.update(
                        {'name': measurements_dict[name]['name']},
                        {'$push': {'measurements': {'$each': measurements_dict[name]['measurements']}}},
                        True)
                measurements_dict = {}
                current_time = time.time()
                print('Dumped! Time to dump: %s seconds' % (current_time - last_time))
                last_time = current_time
else:
    print('Time series data does not exist')

# Create the search terms collection
search_terms_collection = db['search_terms']
for document in search_terms_dict.values():
    search_terms_collection.insert(document)

# Create the flags YAML
yaml_path = os.path.join(os.environ['YAML_LOCATION'], 'flags.yaml')
facet_dict = {name: list(facet_dict[name]) for name in facet_dict}
flags_dict['facets'] = facet_dict
yaml.dump(flags_dict, open(yaml_path, 'w'))

print('Database filling complete')
