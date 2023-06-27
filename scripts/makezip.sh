#!/bin/sh

NAME=fullscreen-to-empty-workspace@aiono.dev
DIR=src
pushd $DIR
zip -r $NAME.zip *
popd
mkdir -p build
mv $DIR/$NAME.zip build/$NAME.zip

