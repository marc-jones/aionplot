FROM tiangolo/uwsgi-nginx-flask:python2.7
COPY ./app /app
ADD . /todo
WORKDIR /todo
RUN pip install -r requirements.txt
