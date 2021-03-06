import os
from flask import Flask
from pymongo import MongoClient
import logging, sys
from flask_compress import Compress

app = Flask(__name__)
Compress(app)

app.secret_key = os.environ['WEBAPP_SECRET']

mungo_client = MongoClient(
    os.environ['MONGO_HOSTNAME'],
    27017,
    username=os.environ['MONGO_WEBAPP_USERNAME'],
    password=os.environ['MONGO_WEBAPP_PASSWORD'],
    authSource="time_series",
    connect=False
)

from routes import *

logging.basicConfig(stream=sys.stderr)
