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

let stockButton;

let Stock = function(symbol, marketValue, change) {
    this.symbol = symbol;
    this.marketValue = marketValue;
    this.change = change;
}

Stock.prototype.getSymbol = function() {
    return this.symbol;
};

Stock.prototype.getMarketValue = function() {
    return this.marketValue;
};

Stock.prototype.getChange = function() {
    return this.change;
};

const StockMenuItem = new Lang.Class({
    Name: "StockMenuItem",
    Extends: PopupMenu.PopupMenuItem,

    _init: function(stock) {
        let attrs = {};
        this.parent(stock.getSymbol(), attrs);
    }
});

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

        let stocks = this._getStocks();

        stocks.forEach(function(stock) {
            self.menu.addMenuItem(new StockMenuItem(stock));
        });
    },

    _getStocks: function() {
        return [
            new Stock("AAA", 13.3, "+10%"),
            new Stock("BBB", 13.3, "+10%"),
            new Stock("CCC", 13.3, "+10%"),
            new Stock("DDD", 13.3, "+10%"),
        ]
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
