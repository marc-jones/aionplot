#!/bin/bash

wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.4.0/ncbi-blast-2.4.0+-x64-linux.tar.gz

tar -xzf ncbi-blast-2.4.0+-x64-linux.tar.gz

mv ncbi-blast-2.4.0+/bin /usr/bin/blast_bin

rm -rf ncbi-blast-2.4.0+
