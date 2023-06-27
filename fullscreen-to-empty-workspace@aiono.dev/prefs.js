const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
// https://gjs.guide/extensions/topics/extension-utils.html#extension-metadata
const Me = ExtensionUtils.getCurrentExtension();

/**
 * Like `extension.js` this is used for any one-time setup like translations.
 */
function init() {
  console.debug(`initializing ${Me.metadata.uuid} Preferences`);
}

const MOVE_WINDOW_WHEN_MAXIMIZED = 'move-window-when-maximized';

function fillPreferencesWindow(window) {
  const settings = ExtensionUtils.getSettings();

  // Create a preferences page, with a single group
  const page = new Adw.PreferencesPage();
  window.add(page);

  const group = new Adw.PreferencesGroup();
  page.add(group);

  // Create a new preferences row
  const row = new Adw.ActionRow({ title: 'Move window when maximized' });
  group.add(row);

  // Create a switch and bind its value to the `show-indicator` key
  const toggle = new Gtk.Switch({
      active: settings.get_boolean(MOVE_WINDOW_WHEN_MAXIMIZED),
      valign: Gtk.Align.CENTER,
  });

  settings.bind(
    MOVE_WINDOW_WHEN_MAXIMIZED,
    toggle,
    'active',
    Gio.SettingsBindFlags.DEFAULT,
  );

  // Add the switch to the row
  row.add_suffix(toggle);
  row.activatable_widget = toggle;

  // Make sure the window doesn't outlive the settings object
  window._settings = settings;
}

