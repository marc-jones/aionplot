FROM python:2.7.16-jessie
RUN apt-get update && apt-get install -y wkhtmltopdf xvfb fonts-texgyre

# Install Blast.
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.4.0/ncbi-blast-2.4.0+-x64-linux.tar.gz &&  \
    tar -xzf ncbi-blast-2.4.0+-x64-linux.tar.gz &&  \
    mv ncbi-blast-2.4.0+/bin /usr/bin/blast_bin &&  \
    rm -rf ncbi-blast-2.4.0+ 

# Setup virtualx environment.
COPY wkhtmltopdf.sh /usr/bin/wkhtmltopdf.sh
RUN chmod a+x /usr/bin/wkhtmltopdf.sh &&  \
    ln -s /usr/bin/wkhtmltopdf.sh /usr/local/bin/wkhtmltopdf

# Create a webapp user.
RUN adduser --disabled-password --gecos '' webapp
WORKDIR /home/webapp

# Install the Python dependencies.
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Install script for launching gunicorn.
COPY boot.sh boot.sh
RUN chmod a+x boot.sh

# Copy the webapp code.
COPY app app
RUN cat ./app/templates/SearchAndPlot/*.js > ./app/templates/SearchAndPlot.js

# Fix the privileges and set the user.
RUN chown -R webapp:webapp ./
USER webapp


# Additional configurations to ensure that the webapp runs correctly.
ENV CONTENT_LOCATION=/content
WORKDIR /home/webapp/app

# Expose the port and start the webapp.
EXPOSE 5000
ENTRYPOINT ["../boot.sh"]
