from pymongo import MongoClient
import os

measurements_dict = {}
search_terms_dict = {}
facet_dict = {}

time_series_data_path = os.path.join(os.environ['DATA_LOCATION'],
    'time_series_data.tsv')

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
            measurements_dict[line[0]]['measurements'].append(
                {headers[idx]: line[idx] for idx in range(1, len(line))})
            search_terms_dict[line[0]] = {'name': line[0], 'nicknames': [],
                'term_type': 'direct'}
            for idx in range(5, len(line)):
                facet_dict[headers[idx]].add(line[idx])
else:
    print('Time series data does not exist')

mungo_client = MongoClient(os.environ['MONGO_HOSTNAME'], 27017, connect=False)

# Create the time series database
mungo_client.drop_database('time_series')
db = mungo_client['time_series']

# Create the measurements collection
measurements_collection = db['measurements']
for document in measurements_dict.values():
    measurements_collection.insert(document)

# Create the search terms collection
search_terms_collection = db['search_terms']
for document in search_terms_dict.values():
    search_terms_collection.insert(document)

# Create the facets collection
facets_collection = db['facets']
facet_dict = {name: list(facet_dict[name]) for name in facet_dict}
facets_collection.insert(facet_dict)

print('Database filling complete')
