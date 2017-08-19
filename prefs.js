const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;

const EXTENSIONDIR = Me.dir.get_path();

const StocksPrefsWidget = new GObject.Class({
    Name: 'Stocks.Prefs.Widget',
    GTypeName: 'StocksExtensionPrefsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);

        // Create user-agent string from uuid and (if present) the version
        this.user_agent = Me.metadata.uuid;
        if (Me.metadata.version !== undefined && Me.metadata.version.toString().trim() !== '') {
            this.user_agent += '/';
            this.user_agent += Me.metadata.version.toString();
        }

        this.initWindow();

        this.mainWidget = this.Window.get_object("stocks-container");
       // this.refreshUI();
        
    },

    Window: new Gtk.Builder(),

    initWindow: function() {

        this.Window.add_from_file(EXTENSIONDIR + "/settings.glade");
    }
});


function init() {
}

function buildPrefsWidget() {
    let prefs = new StocksPrefsWidget();
    let widget = prefs.mainWidget;
    widget.show_all();
    return widget;
}
