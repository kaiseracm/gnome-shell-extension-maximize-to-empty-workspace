#!/bin/sh

NAME=fullscreen-to-empty-workspace@aiono.dev
DIR=src
zip -r $NAME.zip $DIR/*
mkdir -p build
mv $NAME.zip build/$NAME.zip

