FROM python:2.7
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.4.0/ncbi-blast-2.4.0+-x64-linux.tar.gz &&  \
    tar -xzf ncbi-blast-2.4.0+-x64-linux.tar.gz &&  \
    mv ncbi-blast-2.4.0+/bin /usr/bin/blast_bin &&  \
    rm -rf ncbi-blast-2.4.0+ 
ADD . /working_dir
WORKDIR /working_dir
RUN pip install -r requirements.txt
ENV MONGO_HOSTNAME=db
ENV DATA_LOCATION=/data
ENV CONTENT_LOCATION=/content
ENTRYPOINT python populator.py
