# AionPlot: A platform for disseminating and visualizing time series data

AionPlot was made to allow for time series data, regardless of the origin, to be
easily searched and visualized via a web interface.
All you need to provide AionPlot is your time series data, and you can create
a web server to allow your data to be shared with the community.
Although there are particular features which are tailored towards the use of
AionPlot for displaying gene expression data (such as being able to query the
database using a BLAST search), any time series data can be plotted with
AionPlot if supplied in the correct format.

## Input file format

TODO

## Initialization

Please consult the file `vm_provisioning/README.md` for a detailed guide on how
to set up both a local, development version and a production version of
AionPlot.
A local version is great for quickly searching and visualizing private datasets,
whereas a public instance of AionPlot allows you to disseminate your dataset to
others in the community.

## Useful development commands

### Rebuild Docker images and push to the development VM

The following commands were useful while developing the system, to update the
Docker images and push them to the development VM.
Although they won't work for the average user, if you've forked the project,
they will be of use.
To make them work, however, you will have to change the references to my
DockerHub ID (`dmarcjones`) to your own.
Of note, both commands rely on `AIONPLOT_FLASKAPP_IMAGE` and
`AIONPLOT_POPULATOR_IMAGE` being set to the same dev images you're pushing to
DockerHub.

```
# Update the dev image of the web server and apply it to the development VM

cd webapp_image/ && \
    docker build -t aionplot-flaskapp . && \
    docker tag aionplot-flaskapp dmarcjones/aionplot-flaskapp:dev && \
    docker push dmarcjones/aionplot-flaskapp:dev && \
    cd ../vm_provisioning/ && \
    ansible-playbook -i hosts playbook.yml --limit dev && \
    cd ..

# Update the dev image of the populator and run it on the development VM

cd mongo_populator_image/ && \
    docker build -t aionplot-populator . && \
    docker tag aionplot-populator dmarcjones/aionplot-populator:dev && \
    docker push dmarcjones/aionplot-populator:dev && \
    cd ../vm_provisioning/ && \
    ansible-playbook -i hosts populator-playbook.yml --limit dev && \
    cd ..

```

### Connecting to the database

To connect to the database, you will first have to use `ssh` to connect to the
server.
If you want to connect to the development server, use:

```
vagrant ssh
```

Once in the server, run:

```
sudo docker container ls
```

This will display two running containers, the Flask app and the MongoDB
database. Note the container ID of the MongoDB container, and run:

```
docker exec -it <mongo-container-id> bash
```

This will open up a new command line prompt.
Running the following command using your variables set in the `vars.yml` file
will initialize an interactive Mongo session.

```
mongo -u <MONGO_WEBAPP_USERNAME> -p <MONGO_WEBAPP_PASSWORD>
```

This will let you query the database directly, for example, to list all entries
in the database (not recommended with big datasets!) run:

```
use time_series
db.measurements.find({})
```
