module BABYLON {

    export interface ICommand {
        canExecute(parameter: any): boolean;
        execute(parameter: any): void;
        canExecuteChanged: Observable<void>;
    }

    export class Command implements ICommand {
        constructor(execute: (p) => void, canExecute: (p) => boolean) {
            if (!execute) {
                throw Error("At least an execute lambda must be given at Command creation time");
            }

            this._canExecuteChanged    = null;
            this._lastCanExecuteResult = null;
            this.execute               = execute;
            this.canExecute            = canExecute;
        }

        canExecute(parameter): boolean {
            let res = true;

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
        }

        execute(parameter): void {
            this._execute(parameter);
        }

        get canExecuteChanged(): Observable<void> {
            if (!this._canExecuteChanged) {
                this._canExecuteChanged = new Observable<void>();
            }
            return this._canExecuteChanged;
        }

        private _lastCanExecuteResult: boolean;
        private _execute: (p) => void;
        private _canExecute: (p) => boolean;
        private _canExecuteChanged: Observable<void>;
    }

    export abstract class UIElement extends SmartPropertyBase {

        static get enabledState(): string {
            return UIElement._enableState;
        }

        static get disabledState(): string {
            return UIElement._disabledState;
        }

        static get mouseOverState(): string {
            return UIElement._mouseOverState;
        }

        static UIELEMENT_PROPCOUNT: number = 16;

        static parentProperty          : Prim2DPropInfo;
        static widthProperty           : Prim2DPropInfo;
        static heightProperty          : Prim2DPropInfo;
        static minWidthProperty        : Prim2DPropInfo;
        static minHeightProperty       : Prim2DPropInfo;
        static maxWidthProperty        : Prim2DPropInfo;
        static maxHeightProperty       : Prim2DPropInfo;
        static actualWidthProperty     : Prim2DPropInfo;
        static actualHeightProperty    : Prim2DPropInfo;
        static marginProperty          : Prim2DPropInfo;
        static paddingProperty         : Prim2DPropInfo;
        static marginAlignmentProperty : Prim2DPropInfo;
        static paddingAlignmentProperty: Prim2DPropInfo;
        static isEnabledProperty       : Prim2DPropInfo;
        static isFocusedProperty       : Prim2DPropInfo;
        static isMouseOverProperty     : Prim2DPropInfo;

        constructor(settings: {
            id               ?: string,
            parent           ?: UIElement,
            templateName     ?: string,
            styleName        ?: string,
            minWidth         ?: number,
            minHeight        ?: number,
            maxWidth         ?: number,
            maxHeight        ?: number,
            width            ?: number,
            height           ?: number,
            marginTop        ?: number | string,
            marginLeft       ?: number | string,
            marginRight      ?: number | string,
            marginBottom     ?: number | string,
            margin           ?: number | string,
            marginHAlignment ?: number,
            marginVAlignment ?: number,
            marginAlignment  ?: string,
            paddingTop       ?: number | string,
            paddingLeft      ?: number | string,
            paddingRight     ?: number | string,
            paddingBottom    ?: number | string,
            padding          ?: string,
            paddingHAlignment?: number,
            paddingVAlignment?: number,
            paddingAlignment ?: string,
        }) {
            super();

            if (!settings) {
                throw Error("A settings object must be passed with at least either a parent or owner parameter");
            }

            let type                        = Tools.getFullClassName(this);
            this._ownerWindow               = null;
            this._parent                    = null;
            this._visualPlaceholder         = null;
            this._visualTemplateRoot        = null;
            this._visualChildrenPlaceholder = null;
            this._hierarchyDepth            = 0;
            this._renderingTemplateName     = (settings.templateName != null) ? settings.templateName : GUIManager.DefaultTemplateName;
            this._style                     = (settings.styleName!=null) ? GUIManager.getStyle(type, settings.styleName) : null;
            this._flags                     = 0;
            this._id                        = (settings.id!=null) ? settings.id : null;
            this._uid                       = null;
            this._width                     = (settings.width     != null) ? settings.width     : null;
            this._height                    = (settings.height    != null) ? settings.height    : null;
            this._minWidth                  = (settings.minWidth  != null) ? settings.minWidth  : 0;
            this._minHeight                 = (settings.minHeight != null) ? settings.minHeight : 0;
            this._maxWidth                  = (settings.maxWidth  != null) ? settings.maxWidth  : Number.MAX_VALUE;
            this._maxHeight                 = (settings.maxHeight != null) ? settings.maxHeight : Number.MAX_VALUE;
            this._margin                    = null;
            this._padding                   = null;
            this._marginAlignment           = null;

            this._setFlags(UIElement.flagIsVisible|UIElement.flagIsEnabled);

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
                    this.margin.fromString(<string>settings.margin);
                } else {
                    this.margin.fromUniformPixels(<number>settings.margin);
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

            if (settings.paddingHAlignment) {
                this.paddingAlignment.horizontal = settings.paddingHAlignment;
            }

            if (settings.paddingVAlignment) {
                this.paddingAlignment.vertical = settings.paddingVAlignment;
            }

            if (settings.paddingAlignment) {
                this.paddingAlignment.fromString(settings.paddingAlignment);
            }

            if (settings.parent != null) {
                this._parent = settings.parent;
                this._hierarchyDepth = this._parent._hierarchyDepth + 1;
            }
        }

        public dispose(): boolean {
            if (this.isDisposed) {
                return false;
            }

            if (this._renderingTemplate) {
                this._renderingTemplate.detach();
                this._renderingTemplate = null;
            }

            super.dispose();

            // Don't set to null, it may upset somebody...
            this.animations.splice(0);

            return true;
        }

        /**
         * Animation array, more info: http://doc.babylonjs.com/tutorials/Animations
         */
        public animations: Animation[];

        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        public getAnimatables(): IAnimatable[] {
            return new Array<IAnimatable>();
        }

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

        public findById(id: string): UIElement {
            if (this._id === id) {
                return this;
            }

            let children = this._getChildren();
            for (let child of children) {
                let r = child.findById(id);
                if (r != null) {
                    return r;
                }
            }
        }

        public get ownerWindow(): Window {
            return this._ownerWindow;
        }

        public get style(): string {
            if (!this.style) {
                return GUIManager.DefaultStyleName;
            }
            return this._style.name;
        }

        public set style(value: string) {
            if (this._style && (this._style.name === value)) {
                return;
            }

            let newStyle: UIElementStyle = null;
            if (value) {
                newStyle = GUIManager.getStyle(Tools.getFullClassName(this), value);
                if (!newStyle) {
                    throw Error(`Couldn't find Style ${value} for UIElement ${Tools.getFullClassName(this)}`);
                }
            }

            if (this._style) {
                this._style.removeStyle(this);
            }

            if (newStyle) {
                newStyle.applyStyle(this);
            }
            
            this._style = newStyle;
        }

        /**
         * A string that identifies the UIElement.
         * The id is optional and there's possible collision with other UIElement's id as the uniqueness is not supported.
         */
        public get id(): string {
            return this._id;
        }

        public set id(value: string) {
            if (this._id === value) {
                return;
            }

            this._id = value;
        }

        /**
         * Return a unique id automatically generated.
         * This property is mainly used for serialization to ensure a perfect way of identifying a UIElement
         */
        public get uid(): string {
            if (!this._uid) {
                this._uid = Tools.RandomId();
            }
            return this._uid;
        }

        public get hierarchyDepth(): number {
            return this._hierarchyDepth;
        }

        @dependencyProperty(0, pi => UIElement.parentProperty = pi)
        public get parent(): UIElement {
            return this._parent;
        }

        public set parent(value: UIElement) {
            this._parent = value;
        }

        @dependencyProperty(1, pi => UIElement.widthProperty = pi)
        public get width(): number {
            return this._width;
        }

        public set width(value: number) {
            this._width = value;
        }

        @dependencyProperty(2, pi => UIElement.heightProperty = pi)
        public get height(): number {
            return this._height;
        }

        public set height(value: number) {
            this._height = value;
        }

        @dependencyProperty(3, pi => UIElement.minWidthProperty = pi)
        public get minWidth(): number {
            return this._minWidth;
        }

        public set minWidth(value: number) {
            this._minWidth = value;
        }

        @dependencyProperty(4, pi => UIElement.minHeightProperty = pi)
        public get minHheight(): number {
            return this._minHeight;
        }

        public set minHeight(value: number) {
            this._minHeight = value;
        }

        @dependencyProperty(5, pi => UIElement.maxWidthProperty = pi)
        public get maxWidth(): number {
            return this._maxWidth;
        }

        public set maxWidth(value: number) {
            this._maxWidth = value;
        }

        @dependencyProperty(6, pi => UIElement.maxHeightProperty = pi)
        public get maxHeight(): number {
            return this._maxHeight;
        }

        public set maxHeight(value: number) {
            this._maxHeight = value;
        }

        @dependencyProperty(7, pi => UIElement.actualWidthProperty = pi)
        public get actualWidth(): number {
            return this._actualWidth;
        }

        public set actualWidth(value: number) {
            this._actualWidth = value;
        }

        @dependencyProperty(8, pi => UIElement.actualHeightProperty = pi)
        public get actualHeight(): number {
            return this._actualHeight;
        }

        public set actualHeight(value: number) {
            this._actualHeight = value;
        }

        @dynamicLevelProperty(9, pi => UIElement.marginProperty = pi)
        /**
         * You can get/set a margin on the primitive through this property
         * @returns the margin object, if there was none, a default one is created and returned
         */
        public get margin(): PrimitiveThickness {
            if (!this._margin) {
                this._margin = new PrimitiveThickness(() => {
                    if (!this.parent) {
                        return null;
                    }
                    return this.parent.margin;
                });
            }
            return this._margin;
        }

        public set margin(value: PrimitiveThickness) {
            this.margin.copyFrom(value);
        }

        public get _hasMargin(): boolean {
            return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
        }

        @dynamicLevelProperty(10, pi => UIElement.paddingProperty = pi)
        /**
         * You can get/set a margin on the primitive through this property
         * @returns the margin object, if there was none, a default one is created and returned
         */
        public get padding(): PrimitiveThickness {
            if (!this._padding) {
                this._padding = new PrimitiveThickness(() => {
                    if (!this.parent) {
                        return null;
                    }
                    return this.parent.padding;
                });
            }
            return this._padding;
        }

        public set padding(value: PrimitiveThickness) {
            this.padding.copyFrom(value);
        }

        private get _hasPadding(): boolean {
            return this._padding !== null && !this._padding.isDefault;
        }

        @dynamicLevelProperty(11, pi => UIElement.marginAlignmentProperty = pi)
        /**
         * You can get/set the margin alignment through this property
         */
        public get marginAlignment(): PrimitiveAlignment {
            if (!this._marginAlignment) {
                this._marginAlignment = new PrimitiveAlignment();
            }
            return this._marginAlignment;
        }

        public set marginAlignment(value: PrimitiveAlignment) {
            this.marginAlignment.copyFrom(value);
        }

        /**
         * Check if there a marginAlignment specified (non null and not default)
         */
        public get _hasMarginAlignment(): boolean {
            return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
        }

        @dynamicLevelProperty(12, pi => UIElement.paddingAlignmentProperty = pi)
        /**
         * You can get/set the margin alignment through this property
         */
        public get paddingAlignment(): PrimitiveAlignment {
            if (!this._paddingAlignment) {
                this._paddingAlignment = new PrimitiveAlignment();
            }
            return this._paddingAlignment;
        }

        public set paddingAlignment(value: PrimitiveAlignment) {
            this.paddingAlignment.copyFrom(value);
        }

        /**
         * Check if there a marginAlignment specified (non null and not default)
         */
        public get _hasPaddingAlignment(): boolean {
            return (this._paddingAlignment !== null && !this._paddingAlignment.isDefault);
        }

        public get isVisible(): boolean {
            return this._isFlagSet(UIElement.flagIsVisible);
        }

        public set isVisible(value: boolean) {
            if (this.isVisible === value) {
                return;
            }

            this._visualPlaceholder.levelVisible = value;

            this._changeFlags(UIElement.flagIsVisible, value);
        }

        @dynamicLevelProperty(13, pi => UIElement.isEnabledProperty = pi)
        /**
         * True if the UIElement is enabled, false if it's disabled.
         * User interaction is not possible if the UIElement is not enabled
         */
        public get isEnabled(): boolean {
            return this._isFlagSet(UIElement.flagIsEnabled);
        }

        public set isEnabled(value: boolean) {
            this._changeFlags(UIElement.flagIsEnabled, value);
        }

        @dynamicLevelProperty(14, pi => UIElement.isFocusedProperty = pi)
        /**
         * True if the UIElement has the focus, false if it doesn't
         */
        public get isFocused(): boolean {
            return this._isFlagSet(UIElement.flagIsFocus);
        }

        public set isFocused(value: boolean) {
            // If the UIElement doesn't accept focus, set it on its parent
            if (!this.isFocusable) {
                let p = this.parent;
                if (!p) {
                    return;
                }
                p.isFocused = value;
            }

            // If the focus is being set, notify the Focus Manager
            if (value) {
                this.ownerWindow.focusManager.setFocusOn(this, this.getFocusScope());
            }

            this._changeFlags(UIElement.flagIsFocus, value);
        }

        @dynamicLevelProperty(15, pi => UIElement.isMouseOverProperty = pi)
        /**
         * True if the UIElement has the mouse over it
         */
        public get isMouseOver(): boolean {
            return this._isFlagSet(UIElement.flagIsMouseOver);
        }

        public set isMouseOver(value: boolean) {
            this._changeFlags(UIElement.flagIsMouseOver, value);
        }

        public get isFocusScope(): boolean {
            return this._isFlagSet(UIElement.flagIsFocusScope);
        }

        public set isFocusScope(value: boolean) {
            this._changeFlags(UIElement.flagIsFocusScope, value);
        }

        public get isFocusable(): boolean {
            return this._isFlagSet(UIElement.flagIsFocusable);
        }

        public set isFocusable(value: boolean) {
            this._changeFlags(UIElement.flagIsFocusable, value);
        }

        // Look for the nearest parent which is the focus scope. Should always return something as the Window UIElement which is the root of all UI Tree is focus scope (unless the user disable it)
        protected getFocusScope(): UIElement {
            if (this.isFocusScope) {
                return this;
            }

            let p = this.parent;
            if (!p) {
                return null;
            }

            return p.getFocusScope();
        }

        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        public _isFlagSet(flag: number): boolean {
            return (this._flags & flag) !== 0;
        }

        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        public _areAllFlagsSet(flags: number): boolean {
            return (this._flags & flags) === flags;
        }

        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        public _areSomeFlagsSet(flags: number): boolean {
            return (this._flags & flags) !== 0;
        }

        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        public _clearFlags(flags: number) {
            this._flags &= ~flags;
        }

        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        public _setFlags(flags: number): number {
            let cur = this._flags;
            this._flags |= flags;
            return cur;
        }

        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        public _changeFlags(flags: number, state: boolean) {
            if (state) {
                this._flags |= flags;
            } else {
                this._flags &= ~flags;
            }
        }

        private _assignTemplate(templateName: string) {
            if (!templateName) {
                templateName = GUIManager.DefaultTemplateName;
            }
            let className = Tools.getFullClassName(this);
            if (!className) {
                throw Error("Couldn't access class name of this UIElement, you have to decorate the type with the className decorator");
            }

            let factory = GUIManager.getRenderingTemplate(className, templateName);
            if (!factory) {
                throw Error(`Couldn't get the renderingTemplate ${templateName} of class ${className}`);
            }

            this._renderingTemplateName = templateName;
            this._renderingTemplate = factory();
            this._renderingTemplate.attach(this);
        }

        public _createVisualTree() {
            let parentPrim: Prim2DBase = this.ownerWindow.canvas;
            if (this.parent) {
                parentPrim = this.parent.visualChildrenPlaceholder;
            }

            if (!this._renderingTemplate) {
                this._assignTemplate(this._renderingTemplateName);               
            }

            this._visualPlaceholder = new Group2D({ parent: parentPrim, id: `GUI ${Tools.getClassName(this)} RootGroup of ${this.id}`});
            let p = this._visualPlaceholder;
            p.addExternalData<UIElement>("_GUIOwnerElement_", this);
            p.dataSource = this;

            p.createSimpleDataBinding(Prim2DBase.widthProperty          , "width"          , DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(Prim2DBase.heightProperty         , "height"         , DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(Prim2DBase.actualWidthProperty    , "actualWidth"    , DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(Prim2DBase.actualHeightProperty   , "actualHeight"   , DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(Prim2DBase.marginProperty         , "margin"         , DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(Prim2DBase.marginAlignmentProperty, "marginAlignment", DataBinding.MODE_ONEWAY);
            this.createVisualTree();
        }

        public _patchUIElement(ownerWindow: Window, parent: UIElement) {
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

            let children = this._getChildren();
            if (children) {
                for (let curChild of children) {
                    curChild._patchUIElement(ownerWindow, this);
                }
            }
        }

        // Overload the SmartPropertyBase's method to provide the additional logic of returning the parent's dataSource if there's no dataSource specified at this level.
        protected _getDataSource(): IPropertyChanged {
            let levelDS = super._getDataSource();
            if (levelDS != null) {
                return levelDS;
            }

            let p = this.parent;
            if (p != null) {
                return p.dataSource;
            }

            return null;
        }

        protected createVisualTree() {
            let res = this._renderingTemplate.createVisualTree(this, this._visualPlaceholder);
            this._visualTemplateRoot = res.root;
            this._visualChildrenPlaceholder = res.contentPlaceholder;
        }

        protected get visualPlaceholder(): Prim2DBase {
            return this._visualPlaceholder;
        }

        protected get visualTemplateRoot(): Prim2DBase {
            return this._visualTemplateRoot;
        }

        protected get visualChildrenPlaceholder(): Prim2DBase {
            return this._visualChildrenPlaceholder;
        }

        protected get _position(): Vector2 { return null; } // TODO use abstract keyword when TS 2.0 will be approved
        protected abstract _getChildren(): Array<UIElement>;

        public static flagVisualToBuild = 0x0000001;
        public static flagIsVisible     = 0x0000002;
        public static flagIsFocus       = 0x0000004;
        public static flagIsFocusScope  = 0x0000008;
        public static flagIsFocusable   = 0x0000010;
        public static flagIsEnabled     = 0x0000020;
        public static flagIsMouseOver   = 0x0000040;

        protected _visualPlaceholder: Group2D;
        protected _visualTemplateRoot: Prim2DBase;
        protected _visualChildrenPlaceholder: Prim2DBase;
        private _renderingTemplateName: string;
        protected _renderingTemplate: UIElementRenderingTemplateBase;
        private _parent: UIElement;
        private _hierarchyDepth: number;
        private _flags: number;
        private _style: UIElementStyle;
        private _ownerWindow: Window;
        private _id: string;
        private _uid: string;
        private _actualWidth: number;
        private _actualHeight: number;
        private _minWidth: number;
        private _minHeight: number;
        private _maxWidth: number;
        private _maxHeight: number;
        private _width: number;
        private _height: number;
        private _margin: PrimitiveThickness;
        private _padding: PrimitiveThickness;
        private _marginAlignment: PrimitiveAlignment;
        private _paddingAlignment: PrimitiveAlignment;

        private static _enableState = "Enabled";
        private static _disabledState = "Disabled";
        private static _mouseOverState = "MouseOver";
    }

    export abstract class UIElementStyle {
        abstract removeStyle(uiel: UIElement);
        abstract applyStyle(uiel: UIElement);
        get name(): string { return null; } // TODO use abstract keyword when TS 2.0 will be approved
    }

    export class GUIManager {

        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // DATA TEMPLATE MANAGER

        static registerDataTemplate(className: string, factory: (parent: UIElement, dataObject: any) => UIElement) {
            
        }

        // DATA TEMPLATE MANAGER
        /////////////////////////////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // STYLE MANAGER

        static getStyle(uiElType: string, styleName: string): UIElementStyle {
            let styles = GUIManager.stylesByUIElement.get(uiElType);
            if (!styles) {
                throw Error(`The type ${uiElType} is unknown, no style were registered for it.`);
            }
            let style = styles.get(styleName);
            if (!style) {
                throw Error(`Couldn't find Template ${styleName} of UIElement type ${uiElType}`);
            }
            return style;
        }

        static registerStyle(uiElType: string, templateName: string, style: UIElementStyle) {
            let templates = GUIManager.stylesByUIElement.getOrAddWithFactory(uiElType, () => new StringDictionary<UIElementStyle>());
            if (templates.contains(templateName)) {
                templates[templateName] = style;
            } else {
                templates.add(templateName, style);
            }
        }

        static stylesByUIElement: StringDictionary<StringDictionary<UIElementStyle>> = new StringDictionary<StringDictionary<UIElementStyle>>();

        public static get DefaultStyleName(): string {
            return GUIManager._defaultStyleName;
        }

        public static set DefaultStyleName(value: string) {
            GUIManager._defaultStyleName = value;
        }

        // STYLE MANAGER
        /////////////////////////////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // RENDERING TEMPLATE MANAGER
        static getRenderingTemplate(uiElType: string, templateName: string): () => UIElementRenderingTemplateBase {
            let templates = GUIManager.renderingTemplatesByUIElement.get(uiElType);
            if (!templates) {
                throw Error(`The type ${uiElType} is unknown, no Rendering Template were registered for it.`);
            }
            let templateFactory = templates.get(templateName);
            if (!templateFactory) {
                throw Error(`Couldn't find Template ${templateName} of UI Element type ${uiElType}`);
            }
            return templateFactory;
        }

        static registerRenderingTemplate(uiElType: string, templateName: string, factory: () => UIElementRenderingTemplateBase) {
            let templates = GUIManager.renderingTemplatesByUIElement.getOrAddWithFactory(uiElType, () => new StringDictionary<() => UIElementRenderingTemplateBase>());
            if (templates.contains(templateName)) {
                templates[templateName] = factory;
            } else {
                templates.add(templateName, factory);
            }
        }

        static renderingTemplatesByUIElement: StringDictionary<StringDictionary<() => UIElementRenderingTemplateBase>> = new StringDictionary<StringDictionary<() => UIElementRenderingTemplateBase>>();

        public static get DefaultTemplateName(): string {
            return GUIManager._defaultTemplateName;
        }

        public static set DefaultTemplateName(value: string) {
            GUIManager._defaultTemplateName = value;
        }

        // RENDERING TEMPLATE MANAGER
        /////////////////////////////////////////////////////////////////////////////////////////////////////

        private static _defaultTemplateName = "Default";
        private static _defaultStyleName = "Default";
    }

    export abstract class UIElementRenderingTemplateBase {
        attach(owner: UIElement) {
            this._owner = owner;
        }
        detach() {
            
        }

        public get owner(): UIElement {
            return this._owner;
        }

        abstract createVisualTree(owner: UIElement, visualPlaceholder: Group2D): { root: Prim2DBase, contentPlaceholder: Prim2DBase };

        private _owner: UIElement;
    }

    export function registerWindowRenderingTemplate(uiElType: string, templateName: string, factory: () => UIElementRenderingTemplateBase): (target: Object) => void {
        return () => {
            GUIManager.registerRenderingTemplate(uiElType, templateName, factory);
        }
    }

}