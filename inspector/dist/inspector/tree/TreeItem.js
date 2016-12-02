var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var TreeItem = (function (_super) {
        __extends(TreeItem, _super);
        function TreeItem(tab, obj) {
            _super.call(this);
            this._children = [];
            this._tab = tab;
            this._adapter = obj;
            this._tools = this._adapter.getTools();
            this._build();
        }
        Object.defineProperty(TreeItem.prototype, "id", {
            /** Returns the item ID == its adapter ID */
            get: function () {
                return this._adapter.id();
            },
            enumerable: true,
            configurable: true
        });
        /** Add the given item as a child of this one */
        TreeItem.prototype.add = function (child) {
            this._children.push(child);
            this.update();
        };
        /**
         * Function used to compare this item to another tree item.
         * Returns the alphabetical sort of the adapter ID
         */
        TreeItem.prototype.compareTo = function (item) {
            var str1 = this.id;
            var str2 = item.id;
            return str1.localeCompare(str2, [], { numeric: true });
        };
        /** Returns true if the given obj correspond to the adapter linked to this tree item */
        TreeItem.prototype.correspondsTo = function (obj) {
            return this._adapter.correspondsTo(obj);
        };
        /** hide all children of this item */
        TreeItem.prototype.fold = function () {
            // Do nothing id no children
            if (this._children.length > 0) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var elem = _a[_i];
                    elem.toHtml().style.display = 'none';
                }
                this._div.classList.add('folded');
                this._div.classList.remove('unfolded');
            }
        };
        /** Show all children of this item */
        TreeItem.prototype.unfold = function () {
            // Do nothing id no children
            if (this._children.length > 0) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var elem = _a[_i];
                    elem.toHtml().style.display = 'block';
                }
                this._div.classList.add('unfolded');
                this._div.classList.remove('folded');
            }
        };
        /** Build the HTML of this item */
        TreeItem.prototype._build = function () {
            this._div.className = 'line';
            for (var _i = 0, _a = this._tools; _i < _a.length; _i++) {
                var tool = _a[_i];
                this._div.appendChild(tool.toHtml());
            }
            // Id
            var text = INSPECTOR.Inspector.DOCUMENT.createElement('span');
            text.textContent = this._adapter.id();
            this._div.appendChild(text);
            // Type
            var type = INSPECTOR.Inspector.DOCUMENT.createElement('span');
            type.className = 'property-type';
            type.textContent = ' - ' + this._adapter.type();
            this._div.appendChild(type);
            this._lineContent = INSPECTOR.Helpers.CreateDiv('line-content', this._div);
            this._addEvent();
        };
        /**
         * Returns one HTML element (.details) containing all  details of this primitive
         */
        TreeItem.prototype.getDetails = function () {
            return this._adapter.getProperties();
        };
        TreeItem.prototype.update = function () {
            // Clean division holding all children
            INSPECTOR.Helpers.CleanDiv(this._lineContent);
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                var elem = child.toHtml();
                this._lineContent.appendChild(elem);
            }
            if (this._children.length > 0) {
                // Check if folded or not
                if (!this._div.classList.contains('folded') && !this._div.classList.contains('unfolded')) {
                    this._div.classList.add('folded');
                }
            }
            this.fold();
        };
        /**
         * Add an event listener on the item :
         * - one click display details
         * - on mouse hover the item is highlighted
         */
        TreeItem.prototype._addEvent = function () {
            var _this = this;
            this._div.addEventListener('click', function (e) {
                _this._tab.select(_this);
                // Fold/unfold the tree
                if (_this._isFolded()) {
                    _this.unfold();
                }
                else {
                    _this.fold();
                }
                e.stopPropagation();
            });
            // Highlight on mouse over
            this._div.addEventListener('mouseover', function (e) {
                _this._tab.highlightNode(_this);
                e.stopPropagation();
            });
            // Remove highlight on mouse out
            this._div.addEventListener('mouseout', function (e) {
                _this._tab.highlightNode();
            });
        };
        /** Highlight or downplay this node */
        TreeItem.prototype.highlight = function (b) {
            // Remove highlight for all children 
            if (!b) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._adapter.highlight(b);
                }
            }
            // Highlight this node
            this._adapter.highlight(b);
        };
        /** Returns true if the node is folded, false otherwise */
        TreeItem.prototype._isFolded = function () {
            return !this._div.classList.contains('unfolded');
        };
        /** Set this item as active (background lighter) in the tree panel */
        TreeItem.prototype.active = function (b) {
            this._div.classList.remove('active');
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child.active(false);
            }
            if (b) {
                this._div.classList.add('active');
            }
        };
        return TreeItem;
    }(INSPECTOR.BasicElement));
    INSPECTOR.TreeItem = TreeItem;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=TreeItem.js.map