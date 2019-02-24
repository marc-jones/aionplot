## Time series Docker instance

First, you have to build the flaskapp image with:

```
cd webapp_image/
docker build -t flaskapp .
cd ..
```

Then set up the populator image with:

```
cd mongo_populator_image/
docker build -t populator .
cd ..
```

Create the required directory structure:

```
mkdir -p ~/scratch/{content,mongo_data}
```

Then, set up the stack with:

```
docker swarm init
docker stack deploy -c docker-compose.yml flaskmongo
```

In order to populate the MongoDB database, one can run the populator image. Currently the container looks for a file called `key_value_pairs` in the `/data` directory, which we are able to mount when creating the container:

```
docker run -it --network=flaskmongo_webapp -v <path_to_data_on_local_machine>:/data -v <path_to_content_on_local_machine>:/content populator
```

To update the server code:

```
cd webapp_image/ && docker build -t flaskapp . && cd .. && docker service update --force --image flaskapp flaskmongo_web
```

Some useful commands while developing:

```
docker run -it --network=flaskmongo_webapp -v /home/jonesd/Documents/order-data-files:/data -v ~/scratch/content:/content populator

docker run -it --network=flaskmongo_webapp -v /home/jonesd/irwin_local/2018/2018_07_18_rna_seq/output:/data -v ~/scratch/content:/content populator

cd webapp_image/ && \
    docker build -t aionplot-flaskapp . && \
    docker tag aionplot-flaskapp dmarcjones/aionplot-flaskapp:dev && \
    docker push dmarcjones/aionplot-flaskapp:dev && \
    cd ../vm_provisioning/ && \
    ansible-playbook -i hosts playbook.yml --limit dev && \
    cd ..
```

To connect to the database:

```
docker exec -it flaskmongo_db.xxxxxxx bash

mongo

use time_series
db.measurements.find({})
```
