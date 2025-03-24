#!/bin/bash

git pull
docker build . -t open_spy_skrip_dev:latest
cd docker-compose
docker-compose -f deploy.yml up -d
