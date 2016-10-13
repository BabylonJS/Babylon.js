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
    var Label = (function (_super) {
        __extends(Label, _super);
        function Label(settings) {
            if (!settings) {
                settings = {};
            }
            _super.call(this, settings);
            if (settings.text != null) {
                this.text = settings.text;
            }
        }
        Object.defineProperty(Label.prototype, "_position", {
            get: function () {
                return BABYLON.Vector2.Zero();
            },
            enumerable: true,
            configurable: true
        });
        Label.prototype._getChildren = function () {
            return Label._emptyArray;
        };
        Label.prototype.createVisualTree = function () {
            _super.prototype.createVisualTree.call(this);
            var p = this._visualChildrenPlaceholder;
        };
        Object.defineProperty(Label.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
            },
            enumerable: true,
            configurable: true
        });
        Label._emptyArray = new Array();
        __decorate([
            BABYLON.dependencyProperty(BABYLON.Control.CONTROL_PROPCOUNT + 0, function (pi) { return Label.textProperty = pi; })
        ], Label.prototype, "text", null);
        Label = __decorate([
            BABYLON.className("Label", "BABYLON")
        ], Label);
        return Label;
    }(BABYLON.Control));
    BABYLON.Label = Label;
    var DefaultLabelRenderingTemplate = (function (_super) {
        __extends(DefaultLabelRenderingTemplate, _super);
        function DefaultLabelRenderingTemplate() {
            _super.apply(this, arguments);
        }
        DefaultLabelRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            var r = new BABYLON.Text2D("", { parent: visualPlaceholder });
            r.createSimpleDataBinding(BABYLON.Text2D.textProperty, "text");
            r.dataSource = owner;
            return { root: r, contentPlaceholder: r };
        };
        DefaultLabelRenderingTemplate = __decorate([
            BABYLON.registerWindowRenderingTemplate("BABYLON.Label", "Default", function () { return new DefaultLabelRenderingTemplate(); })
        ], DefaultLabelRenderingTemplate);
        return DefaultLabelRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    BABYLON.DefaultLabelRenderingTemplate = DefaultLabelRenderingTemplate;
})(BABYLON || (BABYLON = {}));
