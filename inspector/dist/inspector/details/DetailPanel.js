var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var DetailPanel = (function (_super) {
        __extends(DetailPanel, _super);
        function DetailPanel(dr) {
            _super.call(this);
            // Contains all details rows that belongs to the item above
            this._detailRows = [];
            // Store the sort direction of each header column
            this._sortDirection = {};
            this._build();
            if (dr) {
                this._detailRows = dr;
                this.update();
            }
        }
        Object.defineProperty(DetailPanel.prototype, "details", {
            set: function (detailsRow) {
                this.clean();
                this._detailRows = detailsRow;
                // Refresh HTML
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        DetailPanel.prototype._build = function () {
            var _this = this;
            this._div.className = 'insp-details';
            this._div.id = 'insp-details';
            // Create header row
            this._createHeaderRow();
            this._div.appendChild(this._headerRow);
            window.addEventListener('resize', function (e) {
                // adapt the header row max width according to its parent size;
                _this._headerRow.style.maxWidth = _this._headerRow.parentElement.clientWidth + 'px';
            });
        };
        /** Updates the HTML of the detail panel */
        DetailPanel.prototype.update = function () {
            this._sortDetails('name', 1);
            this._addDetails();
        };
        /** Add all lines in the html div. Does not sort them! */
        DetailPanel.prototype._addDetails = function () {
            var details = INSPECTOR.Helpers.CreateDiv('details', this._div);
            for (var _i = 0, _a = this._detailRows; _i < _a.length; _i++) {
                var row = _a[_i];
                details.appendChild(row.toHtml());
            }
        };
        /**
         * Sort the details row by comparing the given property of each row
         */
        DetailPanel.prototype._sortDetails = function (property, _direction) {
            // Clean header
            var elems = INSPECTOR.Inspector.DOCUMENT.querySelectorAll('.sort-direction');
            for (var e = 0; e < elems.length; e++) {
                elems[e].classList.remove('fa-chevron-up');
                elems[e].classList.remove('fa-chevron-down');
            }
            if (_direction || !this._sortDirection[property]) {
                this._sortDirection[property] = _direction || 1;
            }
            else {
                this._sortDirection[property] *= -1;
            }
            var direction = this._sortDirection[property];
            if (direction == 1) {
                this._headerRow.querySelector("#sort-direction-" + property).classList.remove('fa-chevron-down');
                this._headerRow.querySelector("#sort-direction-" + property).classList.add('fa-chevron-up');
            }
            else {
                this._headerRow.querySelector("#sort-direction-" + property).classList.remove('fa-chevron-up');
                this._headerRow.querySelector("#sort-direction-" + property).classList.add('fa-chevron-down');
            }
            var isString = function (s) {
                return typeof (s) === 'string' || s instanceof String;
            };
            this._detailRows.sort(function (detail1, detail2) {
                var str1 = String(detail1[property]);
                var str2 = String(detail2[property]);
                if (!isString(str1)) {
                    str1 = detail1[property].toString();
                }
                if (!isString(str2)) {
                    str2 = detail2[property].toString();
                }
                // Compare numbers as numbers and string as string with 'numeric=true'
                return str1.localeCompare(str2, [], { numeric: true }) * direction;
            });
        };
        /**
         * Removes all data in the detail panel but keep the header row
         */
        DetailPanel.prototype.clean = function () {
            // Delete all details row
            for (var _i = 0, _a = this._detailRows; _i < _a.length; _i++) {
                var pline = _a[_i];
                pline.dispose();
            }
            INSPECTOR.Helpers.CleanDiv(this._div);
            // Header row
            this._div.appendChild(this._headerRow);
        };
        /** Overrides basicelement.dispose */
        DetailPanel.prototype.dispose = function () {
            // Delete all details row
            for (var _i = 0, _a = this._detailRows; _i < _a.length; _i++) {
                var pline = _a[_i];
                pline.dispose();
            }
        };
        /**
         * Creates the header row : name, value, id
         */
        DetailPanel.prototype._createHeaderRow = function () {
            var _this = this;
            this._headerRow = INSPECTOR.Helpers.CreateDiv('header-row');
            var createDiv = function (name, cssClass) {
                var div = INSPECTOR.Helpers.CreateDiv(cssClass + ' header-col');
                // Column title - first letter in uppercase
                var spanName = INSPECTOR.Inspector.DOCUMENT.createElement('span');
                spanName.textContent = name.charAt(0).toUpperCase() + name.slice(1);
                // sort direction
                var spanDirection = INSPECTOR.Inspector.DOCUMENT.createElement('i');
                spanDirection.className = 'sort-direction fa';
                spanDirection.id = 'sort-direction-' + name;
                div.appendChild(spanName);
                div.appendChild(spanDirection);
                div.addEventListener('click', function (e) {
                    _this._sortDetails(name);
                    _this._addDetails();
                });
                return div;
            };
            this._headerRow.appendChild(createDiv('name', 'prop-name'));
            this._headerRow.appendChild(createDiv('value', 'prop-value'));
        };
        return DetailPanel;
    }(INSPECTOR.BasicElement));
    INSPECTOR.DetailPanel = DetailPanel;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=DetailPanel.js.map