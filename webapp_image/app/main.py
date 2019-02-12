import os
from flask import Flask
from pymongo import MongoClient
import logging, sys

app = Flask(__name__)

app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

mungo_client = MongoClient(
    os.environ['MONGO_HOSTNAME'],
    27017,
    username=os.environ['MONGO_WEBAPP_USERNAME'],
    password=os.environ['MONGO_WEBAPP_PASSWORD'],
    connect=False
)

from routes import *

logging.basicConfig(stream=sys.stderr)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
