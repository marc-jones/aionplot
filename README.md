## Time series Docker instance

First, you have to build the flaskapp image with:

```
cd webapp_image/
docker build -t flaskapp .
```

Then set up the populator image with:

```
cd ../mongo_populator_image/
docker build -t populator .
```

Then, set up the stack with:

```
cd ..
docker swarm init
docker stack deploy -c docker-compose.yml flaskmongo
```

In order to populate the MongoDB database, one can run the populator image. Currently the container looks for a file called `key_value_pairs` in the `/data` directory, which we are able to mount when creating the container:

```
docker run -it --network=flaskmongo_webapp -v <path_to_data_on_local_machine>:/data populator
```

To update the server code:

```
cd webapp_image/ && docker build -t flaskapp . && cd .. && docker service update --force --image flaskapp flaskmongo_web
```

To update the test database:

```
docker run -it --network=flaskmongo_webapp -v /home/jonesd/Documents/order-data-files:/data populator
```
