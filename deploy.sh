#!/bin/sh

NAME=MaximizeToEmptyWorkspace-extension@kaisersite.de
rm -rf ~/.local/share/gnome-shell/extensions/$NAME
cp -r $NAME ~/.local/share/gnome-shell/extensions/.
