var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A search bar can be used to filter elements in the tree panel.
     * At each keypress on the input, the treepanel will be filtered.
     */
    var SearchBar = (function (_super) {
        __extends(SearchBar, _super);
        function SearchBar(tab) {
            var _this = this;
            _super.call(this);
            this._tab = tab;
            this._div.classList.add('searchbar');
            var filter = INSPECTOR.Inspector.DOCUMENT.createElement('i');
            filter.className = 'fa fa-search';
            this._div.appendChild(filter);
            // Create input
            this._inputElement = INSPECTOR.Inspector.DOCUMENT.createElement('input');
            this._inputElement.placeholder = 'Filter by name...';
            this._div.appendChild(this._inputElement);
            this._inputElement.addEventListener('keyup', function (evt) {
                var filter = _this._inputElement.value;
                _this._tab.filter(filter);
            });
        }
        /** Delete all characters typped in the input element */
        SearchBar.prototype.reset = function () {
            this._inputElement.value = '';
        };
        SearchBar.prototype.update = function () {
            // Nothing to update
        };
        return SearchBar;
    }(INSPECTOR.BasicElement));
    INSPECTOR.SearchBar = SearchBar;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=SearchBar.js.map