# Commands for provisioning the virtual machine to run web server in Docker

## Installing a production system

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

### Optional: build and use your own docker webapp image

If you have made custom changes to the webapp code or simply want to be in
charge or the image that you deploy to your system you can do that by building
and pushing your own image to [DockerHub](https://docs.docker.com/docker-hub/).

```
cd webapp_image
docker build -t <hub-user>/aionplot-flaskapp:<tag> .
docker push <hub-user>/aionplot-flaskapp:<tag>
```

To make use of this image you then need to update ``AIONPLOT_FLASKAPP_IMAGE``
variable in the ``vars.yml`` file.

```
AIONPLOT_FLASKAPP_IMAGE: <hub-user>/aionplot-flaskapp:<tag>
```

### Optional: open up additional ports

Depending on your monitoring and logging you may want to open up additional
ports. This can be achieved by listing them in the ``FIREWALLD_ALLOWED_PORTS``
variable in the ``vars.yml`` file. For example to open up port 9100 to make the
Prometheus node_exporter metrics available one would use the line below.

```
FIREWALLD_ALLOWED_PORTS: ["9100/tcp"]
```


## Setting up a local development environment

```
vagrant up
```

### Configure the hosts

```
cp hosts-template hosts
```

The default VM in the ``dev`` host group has been configured to work with the
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

### Populate the Mongo database

```
ansible-playbook -i hosts populator-playbook.yml --limit dev
```
