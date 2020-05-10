#!/bin/sh

NAME=MaximizeToEmptyWorkspace-extension@kaisersite.de
cd $NAME
zip -r $NAME.zip *
mv $NAME.zip ../..
cd ..

