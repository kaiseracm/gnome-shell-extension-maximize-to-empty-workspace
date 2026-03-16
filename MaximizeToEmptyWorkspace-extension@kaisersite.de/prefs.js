import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MaximizeToEmptyWorkspacePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: _('Unmaximize Behavior'),
            description: _('Control what happens when a window is unmaximized'),
        });

        // Move back to home workspace toggle
        const moveBackRow = new Adw.ActionRow({
            title: _('Move back to home workspace'),
            subtitle: _('Unmaximized windows will be moved back to workspace 1'),
        });
        const moveBackToggle = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        settings.bind('move-back-to-home', moveBackToggle, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        moveBackRow.add_suffix(moveBackToggle);
        moveBackRow.set_activatable_widget(moveBackToggle);
        group.add(moveBackRow);

        // Cleanup empty workspace toggle
        const cleanupRow = new Adw.ActionRow({
            title: _('Clean up empty workspaces'),
            subtitle: _('Automatically remove empty workspaces after moving windows back'),
        });
        const cleanupToggle = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        settings.bind('cleanup-empty-workspace', cleanupToggle, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        cleanupRow.add_suffix(cleanupToggle);
        cleanupRow.set_activatable_widget(cleanupToggle);
        group.add(cleanupRow);

        page.add(group);
        window.add(page);
    }
}
