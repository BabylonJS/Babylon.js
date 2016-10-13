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
    var Button = (function (_super) {
        __extends(Button, _super);
        function Button(settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            // For a button the default contentAlignemnt is center/center
            if (settings.contentAlignment == null) {
                this.contentAlignment.horizontal = BABYLON.PrimitiveAlignment.AlignCenter;
                this.contentAlignment.vertical = BABYLON.PrimitiveAlignment.AlignCenter;
            }
            this.normalEnabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#337AB7FF");
            this.normalDisabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#7BA9D0FF");
            this.normalMouseOverBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#286090FF");
            this.normalPushedBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#1E496EFF");
            this.normalEnabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#2E6DA4FF");
            this.normalDisabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#77A0C4FF");
            this.normalMouseOverBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#204D74FF");
            this.normalPushedBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#2E5D9EFF");
            this.defaultEnabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            this.defaultDisabledBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF");
            this.defaultMouseOverBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#E6E6E6FF");
            this.defaultPushedBackground = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#D4D4D4FF");
            this.defaultEnabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#CCCCCCFF");
            this.defaultDisabledBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#DEDEDEFF");
            this.defaultMouseOverBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#ADADADFF");
            this.defaultPushedBorder = BABYLON.Canvas2D.GetSolidColorBrushFromHex("#6C8EC5FF");
        }
        Object.defineProperty(Button.prototype, "isPushed", {
            get: function () {
                return this._isPushed;
            },
            set: function (value) {
                this._isPushed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isDefault", {
            get: function () {
                return this._isDefault;
            },
            set: function (value) {
                this._isDefault = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isOutline", {
            get: function () {
                return this._isOutline;
            },
            set: function (value) {
                this._isOutline = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "clickObservable", {
            get: function () {
                if (!this._clickObservable) {
                    this._clickObservable = new BABYLON.Observable();
                }
                return this._clickObservable;
            },
            enumerable: true,
            configurable: true
        });
        Button.prototype._raiseClick = function () {
            console.log("click");
        };
        Button.prototype.createVisualTree = function () {
            var _this = this;
            _super.prototype.createVisualTree.call(this);
            var p = this._visualPlaceholder;
            p.pointerEventObservable.add(function (e, s) {
                // We reject an event coming from the placeholder because it means it's on an empty spot, so it's not valid.
                if (e.relatedTarget === _this._visualPlaceholder) {
                    return;
                }
                if (s.mask === BABYLON.PrimitivePointerInfo.PointerUp) {
                    _this._raiseClick();
                    _this.isPushed = false;
                }
                else if (s.mask === BABYLON.PrimitivePointerInfo.PointerDown) {
                    _this.isPushed = true;
                }
            }, BABYLON.PrimitivePointerInfo.PointerUp | BABYLON.PrimitivePointerInfo.PointerDown);
        };
        Object.defineProperty(Button.prototype, "_position", {
            get: function () {
                return BABYLON.Vector2.Zero();
            },
            enumerable: true,
            configurable: true
        });
        Button.BUTTON_PROPCOUNT = BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 3;
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 0, function (pi) { return Button.isPushedProperty = pi; })
        ], Button.prototype, "isPushed", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 1, function (pi) { return Button.isDefaultProperty = pi; })
        ], Button.prototype, "isDefault", null);
        __decorate([
            BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 2, function (pi) { return Button.isOutlineProperty = pi; })
        ], Button.prototype, "isOutline", null);
        Button = __decorate([
            BABYLON.className("Button", "BABYLON")
        ], Button);
        return Button;
    }(BABYLON.ContentControl));
    BABYLON.Button = Button;
    var DefaultButtonRenderingTemplate = (function (_super) {
        __extends(DefaultButtonRenderingTemplate, _super);
        function DefaultButtonRenderingTemplate() {
            _super.apply(this, arguments);
        }
        DefaultButtonRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            this._rect = new BABYLON.Rectangle2D({ parent: visualPlaceholder, fill: "#FF8080FF", border: "#FF8080FF", roundRadius: 10, borderThickness: 2 });
            this.stateChange();
            return { root: this._rect, contentPlaceholder: this._rect };
        };
        DefaultButtonRenderingTemplate.prototype.attach = function (owner) {
            var _this = this;
            _super.prototype.attach.call(this, owner);
            this.owner.propertyChanged.add(function (e, s) { return _this.stateChange(); }, BABYLON.UIElement.isEnabledProperty.flagId |
                BABYLON.UIElement.isFocusedProperty.flagId |
                BABYLON.UIElement.isMouseOverProperty.flagId |
                Button.isDefaultProperty.flagId |
                Button.isOutlineProperty.flagId |
                Button.isPushedProperty.flagId);
        };
        DefaultButtonRenderingTemplate.prototype.stateChange = function () {
            var b = this.owner;
            var bg = b.isDefault ? b.defaultEnabledBackground : b.normalEnabledBackground;
            var bd = b.isDefault ? b.defaultEnabledBorder : b.normalEnabledBorder;
            if (b.isPushed) {
                if (b.isDefault) {
                    bg = b.defaultPushedBackground;
                    bd = b.defaultPushedBorder;
                }
                else {
                    bg = b.normalPushedBackground;
                    bd = b.normalPushedBorder;
                }
            }
            else if (b.isMouseOver) {
                console.log("MouseOver Style");
                if (b.isDefault) {
                    bg = b.defaultMouseOverBackground;
                    bd = b.defaultMouseOverBorder;
                }
                else {
                    bg = b.normalMouseOverBackground;
                    bd = b.normalMouseOverBorder;
                }
            }
            else if (!b.isEnabled) {
                if (b.isDefault) {
                    bg = b.defaultDisabledBackground;
                    bd = b.defaultDisabledBorder;
                }
                else {
                    bg = b.normalDisabledBackground;
                    bd = b.normalDisabledBorder;
                }
            }
            this._rect.fill = bg;
            this._rect.border = bd;
        };
        DefaultButtonRenderingTemplate = __decorate([
            BABYLON.registerWindowRenderingTemplate("BABYLON.Button", "Default", function () { return new DefaultButtonRenderingTemplate(); })
        ], DefaultButtonRenderingTemplate);
        return DefaultButtonRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    BABYLON.DefaultButtonRenderingTemplate = DefaultButtonRenderingTemplate;
})(BABYLON || (BABYLON = {}));
