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

const Util = imports.misc.util;
const Mainloop = imports.mainloop;

let stockButton;

var Stock = new Lang.Class({
    Name: "Stock",
    _init: function(s, mV, c, pC) {
        this.symbol = s;
        this.marketValue = mV;
        this.change = c;
        this.previousClose = pC;
    }
});

//const StockMenuItem = new Lang.Class({
//    Name: "StockMenuItem",
//    Extends: PopupMenu.PopupMenuItem,
//
//    _init: function(stock) {
//        this.stock = stock;
//        let attrs = {};
//        let symbolLabel = new St.Label({
//            style_class: "stock-label"
//        });
//
//        //symbolLabel.text = stock.getSymbol();
//
//        //this.parent().actor.add_child(symbolLabel);
//        this.parent(stock.getSymbol(), attrs);
//    }
//});

const StockPanelButton = new Lang.Class({
    Name: "StockPanelButton",
    Extends: PanelMenu.Button,
    
    _init: function() {
        var self = this;
        this.parent(0.0, "Stock Widget", false);

        let gicon = Gio.icon_new_for_string(Me.path + "/images/decresing-chart.svg");
        let icon = new St.Icon({
            gicon: gicon,
            style_class: 'stock-button-icon'
        });

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
        let topBox = new St.BoxLayout({
            vertical:true,
            style_class: 'container'
        });

        let stockContainer = new St.Bin();

        let menuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });

        menuItem.actor.add_actor(stockContainer);

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
            log('STOCKS:', change);
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
            topBox.add_actor(itemBox);
        });

        menuItem.actor.add_actor(topBox);
        this.menu.addMenuItem(menuItem);
    },

    _getStocks: function() {
        let _httpSession = undefined;

        let url = 'https://query.yahooapis.com/v1/public/yql';
        let symbols = ["'FUSVX'", "'RDFN'", "'SNAP'", "'F'", "'CRM'", "'SWPPX'", "'XOM'"];
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
            let results = data.query.results.quote;

            var stocks = results.map(q => {
                return new Stock(q.symbol, q.LastTradePriceOnly, q.PercentChange, q.PreviousClose);
            });

            that.render(stocks);

            Mainloop.quit();
        });
    }
});

function init() {
}

function enable() {
    stockButton = new StockPanelButton;
    Main.panel.addToStatusArea('stock-button', stockButton);
}

function disable() {
    stockButton.destroy();
}
