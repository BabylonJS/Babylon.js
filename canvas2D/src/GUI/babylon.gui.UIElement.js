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
    var Command = (function () {
        function Command(execute, canExecute) {
            if (!execute) {
                throw Error("At least an execute lambda must be given at Command creation time");
            }
            this._canExecuteChanged = null;
            this._lastCanExecuteResult = null;
            this.execute = execute;
            this.canExecute = canExecute;
        }
        Command.prototype.canExecute = function (parameter) {
            var res = true;
            if (this._canExecute) {
                res = this._canExecute(parameter);
            }
            if (res !== this._lastCanExecuteResult) {
                if (this._canExecuteChanged && this._canExecuteChanged.hasObservers()) {
                    this._canExecuteChanged.notifyObservers(null);
                }
                this._lastCanExecuteResult = res;
            }
            return res;
        };
        Command.prototype.execute = function (parameter) {
            this._execute(parameter);
        };
        Object.defineProperty(Command.prototype, "canExecuteChanged", {
            get: function () {
                if (!this._canExecuteChanged) {
                    this._canExecuteChanged = new BABYLON.Observable();
                }
                return this._canExecuteChanged;
            },
            enumerable: true,
            configurable: true
        });
        return Command;
    }());
    BABYLON.Command = Command;
    var UIElement = (function (_super) {
        __extends(UIElement, _super);
        function UIElement(settings) {
            _super.call(this);
            if (!settings) {
                throw Error("A settings object must be passed with at least either a parent or owner parameter");
            }
            var type = BABYLON.Tools.getFullClassName(this);
            this._ownerWindow = null;
            this._parent = null;
            this._visualPlaceholder = null;
            this._visualTemplateRoot = null;
            this._visualChildrenPlaceholder = null;
            this._hierarchyDepth = 0;
            this._style = (settings.styleName != null) ? UIElementStyleManager.getStyle(type, settings.styleName) : null;
            this._flags = 0;
            this._id = (settings.id != null) ? settings.id : null;
            this._uid = null;
            this._width = (settings.width != null) ? settings.width : null;
            this._height = (settings.height != null) ? settings.height : null;
            this._minWidth = (settings.minWidth != null) ? settings.minWidth : 0;
            this._minHeight = (settings.minHeight != null) ? settings.minHeight : 0;
            this._maxWidth = (settings.maxWidth != null) ? settings.maxWidth : Number.MAX_VALUE;
            this._maxHeight = (settings.maxHeight != null) ? settings.maxHeight : Number.MAX_VALUE;
            this._margin = null;
            this._padding = null;
            this._marginAlignment = null;
            this._isEnabled = true;
            this._isFocused = false;
            this._isMouseOver = false;
            // Default Margin Alignment for UIElement is stretch for horizontal/vertical and not left/bottom (which is the default for Canvas2D Primitives)
            //this.marginAlignment.horizontal = PrimitiveAlignment.AlignStretch;
            //this.marginAlignment.vertical   = PrimitiveAlignment.AlignStretch;
            // Set the layout/margin stuffs
            if (settings.marginTop) {
                this.margin.setTop(settings.marginTop);
            }
            if (settings.marginLeft) {
                this.margin.setLeft(settings.marginLeft);
            }
            if (settings.marginRight) {
                this.margin.setRight(settings.marginRight);
            }
            if (settings.marginBottom) {
                this.margin.setBottom(settings.marginBottom);
            }
            if (settings.margin) {
                if (typeof settings.margin === "string") {
                    this.margin.fromString(settings.margin);
                }
                else {
                    this.margin.fromUniformPixels(settings.margin);
                }
            }
            if (settings.marginHAlignment) {
                this.marginAlignment.horizontal = settings.marginHAlignment;
            }
            if (settings.marginVAlignment) {
                this.marginAlignment.vertical = settings.marginVAlignment;
            }
            if (settings.marginAlignment) {
                this.marginAlignment.fromString(settings.marginAlignment);
            }
            if (settings.paddingTop) {
                this.padding.setTop(settings.paddingTop);
            }
            if (settings.paddingLeft) {
                this.padding.setLeft(settings.paddingLeft);
            }
            if (settings.paddingRight) {
                this.padding.setRight(settings.paddingRight);
            }
            if (settings.paddingBottom) {
                this.padding.setBottom(settings.paddingBottom);
            }
            if (settings.padding) {
                this.padding.fromString(settings.padding);
            }
            this._assignTemplate(settings.templateName);
            if (settings.parent != null) {
                this._parent = settings.parent;
                this._hierarchyDepth = this._parent._hierarchyDepth + 1;
            }
        }
        UIElement.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this._renderingTemplate) {
                this._renderingTemplate.detach();
                this._renderingTemplate = null;
            }
            _super.prototype.dispose.call(this);
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
            return true;
        };
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        UIElement.prototype.getAnimatables = function () {
            return new Array();
        };
        Object.defineProperty(UIElement.prototype, "ownerWindows", {
            // TODO
            // PROPERTIES
            // Style
            // Id
            // Parent/Children
            // ActualWidth/Height, MinWidth/Height, MaxWidth/Height,
            // Alignment/Margin
            // Visibility, IsVisible
            // IsEnabled (is false, control is disabled, no interaction and a specific render state)
            // CacheMode of Visual Elements
            // Focusable/IsFocused
            // IsPointerCaptured, CapturePointer, IsPointerDirectlyOver, IsPointerOver. De-correlate mouse, stylus, touch?
            // ContextMenu
            // Cursor
            // DesiredSize
            // IsInputEnable ?
            // Opacity, OpacityMask ?
            // SnapToDevicePixels
            // Tag
            // ToolTip
            // METHODS
            // BringIntoView (for scrollable content, to move the scroll to bring the given element visible in the parent's area)
            // Capture/ReleaseCapture (mouse, touch, stylus)
            // Focus
            // PointFrom/ToScreen to translate coordinates
            // EVENTS
            // ContextMenuOpening/Closing/Changed
            // DragEnter/LeaveOver, Drop
            // Got/LostFocus
            // IsEnabledChanged
            // IsPointerOver/DirectlyOverChanged
            // IsVisibleChanged
            // KeyDown/Up
            // LayoutUpdated ?
            // Pointer related events
            // SizeChanged
            // ToolTipOpening/Closing
            get: function () {
                return this._ownerWindow;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "style", {
            get: function () {
                if (!this.style) {
                    return UIElementStyleManager.DefaultStyleName;
                }
                return this._style.name;
            },
            set: function (value) {
                if (this._style && (this._style.name === value)) {
                    return;
                }
                var newStyle = null;
                if (value) {
                    newStyle = UIElementStyleManager.getStyle(BABYLON.Tools.getFullClassName(this), value);
                    if (!newStyle) {
                        throw Error("Couldn't find Style " + value + " for UIElement " + BABYLON.Tools.getFullClassName(this));
                    }
                }
                if (this._style) {
                    this._style.removeStyle(this);
                }
                if (newStyle) {
                    newStyle.applyStyle(this);
                }
                this._style = newStyle;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "id", {
            /**
             * A string that identifies the UIElement.
             * The id is optional and there's possible collision with other UIElement's id as the uniqueness is not supported.
             */
            get: function () {
                return this._id;
            },
            set: function (value) {
                if (this._id === value) {
                    return;
                }
                this._id = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "uid", {
            /**
             * Return a unique id automatically generated.
             * This property is mainly used for serialization to ensure a perfect way of identifying a UIElement
             */
            get: function () {
                if (!this._uid) {
                    this._uid = BABYLON.Tools.RandomId();
                }
                return this._uid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "hierarchyDepth", {
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                this._parent = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                this._width = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                this._height = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minWidth", {
            get: function () {
                return this._minWidth;
            },
            set: function (value) {
                this._minWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minHheight", {
            get: function () {
                return this._minHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minHeight", {
            set: function (value) {
                this._minHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "maxWidth", {
            get: function () {
                return this._maxWidth;
            },
            set: function (value) {
                this._maxWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "maxHeight", {
            get: function () {
                return this._maxHeight;
            },
            set: function (value) {
                this._maxHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "actualWidth", {
            get: function () {
                return this._actualWidth;
            },
            set: function (value) {
                this._actualWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "actualHeight", {
            get: function () {
                return this._actualHeight;
            },
            set: function (value) {
                this._actualHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "margin", {
            get: function () {
                var _this = this;
                if (!this._margin) {
                    this._margin = new BABYLON.PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.margin;
                    });
                }
                return this._margin;
            },
            set: function (value) {
                this.margin.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasMargin", {
            get: function () {
                return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "padding", {
            get: function () {
                var _this = this;
                if (!this._padding) {
                    this._padding = new BABYLON.PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.padding;
                    });
                }
                return this._padding;
            },
            set: function (value) {
                this.padding.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasPadding", {
            get: function () {
                return this._padding !== null && !this._padding.isDefault;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "marginAlignment", {
            get: function () {
                if (!this._marginAlignment) {
                    this._marginAlignment = new BABYLON.PrimitiveAlignment();
                }
                return this._marginAlignment;
            },
            set: function (value) {
                this.marginAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasMarginAlignment", {
            /**
             * Check if there a marginAlignment specified (non null and not default)
             */
            get: function () {
                return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isEnabled", {
            get: function () {
                return this._isEnabled;
            },
            set: function (value) {
                this._isEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isFocused", {
            get: function () {
                return this._isFocused;
            },
            set: function (value) {
                this._isFocused = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isMouseOver", {
            get: function () {
                return this._isMouseOver;
            },
            set: function (value) {
                this._isMouseOver = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        UIElement.prototype._isFlagSet = function (flag) {
            return (this._flags & flag) !== 0;
        };
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        UIElement.prototype._areAllFlagsSet = function (flags) {
            return (this._flags & flags) === flags;
        };
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        UIElement.prototype._areSomeFlagsSet = function (flags) {
            return (this._flags & flags) !== 0;
        };
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        UIElement.prototype._clearFlags = function (flags) {
            this._flags &= ~flags;
        };
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        UIElement.prototype._setFlags = function (flags) {
            var cur = this._flags;
            this._flags |= flags;
            return cur;
        };
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        UIElement.prototype._changeFlags = function (flags, state) {
            if (state) {
                this._flags |= flags;
            }
            else {
                this._flags &= ~flags;
            }
        };
        UIElement.prototype._assignTemplate = function (templateName) {
            if (!templateName) {
                templateName = UIElementRenderingTemplateManager.DefaultTemplateName;
            }
            var className = BABYLON.Tools.getFullClassName(this);
            if (!className) {
                throw Error("Couldn't access class name of this UIElement, you have to decorate the type with the className decorator");
            }
            var factory = UIElementRenderingTemplateManager.getRenderingTemplate(className, templateName);
            if (!factory) {
                throw Error("Couldn't get the renderingTemplate " + templateName + " of class " + className);
            }
            this._renderingTemplate = factory();
            this._renderingTemplate.attach(this);
        };
        UIElement.prototype._createVisualTree = function () {
            var parentPrim = this.ownerWindows.canvas;
            if (this.parent) {
                parentPrim = this.parent.visualChildrenPlaceholder;
            }
            this._visualPlaceholder = new BABYLON.Group2D({ parent: parentPrim, id: "GUI Visual Placeholder of " + this.id });
            var p = this._visualPlaceholder;
            p.addExternalData("_GUIOwnerElement_", this);
            p.dataSource = this;
            p.createSimpleDataBinding(BABYLON.Prim2DBase.widthProperty, "width", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.heightProperty, "height", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.actualWidthProperty, "actualWidth", BABYLON.DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.actualHeightProperty, "actualHeight", BABYLON.DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginProperty, "margin", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.paddingProperty, "padding", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginAlignmentProperty, "marginAlignment", BABYLON.DataBinding.MODE_ONEWAY);
            this.createVisualTree();
        };
        UIElement.prototype._patchUIElement = function (ownerWindow, parent) {
            if (ownerWindow) {
                if (!this._ownerWindow) {
                    ownerWindow._registerVisualToBuild(this);
                }
                this._ownerWindow = ownerWindow;
            }
            this._parent = parent;
            if (parent) {
                this._hierarchyDepth = parent.hierarchyDepth + 1;
            }
            var children = this._getChildren();
            if (children) {
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var curChild = children_1[_i];
                    curChild._patchUIElement(ownerWindow, this);
                }
            }
        };
        // Overload the SmartPropertyBase's method to provide the additional logic of returning the parent's dataSource if there's no dataSource specified at this level.
        UIElement.prototype._getDataSource = function () {
            var levelDS = _super.prototype._getDataSource.call(this);
            if (levelDS != null) {
                return levelDS;
            }
            var p = this.parent;
            if (p != null) {
                return p.dataSource;
            }
            return null;
        };
        UIElement.prototype.createVisualTree = function () {
            var res = this._renderingTemplate.createVisualTree(this, this._visualPlaceholder);
            this._visualTemplateRoot = res.root;
            this._visualChildrenPlaceholder = res.contentPlaceholder;
        };
        Object.defineProperty(UIElement.prototype, "visualPlaceholder", {
            get: function () {
                return this._visualPlaceholder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "visualTemplateRoot", {
            get: function () {
                return this._visualTemplateRoot;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "visualChildrenPlaceholder", {
            get: function () {
                return this._visualChildrenPlaceholder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_position", {
            get: function () { return null; } // TODO use abstract keyword when TS 2.0 will be approved
            ,
            enumerable: true,
            configurable: true
        });
        UIElement.UIELEMENT_PROPCOUNT = 15;
        UIElement.flagVisualToBuild = 0x0000001; // set if the UIElement visual must be updated
        __decorate([
            BABYLON.dependencyProperty(0, function (pi) { return UIElement.parentProperty = pi; })
        ], UIElement.prototype, "parent", null);
        __decorate([
            BABYLON.dependencyProperty(1, function (pi) { return UIElement.widthProperty = pi; })
        ], UIElement.prototype, "width", null);
        __decorate([
            BABYLON.dependencyProperty(2, function (pi) { return UIElement.heightProperty = pi; })
        ], UIElement.prototype, "height", null);
        __decorate([
            BABYLON.dependencyProperty(3, function (pi) { return UIElement.minWidthProperty = pi; })
        ], UIElement.prototype, "minWidth", null);
        __decorate([
            BABYLON.dependencyProperty(4, function (pi) { return UIElement.minHeightProperty = pi; })
        ], UIElement.prototype, "minHheight", null);
        __decorate([
            BABYLON.dependencyProperty(5, function (pi) { return UIElement.maxWidthProperty = pi; })
        ], UIElement.prototype, "maxWidth", null);
        __decorate([
            BABYLON.dependencyProperty(6, function (pi) { return UIElement.maxHeightProperty = pi; })
        ], UIElement.prototype, "maxHeight", null);
        __decorate([
            BABYLON.dependencyProperty(7, function (pi) { return UIElement.actualWidthProperty = pi; })
        ], UIElement.prototype, "actualWidth", null);
        __decorate([
            BABYLON.dependencyProperty(8, function (pi) { return UIElement.actualHeightProperty = pi; })
        ], UIElement.prototype, "actualHeight", null);
        __decorate([
            BABYLON.dynamicLevelProperty(9, function (pi) { return UIElement.marginProperty = pi; })
        ], UIElement.prototype, "margin", null);
        __decorate([
            BABYLON.dynamicLevelProperty(10, function (pi) { return UIElement.paddingProperty = pi; })
        ], UIElement.prototype, "padding", null);
        __decorate([
            BABYLON.dynamicLevelProperty(11, function (pi) { return UIElement.marginAlignmentProperty = pi; })
        ], UIElement.prototype, "marginAlignment", null);
        __decorate([
            BABYLON.dynamicLevelProperty(12, function (pi) { return UIElement.isEnabledProperty = pi; })
        ], UIElement.prototype, "isEnabled", null);
        __decorate([
            BABYLON.dynamicLevelProperty(13, function (pi) { return UIElement.isFocusedProperty = pi; })
        ], UIElement.prototype, "isFocused", null);
        __decorate([
            BABYLON.dynamicLevelProperty(14, function (pi) { return UIElement.isMouseOverProperty = pi; })
        ], UIElement.prototype, "isMouseOver", null);
        return UIElement;
    }(BABYLON.SmartPropertyBase));
    BABYLON.UIElement = UIElement;
    var UIElementStyle = (function () {
        function UIElementStyle() {
        }
        Object.defineProperty(UIElementStyle.prototype, "name", {
            get: function () { return null; } // TODO use abstract keyword when TS 2.0 will be approved
            ,
            enumerable: true,
            configurable: true
        });
        return UIElementStyle;
    }());
    BABYLON.UIElementStyle = UIElementStyle;
    var UIElementStyleManager = (function () {
        function UIElementStyleManager() {
        }
        UIElementStyleManager.getStyle = function (uiElType, styleName) {
            var styles = UIElementStyleManager.stylesByUIElement.get(uiElType);
            if (!styles) {
                throw Error("The type " + uiElType + " is unknown, no style were registered for it.");
            }
            var style = styles.get(styleName);
            if (!style) {
                throw Error("Couldn't find Template " + styleName + " of UIElement type " + uiElType);
            }
            return style;
        };
        UIElementStyleManager.registerStyle = function (uiElType, templateName, style) {
            var templates = UIElementStyleManager.stylesByUIElement.getOrAddWithFactory(uiElType, function () { return new BABYLON.StringDictionary(); });
            if (templates.contains(templateName)) {
                templates[templateName] = style;
            }
            else {
                templates.add(templateName, style);
            }
        };
        Object.defineProperty(UIElementStyleManager, "DefaultStyleName", {
            get: function () {
                return UIElementStyleManager._defaultStyleName;
            },
            set: function (value) {
                UIElementStyleManager._defaultStyleName = value;
            },
            enumerable: true,
            configurable: true
        });
        UIElementStyleManager.stylesByUIElement = new BABYLON.StringDictionary();
        UIElementStyleManager._defaultStyleName = "Default";
        return UIElementStyleManager;
    }());
    BABYLON.UIElementStyleManager = UIElementStyleManager;
    var UIElementRenderingTemplateManager = (function () {
        function UIElementRenderingTemplateManager() {
        }
        UIElementRenderingTemplateManager.getRenderingTemplate = function (uiElType, templateName) {
            var templates = UIElementRenderingTemplateManager.renderingTemplatesByUIElement.get(uiElType);
            if (!templates) {
                throw Error("The type " + uiElType + " is unknown, no Rendering Template were registered for it.");
            }
            var templateFactory = templates.get(templateName);
            if (!templateFactory) {
                throw Error("Couldn't find Template " + templateName + " of UI Element type " + uiElType);
            }
            return templateFactory;
        };
        UIElementRenderingTemplateManager.registerRenderingTemplate = function (uiElType, templateName, factory) {
            var templates = UIElementRenderingTemplateManager.renderingTemplatesByUIElement.getOrAddWithFactory(uiElType, function () { return new BABYLON.StringDictionary(); });
            if (templates.contains(templateName)) {
                templates[templateName] = factory;
            }
            else {
                templates.add(templateName, factory);
            }
        };
        Object.defineProperty(UIElementRenderingTemplateManager, "DefaultTemplateName", {
            get: function () {
                return UIElementRenderingTemplateManager._defaultTemplateName;
            },
            set: function (value) {
                UIElementRenderingTemplateManager._defaultTemplateName = value;
            },
            enumerable: true,
            configurable: true
        });
        UIElementRenderingTemplateManager.renderingTemplatesByUIElement = new BABYLON.StringDictionary();
        UIElementRenderingTemplateManager._defaultTemplateName = "Default";
        return UIElementRenderingTemplateManager;
    }());
    BABYLON.UIElementRenderingTemplateManager = UIElementRenderingTemplateManager;
    var UIElementRenderingTemplateBase = (function () {
        function UIElementRenderingTemplateBase() {
        }
        UIElementRenderingTemplateBase.prototype.attach = function (owner) {
            this._owner = owner;
        };
        UIElementRenderingTemplateBase.prototype.detach = function () {
        };
        Object.defineProperty(UIElementRenderingTemplateBase.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        return UIElementRenderingTemplateBase;
    }());
    BABYLON.UIElementRenderingTemplateBase = UIElementRenderingTemplateBase;
    function registerWindowRenderingTemplate(uiElType, templateName, factory) {
        return function () {
            UIElementRenderingTemplateManager.registerRenderingTemplate(uiElType, templateName, factory);
        };
    }
    BABYLON.registerWindowRenderingTemplate = registerWindowRenderingTemplate;
})(BABYLON || (BABYLON = {}));
