var OURBABYLON = OURBABYLON || {};

(function () {
    OURBABYLON.Loading = function (container, loadingMessage) {
        //Be careful while using document.body as container, if you do not specify a 'overflow-x: hidden' it will pop a horizontal scrollbar.
        container = container || document.body;

        this._loadingBack = document.createElement("div");//loadingBackDiv;
        this._loadingBack.id = "loadingBack";

        this._loadingText = document.createElement("div");//loadingTextDiv;
        this._loadingText.id = "loadingText";

        this.hide();

        container.appendChild(this._loadingBack);
        container.appendChild(this._loadingText);

        this._loadingMessage = loadingMessage || "Loading, please wait ...";
    };

    OURBABYLON.Loading.prototype.show = function () {
        this._loadingBack.className = "";
        this._loadingText.className = "";
        this._loadingText.innerHTML = this._loadingMessage;
    };

    OURBABYLON.Loading.prototype.hide = function () {
        this._loadingBack.className = "loadingBack";
        this._loadingText.className = "loadingText";
    };

    OURBABYLON.Loading.prototype.changeMessage = function (newMessage) {
        this._loadingText.innerHTML = newMessage;
    };

    OURBABYLON.Loading.prototype.onProgress = function (evt) {
        if (evt.lengthComputable) {
            this.changeMessage("Loading, please wait..." + (evt.loaded * 100 / evt.total).toFixed() + "%");
        } else {
            dlCount = evt.loaded / (1024 * 1024);
            this.changeMessage("Loading, please wait..." + Math.floor(dlCount * 100.0) / 100.0 + " MB already loaded.");
        }
    };
})();