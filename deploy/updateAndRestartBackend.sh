#!/bin/bash

# any future command that fails will exit the script
set -e

# Change directory to where the project is stored
cd /var/www/html/sci/backend

# stash changes
sudo git add .
sudo git stash

# clone the repo again
sudo git pull origin master

# Build the application
sudo docker-compose build app

# Stop webserver
sudo systemctl stop nginx

echo "Run Docker compose up"
sudo docker-compose up -d -V app

# Start webserver
sudo systemctl start nginx

echo "****************************************************************"
echo "--- Backend update complete"
echo "****************************************************************"
