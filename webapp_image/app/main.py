import os
from flask import Flask
from pymongo import MongoClient
import logging, sys

app = Flask(__name__)

mungo_client = MongoClient(os.environ['MONGO_HOSTNAME'], 27017,
    connect=False)

from routes import *

logging.basicConfig(stream=sys.stderr)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
