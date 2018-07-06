## Time series Docker instance

First, you have to build the flaskapp image with:

```
docker build -t flaskapp .
```

Then, set up the stack with:

```
docker swarm init

docker stack deploy -c docker-compose.yml flaskmongo
```

In order to access the MongoDB database, for example, to fill it, you can create a container and attach it to the running stack with:

```
docker run -it --network=flaskmongo_webapp flaskapp
```

This will open an interactive Python session. To access the MongoDB database, one can run:

```python
from pymongo import MongoClient
client = MongoClient('db')
```
