#!/bin/sh

NAME=fullscreen-to-empty-workspace@aiono.dev
DIR=src
rm -rf ~/.local/share/gnome-shell/extensions/$NAME
cp -r src ~/.local/share/gnome-shell/extensions/$NAME
