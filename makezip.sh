#!/bin/sh

NAME=fullscreen-to-empty-workspace@aiono.dev
cd $NAME
zip -r $NAME.zip *
mv $NAME.zip ../..
cd ..

