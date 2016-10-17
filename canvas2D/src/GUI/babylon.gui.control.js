var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Control = (function (_super) {
        __extends(Control, _super);
        function Control(settings) {
            _super.call(this, settings);
        }
        Object.defineProperty(Control.prototype, "background", {
            get: function () {
                if (!this._background) {
                    this._background = new BABYLON.ObservableStringDictionary(false);
                }
                return this._background;
            },
            set: function (value) {
                this.background.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "border", {
            get: function () {
                return this._border;
            },
            set: function (value) {
                this._border = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "borderThickness", {
            get: function () {
                return this._borderThickness;
            },
            set: function (value) {
                this._borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "fontName", {
            get: function () {
                return this._fontName;
            },
            set: function (value) {
                this._fontName = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "foreground", {
            get: function () {
                return this._foreground;
            },
            set: function (value) {
                this._foreground = value;
            },
            enumerable: true,
            configurable: true
        });
        Control.CONTROL_PROPCOUNT = BABYLON.UIElement.UIELEMENT_PROPCOUNT + 5;
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 0, function (pi) { return Control.backgroundProperty = pi; })
        ], Control.prototype, "background", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 1, function (pi) { return Control.borderProperty = pi; })
        ], Control.prototype, "border", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 2, function (pi) { return Control.borderThicknessProperty = pi; })
        ], Control.prototype, "borderThickness", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 3, function (pi) { return Control.fontNameProperty = pi; })
        ], Control.prototype, "fontName", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 4, function (pi) { return Control.foregroundProperty = pi; })
        ], Control.prototype, "foreground", null);
        Control = __decorate([
            BABYLON.className("Control", "BABYLON")
        ], Control);
        return Control;
    }(BABYLON.UIElement));
    BABYLON.Control = Control;
    var ContentControl = (function (_super) {
        __extends(ContentControl, _super);
        function ContentControl(settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.content != null) {
                this._content = settings.content;
            }
            if (settings.contentAlignment != null) {
                this.contentAlignment.fromString(settings.contentAlignment);
            }
        }
        ContentControl.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this.content && this.content.dispose) {
                this.content.dispose();
                this.content = null;
            }
            if (this.__contentUIElement) {
                this.__contentUIElement.dispose();
                this.__contentUIElement = null;
            }
            _super.prototype.dispose.call(this);
            return true;
        };
        Object.defineProperty(ContentControl.prototype, "content", {
            get: function () {
                return this._content;
            },
            set: function (value) {
                this._content = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "contentAlignment", {
            get: function () {
                if (!this._contentAlignment) {
                    this._contentAlignment = new BABYLON.PrimitiveAlignment();
                }
                return this._contentAlignment;
            },
            set: function (value) {
                this.contentAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "_hasContentAlignment", {
            /**
             * Check if there a contentAlignment specified (non null and not default)
             */
            get: function () {
                return (this._contentAlignment !== null && !this._contentAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "_contentUIElement", {
            get: function () {
                if (!this.__contentUIElement) {
                    this._buildContentUIElement();
                }
                return this.__contentUIElement;
            },
            enumerable: true,
            configurable: true
        });
        ContentControl.prototype._buildContentUIElement = function () {
            var c = this._content;
            this.__contentUIElement = null;
            // Already a UIElement
            if (c instanceof BABYLON.UIElement) {
                this.__contentUIElement = c;
            }
            else if ((typeof c === "string") || (typeof c === "boolean") || (typeof c === "number")) {
                var l = new BABYLON.Label({ parent: this, id: "Content of " + this.id });
                var binding = new BABYLON.DataBinding();
                binding.propertyPathName = "content";
                binding.stringFormat = function (v) { return ("" + v); };
                binding.dataSource = this;
                l.createDataBinding(BABYLON.Label.textProperty, binding);
                binding = new BABYLON.DataBinding();
                binding.propertyPathName = "contentAlignment";
                binding.dataSource = this;
                l.createDataBinding(BABYLON.Label.marginAlignmentProperty, binding);
                this.__contentUIElement = l;
            }
            else {
            }
            if (this.__contentUIElement) {
                this.__contentUIElement._patchUIElement(this.ownerWindows, this);
            }
        };
        ContentControl.prototype._getChildren = function () {
            var children = new Array();
            if (this.content) {
                children.push(this._contentUIElement);
            }
            return children;
        };
        ContentControl.CONTENTCONTROL_PROPCOUNT = Control.CONTROL_PROPCOUNT + 2;
        __decorate([
            BABYLON.dependencyProperty(Control.CONTROL_PROPCOUNT + 0, function (pi) { return ContentControl.contentProperty = pi; })
        ], ContentControl.prototype, "content", null);
        __decorate([
            BABYLON.dependencyProperty(Control.CONTROL_PROPCOUNT + 1, function (pi) { return ContentControl.contentAlignmentProperty = pi; })
        ], ContentControl.prototype, "contentAlignment", null);
        ContentControl = __decorate([
            BABYLON.className("ContentControl", "BABYLON")
        ], ContentControl);
        return ContentControl;
    }(Control));
    BABYLON.ContentControl = ContentControl;
})(BABYLON || (BABYLON = {}));
