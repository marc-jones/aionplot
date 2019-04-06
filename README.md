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

It's possible to set up both a local, development version and a production
version of AionPlot.
A local version is great for quickly searching and visualizing private datasets,
whereas a production instance of AionPlot allows you to disseminate your dataset
to others in the community.

### Requirements

These instructions require that you have [Ansible](https://www.ansible.com/)
installed and that you have setup password-less SSH into your CentOS 7
production server using SSH keys.

### Configure input variables

```
cp vars-template.yml vars.yml
```

Change at least the variables listed below.

```
WEBAPP_SECRET: change_me
MONGO_INITDB_ROOT_PASSWORD: change_me
MONGO_WEBAPP_PASSWORD: change_me
MONGO_DBADMIN_PASSWORD: change_me
LOCAL_DATA_DIR: ~/Documents/time-series-data-files
```

### Add the production server to be configured to a ``hosts`` file

```
cp hosts-template hosts
```

### Optional: build and use your own Docker webapp image

If you have made custom changes to the webapp code or simply want to be in
charge of the image that you deploy to your system you can do that by building
and pushing your own image to [DockerHub](https://docs.docker.com/docker-hub/).

```
cd webapp_image
docker build -t <hub-user>/aionplot-flaskapp:<tag> .
docker push <hub-user>/aionplot-flaskapp:<tag>
```

To make use of this image you then need to update `AIONPLOT_FLASKAPP_IMAGE`
variable in the `vars.yml` file.

```
AIONPLOT_FLASKAPP_IMAGE: <hub-user>/aionplot-flaskapp:<tag>
```

### Optional: open up additional ports

Depending on your monitoring and logging you may want to open up additional
ports. This can be achieved by listing them in the `FIREWALLD_ALLOWED_PORTS`
variable in the `vars.yml` file. For example to open up port 9100 to make the
Prometheus node_exporter metrics available one would use the line below.

```
FIREWALLD_ALLOWED_PORTS: ["9100/tcp"]
```

### Setting up a local development environment

The local development server will be a virtual machine (VM) hosting the
website. We will use [Vagrant](https://www.vagrantup.com/) to set up the VM.
Once it's installed, change your working directory to the `vm_provisioning`
folder and run:

```
vagrant up
```

### Configure the hosts

```
cp hosts-template hosts
```

The default VM in the `dev` host group has been configured to work with the
Vagrant virtual machine.

### Ensure that the development VM is responsive

```
ansible -m ping -i hosts dev
```

### Configure input variables

```
cp vars-template.yml vars.yml
```

The default values are reasonable for a development server, but you may want to
change the passwords.

### Provision the virtual machines using Ansible

```
ansible-playbook -i hosts playbook.yml --limit dev
```

If you see an error message along the lines of:

```
Error: Package: 3:docker-ce-18.09.3-3.el7.x86_64 (dockerrepo)
           Requires: container-selinux >= 2.9
```

it means that your CentOS 7 machine has not been configured to be able to find
the `container-selinux` package required to install Docker. Instructions on
how to install this manually can be found in this Stackoverflow comment
https://stackoverflow.com/a/46209054.  Below is a sample command to run.

```
yum install -y http://mirror.centos.org/centos/7/extras/x86_64/Packages/container-selinux-2.74-1.el7.noarch.rpm
```

### Populate the Mongo database

To populate the database with your own data, on both the production and
development server, make sure that the `LOCAL_DATA_DIR` variable in the
`vars.yml` file points towards the folder containing your data files and run:

```
ansible-playbook -i hosts populator-playbook.yml
```

Or use this command to just populate the development server:

```
ansible-playbook -i hosts populator-playbook.yml --limit dev
```

### Optional: build and use your own Docker populator image

If you have made custom changes to the database populator code, or simply want
to be in charge of the image that you deploy to your system, you can do that by
building and pushing your own image to
[DockerHub](https://docs.docker.com/docker-hub/).

```
cd mongo_populator_image
docker build -t <hub-user>/aionplot-populator:<tag> .
docker push <hub-user>/aionplot-populator:<tag>
```

To make use of this image you then need to update `AIONPLOT_POPULATOR_IMAGE`
variable in the `vars.yml` file.

```
AIONPLOT_POPULATOR_IMAGE: <hub-user>/aionplot-populator:<tag>
```

## Useful development commands

### Rebuild Docker images and push to the development VM

The following commands were useful while developing the system, to update the
Docker images and apply them to the development VM.
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
