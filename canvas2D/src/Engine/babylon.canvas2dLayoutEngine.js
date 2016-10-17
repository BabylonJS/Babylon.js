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
    var LayoutEngineBase = (function () {
        function LayoutEngineBase() {
            this.layoutDirtyOnPropertyChangedMask = 0;
        }
        LayoutEngineBase.prototype.updateLayout = function (prim) {
        };
        Object.defineProperty(LayoutEngineBase.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        LayoutEngineBase.prototype.isLocked = function () {
            return this._isLocked;
        };
        LayoutEngineBase.prototype.lock = function () {
            if (this._isLocked) {
                return false;
            }
            this._isLocked = true;
            return true;
        };
        LayoutEngineBase = __decorate([
            BABYLON.className("LayoutEngineBase", "BABYLON")
        ], LayoutEngineBase);
        return LayoutEngineBase;
    }());
    BABYLON.LayoutEngineBase = LayoutEngineBase;
    var CanvasLayoutEngine = (function (_super) {
        __extends(CanvasLayoutEngine, _super);
        function CanvasLayoutEngine() {
            _super.apply(this, arguments);
        }
        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        CanvasLayoutEngine.prototype.updateLayout = function (prim) {
            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this._doUpdate(child);
                }
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
        };
        CanvasLayoutEngine.prototype._doUpdate = function (prim) {
            // Canvas ?
            if (prim instanceof BABYLON.Canvas2D) {
                prim.layoutArea = prim.actualSize;
            }
            else if (prim.parent instanceof BABYLON.Canvas2D) {
                prim.layoutArea = prim.owner.actualSize;
            }
            else {
                prim.layoutArea = prim.parent.contentArea;
            }
        };
        Object.defineProperty(CanvasLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        CanvasLayoutEngine.Singleton = new CanvasLayoutEngine();
        CanvasLayoutEngine = __decorate([
            BABYLON.className("CanvasLayoutEngine", "BABYLON")
        ], CanvasLayoutEngine);
        return CanvasLayoutEngine;
    }(LayoutEngineBase));
    BABYLON.CanvasLayoutEngine = CanvasLayoutEngine;
    var StackPanelLayoutEngine = (function (_super) {
        __extends(StackPanelLayoutEngine, _super);
        function StackPanelLayoutEngine() {
            _super.call(this);
            this._isHorizontal = true;
            this.layoutDirtyOnPropertyChangedMask = BABYLON.Prim2DBase.sizeProperty.flagId;
        }
        Object.defineProperty(StackPanelLayoutEngine, "Horizontal", {
            get: function () {
                if (!StackPanelLayoutEngine._horizontal) {
                    StackPanelLayoutEngine._horizontal = new StackPanelLayoutEngine();
                    StackPanelLayoutEngine._horizontal.isHorizontal = true;
                    StackPanelLayoutEngine._horizontal.lock();
                }
                return StackPanelLayoutEngine._horizontal;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StackPanelLayoutEngine, "Vertical", {
            get: function () {
                if (!StackPanelLayoutEngine._vertical) {
                    StackPanelLayoutEngine._vertical = new StackPanelLayoutEngine();
                    StackPanelLayoutEngine._vertical.isHorizontal = false;
                    StackPanelLayoutEngine._vertical.lock();
                }
                return StackPanelLayoutEngine._vertical;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StackPanelLayoutEngine.prototype, "isHorizontal", {
            get: function () {
                return this._isHorizontal;
            },
            set: function (val) {
                if (this.isLocked()) {
                    return;
                }
                this._isHorizontal = val;
            },
            enumerable: true,
            configurable: true
        });
        StackPanelLayoutEngine.prototype.updateLayout = function (prim) {
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                var x = 0;
                var y = 0;
                var h = this.isHorizontal;
                var max = 0;
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var layoutArea = void 0;
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, StackPanelLayoutEngine.dstOffset, StackPanelLayoutEngine.dstArea, true);
                        layoutArea = StackPanelLayoutEngine.dstArea.clone();
                        child.layoutArea = layoutArea;
                    }
                    else {
                        layoutArea = child.layoutArea;
                        child.margin.computeArea(child.actualSize, layoutArea);
                    }
                    max = Math.max(max, h ? layoutArea.height : layoutArea.width);
                }
                for (var _b = 0, _c = prim.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    child.layoutAreaPos = new BABYLON.Vector2(x, y);
                    var layoutArea = child.layoutArea;
                    if (h) {
                        x += layoutArea.width;
                        child.layoutArea = new BABYLON.Size(layoutArea.width, max);
                    }
                    else {
                        y += layoutArea.height;
                        child.layoutArea = new BABYLON.Size(max, layoutArea.height);
                    }
                }
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
        };
        Object.defineProperty(StackPanelLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        StackPanelLayoutEngine._horizontal = null;
        StackPanelLayoutEngine._vertical = null;
        StackPanelLayoutEngine.dstOffset = BABYLON.Vector2.Zero();
        StackPanelLayoutEngine.dstArea = BABYLON.Size.Zero();
        StackPanelLayoutEngine = __decorate([
            BABYLON.className("StackPanelLayoutEngine", "BABYLON")
        ], StackPanelLayoutEngine);
        return StackPanelLayoutEngine;
    }(LayoutEngineBase));
    BABYLON.StackPanelLayoutEngine = StackPanelLayoutEngine;
})(BABYLON || (BABYLON = {}));
