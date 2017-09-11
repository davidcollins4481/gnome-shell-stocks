const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const Convenience = Me.imports.convenience;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;

const STOCKS_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.stocks';
let topBox = undefined,
    menuItem = undefined;

var Stock = new Lang.Class({
    Name: "Stock",
    _init: function(s, mV, c, pC) {
        this.symbol = s;
        this.marketValue = mV;
        this.change = c;
        this.previousClose = pC;
    }
});

const StockPanelButton = new Lang.Class({
    Name: "StockPanelButton",
    Extends: PanelMenu.Button,
    
    _init: function() {
        var self = this;
        this.parent(0.0, "Stock Widget", false);
        this._loadConfig()

        let gicon = Gio.icon_new_for_string(Me.path + "/images/decresing-chart.svg");
        let icon = new St.Icon({
            gicon: gicon,
            style_class: 'stock-button-icon'
        });

        print('init extension');

        this.actor.add_actor(icon);
        this._getStocks();

        let buttonBox = new St.BoxLayout({
            vertical: true,
            style_class: 'container'
        });

        let button = new St.Button({
            reactive: true,
            can_focus: true,
            track_hover: true,
            accessible_name: 'accessible name',//accessibleName,
            style_class: 'popup-menu-item stock-settings-button'
        });

        button.child = new St.Icon({
            icon_name: 'preferences-system-symbolic'
        });

        buttonBox.add_actor(button);

        let settingsMenuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });

        settingsMenuItem.actor.add_actor(buttonBox);
        this.menu.addMenuItem(settingsMenuItem);

        button.connect('clicked', Lang.bind(this, this._onPreferencesActivate));

        this.menu.connect('open-state-changed', Lang.bind(this, this._calc));
    },

    _calc: function() {
        print('calc');
        this._getStocks();
    },

    _loadConfig: function() {
        this._settings = Convenience.getSettings(STOCKS_SETTINGS_SCHEMA);
    },

    _onPreferencesActivate: function() {
        this.menu.actor.hide();
        Util.spawn(["gnome-shell-extension-prefs", "stocks@davidcollins4481"]);
        return 0;
    },

   _onSettingsButtonChanged: function(actor, event) {
       log("STOCKS", 'clicked');
   },

    render: function(stocks) {
        if (this.topBox) {
            this.topBox.destroy();
            this.topBox = undefined;
            this.menuItem.destroy();
            this.menuItem = undefined;
        }
        this.topBox = new St.BoxLayout({
            vertical:true,
            style_class: 'container'
        });

        let stockContainer = new St.Bin();

        this.menuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });

        this.menuItem.actor.add_actor(stockContainer);
        let that = this;
        stocks.forEach(function(stock) {
            let symbolContainer = new St.Bin({
                style_class: 'stock-symbol-container'
            });

            let valueContainer = new St.Bin({
                style_class: 'stock-value-container'
            });

            let changeContainer = new St.Bin({
                style_class: 'stock-change-container'
            });

            let symbolLabel = new St.Label({
                text: stock.symbol
            });
           
            let valueLabel = new St.Label({
                text: stock.marketValue
            });

            let change = parseFloat(stock.change.replace('%', ''));
            let changeLabel = new St.Label({
                style_class: change >= 0 ? 'stock-change-positive' : 'stock-change-negative',
                text: stock.change.toString() 
            })

            symbolContainer.add_actor(symbolLabel);
            valueContainer.add_actor(valueLabel);
            changeContainer.add_actor(changeLabel);

            let itemBox = new St.BoxLayout({
                vertical: false,
                style_class: 'stock-item-container'
            });

            itemBox.add_actor(symbolContainer);
            itemBox.add_actor(valueContainer);
            itemBox.add_actor(changeContainer);
            that.topBox.add_actor(itemBox);
        });

        this.menuItem.actor.add_actor(this.topBox);
        this.menu.addMenuItem(this.menuItem);
    },

    _getStocks: function() {
        let _httpSession = undefined;

        let symbols = undefined;
        let savedStocks = this._settings.get_string("ticker-symbols");
        if (savedStocks) {
            try {
                symbols = JSON.parse(savedStocks);
                symbols = symbols.map(function(s) {
                    return '"' + s + '"';
                });
            } catch (e) {
            
            }
        } else {

        }

        let url = 'https://query.yahooapis.com/v1/public/yql';
        let params = {
            'q': 'select * from yahoo.finance.quotes where symbol in ' + '(' + symbols.join(',')  + ')',
            'format' : 'json',
            'env' : "store://datatables.org/alltableswithkeys"
        };

        let paramsEncoded = Object.keys(params).map(function(key) {
            return `${key}=${encodeURIComponent(params[key])}`;
        });

        url += `?${paramsEncoded.join('&')}`;

        var request = Soup.Message.new('GET', url);

        var session = new Soup.SessionAsync();
        var that = this;
        session.queue_message(request, function(session, message) {
            let data = JSON.parse(message.response_body.data);
            if (!data.query) {
                return;
            }
            
            let results = data.query.results.quote;

            var stocks = results.map(q => {
                return new Stock(q.symbol, q.LastTradePriceOnly, q.PercentChange, q.PreviousClose);
            });

            that.render(stocks);

            Mainloop.quit();
        });
    }
});

let stockButton;

function init() {
}

function enable() {
    stockButton = new StockPanelButton;
    Main.panel.addToStatusArea('stock-button', stockButton);
}

function disable() {
    stockButton.destroy();
}
