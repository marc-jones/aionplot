from pymongo import MongoClient
import os

client = MongoClient(os.environ['MONGO_HOSTNAME'], 27017, connect=False)
db = client.tododb

data_path = os.path.join(os.environ['DATA_LOCATION'], 'key_value_pairs')

if os.path.isfile(data_path):
    with open(data_path) as f:
        for line in f:
            line = line.strip().split()
            item_doc = {
                'name': line[0],
                'description': line[1]
            }
            db.tododb.insert_one(item_doc)
else:
    print('Data file does not exist')
