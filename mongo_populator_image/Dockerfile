FROM python:2.7
ADD . /working_dir
WORKDIR /working_dir
RUN pip install -r requirements.txt
ENV MONGO_HOSTNAME=db
ENV DATA_LOCATION=/data
ENV CONTENT_LOCATION=/content
ENTRYPOINT python populator.py
