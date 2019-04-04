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

# Install the Python dependencies.
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt


COPY boot.sh boot.sh
RUN chmod a+x boot.sh

COPY app app
RUN cat /app/templates/SearchAndPlot/*.js > /app/templates/SearchAndPlot.js

EXPOSE 5000
ENV CONTENT_LOCATION=/content

WORKDIR /app
ENTRYPOINT ["../boot.sh"]
