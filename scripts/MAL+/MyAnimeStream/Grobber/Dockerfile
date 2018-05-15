FROM tiangolo/uwsgi-nginx-flask:python3.6

RUN "mkdir /app/app"
COPY ./grobber /app/app/grobber
RUN "rm -f -r /app/app/grobber/static"
COPY ./grobber/static /app/app/static
COPY ./.docker/uwsgi.ini /app/app/

RUN pip install -r ./requirements.txt