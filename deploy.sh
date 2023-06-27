#!/bin/sh

NAME=fullscreen-to-empty-workspace@aiono.dev
rm -rf ~/.local/share/gnome-shell/extensions/$NAME
cp -r $NAME ~/.local/share/gnome-shell/extensions/.
