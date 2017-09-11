const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const EXTENSIONDIR = Me.dir.get_path();
const Gettext = imports.gettext.domain('gnome-shell-extension-stocks');
const _ = Gettext.gettext;
const Convenience = Me.imports.convenience;
const STOCKS_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.stocks';

const StocksPrefsWidget = new GObject.Class({
    Name: 'Stocks.Prefs.Widget',
    GTypeName: 'StocksExtensionPrefsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);
        this._settings = Convenience.getSettings(STOCKS_SETTINGS_SCHEMA);
        // Create user-agent string from uuid and (if present) the version
        this.user_agent = Me.metadata.uuid;
        if (Me.metadata.version !== undefined && Me.metadata.version.toString().trim() !== '') {
            this.user_agent += '/';
            this.user_agent += Me.metadata.version.toString();
        }

        this.initWindow();

        this.mainWidget = this.Window.get_object("stocks-container");
        this.treeview = this.Window.get_object("stocks-treeview");
        this.liststore = this.Window.get_object("stocklist-store");

        this.newTicker = this.Window.get_object("new-ticker");
        this.tickerAdd = this.Window.get_object("ticker-add");
        this.tickerRemove = this.Window.get_object("ticker-remove");

        this.tickerAdd.connect('clicked', Lang.bind(this, this.addTickerSymbol));
        this.tickerRemove.connect('clicked', Lang.bind(this, this.removeTickerSymbol));

        let column = new Gtk.TreeViewColumn();
        column.set_title(_("Stock"));
        this.treeview.append_column(column);

        this.refreshUI();
    },

    Window: new Gtk.Builder(),

    addTickerSymbol: function() {
        print('clicking add ticker');
        this.newTicker.show_all();
    },

    removeTickerSymbol: function() {
        //print(this.treeview.get_selection().get_selected_rows());
        let selection = this.treeview.get_selection();
        let [model, pathlist] = selection.get_selected_rows();

        let a = selection.get_selected_rows(this.liststore)[0][0];
        let storeIndex = parseInt(a.to_string());

        let savedStocks = this._settings.get_string("ticker-symbols");
        let symbols = JSON.parse(savedStocks);
        let selectedToRemove = symbols[storeIndex];

        symbols = symbols.filter(function(s) {
            return s != selectedToRemove;
        });
       
        this.stocks = symbols;
        this.refreshUI();
    },

    refreshUI: function() {
        let column = this.treeview.get_column(0);
        let renderer = new Gtk.CellRendererText();
        column.clear();
        column.pack_start(renderer, null);

        // callback arg types:
        // Gtk.TreeViewColumn, Gtk.CellRendererText, Gtk.ListStore, Gtk.TreeIter
        column.set_cell_data_func(renderer, function(column, renderer, store, iterator) {
            renderer.markup = store.get_value(iterator, 0);
        });

        let current = this.liststore.get_iter_first();
        var that = this;

        this.liststore.clear();
        
        this.stocks.forEach(function(s) {
            current = that.liststore.append();
            that.liststore.set_value(current, 0, s);
        });
    },

    initWindow: function() {
        this.Window.add_from_file(EXTENSIONDIR + "/settings.glade");
    },

    set stocks(s) {
        return this._settings.set_string("ticker-symbols", JSON.stringify(s));
    },

    get stocks() {
        let symbols = undefined;
        let savedStocks = this._settings.get_string("ticker-symbols");
        if (savedStocks) {
            try {
                symbols = JSON.parse(savedStocks);
            } catch (e) {
            
            }
        } else {

        }

        return symbols.length ? symbols : [];
       
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
