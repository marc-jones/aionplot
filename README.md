# AionPlot: A platform for disseminating and visualizing time series data

AionPlot was made to allow for time series data, regardless of the origin, to be easily searched and visualized via a web interface.
All you need to provide AionPlot is your time series data, and you can create a web server to allow your data to be shared with the community.
Although there are particular features which are tailored towards the use of AionPlot for displaying gene expression data (such as being able to query the database using a BLAST search), any time series data can be plotted with AionPlot if supplied in the correct format.

## Initialization

It's possible to set up both a local, development version and a production version of AionPlot.
A local version is great for quickly searching and visualizing private datasets, whereas a production instance of AionPlot allows you to disseminate your dataset to others in the community.

### Requirements

These instructions require that you have [Ansible](https://www.ansible.com/) installed and that you have setup password-less SSH into your CentOS 7 production server using SSH keys.

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

If you have made custom changes to the webapp code or simply want to be in charge of the image that you deploy to your system you can do that by building and pushing your own image to [DockerHub](https://docs.docker.com/docker-hub/).

```
cd webapp_image
docker build -t <hub-user>/aionplot-flaskapp:<tag> .
docker push <hub-user>/aionplot-flaskapp:<tag>
```

To make use of this image you then need to update `AIONPLOT_FLASKAPP_IMAGE` variable in the `vars.yml` file.

```
AIONPLOT_FLASKAPP_IMAGE: <hub-user>/aionplot-flaskapp:<tag>
```

### Optional: open up additional ports

Depending on your monitoring and logging you may want to open up additional ports.
This can be achieved by listing them in the `FIREWALLD_ALLOWED_PORTS` variable in the `vars.yml` file.
For example to open up port 9100 to make the Prometheus node_exporter metrics available one would use the line below.

```
FIREWALLD_ALLOWED_PORTS: ["9100/tcp"]
```

### Setting up a local development environment

The local development server will be a virtual machine (VM) hosting the website.
We will use [Vagrant](https://www.vagrantup.com/) to set up the VM.
Once it's installed, change your working directory to the `vm_provisioning` folder and run:

```
vagrant up
```

### Configure the hosts

```
cp hosts-template hosts
```

The default VM in the `dev` host group has been configured to work with the Vagrant virtual machine.

### Ensure that the development VM is responsive

```
ansible -m ping -i hosts dev
```

### Configure input variables

```
cp vars-template.yml vars.yml
```

The default values are reasonable for a development server, but you may want to change the passwords.

### Provision the virtual machines using Ansible

```
ansible-playbook -i hosts playbook.yml --limit dev
```

If you see an error message along the lines of:

```
Error: Package: 3:docker-ce-18.09.3-3.el7.x86_64 (dockerrepo)
           Requires: container-selinux >= 2.9
```

it means that your CentOS 7 machine has not been configured to be able to find the `container-selinux` package required to install Docker.
Instructions on how to install this manually can be found in this [Stackoverflow comment](https://stackoverflow.com/a/46209054).
Below is a sample command to run.

```
yum install -y http://mirror.centos.org/centos/7/extras/x86_64/Packages/container-selinux-2.74-1.el7.noarch.rpm
```

### Populate the Mongo database

To populate the database with your own data, on both the production and development server, make sure that the `LOCAL_DATA_DIR` variable in the `vars.yml` file points towards the folder containing your data files and run:

```
ansible-playbook -i hosts populator-playbook.yml
```

Or use this command to just populate the development server:

```
ansible-playbook -i hosts populator-playbook.yml --limit dev
```

### Optional: build and use your own Docker populator image

If you have made custom changes to the database populator code, or simply want to be in charge of the image that you deploy to your system, you can do that by building and pushing your own image to [DockerHub](https://docs.docker.com/docker-hub/).

```
cd mongo_populator_image
docker build -t <hub-user>/aionplot-populator:<tag> .
docker push <hub-user>/aionplot-populator:<tag>
```

To make use of this image you then need to update `AIONPLOT_POPULATOR_IMAGE` variable in the `vars.yml` file.

```
AIONPLOT_POPULATOR_IMAGE: <hub-user>/aionplot-populator:<tag>
```

## Input file format

All input files should be put into a single folder, which you then point the `LOCAL_DATA_DIR` variable in the `vars.yml` file towards.
The files should be named as followed, and conform to the same formatting:

### `time_series_data.tsv` - Essential

This contains the actual time series data, and is the only essential file. At a minimum, this file should contain the following tab separated columns:

```
name	time	value	hi	lo
```

- `name`: The name of the record (e.g. a gene name).
- `time`: The time value.
- `value`: The measurement taken at this time (e.g. gene expression level).
- `hi`: Required to allow error bars to be plotted, the upper bound of the measurement.
- `lo`: Required to allow error bars to be plotted, the lower bound of the measurement.

Any other columns present in this will be treated as facets to separate the data.
For example, if you have different treatments you wish to compare from different cell lines, you may organise the data using the following columns:

```
name	time	value	hi	lo	Cell Line	Treatment
gene1	22	64.7015	84.7443	44.6587	cell_line_1	Control
gene1	22	70.8761	92.8078	48.9445	cell_line_1	Treatment_1
...
```

### `record_details.tsv` - Optional

This contains information further information about the records, and can be used to style how the records appear on the website.
At a minimum, this file should contain a single column:

```
name
```

- `name`: The name of the record (e.g. a gene name)

However, such a file is not terribly useful!
Optional, reserved column names are:

```
label_tooltip	label_colour	nicknames
```

- `label_tooltip`: The label to display above the record name when the user hovers over the record's button or legend
- `label_colour`: The colour of the record's button in the user interface. This uses the notation of [Bootstrap modifier classes](https://getbootstrap.com/docs/3.4/components/#available-variations), and should be either `default`, `primary`, `success`, `info`, `warning` or `danger`.
- `nicknames`: Alternative names for the record, which the user may use to query the database. Multiple names can be delineated with commas.

Any other columns present in this file will be incorporated into the database and displayed in the Table tab.
It should be noted that none of these additional columns may be called `groups` as that is a system reserved column name.

All record names included in `record_details.tsv` should also be present in `time_series_data.tsv`.

### `groups.tsv` - Optional

This file defines groups of records, and may also be used to provide additional information on those groups.
At a minimum the file should contain the following two tab separated columns:

```
name	group
```

- `name`: The name of the record (e.g. a gene name).
- `group`: The name of the group.

Optional, reserved column names are:

```
label_tooltip	label_colour	nicknames
```

- `label_tooltip`: The label to display above the record name when the user hovers over the record's button or legend
- `label_colour`: The colour of the record's button in the user interface. This uses the notation of [Bootstrap modifier classes](https://getbootstrap.com/docs/3.4/components/#available-variations), and should be either `default`, `primary`, `success`, `info`, `warning` or `danger`.
- `nicknames`: Alternative names for the record, which the user may use to query the database. Multiple names can be delineated with commas.

These optional column names will only apply to the record when the button is displayed as part of the group, and not otherwise.

Any other columns present in this file will be incorporated into the database and displayed in the Table tab when the group is selected.

Groups can be called anything except "BLAST Hits" which is a reserved system name.

### `plot_regions.tsv` - Optional

This file allows you to define rectangular regions to be displayed on the plots.
This file must contain (`7 + x`) columns, where `x` is the number of named facets:

```
name	x_min	x_max	y_min	y_max	colour	alpha	facet_1	facet_2	...
```

- `name`: The name of the region, which will appear in the plot legend.
- `x_min`: The value at which the region starts on the x axis.
- `x_max`: The value at which the region ends on the x axis.
- `y_min`: The value at which the region starts on the y axis.
- `y_may`: The value at which the region ends on the y axis.
- `colour`: The hex RGB value (e.g. 9EBCF0) of the colour used to plot the region.
- `alpha`: A floating point number, between 0.0 and 1.0, indicating the transparency of the region (1.0 being opaque).
- `facet_x`: These facet names should correspond to the additional column names included in `time_series_data.tsv`. All facet names need to be included.

If you wish the region to scale to fit the plot, you may set `x_min`, `x_max`, `y_min`, and `y_max` to either `min` or `max`.
For example, to highlight a period of time, with the region expanding to fill the y axis, set `y_min` to `min` and `y_max` to `max`.

### `genes.fasta` - Optional

This allows you to define DNA sequence information for the records. This obviously only makes sense when your records represent genes, and should be ignored otherwise. The file should follow the FASTA standard for DNA sequences. If this file is provided, the sequences of genes will be available to download by users and they will be able to query the database using BLAST sequence searches.

### `website_information.yaml` - Optional

This file allows you to customise how the website appears. The file should be in YAML format, for example:

```
name: "ORDER: Oilseed Rape Developmental Expression Resource"
short_name: "ORDER"
x_axis_label: "Time (days)"
y_axis_label: "Cufflinks FPKM"
```

- `name`: The name of the resource you wish to make available.
- `short_name`: When accessed on mobile, this will be the name displayed to the user. This should therefore be a short (< 8) acronym or nickname for the website.
- `x_axis_label`: A label for the x axis in the plot.
- `y_axis_label`: A label for the y axis in the plot.

### `website_content` - Optional

This is a folder, containing files that will allow you to further customise the look and content of the website.
None of the files are mandatory, so if you do not include them AionPlot defaults will be used. Three of the files should be written in markdown or HTML format:

- `landing.md` - The landing page is the first page the user will see, so should explain what the resource is.
- `about.md` - The About page should provide additional, detailed information on the dataset being presented.
- `howtouse.md` - The How To Use page should explain to the user how to use the resource, such what format searches should take and what the colouration of record buttons, if any, corresponds to.

If you wish to include images or additional downloads in these pages, you can do. Place the images or additional files in the `website_content` folder, then in your markdown or HTML code, link to the file using the following format:

`{{ url_for('website_content', filename='name_of_file.replace_this') }}`

In addition, a favicon icon can be included in this folder which will be used by AionPlot.

## Useful development commands

### Rebuild Docker images and push to the development VM

The following commands were useful while developing the system, to update the Docker images and apply them to the development VM.
Although they won't work for the average user, if you've forked the project, they will be of use.
To make them work, however, you will have to change the references to my DockerHub ID (`dmarcjones`) to your own.
Of note, both commands rely on `AIONPLOT_FLASKAPP_IMAGE` and `AIONPLOT_POPULATOR_IMAGE` being set to the same dev images you're pushing to DockerHub.

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

To connect to the database, you will first have to use `ssh` to connect to the server.
If you want to connect to the development server, use:

```
vagrant ssh
```

Once in the server, run:

```
sudo docker container ls
```

This will display two running containers, the Flask app and the MongoDB database.
Note the container ID of the MongoDB container, and run:

```
docker exec -it <mongo-container-id> bash
```

This will open up a new command line prompt.
Running the following command using your variables set in the `vars.yml` file will initialize an interactive Mongo session.

```
mongo -u <MONGO_WEBAPP_USERNAME> -p <MONGO_WEBAPP_PASSWORD>
```

This will let you query the database directly, for example, to list all entries in the database (not recommended with big datasets!) run:

```
use time_series
db.measurements.find({})
```
