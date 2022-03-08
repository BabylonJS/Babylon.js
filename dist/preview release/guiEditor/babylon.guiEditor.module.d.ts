/// <reference types="react" />
declare module "babylonjs-gui-editor/controlTypes" {
    export const ControlTypes: {
        className: string;
        icon: string;
    }[];
}
declare module "babylonjs-gui-editor/components/log/logComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface ILogComponentProps {
        globalState: GlobalState;
    }
    export class LogEntry {
        message: string;
        isError: boolean;
        constructor(message: string, isError: boolean);
    }
    export class LogComponent extends React.Component<ILogComponentProps, {
        logs: LogEntry[];
    }> {
        constructor(props: ILogComponentProps);
        componentDidMount(): void;
        componentDidUpdate(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/tools" {
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Grid } from "babylonjs-gui/2D/controls/grid";
    import { Vector2 } from "babylonjs/Maths/math";
    export class Tools {
        static LookForItems(item: any, selectedEntities: any[], firstIteration?: boolean): boolean;
        private static _RecursiveRemoveHiddenMeshesAndHoistChildren;
        static SortAndFilter(parent: any, items: any[]): any[];
        static getCellInfo(grid: Grid, control: Control): Vector2;
        static reorderGrid(grid: Grid, index: number, control: Control, cell: Vector2): void;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent" {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
        allowNullValue?: boolean;
    }
}
declare module "babylonjs-gui-editor/diagram/coordinateHelper" {
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Matrix2D } from "babylonjs-gui/2D/math2D";
    import { Vector2 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    export type DimensionProperties = "width" | "left" | "height" | "top" | "paddingLeft" | "paddingRight" | "paddingTop" | "paddingBottom" | "fontSize";
    export class Rect {
        top: number;
        left: number;
        right: number;
        bottom: number;
        constructor(left: number, top: number, right: number, bottom: number);
        clone(): Rect;
        get center(): Vector2;
        get width(): number;
        get height(): number;
    }
    export class CoordinateHelper {
        private static _matrixCache;
        static globalState: GlobalState;
        /**
         * Get the scaling of a specific GUI control
         * @param node the node for which we are getting the scaling
         * @param relative should we return only the relative scaling (relative to the parent)
         * @returns an X,Y vector of the scaling
         */
        static getScale(node: Control, relative?: boolean): Vector2;
        static getRotation(node: Control, relative?: boolean): number;
        /**
         * This function calculates a local matrix for a node, including it's full transformation and pivot point
         *
         * @param node the node to calculate the matrix for
         * @param useStoredValues should the stored (cached) values be used to calculate the matrix
         * @returns a new matrix for the control
         */
        static getNodeMatrix(node: Control, storedValues?: Rect): Matrix2D;
        /**
         * Using the node's tree, calculate its world matrix and return it
         * @param node the node to calculate the matrix for
         * @param useStoredValuesIfPossible used stored valued (cached when pointer down is clicked)
         * @returns the world matrix for this node
         */
        static nodeToRTTWorldMatrix(node: Control, storedValues?: Rect): Matrix2D;
        static nodeToRTTSpace(node: Control, x: number, y: number, reference?: Vector2, storedValues?: Rect): Vector2;
        static rttToLocalNodeSpace(node: Control, x: number, y: number, reference?: Vector2, storedValues?: Rect): Vector2;
        static rttToCanvasSpace(x: number, y: number): Vector2;
        static mousePointerToRTTSpace(node: Control, x?: number, y?: number): Vector2;
        private static resetMatrixArray;
        static computeLocalBounds(node: Control): Rect;
        /**
         * converts a node's dimensions to percentage, properties can be specified as a list, or can convert all
        */
        static convertToPercentage(guiControl: Control, properties?: DimensionProperties[], onPropertyChangedObservable?: Observable<PropertyChangedEvent>): void;
        static round(value: number): number;
        static convertToPixels(guiControl: Control, properties?: DimensionProperties[], onPropertyChangedObservable?: Observable<PropertyChangedEvent>): void;
    }
}
declare module "babylonjs-gui-editor/diagram/workbench" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Vector2, Vector3 } from "babylonjs/Maths/math.vector";
    import { Scene } from "babylonjs/scene";
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { ISize } from "babylonjs/Maths/math";
    export interface IWorkbenchComponentProps {
        globalState: GlobalState;
    }
    export enum ConstraintDirection {
        NONE = 0,
        X = 2,
        Y = 3
    }
    export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
        private _rootContainer;
        private _setConstraintDirection;
        private _mouseStartPointX;
        private _mouseStartPointY;
        _scene: Scene;
        private _ctrlKeyIsPressed;
        private _altKeyIsPressed;
        private _constraintDirection;
        private _forcePanning;
        private _forceZooming;
        private _forceSelecting;
        private _panning;
        private _canvas;
        private _responsive;
        private _isOverGUINode;
        private _engine;
        private _liveRenderObserver;
        private _guiRenderObserver;
        private _mainSelection;
        private _selectionDepth;
        private _doubleClick;
        _liveGuiTextureRerender: boolean;
        private _anyControlClicked;
        private _visibleRegionContainer;
        get visibleRegionContainer(): Container;
        private _panAndZoomContainer;
        get panAndZoomContainer(): Container;
        private _trueRootContainer;
        set trueRootContainer(value: Container);
        get trueRootContainer(): Container;
        private _nextLiveGuiRender;
        private _liveGuiRerenderDelay;
        private _defaultGUISize;
        private _initialPanningOffset;
        private _panningOffset;
        private _zoomFactor;
        private _zoomModeIncrement;
        private _guiSize;
        get guiSize(): ISize;
        set guiSize(value: ISize);
        applyEditorTransformation(): void;
        removeEditorTransformation(): void;
        get globalState(): GlobalState;
        get nodes(): Control[];
        get selectedGuiNodes(): Control[];
        private _getParentWithDepth;
        private _getMaxParent;
        constructor(props: IWorkbenchComponentProps);
        determineMouseSelection(selection: Control): void;
        keyEvent: (evt: KeyboardEvent) => void;
        private _deleteSelectedNodes;
        copyToClipboard(copyFn: (content: string) => void): void;
        cutToClipboard(copyFn: (content: string) => void): void;
        pasteFromClipboard(clipboardContents: string): boolean;
        CopyGUIControl(original: Control): void;
        private selectAllGUI;
        blurEvent: () => void;
        componentWillUnmount(): void;
        loadFromJson(serializationObject: any): void;
        loadFromSnippet(snippetId: string): Promise<void>;
        loadToEditor(): void;
        updateNodeOutlines(): void;
        findNodeFromGuiElement(guiControl: Control): Control;
        appendBlock(guiElement: Control): Control;
        private _isMainSelectionParent;
        createNewGuiNode(guiControl: Control): Control;
        private parent;
        private _convertToPixels;
        private _reorderGrid;
        private _isNotChildInsert;
        private _adjustParentingIndex;
        isSelected(value: boolean, guiNode: Control): void;
        clicked: boolean;
        _onMove(guiControl: Control, evt: Vector2, startPos: Vector2, ignorClick?: boolean): boolean;
        onMove(evt: React.PointerEvent): void;
        private _screenToTexturePosition;
        private getScaledPointerPosition;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        isUp: boolean;
        onUp(evt: React.PointerEvent): void;
        createGUICanvas(): void;
        synchronizeLiveGUI(): void;
        addControls(scene: Scene): void;
        panning(): void;
        moveControls(moveHorizontal: boolean, amount: number): void;
        zoomWheel(event: WheelEvent): number;
        zooming(delta: number): void;
        zeroIfClose(vec: Vector3): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject" {
    /**
     * Class used to provide lock mechanism
     */
    export class LockObject {
        /**
         * Gets or set if the lock is engaged
         */
        lock: boolean;
    }
}
declare module "babylonjs-gui-editor/globalState" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { LogEntry } from "babylonjs-gui-editor/components/log/logComponent";
    import { Color3 } from "babylonjs/Maths/math.color";
    import { WorkbenchComponent } from "babylonjs-gui-editor/diagram/workbench";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Scene } from "babylonjs/scene";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { ISize } from "babylonjs/Maths/math";
    export enum DragOverLocation {
        ABOVE = 0,
        BELOW = 1,
        CENTER = 2,
        NONE = 3
    }
    export class GlobalState {
        liveGuiTexture: Nullable<AdvancedDynamicTexture>;
        guiTexture: AdvancedDynamicTexture;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        selectedControls: Control[];
        onSelectionChangedObservable: Observable<void>;
        onResizeObservable: Observable<ISize>;
        onBuiltObservable: Observable<void>;
        onResetRequiredObservable: Observable<void>;
        onUpdateRequiredObservable: Observable<void>;
        onLogRequiredObservable: Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: Observable<string>;
        onIsLoadingChanged: Observable<boolean>;
        onSelectionBoxMoved: Observable<ClientRect | DOMRect>;
        onNewSceneObservable: Observable<Nullable<Scene>>;
        onGuiNodeRemovalObservable: Observable<Control>;
        onPopupClosedObservable: Observable<void>;
        private _backgroundColor;
        private _outlines;
        isMultiSelecting: boolean;
        onOutlineChangedObservable: Observable<void>;
        blockKeyboardEvents: boolean;
        controlCamera: boolean;
        selectionLock: boolean;
        workbench: WorkbenchComponent;
        onPropertyChangedObservable: Observable<PropertyChangedEvent>;
        onZoomObservable: Observable<void>;
        onFitToWindowObservable: Observable<void>;
        onPanObservable: Observable<void>;
        onSelectionButtonObservable: Observable<void>;
        onLoadObservable: Observable<File>;
        onSaveObservable: Observable<void>;
        onSnippetLoadObservable: Observable<void>;
        onSnippetSaveObservable: Observable<void>;
        onResponsiveChangeObservable: Observable<boolean>;
        onParentingChangeObservable: Observable<Nullable<Control>>;
        onDropObservable: Observable<void>;
        onPropertyGridUpdateRequiredObservable: Observable<void>;
        onDraggingEndObservable: Observable<void>;
        onDraggingStartObservable: Observable<void>;
        onWindowResizeObservable: Observable<void>;
        onGizmoUpdateRequireObservable: Observable<void>;
        onArtBoardUpdateRequiredObservable: Observable<void>;
        onBackgroundColorChangeObservable: Observable<void>;
        onPointerMoveObservable: Observable<import("react").PointerEvent<HTMLCanvasElement>>;
        onPointerUpObservable: Observable<Nullable<PointerEvent | import("react").PointerEvent<HTMLCanvasElement>>>;
        draggedControl: Nullable<Control>;
        draggedControlDirection: DragOverLocation;
        onCopyObservable: Observable<(content: string) => void>;
        onCutObservable: Observable<(content: string) => void>;
        onPasteObservable: Observable<string>;
        isSaving: boolean;
        lockObject: LockObject;
        storeEditorData: (serializationObject: any) => void;
        customSave?: {
            label: string;
            action: (data: string) => Promise<string>;
        };
        customLoad?: {
            label: string;
            action: (data: string) => Promise<string>;
        };
        constructor();
        /** adds copy, cut and paste listeners to the host window */
        registerEventListeners(): void;
        private _updateKeys;
        get backgroundColor(): Color3;
        set backgroundColor(value: Color3);
        get outlines(): boolean;
        set outlines(value: boolean);
        select(control: Control): void;
        setSelection(controls: Control[]): void;
        isMultiSelectable(control: Control): boolean;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/stringTools" {
    export class StringTools {
        private static _SaveAs;
        private static _Click;
        /**
         * Download a string into a file that will be saved locally by the browser
         * @param content defines the string to download locally as a file
         */
        static DownloadAsFile(document: HTMLDocument, content: string, filename: string): void;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/textLineComponent" {
    import * as React from "react";
    interface ITextLineComponentProps {
        label?: string;
        value?: string;
        color?: string;
        underline?: boolean;
        onLink?: () => void;
        url?: string;
        ignoreValue?: boolean;
        additionalClass?: string;
        icon?: string;
        iconLabel?: string;
        tooltip?: string;
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/targetsProxy" {
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Observable } from "babylonjs/Misc/observable";
    export const conflictingValuesPlaceholder = "\u2014";
    /**
     *
     * @param propertyName the property that the input changes
     * @param targets a list of selected targets
     * @param defaultValue the value that should be returned when two targets have conflicting values
     * @param setter an optional setter function to override the default setter behavior
     * @returns a proxy object that can be passed as a target into the input
     */
    export function makeTargetsProxy<Type>(targets: Type[], onPropertyChangedObservable?: Observable<PropertyChangedEvent>, getProperty?: (target: Type, property: keyof Type) => any): any;
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/floatLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IFloatLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        lockObject?: LockObject;
        onChange?: (newValue: number) => void;
        isInteger?: boolean;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        additionalClass?: string;
        step?: string;
        digits?: number;
        useEuler?: boolean;
        min?: number;
        max?: number;
        smallUI?: boolean;
        onEnter?: (newValue: number) => void;
        icon?: string;
        iconLabel?: string;
        defaultValue?: number;
        unit?: string;
        onUnitClicked?: () => void;
        unitLocked?: boolean;
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        constructor(props: IFloatLineComponentProps);
        componentWillUnmount(): void;
        getValueString(value: any): string;
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/sliderLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface ISliderLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        minimum: number;
        maximum: number;
        step: number;
        directValue?: number;
        useEuler?: boolean;
        onChange?: (value: number) => void;
        onInput?: (value: number) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        decimalCount?: number;
        margin?: boolean;
        icon?: string;
        iconLabel?: string;
        lockObject?: LockObject;
    }
    export class SliderLineComponent extends React.Component<ISliderLineComponentProps, {
        value: number;
    }> {
        private _localChange;
        constructor(props: ISliderLineComponentProps);
        shouldComponentUpdate(nextProps: ISliderLineComponentProps, nextState: {
            value: number;
        }): boolean;
        onChange(newValueString: any): void;
        onInput(newValueString: any): void;
        prepareDataToRead(value: number): number;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/inputArrowsComponent" {
    import * as React from "react";
    interface IInputArrowsComponentProps {
        incrementValue: (amount: number) => void;
        setDragging: (dragging: boolean) => void;
    }
    export class InputArrowsComponent extends React.Component<IInputArrowsComponentProps> {
        private _arrowsRef;
        private _drag;
        private _releaseListener;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/textInputLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface ITextInputLineComponentProps {
        label?: string;
        lockObject: LockObject;
        target?: any;
        propertyName?: string;
        value?: string;
        onChange?: (value: string) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        icon?: string;
        iconLabel?: string;
        noUnderline?: boolean;
        numbersOnly?: boolean;
        delayInput?: boolean;
        unit?: string;
        onUnitClicked?: (unit: string) => void;
        unitLocked?: boolean;
        arrows?: boolean;
        arrowsIncrement?: (amount: number) => void;
        step?: number;
    }
    export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, {
        value: string;
        dragging: boolean;
    }> {
        private _localChange;
        constructor(props: ITextInputLineComponentProps);
        componentWillUnmount(): void;
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
            dragging: boolean;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string): void;
        incrementValue(amount: number): void;
        onKeyDown(event: React.KeyboardEvent): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/commandButtonComponent" {
    import * as React from "react";
    interface ICommandButtonComponentProps {
        tooltip: string;
        shortcut?: string;
        icon: string;
        iconLabel?: string;
        isActive: boolean;
        onClick: () => void;
        altStyle?: boolean;
        disabled?: boolean;
    }
    export class CommandButtonComponent extends React.Component<ICommandButtonComponentProps> {
        constructor(props: ICommandButtonComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/checkBoxLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    export interface ICheckBoxLineComponentProps {
        label?: string;
        target?: any;
        propertyName?: string;
        isSelected?: () => boolean;
        onSelect?: (value: boolean) => void;
        onValueChanged?: () => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        disabled?: boolean;
        icon?: string;
        iconLabel?: string;
        faIcons?: {
        };
    }
    export class CheckBoxLineComponent extends React.Component<ICheckBoxLineComponentProps, {
        isSelected: boolean;
        isDisabled?: boolean;
        isConflict: boolean;
    }> {
        private _localChange;
        constructor(props: ICheckBoxLineComponentProps);
        shouldComponentUpdate(nextProps: ICheckBoxLineComponentProps, nextState: {
            isSelected: boolean;
            isDisabled: boolean;
            isConflict: boolean;
        }): boolean;
        onChange(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/numericInputComponent" {
    import * as React from "react";
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
        precision?: number;
        icon?: string;
        iconLabel?: string;
    }
    export class NumericInputComponent extends React.Component<INumericInputComponentProps, {
        value: string;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: INumericInputComponentProps);
        shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: {
            value: string;
        }): boolean;
        updateValue(evt: any): void;
        onBlur(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/colorPicker/colorComponentEntry" {
    import * as React from "react";
    export interface IColorComponentEntryProps {
        value: number;
        label: string;
        max?: number;
        min?: number;
        onChange: (value: number) => void;
    }
    export class ColorComponentEntry extends React.Component<IColorComponentEntryProps> {
        constructor(props: IColorComponentEntryProps);
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/colorPicker/hexColor" {
    import * as React from "react";
    export interface IHexColorProps {
        value: string;
        expectedLength: number;
        onChange: (value: string) => void;
    }
    export class HexColor extends React.Component<IHexColorProps, {
        hex: string;
    }> {
        constructor(props: IHexColorProps);
        shouldComponentUpdate(nextProps: IHexColorProps, nextState: {
            hex: string;
        }): boolean;
        updateHexValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/colorPicker/colorPicker" {
    import * as React from "react";
    import { Color3, Color4 } from "babylonjs/Maths/math.color";
    /**
     * Interface used to specify creation options for color picker
     */
    export interface IColorPickerProps {
        color: Color3 | Color4;
        linearhint?: boolean;
        debugMode?: boolean;
        onColorChanged?: (color: Color3 | Color4) => void;
    }
    /**
     * Interface used to specify creation options for color picker
     */
    export interface IColorPickerState {
        color: Color3;
        alpha: number;
    }
    /**
     * Class used to create a color picker
     */
    export class ColorPicker extends React.Component<IColorPickerProps, IColorPickerState> {
        private _saturationRef;
        private _hueRef;
        private _isSaturationPointerDown;
        private _isHuePointerDown;
        constructor(props: IColorPickerProps);
        shouldComponentUpdate(nextProps: IColorPickerProps, nextState: IColorPickerState): boolean;
        onSaturationPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onSaturationPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        onSaturationPointerMove(evt: React.PointerEvent<HTMLDivElement>): void;
        onHuePointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onHuePointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        onHuePointerMove(evt: React.PointerEvent<HTMLDivElement>): void;
        private _evaluateSaturation;
        private _evaluateHue;
        componentDidUpdate(): void;
        raiseOnColorChanged(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/colorPickerComponent" {
    import * as React from "react";
    import { Color4, Color3 } from "babylonjs/Maths/math.color";
    export interface IColorPickerComponentProps {
        value: Color4 | Color3;
        linearHint?: boolean;
        onColorChanged: (newOne: string) => void;
        icon?: string;
        iconLabel?: string;
        shouldPopRight?: boolean;
    }
    interface IColorPickerComponentState {
        pickerEnabled: boolean;
        color: Color3 | Color4;
        hex: string;
    }
    export class ColorPickerLineComponent extends React.Component<IColorPickerComponentProps, IColorPickerComponentState> {
        private _floatRef;
        private _floatHostRef;
        constructor(props: IColorPickerComponentProps);
        syncPositions(): void;
        shouldComponentUpdate(nextProps: IColorPickerComponentProps, nextState: IColorPickerComponentState): boolean;
        getHexString(props?: Readonly<IColorPickerComponentProps> & Readonly<{
            children?: React.ReactNode;
        }>): string;
        componentDidUpdate(): void;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/colorLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Color4 } from "babylonjs/Maths/math.color";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    export interface IColorLineComponentProps {
        label: string;
        target?: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onChange?: () => void;
        isLinear?: boolean;
        icon?: string;
        iconLabel?: string;
        lockObject?: LockObject;
        disableAlpha?: boolean;
    }
    interface IColorLineComponentState {
        isExpanded: boolean;
        color: Color4;
        colorString: string;
    }
    export class ColorLineComponent extends React.Component<IColorLineComponentProps, IColorLineComponentState> {
        constructor(props: IColorLineComponentProps);
        shouldComponentUpdate(nextProps: IColorLineComponentProps, nextState: IColorLineComponentState): boolean;
        getValue(props?: Readonly<IColorLineComponentProps> & Readonly<{
            children?: React.ReactNode;
        }>): Color4;
        getValueAsString(props?: Readonly<IColorLineComponentProps> & Readonly<{
            children?: React.ReactNode;
        }>): string;
        setColorFromString(colorString: string): void;
        setColor(color: Color4): void;
        updateColor(newColor: Color4): void;
        switchExpandState(): void;
        updateStateR(value: number): void;
        updateStateG(value: number): void;
        updateStateB(value: number): void;
        updateStateA(value: number): void;
        copyToClipboard(): void;
        get colorString(): string;
        set colorString(_: string);
        private convertToColor;
        private toColor3;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/iconComponent" {
    import * as React from "react";
    interface IIconComponentProps {
        icon: string;
        label?: string;
    }
    export class IconComponent extends React.Component<IIconComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/optionsLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { IInspectableOptions } from "babylonjs/Misc/iInspectable";
    export const Null_Value: number;
    export interface IOptionsLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        options: IInspectableOptions[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number) => void;
        extractValue?: () => number;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        allowNullValue?: boolean;
        icon?: string;
        iconLabel?: string;
    }
    export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, {
        value: number;
    }> {
        private _localChange;
        private remapValueIn;
        private remapValueOut;
        constructor(props: IOptionsLineComponentProps);
        shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: {
            value: number;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/commonControlPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface ICommonControlPropertyGridComponentProps {
        controls: Control[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        private _onPropertyChangedObserver;
        constructor(props: ICommonControlPropertyGridComponentProps);
        private _getTransformedReferenceCoordinate;
        private _updateAlignment;
        private _checkAndUpdateValues;
        private _markChildrenAsDirty;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/sliderPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
    import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
    interface ISliderPropertyGridComponentProps {
        sliders: (Slider | ImageBasedSlider)[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
        constructor(props: ISliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/sliderGenericPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
    interface ISliderGenericPropertyGridComponentProps {
        sliders: Slider[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SliderGenericPropertyGridComponent extends React.Component<ISliderGenericPropertyGridComponentProps> {
        constructor(props: ISliderGenericPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/linePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Line } from "babylonjs-gui/2D/controls/line";
    interface ILinePropertyGridComponentProps {
        lines: Line[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
        constructor(props: ILinePropertyGridComponentProps);
        onDashChange(value: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/radioButtonPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
    interface IRadioButtonPropertyGridComponentProps {
        radioButtons: RadioButton[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
        constructor(props: IRadioButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/textBlockPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface ITextBlockPropertyGridComponentProps {
        textBlocks: TextBlock[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
        constructor(props: ITextBlockPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/inputTextPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { InputText } from "babylonjs-gui/2D/controls/inputText";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IInputTextPropertyGridComponentProps {
        inputTexts: InputText[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
        constructor(props: IInputTextPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/color3LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        isLinear?: boolean;
        icon?: string;
        lockObject?: LockObject;
        iconLabel?: string;
        onValueChange?: (value: string) => void;
    }
    export class Color3LineComponent extends React.Component<IColor3LineComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/colorPickerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IColorPickerPropertyGridComponentProps {
        colorPickers: ColorPicker[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
        constructor(props: IColorPickerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/imagePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Image } from "babylonjs-gui/2D/controls/image";
    interface IImagePropertyGridComponentProps {
        images: Image[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
        constructor(props: IImagePropertyGridComponentProps);
        toggleAnimations(on: boolean): void;
        getMaxCells(): number;
        updateCellSize(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/imageBasedSliderPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
    interface IImageBasedSliderPropertyGridComponentProps {
        imageBasedSliders: ImageBasedSlider[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
        constructor(props: IImageBasedSliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/containerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Container } from "babylonjs-gui/2D/controls/container";
    interface IContainerPropertyGridComponentProps {
        containers: Container[];
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ContainerPropertyGridComponent extends React.Component<IContainerPropertyGridComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/rectanglePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    interface IRectanglePropertyGridComponentProps {
        rectangles: Rectangle[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
        constructor(props: IRectanglePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/stackPanelPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    interface IStackPanelPropertyGridComponentProps {
        stackPanels: StackPanel[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
        constructor(props: IStackPanelPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/gridPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Grid } from "babylonjs-gui/2D/controls/grid";
    interface IGridPropertyGridComponentProps {
        grids: Grid[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps> {
        constructor(props: IGridPropertyGridComponentProps);
        private _removingColumn;
        private _removingRow;
        private _previousGrid;
        private _rowDefinitions;
        private _rowEditFlags;
        private _columnEditFlags;
        private _columnDefinitions;
        private _editedRow;
        private _editedColumn;
        private _rowChild;
        private _columnChild;
        renderRows(): JSX.Element[];
        setRowValues(): void;
        setColumnValues(): void;
        renderColumns(): JSX.Element[];
        resizeRow(): void;
        resizeColumn(): void;
        checkValue(value: string, percent: boolean): string;
        checkPercentage(value: string): boolean;
        resetValues(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/scrollViewerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
    interface IScrollViewerPropertyGridComponentProps {
        scrollViewers: ScrollViewer[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
        constructor(props: IScrollViewerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/ellipsePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
    interface IEllipsePropertyGridComponentProps {
        ellipses: Ellipse[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
        constructor(props: IEllipsePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/checkboxPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
    interface ICheckboxPropertyGridComponentProps {
        checkboxes: Checkbox[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
        constructor(props: ICheckboxPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/controlPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IControlPropertyGridComponentProps {
        controls: Control[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
        constructor(props: IControlPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/parentingPropertyGridComponent" {
    import * as React from "react";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Observable } from "babylonjs/Misc/observable";
    interface IParentingPropertyGridComponentProps {
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ParentingPropertyGridComponent extends React.Component<IParentingPropertyGridComponentProps> {
        constructor(props: IParentingPropertyGridComponentProps);
        private _columnNumber;
        private _rowNumber;
        updateGridPosition(): void;
        getCellInfo(): void;
        private _changeCell;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/displayGridPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { DisplayGrid } from "babylonjs-gui/2D/controls/displayGrid";
    interface IDisplayGridPropertyGridComponentProps {
        displayGrids: DisplayGrid[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class DisplayGridPropertyGridComponent extends React.Component<IDisplayGridPropertyGridComponentProps> {
        constructor(props: IDisplayGridPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyGrids/gui/buttonPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    interface IButtonPropertyGridComponentProps {
        rectangles: Rectangle[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onAddComponent: (newComponent: string) => void;
    }
    export class ButtonPropertyGridComponent extends React.Component<IButtonPropertyGridComponentProps> {
        constructor(props: IButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/guiNodeTools" {
    import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
    import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
    import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
    import { Line } from "babylonjs-gui/2D/controls/line";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
    import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
    import { Image } from "babylonjs-gui/2D/controls/image";
    import { InputText } from "babylonjs-gui/2D/controls/inputText";
    import { Grid } from "babylonjs-gui/2D/controls/grid";
    import { DisplayGrid } from "babylonjs-gui/2D/controls/displayGrid";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
    import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
    export class GUINodeTools {
        static ImageControlDefaultUrl: string;
        static CreateControlFromString(data: string): Grid | Rectangle | Line | TextBlock | Image | Slider | ImageBasedSlider | RadioButton | InputText | ColorPicker | StackPanel | Ellipse | Checkbox | DisplayGrid;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps> {
        private _onBuiltObserver;
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        load(file: File): void;
        save(saveCallback: () => void): void;
        saveLocally: () => void;
        saveToSnippetServerHelper: (content: string, adt: AdvancedDynamicTexture) => Promise<string>;
        saveToSnippetServer: () => Promise<void>;
        loadFromSnippet(): void;
        renderNode(nodes: Control[]): JSX.Element;
        /**
         * returns the class name of a list of controls if they share a class, or an empty string if not
         */
        getControlsCommonClassName(nodes: Control[]): string;
        renderProperties(nodes: Control[]): JSX.Element | undefined;
        renderControlIcon(nodes: Control[]): string;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-gui-editor/portal" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface IPortalProps {
        globalState: GlobalState;
    }
    export class Portal extends React.Component<IPortalProps> {
        render(): React.ReactPortal;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/messageDialog" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface IMessageDialogComponentProps {
        globalState: GlobalState;
    }
    export class MessageDialogComponent extends React.Component<IMessageDialogComponentProps, {
        message: string;
        isError: boolean;
    }> {
        constructor(props: IMessageDialogComponentProps);
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-gui-editor/components/sceneExplorer/treeItemLabelComponent" {
    import * as React from "react";
    interface ITreeItemLabelComponentProps {
        label?: string;
        onClick?: () => void;
        onChange: (newValue: string) => void;
        bracket: string;
        renaming: boolean;
        setRenaming: (renaming: boolean) => void;
    }
    interface ITreeItemLabelState {
        value: string;
    }
    export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps, ITreeItemLabelState> {
        constructor(props: ITreeItemLabelComponentProps);
        onClick(): void;
        onBlur(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/sceneExplorer/extensionsComponent" {
    import * as React from "react";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    interface IExtensionsComponentProps {
        target: any;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
    }
    export class ExtensionsComponent extends React.Component<IExtensionsComponentProps, {
        popupVisible: boolean;
    }> {
        private _popup;
        private extensionRef;
        constructor(props: IExtensionsComponentProps);
        showPopup(): void;
        componentDidMount(): void;
        componentDidUpdate(): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-gui-editor/components/sceneExplorer/entities/gui/controlTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import * as React from "react";
    import { DragOverLocation, GlobalState } from "babylonjs-gui-editor/globalState";
    interface IControlTreeItemComponentProps {
        control: Control;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
        isHovered: boolean;
        isDragOver: boolean;
        dragOverLocation: DragOverLocation;
    }
    export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, {
        isActive: boolean;
        isVisible: boolean;
        isRenaming: boolean;
    }> {
        constructor(props: IControlTreeItemComponentProps);
        highlight(): void;
        switchVisibility(): void;
        onRename(name: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/sceneExplorer/treeItemSelectableComponent" {
    import { Nullable } from "babylonjs/types";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    import { DragOverLocation, GlobalState } from "babylonjs-gui-editor/globalState";
    export interface ITreeItemSelectableComponentProps {
        entity: any;
        selectedEntities: any[];
        mustExpand?: boolean;
        offset: number;
        globalState: GlobalState;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        filter: Nullable<string>;
    }
    export interface ITreeItemSelectableComponentState {
        dragOver: boolean;
        isSelected: boolean;
        isHovered: boolean;
        dragOverLocation: DragOverLocation;
    }
    export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, ITreeItemSelectableComponentState> {
        private _onSelectionChangedObservable;
        private _onDraggingEndObservable;
        private _onDraggingStartObservable;
        /** flag flipped onDragEnter if dragOver is already true
         * prevents dragLeave from immediately setting dragOver to false
         * required to make dragging work as expected
         * see: see: https://github.com/transformation-dev/matrx/tree/master/packages/dragster
         */
        private _secondDragEnter;
        constructor(props: ITreeItemSelectableComponentProps);
        switchExpandedState(): void;
        shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: {
            isSelected: boolean;
        }): boolean;
        scrollIntoView(): void;
        componentWillUnmount(): void;
        onSelect(): void;
        renderChildren(isExpanded: boolean, offset?: boolean): (JSX.Element | null)[] | null;
        render(): JSX.Element | (JSX.Element | null)[] | null;
        dragOver(event: React.DragEvent<HTMLDivElement>): void;
        updateDragOverLocation(event: React.DragEvent<HTMLDivElement>): void;
        drop(): void;
    }
}
declare module "babylonjs-gui-editor/components/sceneExplorer/treeItemComponent" {
    import * as React from "react";
    import { Nullable } from "babylonjs/types";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    export interface ITreeItemComponentProps {
        items?: Nullable<any[]>;
        label: string;
        offset: number;
        filter: Nullable<string>;
        forceSubitems?: boolean;
        globalState: GlobalState;
        entity?: any;
        selectedEntities: any[];
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        contextMenuItems?: {
            label: string;
            action: () => void;
        }[];
    }
    export class TreeItemComponent extends React.Component<ITreeItemComponentProps, {
        isExpanded: boolean;
        mustExpand: boolean;
    }> {
        static _ContextMenuUniqueIdGenerator: number;
        constructor(props: ITreeItemComponentProps);
        switchExpandedState(): void;
        shouldComponentUpdate(nextProps: ITreeItemComponentProps, nextState: {
            isExpanded: boolean;
        }): boolean;
        expandAll(expand: boolean): void;
        renderContextMenu(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/sceneExplorer/sceneExplorerComponent" {
    import * as React from "react";
    import { Nullable } from "babylonjs/types";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Scene } from "babylonjs/scene";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface ISceneExplorerFilterComponentProps {
        onFilter: (filter: string) => void;
    }
    export class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
        constructor(props: ISceneExplorerFilterComponentProps);
        render(): JSX.Element;
    }
    interface ISceneExplorerComponentProps {
        scene?: Scene;
        noCommands?: boolean;
        noHeader?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        globalState: GlobalState;
        popupMode?: boolean;
        onPopup?: () => void;
        onClose?: () => void;
    }
    export class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, {
        filter: Nullable<string>;
        selectedEntity: any;
        scene: Nullable<Scene>;
    }> {
        private _onSelectionChangeObserver;
        private _onParrentingChangeObserver;
        private _onNewSceneObserver;
        private _onPropertyChangedObservable;
        constructor(props: ISceneExplorerComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        filterContent(filter: string): void;
        findSiblings(parent: any, items: any[], target: any, goNext: boolean, data: {
            previousOne?: any;
            found?: boolean;
        }): boolean;
        processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>): void;
        renderContent(): JSX.Element | null;
        onClose(): void;
        onPopup(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/fileButtonLineComponent" {
    import * as React from "react";
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
        icon?: string;
        iconLabel?: string;
    }
    export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
        private static _IDGenerator;
        private _id;
        private uploadInputRef;
        constructor(props: IFileButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/commandDropdownComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface ICommandDropdownComponentProps {
        globalState: GlobalState;
        icon?: string;
        tooltip: string;
        defaultValue?: string;
        items: {
            label: string;
            icon?: string;
            fileButton?: boolean;
            onClick?: () => void;
            onCheck?: (value: boolean) => void;
            storeKey?: string;
            isActive?: boolean;
            defaultValue?: boolean | string;
            subItems?: string[];
        }[];
        toRight?: boolean;
    }
    export class CommandDropdownComponent extends React.Component<ICommandDropdownComponentProps, {
        isExpanded: boolean;
        activeState: string;
    }> {
        constructor(props: ICommandDropdownComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/commandBarComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface ICommandBarComponentProps {
        globalState: GlobalState;
    }
    export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
        private _panning;
        private _zooming;
        private _selecting;
        private _sizeOption;
        constructor(props: ICommandBarComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/diagram/guiGizmo" {
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Vector2 } from "babylonjs/Maths/math.vector";
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Rect } from "babylonjs-gui-editor/diagram/coordinateHelper";
    export interface IGuiGizmoProps {
        globalState: GlobalState;
        control: Control;
    }
    enum ScalePointPosition {
        Top = -1,
        Left = -1,
        Center = 0,
        Right = 1,
        Bottom = 1
    }
    interface IScalePoint {
        position: Vector2;
        horizontalPosition: ScalePointPosition;
        verticalPosition: ScalePointPosition;
        rotation: number;
        isPivot: boolean;
    }
    interface IGuiGizmoState {
        canvasBounds: Rect;
        scalePoints: IScalePoint[];
        scalePointDragging: number;
        isRotating: boolean;
    }
    export class GuiGizmoComponent extends React.Component<IGuiGizmoProps, IGuiGizmoState> {
        private _storedValues;
        private _localBounds;
        private _rotation;
        private _gizmoUpdateObserver;
        private _pointerUpObserver;
        private _pointerMoveObserver;
        constructor(props: IGuiGizmoProps);
        componentWillUnmount(): void;
        /**
         * Update the gizmo's positions
         * @param force should the update be forced. otherwise it will be updated only when the pointer is down
         */
        updateGizmo(force?: boolean): void;
        private _onUp;
        private _onMove;
        private _rotate;
        private _modulo;
        private _dragLocalBounds;
        private _updateNodeFromLocalBounds;
        private _beginDraggingScalePoint;
        private _beginRotate;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/diagram/guiGizmoWrapper" {
    import { Nullable } from "babylonjs/types";
    import { Observer } from "babylonjs/Misc/observable";
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    export interface IGizmoWrapperProps {
        globalState: GlobalState;
    }
    export class GizmoWrapper extends React.Component<IGizmoWrapperProps> {
        observer: Nullable<Observer<void>>;
        componentWillMount(): void;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/diagram/artBoard" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Rect } from "babylonjs-gui-editor/diagram/coordinateHelper";
    interface IArtBoardProps {
        globalState: GlobalState;
    }
    interface IArtBoardState {
        bounds: Rect;
    }
    export class ArtBoardComponent extends React.Component<IArtBoardProps, IArtBoardState> {
        constructor(props: IArtBoardProps);
        update(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/workbenchEditor" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Control } from "babylonjs-gui/2D/controls/control";
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    interface IGraphEditorState {
        showPreviewPopUp: boolean;
    }
    export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _toolBarIconSize;
        private _popUpWindow;
        private _draggedItem;
        private _rootRef;
        componentDidMount(): void;
        constructor(props: IGraphEditorProps);
        showWaitScreen(): void;
        hideWaitScreen(): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        handlePopUp: () => void;
        handleClosingPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        render(): JSX.Element;
        onCreate(value: string): Control;
        createToolbar(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/popup" {
    export class Popup {
        static CreatePopup(title: string, windowVariableName: string, width?: number, height?: number): HTMLDivElement | null;
        private static _CopyStyles;
    }
}
declare module "babylonjs-gui-editor/guiEditor" {
    import { Observable } from "babylonjs/Misc/observable";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    /**
     * Interface used to specify creation options for the gui editor
     */
    export interface IGUIEditorOptions {
        liveGuiTexture?: AdvancedDynamicTexture;
        customLoad: {
            label: string;
            action: (data: string) => Promise<string>;
        } | undefined;
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<string>;
        };
        currentSnippetToken?: string;
        customLoadObservable?: Observable<any>;
    }
    /**
     * Class used to create a gui editor
     */
    export class GUIEditor {
        private static _CurrentState;
        /**
         * Show the gui editor
         * @param options defines the options to use to configure the gui editor
         */
        static Show(options: IGUIEditorOptions): Promise<void>;
    }
}
declare module "babylonjs-gui-editor/index" {
    export * from "babylonjs-gui-editor/guiEditor";
}
declare module "babylonjs-gui-editor/nodeLocationInfo" {
    export interface INodeLocationInfo {
        blockId: number;
        x: number;
        y: number;
    }
    export interface IFrameData {
        x: number;
        y: number;
        width: number;
        height: number;
        color: number[];
        name: string;
        isCollapsed: boolean;
        blocks: number[];
        comments: string;
    }
    export interface IEditorData {
        locations: INodeLocationInfo[];
        x: number;
        y: number;
        zoom: number;
        frames?: IFrameData[];
        map?: {
            [key: number]: number;
        };
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/iSelectedLineContainer" {
    export interface ISelectedLineContainer {
        selectedLineContainerTitles: Array<string>;
        selectedLineContainerTitlesNoFocus: Array<string>;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/lineContainerComponent" {
    import * as React from "react";
    import { ISelectedLineContainer } from "babylonjs-gui-editor/sharedUiComponents/lines/iSelectedLineContainer";
    interface ILineContainerComponentProps {
        selection?: ISelectedLineContainer;
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
        isHighlighted: boolean;
    }> {
        constructor(props: ILineContainerComponentProps);
        switchExpandedState(): void;
        renderHeader(): JSX.Element;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/draggableLineComponent" {
    import * as React from "react";
    export interface IButtonLineComponentProps {
        data: string;
        tooltip: string;
    }
    export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/components/guiList/guiListComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface IGuiListComponentProps {
        globalState: GlobalState;
    }
    export class GuiListComponent extends React.Component<IGuiListComponentProps, {
        filter: string;
    }> {
        private _onResetRequiredObserver;
        private static _Tooltips;
        constructor(props: IGuiListComponentProps);
        componentWillUnmount(): void;
        filterContent(filter: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/legacy/legacy" {
    export * from "babylonjs-gui-editor/index";
}
declare module "babylonjs-gui-editor/sharedComponents/propertyChangedEvent" {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/floatLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface IFloatLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onChange?: (newValue: number) => void;
        isInteger?: boolean;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        additionalClass?: string;
        step?: string;
        digits?: number;
        globalState: GlobalState;
        min?: number;
        max?: number;
        smallUI?: boolean;
        onEnter?: (newValue: number) => void;
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        private _regExp;
        private _digits;
        constructor(props: IFloatLineComponentProps);
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/lineWithFileButtonComponent" {
    import * as React from "react";
    interface ILineWithFileButtonComponentProps {
        title: string;
        closed?: boolean;
        label: string;
        iconImage: any;
        onIconClick: (file: File) => void;
        accept: string;
        uploadName?: string;
    }
    export class LineWithFileButtonComponent extends React.Component<ILineWithFileButtonComponentProps, {
        isExpanded: boolean;
    }> {
        private uploadRef;
        constructor(props: ILineWithFileButtonComponentProps);
        onChange(evt: any): void;
        switchExpandedState(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/numericInputComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
        globalState: GlobalState;
    }
    export class NumericInputComponent extends React.Component<INumericInputComponentProps, {
        value: string;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: INumericInputComponentProps);
        shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: {
            value: string;
        }): boolean;
        updateValue(evt: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/sliderLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface ISliderLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        minimum: number;
        maximum: number;
        step: number;
        directValue?: number;
        useEuler?: boolean;
        onChange?: (value: number) => void;
        onInput?: (value: number) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        decimalCount?: number;
        globalState: GlobalState;
    }
    export class SliderLineComponent extends React.Component<ISliderLineComponentProps, {
        value: number;
    }> {
        private _localChange;
        constructor(props: ISliderLineComponentProps);
        shouldComponentUpdate(nextProps: ISliderLineComponentProps, nextState: {
            value: number;
        }): boolean;
        onChange(newValueString: any): void;
        onInput(newValueString: any): void;
        prepareDataToRead(value: number): number;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/textInputLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    interface ITextInputLineComponentProps {
        label: string;
        globalState: GlobalState;
        target?: any;
        propertyName?: string;
        value?: string;
        multilines?: boolean;
        onChange?: (value: string) => void;
        validator?: (value: string) => boolean;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        constructor(props: ITextInputLineComponentProps);
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string, raisePropertyChanged: boolean): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/booleanLineComponent" {
    import * as React from "react";
    export interface IBooleanLineComponentProps {
        label: string;
        value: boolean;
        icon?: string;
        iconLabel?: string;
    }
    export class BooleanLineComponent extends React.Component<IBooleanLineComponentProps> {
        constructor(props: IBooleanLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/buttonLineComponent" {
    import * as React from "react";
    export interface IButtonLineComponentProps {
        label: string;
        onClick: () => void;
        icon?: string;
        iconLabel?: string;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/color4LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    export interface IColor4LineComponentProps {
        label: string;
        target?: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onChange?: () => void;
        isLinear?: boolean;
        icon?: string;
        iconLabel?: string;
        lockObject?: LockObject;
    }
    export class Color4LineComponent extends React.Component<IColor4LineComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/fileMultipleButtonLineComponent" {
    import * as React from "react";
    interface IFileMultipleButtonLineComponentProps {
        label: string;
        onClick: (event: any) => void;
        accept: string;
        icon?: string;
        iconLabel?: string;
    }
    export class FileMultipleButtonLineComponent extends React.Component<IFileMultipleButtonLineComponentProps> {
        private static _IDGenerator;
        private _id;
        private uploadInputRef;
        constructor(props: IFileMultipleButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/hexLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IHexLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        lockObject?: LockObject;
        onChange?: (newValue: number) => void;
        isInteger?: boolean;
        replaySourceReplacement?: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        additionalClass?: string;
        step?: string;
        digits?: number;
        useEuler?: boolean;
        min?: number;
        icon?: string;
        iconLabel?: string;
    }
    export class HexLineComponent extends React.Component<IHexLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        private _propertyChange;
        constructor(props: IHexLineComponentProps);
        componentWillUnmount(): void;
        shouldComponentUpdate(nextProps: IHexLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        convertToHexString(valueString: string): string;
        updateValue(valueString: string, raisePropertyChanged: boolean): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/iconButtonLineComponent" {
    import * as React from "react";
    export interface IIconButtonLineComponentProps {
        icon: string;
        onClick: () => void;
        tooltip: string;
        active?: boolean;
    }
    export class IconButtonLineComponent extends React.Component<IIconButtonLineComponentProps> {
        constructor(props: IIconButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/indentedTextLineComponent" {
    import * as React from "react";
    interface IIndentedTextLineComponentProps {
        value?: string;
        color?: string;
        underline?: boolean;
        onLink?: () => void;
        url?: string;
        additionalClass?: string;
    }
    export class IndentedTextLineComponent extends React.Component<IIndentedTextLineComponentProps> {
        constructor(props: IIndentedTextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/linkButtonComponent" {
    import * as React from "react";
    interface ILinkButtonComponentProps {
        label: string;
        buttonLabel: string;
        url?: string;
        onClick: () => void;
        onIconClick?: () => void;
    }
    export class LinkButtonComponent extends React.Component<ILinkButtonComponentProps> {
        constructor(props: ILinkButtonComponentProps);
        onLink(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/messageLineComponent" {
    import * as React from "react";
    interface IMessageLineComponentProps {
        text: string;
        color?: string;
    }
    export class MessageLineComponent extends React.Component<IMessageLineComponentProps> {
        constructor(props: IMessageLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/radioLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    interface IRadioButtonLineComponentProps {
        onSelectionChangedObservable: Observable<RadioButtonLineComponent>;
        label: string;
        isSelected: () => boolean;
        onSelect: () => void;
        icon?: string;
        iconLabel?: string;
    }
    export class RadioButtonLineComponent extends React.Component<IRadioButtonLineComponentProps, {
        isSelected: boolean;
    }> {
        private _onSelectionChangedObserver;
        constructor(props: IRadioButtonLineComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        onChange(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/valueLineComponent" {
    import * as React from "react";
    interface IValueLineComponentProps {
        label: string;
        value: number;
        color?: string;
        fractionDigits?: number;
        units?: string;
        icon?: string;
        iconLabel?: string;
    }
    export class ValueLineComponent extends React.Component<IValueLineComponentProps> {
        constructor(props: IValueLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/vector2LineComponent" {
    import * as React from "react";
    import { Vector2 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    interface IVector2LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector2) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        icon?: string;
        iconLabel?: string;
    }
    export class Vector2LineComponent extends React.Component<IVector2LineComponentProps, {
        isExpanded: boolean;
        value: Vector2;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: IVector2LineComponentProps);
        shouldComponentUpdate(nextProps: IVector2LineComponentProps, nextState: {
            isExpanded: boolean;
            value: Vector2;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: Vector2): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/vector3LineComponent" {
    import * as React from "react";
    import { Vector3 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector3) => void;
        useEuler?: boolean;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        noSlider?: boolean;
        icon?: string;
        iconLabel?: string;
    }
    export class Vector3LineComponent extends React.Component<IVector3LineComponentProps, {
        isExpanded: boolean;
        value: Vector3;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: IVector3LineComponentProps);
        getCurrentValue(): any;
        shouldComponentUpdate(nextProps: IVector3LineComponentProps, nextState: {
            isExpanded: boolean;
            value: Vector3;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: Vector3): void;
        updateVector3(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/vector4LineComponent" {
    import * as React from "react";
    import { Vector4 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    interface IVector4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector4) => void;
        useEuler?: boolean;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        icon?: string;
        iconLabel?: string;
    }
    export class Vector4LineComponent extends React.Component<IVector4LineComponentProps, {
        isExpanded: boolean;
        value: Vector4;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: IVector4LineComponentProps);
        getCurrentValue(): any;
        shouldComponentUpdate(nextProps: IVector4LineComponentProps, nextState: {
            isExpanded: boolean;
            value: Vector4;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: Vector4): void;
        updateVector4(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        updateStateW(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/commonControlPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface ICommonControlPropertyGridComponentProps {
        controls?: Control[];
        control?: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        constructor(props: ICommonControlPropertyGridComponentProps);
        renderGridInformation(control: Control): JSX.Element | null;
        render(): JSX.Element | undefined;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/checkboxPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
    interface ICheckboxPropertyGridComponentProps {
        checkbox: Checkbox;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
        constructor(props: ICheckboxPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/colorPickerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IColorPickerPropertyGridComponentProps {
        colorPicker: ColorPicker;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
        constructor(props: IColorPickerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/controlPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IControlPropertyGridComponentProps {
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
        constructor(props: IControlPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/ellipsePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
    interface IEllipsePropertyGridComponentProps {
        ellipse: Ellipse;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
        constructor(props: IEllipsePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/gridPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Grid } from "babylonjs-gui/2D/controls/grid";
    interface IGridPropertyGridComponentProps {
        grid: Grid;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps> {
        constructor(props: IGridPropertyGridComponentProps);
        renderRows(): JSX.Element[];
        renderColumns(): JSX.Element[];
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/imageBasedSliderPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
    interface IImageBasedSliderPropertyGridComponentProps {
        imageBasedSlider: ImageBasedSlider;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
        constructor(props: IImageBasedSliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/imagePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Image } from "babylonjs-gui/2D/controls/image";
    interface IImagePropertyGridComponentProps {
        image: Image;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
        constructor(props: IImagePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/inputTextPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { InputText } from "babylonjs-gui/2D/controls/inputText";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface IInputTextPropertyGridComponentProps {
        inputText: InputText;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
        constructor(props: IInputTextPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/linePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Line } from "babylonjs-gui/2D/controls/line";
    interface ILinePropertyGridComponentProps {
        line: Line;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
        constructor(props: ILinePropertyGridComponentProps);
        onDashChange(value: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/radioButtonPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
    interface IRadioButtonPropertyGridComponentProps {
        radioButtons: RadioButton[];
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
        constructor(props: IRadioButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/rectanglePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    interface IRectanglePropertyGridComponentProps {
        rectangle: Rectangle;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
        constructor(props: IRectanglePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/scrollViewerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
    interface IScrollViewerPropertyGridComponentProps {
        scrollViewer: ScrollViewer;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
        constructor(props: IScrollViewerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/sliderPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
    interface ISliderPropertyGridComponentProps {
        slider: Slider;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
        constructor(props: ISliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/stackPanelPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    interface IStackPanelPropertyGridComponentProps {
        stackPanel: StackPanel;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
        constructor(props: IStackPanelPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/gui/textBlockPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedUiComponents/propertyChangedEvent";
    import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
    import { LockObject } from "babylonjs-gui-editor/sharedUiComponents/tabs/propertyGrids/lockObject";
    interface ITextBlockPropertyGridComponentProps {
        textBlock: TextBlock;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
        constructor(props: ITextBlockPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor" {
    export * from "babylonjs-gui-editor/legacy/legacy";
}
/// <reference types="react" />
declare module GUIEDITOR {
    export const ControlTypes: {
        className: string;
        icon: string;
    }[];
}
declare module GUIEDITOR {
    interface ILogComponentProps {
        globalState: GlobalState;
    }
    export class LogEntry {
        message: string;
        isError: boolean;
        constructor(message: string, isError: boolean);
    }
    export class LogComponent extends React.Component<ILogComponentProps, {
        logs: LogEntry[];
    }> {
        constructor(props: ILogComponentProps);
        componentDidMount(): void;
        componentDidUpdate(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class Tools {
        static LookForItems(item: any, selectedEntities: any[], firstIteration?: boolean): boolean;
        private static _RecursiveRemoveHiddenMeshesAndHoistChildren;
        static SortAndFilter(parent: any, items: any[]): any[];
        static getCellInfo(grid: Grid, control: Control): BABYLON.Vector2;
        static reorderGrid(grid: Grid, index: number, control: Control, cell: BABYLON.Vector2): void;
    }
}
declare module GUIEDITOR {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
        allowNullValue?: boolean;
    }
}
declare module GUIEDITOR {
    export type DimensionProperties = "width" | "left" | "height" | "top" | "paddingLeft" | "paddingRight" | "paddingTop" | "paddingBottom" | "fontSize";
    export class Rect {
        top: number;
        left: number;
        right: number;
        bottom: number;
        constructor(left: number, top: number, right: number, bottom: number);
        clone(): Rect;
        get center(): BABYLON.Vector2;
        get width(): number;
        get height(): number;
    }
    export class CoordinateHelper {
        private static _matrixCache;
        static globalState: GlobalState;
        /**
         * Get the scaling of a specific GUI control
         * @param node the node for which we are getting the scaling
         * @param relative should we return only the relative scaling (relative to the parent)
         * @returns an X,Y vector of the scaling
         */
        static getScale(node: Control, relative?: boolean): BABYLON.Vector2;
        static getRotation(node: Control, relative?: boolean): number;
        /**
         * This function calculates a local matrix for a node, including it's full transformation and pivot point
         *
         * @param node the node to calculate the matrix for
         * @param useStoredValues should the stored (cached) values be used to calculate the matrix
         * @returns a new matrix for the control
         */
        static getNodeMatrix(node: Control, storedValues?: Rect): Matrix2D;
        /**
         * Using the node's tree, calculate its world matrix and return it
         * @param node the node to calculate the matrix for
         * @param useStoredValuesIfPossible used stored valued (cached when pointer down is clicked)
         * @returns the world matrix for this node
         */
        static nodeToRTTWorldMatrix(node: Control, storedValues?: Rect): Matrix2D;
        static nodeToRTTSpace(node: Control, x: number, y: number, reference?: BABYLON.Vector2, storedValues?: Rect): BABYLON.Vector2;
        static rttToLocalNodeSpace(node: Control, x: number, y: number, reference?: BABYLON.Vector2, storedValues?: Rect): BABYLON.Vector2;
        static rttToCanvasSpace(x: number, y: number): BABYLON.Vector2;
        static mousePointerToRTTSpace(node: Control, x?: number, y?: number): BABYLON.Vector2;
        private static resetMatrixArray;
        static computeLocalBounds(node: Control): Rect;
        /**
         * converts a node's dimensions to percentage, properties can be specified as a list, or can convert all
        */
        static convertToPercentage(guiControl: Control, properties?: DimensionProperties[], onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>): void;
        static round(value: number): number;
        static convertToPixels(guiControl: Control, properties?: DimensionProperties[], onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>): void;
    }
}
declare module GUIEDITOR {
    export interface IWorkbenchComponentProps {
        globalState: GlobalState;
    }
    export enum ConstraintDirection {
        NONE = 0,
        X = 2,
        Y = 3
    }
    export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
        private _rootContainer;
        private _setConstraintDirection;
        private _mouseStartPointX;
        private _mouseStartPointY;
        _scene: BABYLON.Scene;
        private _ctrlKeyIsPressed;
        private _altKeyIsPressed;
        private _constraintDirection;
        private _forcePanning;
        private _forceZooming;
        private _forceSelecting;
        private _panning;
        private _canvas;
        private _responsive;
        private _isOverGUINode;
        private _engine;
        private _liveRenderObserver;
        private _guiRenderObserver;
        private _mainSelection;
        private _selectionDepth;
        private _doubleClick;
        _liveGuiTextureRerender: boolean;
        private _anyControlClicked;
        private _visibleRegionContainer;
        get visibleRegionContainer(): Container;
        private _panAndZoomContainer;
        get panAndZoomContainer(): Container;
        private _trueRootContainer;
        set trueRootContainer(value: Container);
        get trueRootContainer(): Container;
        private _nextLiveGuiRender;
        private _liveGuiRerenderDelay;
        private _defaultGUISize;
        private _initialPanningOffset;
        private _panningOffset;
        private _zoomFactor;
        private _zoomModeIncrement;
        private _guiSize;
        get guiSize(): BABYLON.ISize;
        set guiSize(value: BABYLON.ISize);
        applyEditorTransformation(): void;
        removeEditorTransformation(): void;
        get globalState(): GlobalState;
        get nodes(): Control[];
        get selectedGuiNodes(): Control[];
        private _getParentWithDepth;
        private _getMaxParent;
        constructor(props: IWorkbenchComponentProps);
        determineMouseSelection(selection: Control): void;
        keyEvent: (evt: KeyboardEvent) => void;
        private _deleteSelectedNodes;
        copyToClipboard(copyFn: (content: string) => void): void;
        cutToClipboard(copyFn: (content: string) => void): void;
        pasteFromClipboard(clipboardContents: string): boolean;
        CopyGUIControl(original: Control): void;
        private selectAllGUI;
        blurEvent: () => void;
        componentWillUnmount(): void;
        loadFromJson(serializationObject: any): void;
        loadFromSnippet(snippetId: string): Promise<void>;
        loadToEditor(): void;
        updateNodeOutlines(): void;
        findNodeFromGuiElement(guiControl: Control): Control;
        appendBlock(guiElement: Control): Control;
        private _isMainSelectionParent;
        createNewGuiNode(guiControl: Control): Control;
        private parent;
        private _convertToPixels;
        private _reorderGrid;
        private _isNotChildInsert;
        private _adjustParentingIndex;
        isSelected(value: boolean, guiNode: Control): void;
        clicked: boolean;
        _onMove(guiControl: Control, evt: BABYLON.Vector2, startPos: BABYLON.Vector2, ignorClick?: boolean): boolean;
        onMove(evt: React.PointerEvent): void;
        private _screenToTexturePosition;
        private getScaledPointerPosition;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        isUp: boolean;
        onUp(evt: React.PointerEvent): void;
        createGUICanvas(): void;
        synchronizeLiveGUI(): void;
        addControls(scene: BABYLON.Scene): void;
        panning(): void;
        moveControls(moveHorizontal: boolean, amount: number): void;
        zoomWheel(event: WheelEvent): number;
        zooming(delta: number): void;
        zeroIfClose(vec: BABYLON.Vector3): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    /**
     * Class used to provide lock mechanism
     */
    export class LockObject {
        /**
         * Gets or set if the lock is engaged
         */
        lock: boolean;
    }
}
declare module GUIEDITOR {
    export enum DragOverLocation {
        ABOVE = 0,
        BELOW = 1,
        CENTER = 2,
        NONE = 3
    }
    export class GlobalState {
        liveGuiTexture: BABYLON.Nullable<AdvancedDynamicTexture>;
        guiTexture: AdvancedDynamicTexture;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        selectedControls: Control[];
        onSelectionChangedObservable: BABYLON.Observable<void>;
        onResizeObservable: BABYLON.Observable<BABYLON.ISize>;
        onBuiltObservable: BABYLON.Observable<void>;
        onResetRequiredObservable: BABYLON.Observable<void>;
        onUpdateRequiredObservable: BABYLON.Observable<void>;
        onLogRequiredObservable: BABYLON.Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: BABYLON.Observable<string>;
        onIsLoadingChanged: BABYLON.Observable<boolean>;
        onSelectionBoxMoved: BABYLON.Observable<ClientRect | DOMRect>;
        onNewSceneObservable: BABYLON.Observable<BABYLON.Nullable<BABYLON.Scene>>;
        onGuiNodeRemovalObservable: BABYLON.Observable<Control>;
        onPopupClosedObservable: BABYLON.Observable<void>;
        private _backgroundColor;
        private _outlines;
        isMultiSelecting: boolean;
        onOutlineChangedObservable: BABYLON.Observable<void>;
        blockKeyboardEvents: boolean;
        controlCamera: boolean;
        selectionLock: boolean;
        workbench: WorkbenchComponent;
        onPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        onZoomObservable: BABYLON.Observable<void>;
        onFitToWindowObservable: BABYLON.Observable<void>;
        onPanObservable: BABYLON.Observable<void>;
        onSelectionButtonObservable: BABYLON.Observable<void>;
        onLoadObservable: BABYLON.Observable<File>;
        onSaveObservable: BABYLON.Observable<void>;
        onSnippetLoadObservable: BABYLON.Observable<void>;
        onSnippetSaveObservable: BABYLON.Observable<void>;
        onResponsiveChangeObservable: BABYLON.Observable<boolean>;
        onParentingChangeObservable: BABYLON.Observable<BABYLON.Nullable<Control>>;
        onDropObservable: BABYLON.Observable<void>;
        onPropertyGridUpdateRequiredObservable: BABYLON.Observable<void>;
        onDraggingEndObservable: BABYLON.Observable<void>;
        onDraggingStartObservable: BABYLON.Observable<void>;
        onWindowResizeObservable: BABYLON.Observable<void>;
        onGizmoUpdateRequireObservable: BABYLON.Observable<void>;
        onArtBoardUpdateRequiredObservable: BABYLON.Observable<void>;
        onBackgroundColorChangeObservable: BABYLON.Observable<void>;
        onPointerMoveObservable: BABYLON.Observable<PointerEvent<HTMLCanvasElement>>;
        onPointerUpObservable: BABYLON.Observable<BABYLON.Nullable<PointerEvent | PointerEvent<HTMLCanvasElement>>>;
        draggedControl: BABYLON.Nullable<Control>;
        draggedControlDirection: DragOverLocation;
        onCopyObservable: BABYLON.Observable<(content: string) => void>;
        onCutObservable: BABYLON.Observable<(content: string) => void>;
        onPasteObservable: BABYLON.Observable<string>;
        isSaving: boolean;
        lockObject: LockObject;
        storeEditorData: (serializationObject: any) => void;
        customSave?: {
            label: string;
            action: (data: string) => Promise<string>;
        };
        customLoad?: {
            label: string;
            action: (data: string) => Promise<string>;
        };
        constructor();
        /** adds copy, cut and paste listeners to the host window */
        registerEventListeners(): void;
        private _updateKeys;
        get backgroundColor(): BABYLON.Color3;
        set backgroundColor(value: BABYLON.Color3);
        get outlines(): boolean;
        set outlines(value: boolean);
        select(control: Control): void;
        setSelection(controls: Control[]): void;
        isMultiSelectable(control: Control): boolean;
    }
}
declare module GUIEDITOR {
    export class StringTools {
        private static _SaveAs;
        private static _Click;
        /**
         * Download a string into a file that will be saved locally by the browser
         * @param content defines the string to download locally as a file
         */
        static DownloadAsFile(document: HTMLDocument, content: string, filename: string): void;
    }
}
declare module GUIEDITOR {
    interface ITextLineComponentProps {
        label?: string;
        value?: string;
        color?: string;
        underline?: boolean;
        onLink?: () => void;
        url?: string;
        ignoreValue?: boolean;
        additionalClass?: string;
        icon?: string;
        iconLabel?: string;
        tooltip?: string;
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export const conflictingValuesPlaceholder = "\u2014";
    /**
     *
     * @param propertyName the property that the input changes
     * @param targets a list of selected targets
     * @param defaultValue the value that should be returned when two targets have conflicting values
     * @param setter an optional setter function to override the default setter behavior
     * @returns a proxy object that can be passed as a target into the input
     */
    export function makeTargetsProxy<Type>(targets: Type[], onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>, getProperty?: (target: Type, property: keyof Type) => any): any;
}
declare module GUIEDITOR {
    interface IFloatLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        lockObject?: LockObject;
        onChange?: (newValue: number) => void;
        isInteger?: boolean;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        additionalClass?: string;
        step?: string;
        digits?: number;
        useEuler?: boolean;
        min?: number;
        max?: number;
        smallUI?: boolean;
        onEnter?: (newValue: number) => void;
        icon?: string;
        iconLabel?: string;
        defaultValue?: number;
        unit?: string;
        onUnitClicked?: () => void;
        unitLocked?: boolean;
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        constructor(props: IFloatLineComponentProps);
        componentWillUnmount(): void;
        getValueString(value: any): string;
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ISliderLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        minimum: number;
        maximum: number;
        step: number;
        directValue?: number;
        useEuler?: boolean;
        onChange?: (value: number) => void;
        onInput?: (value: number) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        decimalCount?: number;
        margin?: boolean;
        icon?: string;
        iconLabel?: string;
        lockObject?: LockObject;
    }
    export class SliderLineComponent extends React.Component<ISliderLineComponentProps, {
        value: number;
    }> {
        private _localChange;
        constructor(props: ISliderLineComponentProps);
        shouldComponentUpdate(nextProps: ISliderLineComponentProps, nextState: {
            value: number;
        }): boolean;
        onChange(newValueString: any): void;
        onInput(newValueString: any): void;
        prepareDataToRead(value: number): number;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IInputArrowsComponentProps {
        incrementValue: (amount: number) => void;
        setDragging: (dragging: boolean) => void;
    }
    export class InputArrowsComponent extends React.Component<IInputArrowsComponentProps> {
        private _arrowsRef;
        private _drag;
        private _releaseListener;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ITextInputLineComponentProps {
        label?: string;
        lockObject: LockObject;
        target?: any;
        propertyName?: string;
        value?: string;
        onChange?: (value: string) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        icon?: string;
        iconLabel?: string;
        noUnderline?: boolean;
        numbersOnly?: boolean;
        delayInput?: boolean;
        unit?: string;
        onUnitClicked?: (unit: string) => void;
        unitLocked?: boolean;
        arrows?: boolean;
        arrowsIncrement?: (amount: number) => void;
        step?: number;
    }
    export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, {
        value: string;
        dragging: boolean;
    }> {
        private _localChange;
        constructor(props: ITextInputLineComponentProps);
        componentWillUnmount(): void;
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
            dragging: boolean;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string): void;
        incrementValue(amount: number): void;
        onKeyDown(event: React.KeyboardEvent): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ICommandButtonComponentProps {
        tooltip: string;
        shortcut?: string;
        icon: string;
        iconLabel?: string;
        isActive: boolean;
        onClick: () => void;
        altStyle?: boolean;
        disabled?: boolean;
    }
    export class CommandButtonComponent extends React.Component<ICommandButtonComponentProps> {
        constructor(props: ICommandButtonComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface ICheckBoxLineComponentProps {
        label?: string;
        target?: any;
        propertyName?: string;
        isSelected?: () => boolean;
        onSelect?: (value: boolean) => void;
        onValueChanged?: () => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        disabled?: boolean;
        icon?: string;
        iconLabel?: string;
        faIcons?: {
        };
    }
    export class CheckBoxLineComponent extends React.Component<ICheckBoxLineComponentProps, {
        isSelected: boolean;
        isDisabled?: boolean;
        isConflict: boolean;
    }> {
        private _localChange;
        constructor(props: ICheckBoxLineComponentProps);
        shouldComponentUpdate(nextProps: ICheckBoxLineComponentProps, nextState: {
            isSelected: boolean;
            isDisabled: boolean;
            isConflict: boolean;
        }): boolean;
        onChange(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
        precision?: number;
        icon?: string;
        iconLabel?: string;
    }
    export class NumericInputComponent extends React.Component<INumericInputComponentProps, {
        value: string;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: INumericInputComponentProps);
        shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: {
            value: string;
        }): boolean;
        updateValue(evt: any): void;
        onBlur(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IColorComponentEntryProps {
        value: number;
        label: string;
        max?: number;
        min?: number;
        onChange: (value: number) => void;
    }
    export class ColorComponentEntry extends React.Component<IColorComponentEntryProps> {
        constructor(props: IColorComponentEntryProps);
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IHexColorProps {
        value: string;
        expectedLength: number;
        onChange: (value: string) => void;
    }
    export class HexColor extends React.Component<IHexColorProps, {
        hex: string;
    }> {
        constructor(props: IHexColorProps);
        shouldComponentUpdate(nextProps: IHexColorProps, nextState: {
            hex: string;
        }): boolean;
        updateHexValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    /**
     * Interface used to specify creation options for color picker
     */
    export interface IColorPickerProps {
        color: BABYLON.Color3 | BABYLON.Color4;
        linearhint?: boolean;
        debugMode?: boolean;
        onColorChanged?: (color: BABYLON.Color3 | BABYLON.Color4) => void;
    }
    /**
     * Interface used to specify creation options for color picker
     */
    export interface IColorPickerState {
        color: BABYLON.Color3;
        alpha: number;
    }
    /**
     * Class used to create a color picker
     */
    export class ColorPicker extends React.Component<IColorPickerProps, IColorPickerState> {
        private _saturationRef;
        private _hueRef;
        private _isSaturationPointerDown;
        private _isHuePointerDown;
        constructor(props: IColorPickerProps);
        shouldComponentUpdate(nextProps: IColorPickerProps, nextState: IColorPickerState): boolean;
        onSaturationPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onSaturationPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        onSaturationPointerMove(evt: React.PointerEvent<HTMLDivElement>): void;
        onHuePointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onHuePointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        onHuePointerMove(evt: React.PointerEvent<HTMLDivElement>): void;
        private _evaluateSaturation;
        private _evaluateHue;
        componentDidUpdate(): void;
        raiseOnColorChanged(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IColorPickerComponentProps {
        value: BABYLON.Color4 | BABYLON.Color3;
        linearHint?: boolean;
        onColorChanged: (newOne: string) => void;
        icon?: string;
        iconLabel?: string;
        shouldPopRight?: boolean;
    }
    interface IColorPickerComponentState {
        pickerEnabled: boolean;
        color: BABYLON.Color3 | BABYLON.Color4;
        hex: string;
    }
    export class ColorPickerLineComponent extends React.Component<IColorPickerComponentProps, IColorPickerComponentState> {
        private _floatRef;
        private _floatHostRef;
        constructor(props: IColorPickerComponentProps);
        syncPositions(): void;
        shouldComponentUpdate(nextProps: IColorPickerComponentProps, nextState: IColorPickerComponentState): boolean;
        getHexString(props?: Readonly<IColorPickerComponentProps> & Readonly<{
            children?: React.ReactNode;
        }>): string;
        componentDidUpdate(): void;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IColorLineComponentProps {
        label: string;
        target?: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onChange?: () => void;
        isLinear?: boolean;
        icon?: string;
        iconLabel?: string;
        lockObject?: LockObject;
        disableAlpha?: boolean;
    }
    interface IColorLineComponentState {
        isExpanded: boolean;
        color: BABYLON.Color4;
        colorString: string;
    }
    export class ColorLineComponent extends React.Component<IColorLineComponentProps, IColorLineComponentState> {
        constructor(props: IColorLineComponentProps);
        shouldComponentUpdate(nextProps: IColorLineComponentProps, nextState: IColorLineComponentState): boolean;
        getValue(props?: Readonly<IColorLineComponentProps> & Readonly<{
            children?: React.ReactNode;
        }>): BABYLON.Color4;
        getValueAsString(props?: Readonly<IColorLineComponentProps> & Readonly<{
            children?: React.ReactNode;
        }>): string;
        setColorFromString(colorString: string): void;
        setColor(color: BABYLON.Color4): void;
        updateColor(newColor: BABYLON.Color4): void;
        switchExpandState(): void;
        updateStateR(value: number): void;
        updateStateG(value: number): void;
        updateStateB(value: number): void;
        updateStateA(value: number): void;
        copyToClipboard(): void;
        get colorString(): string;
        set colorString(_: string);
        private convertToColor;
        private toColor3;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IIconComponentProps {
        icon: string;
        label?: string;
    }
    export class IconComponent extends React.Component<IIconComponentProps> {
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export const Null_Value: number;
    export interface IOptionsLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        options: BABYLON.IInspectableOptions[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number) => void;
        extractValue?: () => number;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        allowNullValue?: boolean;
        icon?: string;
        iconLabel?: string;
    }
    export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, {
        value: number;
    }> {
        private _localChange;
        private remapValueIn;
        private remapValueOut;
        constructor(props: IOptionsLineComponentProps);
        shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: {
            value: number;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ICommonControlPropertyGridComponentProps {
        controls: Control[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        private _onPropertyChangedObserver;
        constructor(props: ICommonControlPropertyGridComponentProps);
        private _getTransformedReferenceCoordinate;
        private _updateAlignment;
        private _checkAndUpdateValues;
        private _markChildrenAsDirty;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ISliderPropertyGridComponentProps {
        sliders: (Slider | ImageBasedSlider)[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
        constructor(props: ISliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ISliderGenericPropertyGridComponentProps {
        sliders: Slider[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SliderGenericPropertyGridComponent extends React.Component<ISliderGenericPropertyGridComponentProps> {
        constructor(props: ISliderGenericPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ILinePropertyGridComponentProps {
        lines: Line[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
        constructor(props: ILinePropertyGridComponentProps);
        onDashChange(value: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IRadioButtonPropertyGridComponentProps {
        radioButtons: RadioButton[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
        constructor(props: IRadioButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ITextBlockPropertyGridComponentProps {
        textBlocks: TextBlock[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
        constructor(props: ITextBlockPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IInputTextPropertyGridComponentProps {
        inputTexts: InputText[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
        constructor(props: IInputTextPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        isLinear?: boolean;
        icon?: string;
        lockObject?: LockObject;
        iconLabel?: string;
        onValueChange?: (value: string) => void;
    }
    export class Color3LineComponent extends React.Component<IColor3LineComponentProps> {
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IColorPickerPropertyGridComponentProps {
        colorPickers: ColorPicker[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
        constructor(props: IColorPickerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IImagePropertyGridComponentProps {
        images: Image[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
        constructor(props: IImagePropertyGridComponentProps);
        toggleAnimations(on: boolean): void;
        getMaxCells(): number;
        updateCellSize(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IImageBasedSliderPropertyGridComponentProps {
        imageBasedSliders: ImageBasedSlider[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
        constructor(props: IImageBasedSliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IContainerPropertyGridComponentProps {
        containers: Container[];
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ContainerPropertyGridComponent extends React.Component<IContainerPropertyGridComponentProps> {
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IRectanglePropertyGridComponentProps {
        rectangles: Rectangle[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
        constructor(props: IRectanglePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IStackPanelPropertyGridComponentProps {
        stackPanels: StackPanel[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
        constructor(props: IStackPanelPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IGridPropertyGridComponentProps {
        grids: Grid[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps> {
        constructor(props: IGridPropertyGridComponentProps);
        private _removingColumn;
        private _removingRow;
        private _previousGrid;
        private _rowDefinitions;
        private _rowEditFlags;
        private _columnEditFlags;
        private _columnDefinitions;
        private _editedRow;
        private _editedColumn;
        private _rowChild;
        private _columnChild;
        renderRows(): JSX.Element[];
        setRowValues(): void;
        setColumnValues(): void;
        renderColumns(): JSX.Element[];
        resizeRow(): void;
        resizeColumn(): void;
        checkValue(value: string, percent: boolean): string;
        checkPercentage(value: string): boolean;
        resetValues(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IScrollViewerPropertyGridComponentProps {
        scrollViewers: ScrollViewer[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
        constructor(props: IScrollViewerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IEllipsePropertyGridComponentProps {
        ellipses: Ellipse[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
        constructor(props: IEllipsePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ICheckboxPropertyGridComponentProps {
        checkboxes: Checkbox[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
        constructor(props: ICheckboxPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IControlPropertyGridComponentProps {
        controls: Control[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
        constructor(props: IControlPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IParentingPropertyGridComponentProps {
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ParentingPropertyGridComponent extends React.Component<IParentingPropertyGridComponentProps> {
        constructor(props: IParentingPropertyGridComponentProps);
        private _columnNumber;
        private _rowNumber;
        updateGridPosition(): void;
        getCellInfo(): void;
        private _changeCell;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IDisplayGridPropertyGridComponentProps {
        displayGrids: DisplayGrid[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class DisplayGridPropertyGridComponent extends React.Component<IDisplayGridPropertyGridComponentProps> {
        constructor(props: IDisplayGridPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IButtonPropertyGridComponentProps {
        rectangles: Rectangle[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onAddComponent: (newComponent: string) => void;
    }
    export class ButtonPropertyGridComponent extends React.Component<IButtonPropertyGridComponentProps> {
        constructor(props: IButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class GUINodeTools {
        static ImageControlDefaultUrl: string;
        static CreateControlFromString(data: string): Grid | Rectangle | Line | TextBlock | Image | Slider | ImageBasedSlider | RadioButton | InputText | ColorPicker | StackPanel | Ellipse | Checkbox | DisplayGrid;
    }
}
declare module GUIEDITOR {
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps> {
        private _onBuiltObserver;
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        load(file: File): void;
        save(saveCallback: () => void): void;
        saveLocally: () => void;
        saveToSnippetServerHelper: (content: string, adt: AdvancedDynamicTexture) => Promise<string>;
        saveToSnippetServer: () => Promise<void>;
        loadFromSnippet(): void;
        renderNode(nodes: Control[]): JSX.Element;
        /**
         * returns the class name of a list of controls if they share a class, or an empty string if not
         */
        getControlsCommonClassName(nodes: Control[]): string;
        renderProperties(nodes: Control[]): JSX.Element | undefined;
        renderControlIcon(nodes: Control[]): string;
        render(): JSX.Element | null;
    }
}
declare module GUIEDITOR {
    interface IPortalProps {
        globalState: GlobalState;
    }
    export class Portal extends React.Component<IPortalProps> {
        render(): React.ReactPortal;
    }
}
declare module GUIEDITOR {
    interface IMessageDialogComponentProps {
        globalState: GlobalState;
    }
    export class MessageDialogComponent extends React.Component<IMessageDialogComponentProps, {
        message: string;
        isError: boolean;
    }> {
        constructor(props: IMessageDialogComponentProps);
        render(): JSX.Element | null;
    }
}
declare module GUIEDITOR {
    interface ITreeItemLabelComponentProps {
        label?: string;
        onClick?: () => void;
        onChange: (newValue: string) => void;
        bracket: string;
        renaming: boolean;
        setRenaming: (renaming: boolean) => void;
    }
    interface ITreeItemLabelState {
        value: string;
    }
    export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps, ITreeItemLabelState> {
        constructor(props: ITreeItemLabelComponentProps);
        onClick(): void;
        onBlur(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IExtensionsComponentProps {
        target: any;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
    }
    export class ExtensionsComponent extends React.Component<IExtensionsComponentProps, {
        popupVisible: boolean;
    }> {
        private _popup;
        private extensionRef;
        constructor(props: IExtensionsComponentProps);
        showPopup(): void;
        componentDidMount(): void;
        componentDidUpdate(): void;
        render(): JSX.Element | null;
    }
}
declare module GUIEDITOR {
    interface IControlTreeItemComponentProps {
        control: Control;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
        isHovered: boolean;
        isDragOver: boolean;
        dragOverLocation: DragOverLocation;
    }
    export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, {
        isActive: boolean;
        isVisible: boolean;
        isRenaming: boolean;
    }> {
        constructor(props: IControlTreeItemComponentProps);
        highlight(): void;
        switchVisibility(): void;
        onRename(name: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface ITreeItemSelectableComponentProps {
        entity: any;
        selectedEntities: any[];
        mustExpand?: boolean;
        offset: number;
        globalState: GlobalState;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        filter: BABYLON.Nullable<string>;
    }
    export interface ITreeItemSelectableComponentState {
        dragOver: boolean;
        isSelected: boolean;
        isHovered: boolean;
        dragOverLocation: DragOverLocation;
    }
    export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, ITreeItemSelectableComponentState> {
        private _onSelectionChangedObservable;
        private _onDraggingEndObservable;
        private _onDraggingStartObservable;
        /** flag flipped onDragEnter if dragOver is already true
         * prevents dragLeave from immediately setting dragOver to false
         * required to make dragging work as expected
         * see: see: https://github.com/transformation-dev/matrx/tree/master/packages/dragster
         */
        private _secondDragEnter;
        constructor(props: ITreeItemSelectableComponentProps);
        switchExpandedState(): void;
        shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: {
            isSelected: boolean;
        }): boolean;
        scrollIntoView(): void;
        componentWillUnmount(): void;
        onSelect(): void;
        renderChildren(isExpanded: boolean, offset?: boolean): (JSX.Element | null)[] | null;
        render(): JSX.Element | (JSX.Element | null)[] | null;
        dragOver(event: React.DragEvent<HTMLDivElement>): void;
        updateDragOverLocation(event: React.DragEvent<HTMLDivElement>): void;
        drop(): void;
    }
}
declare module GUIEDITOR {
    export interface ITreeItemComponentProps {
        items?: BABYLON.Nullable<any[]>;
        label: string;
        offset: number;
        filter: BABYLON.Nullable<string>;
        forceSubitems?: boolean;
        globalState: GlobalState;
        entity?: any;
        selectedEntities: any[];
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        contextMenuItems?: {
            label: string;
            action: () => void;
        }[];
    }
    export class TreeItemComponent extends React.Component<ITreeItemComponentProps, {
        isExpanded: boolean;
        mustExpand: boolean;
    }> {
        static _ContextMenuUniqueIdGenerator: number;
        constructor(props: ITreeItemComponentProps);
        switchExpandedState(): void;
        shouldComponentUpdate(nextProps: ITreeItemComponentProps, nextState: {
            isExpanded: boolean;
        }): boolean;
        expandAll(expand: boolean): void;
        renderContextMenu(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ISceneExplorerFilterComponentProps {
        onFilter: (filter: string) => void;
    }
    export class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
        constructor(props: ISceneExplorerFilterComponentProps);
        render(): JSX.Element;
    }
    interface ISceneExplorerComponentProps {
        scene?: BABYLON.Scene;
        noCommands?: boolean;
        noHeader?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        globalState: GlobalState;
        popupMode?: boolean;
        onPopup?: () => void;
        onClose?: () => void;
    }
    export class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, {
        filter: BABYLON.Nullable<string>;
        selectedEntity: any;
        scene: BABYLON.Nullable<BABYLON.Scene>;
    }> {
        private _onSelectionChangeObserver;
        private _onParrentingChangeObserver;
        private _onNewSceneObserver;
        private _onPropertyChangedObservable;
        constructor(props: ISceneExplorerComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        filterContent(filter: string): void;
        findSiblings(parent: any, items: any[], target: any, goNext: boolean, data: {
            previousOne?: any;
            found?: boolean;
        }): boolean;
        processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>): void;
        renderContent(): JSX.Element | null;
        onClose(): void;
        onPopup(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
        icon?: string;
        iconLabel?: string;
    }
    export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
        private static _IDGenerator;
        private _id;
        private uploadInputRef;
        constructor(props: IFileButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ICommandDropdownComponentProps {
        globalState: GlobalState;
        icon?: string;
        tooltip: string;
        defaultValue?: string;
        items: {
            label: string;
            icon?: string;
            fileButton?: boolean;
            onClick?: () => void;
            onCheck?: (value: boolean) => void;
            storeKey?: string;
            isActive?: boolean;
            defaultValue?: boolean | string;
            subItems?: string[];
        }[];
        toRight?: boolean;
    }
    export class CommandDropdownComponent extends React.Component<ICommandDropdownComponentProps, {
        isExpanded: boolean;
        activeState: string;
    }> {
        constructor(props: ICommandDropdownComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ICommandBarComponentProps {
        globalState: GlobalState;
    }
    export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
        private _panning;
        private _zooming;
        private _selecting;
        private _sizeOption;
        constructor(props: ICommandBarComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IGuiGizmoProps {
        globalState: GlobalState;
        control: Control;
    }
    enum ScalePointPosition {
        Top = -1,
        Left = -1,
        Center = 0,
        Right = 1,
        Bottom = 1
    }
    interface IScalePoint {
        position: BABYLON.Vector2;
        horizontalPosition: ScalePointPosition;
        verticalPosition: ScalePointPosition;
        rotation: number;
        isPivot: boolean;
    }
    interface IGuiGizmoState {
        canvasBounds: Rect;
        scalePoints: IScalePoint[];
        scalePointDragging: number;
        isRotating: boolean;
    }
    export class GuiGizmoComponent extends React.Component<IGuiGizmoProps, IGuiGizmoState> {
        private _storedValues;
        private _localBounds;
        private _rotation;
        private _gizmoUpdateObserver;
        private _pointerUpObserver;
        private _pointerMoveObserver;
        constructor(props: IGuiGizmoProps);
        componentWillUnmount(): void;
        /**
         * Update the gizmo's positions
         * @param force should the update be forced. otherwise it will be updated only when the pointer is down
         */
        updateGizmo(force?: boolean): void;
        private _onUp;
        private _onMove;
        private _rotate;
        private _modulo;
        private _dragLocalBounds;
        private _updateNodeFromLocalBounds;
        private _beginDraggingScalePoint;
        private _beginRotate;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IGizmoWrapperProps {
        globalState: GlobalState;
    }
    export class GizmoWrapper extends React.Component<IGizmoWrapperProps> {
        observer: BABYLON.Nullable<BABYLON.Observer<void>>;
        componentWillMount(): void;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IArtBoardProps {
        globalState: GlobalState;
    }
    interface IArtBoardState {
        bounds: Rect;
    }
    export class ArtBoardComponent extends React.Component<IArtBoardProps, IArtBoardState> {
        constructor(props: IArtBoardProps);
        update(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    interface IGraphEditorState {
        showPreviewPopUp: boolean;
    }
    export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _toolBarIconSize;
        private _popUpWindow;
        private _draggedItem;
        private _rootRef;
        componentDidMount(): void;
        constructor(props: IGraphEditorProps);
        showWaitScreen(): void;
        hideWaitScreen(): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        handlePopUp: () => void;
        handleClosingPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        render(): JSX.Element;
        onCreate(value: string): Control;
        createToolbar(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class Popup {
        static CreatePopup(title: string, windowVariableName: string, width?: number, height?: number): HTMLDivElement | null;
        private static _CopyStyles;
    }
}
declare module GUIEDITOR {
    /**
     * Interface used to specify creation options for the gui editor
     */
    export interface IGUIEditorOptions {
        liveGuiTexture?: AdvancedDynamicTexture;
        customLoad: {
            label: string;
            action: (data: string) => Promise<string>;
        } | undefined;
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<string>;
        };
        currentSnippetToken?: string;
        customLoadObservable?: BABYLON.Observable<any>;
    }
    /**
     * Class used to create a gui editor
     */
    export class GUIEditor {
        private static _CurrentState;
        /**
         * Show the gui editor
         * @param options defines the options to use to configure the gui editor
         */
        static Show(options: IGUIEditorOptions): Promise<void>;
    }
}
declare module GUIEDITOR {
    export interface INodeLocationInfo {
        blockId: number;
        x: number;
        y: number;
    }
    export interface IFrameData {
        x: number;
        y: number;
        width: number;
        height: number;
        color: number[];
        name: string;
        isCollapsed: boolean;
        blocks: number[];
        comments: string;
    }
    export interface IEditorData {
        locations: INodeLocationInfo[];
        x: number;
        y: number;
        zoom: number;
        frames?: IFrameData[];
        map?: {
            [key: number]: number;
        };
    }
}
declare module GUIEDITOR {
    export interface ISelectedLineContainer {
        selectedLineContainerTitles: Array<string>;
        selectedLineContainerTitlesNoFocus: Array<string>;
    }
}
declare module GUIEDITOR {
    interface ILineContainerComponentProps {
        selection?: ISelectedLineContainer;
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
        isHighlighted: boolean;
    }> {
        constructor(props: ILineContainerComponentProps);
        switchExpandedState(): void;
        renderHeader(): JSX.Element;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IButtonLineComponentProps {
        data: string;
        tooltip: string;
    }
    export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IGuiListComponentProps {
        globalState: GlobalState;
    }
    export class GuiListComponent extends React.Component<IGuiListComponentProps, {
        filter: string;
    }> {
        private _onResetRequiredObserver;
        private static _Tooltips;
        constructor(props: IGuiListComponentProps);
        componentWillUnmount(): void;
        filterContent(filter: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module GUIEDITOR {
    interface IFloatLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onChange?: (newValue: number) => void;
        isInteger?: boolean;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        additionalClass?: string;
        step?: string;
        digits?: number;
        globalState: GlobalState;
        min?: number;
        max?: number;
        smallUI?: boolean;
        onEnter?: (newValue: number) => void;
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        private _regExp;
        private _digits;
        constructor(props: IFloatLineComponentProps);
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ILineWithFileButtonComponentProps {
        title: string;
        closed?: boolean;
        label: string;
        iconImage: any;
        onIconClick: (file: File) => void;
        accept: string;
        uploadName?: string;
    }
    export class LineWithFileButtonComponent extends React.Component<ILineWithFileButtonComponentProps, {
        isExpanded: boolean;
    }> {
        private uploadRef;
        constructor(props: ILineWithFileButtonComponentProps);
        onChange(evt: any): void;
        switchExpandedState(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
        globalState: GlobalState;
    }
    export class NumericInputComponent extends React.Component<INumericInputComponentProps, {
        value: string;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: INumericInputComponentProps);
        shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: {
            value: string;
        }): boolean;
        updateValue(evt: any): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ISliderLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        minimum: number;
        maximum: number;
        step: number;
        directValue?: number;
        useEuler?: boolean;
        onChange?: (value: number) => void;
        onInput?: (value: number) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        decimalCount?: number;
        globalState: GlobalState;
    }
    export class SliderLineComponent extends React.Component<ISliderLineComponentProps, {
        value: number;
    }> {
        private _localChange;
        constructor(props: ISliderLineComponentProps);
        shouldComponentUpdate(nextProps: ISliderLineComponentProps, nextState: {
            value: number;
        }): boolean;
        onChange(newValueString: any): void;
        onInput(newValueString: any): void;
        prepareDataToRead(value: number): number;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ITextInputLineComponentProps {
        label: string;
        globalState: GlobalState;
        target?: any;
        propertyName?: string;
        value?: string;
        multilines?: boolean;
        onChange?: (value: string) => void;
        validator?: (value: string) => boolean;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        constructor(props: ITextInputLineComponentProps);
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string, raisePropertyChanged: boolean): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IBooleanLineComponentProps {
        label: string;
        value: boolean;
        icon?: string;
        iconLabel?: string;
    }
    export class BooleanLineComponent extends React.Component<IBooleanLineComponentProps> {
        constructor(props: IBooleanLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IButtonLineComponentProps {
        label: string;
        onClick: () => void;
        icon?: string;
        iconLabel?: string;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IColor4LineComponentProps {
        label: string;
        target?: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onChange?: () => void;
        isLinear?: boolean;
        icon?: string;
        iconLabel?: string;
        lockObject?: LockObject;
    }
    export class Color4LineComponent extends React.Component<IColor4LineComponentProps> {
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IFileMultipleButtonLineComponentProps {
        label: string;
        onClick: (event: any) => void;
        accept: string;
        icon?: string;
        iconLabel?: string;
    }
    export class FileMultipleButtonLineComponent extends React.Component<IFileMultipleButtonLineComponentProps> {
        private static _IDGenerator;
        private _id;
        private uploadInputRef;
        constructor(props: IFileMultipleButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IHexLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        lockObject?: LockObject;
        onChange?: (newValue: number) => void;
        isInteger?: boolean;
        replaySourceReplacement?: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        additionalClass?: string;
        step?: string;
        digits?: number;
        useEuler?: boolean;
        min?: number;
        icon?: string;
        iconLabel?: string;
    }
    export class HexLineComponent extends React.Component<IHexLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        private _propertyChange;
        constructor(props: IHexLineComponentProps);
        componentWillUnmount(): void;
        shouldComponentUpdate(nextProps: IHexLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        convertToHexString(valueString: string): string;
        updateValue(valueString: string, raisePropertyChanged: boolean): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IIconButtonLineComponentProps {
        icon: string;
        onClick: () => void;
        tooltip: string;
        active?: boolean;
    }
    export class IconButtonLineComponent extends React.Component<IIconButtonLineComponentProps> {
        constructor(props: IIconButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IIndentedTextLineComponentProps {
        value?: string;
        color?: string;
        underline?: boolean;
        onLink?: () => void;
        url?: string;
        additionalClass?: string;
    }
    export class IndentedTextLineComponent extends React.Component<IIndentedTextLineComponentProps> {
        constructor(props: IIndentedTextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ILinkButtonComponentProps {
        label: string;
        buttonLabel: string;
        url?: string;
        onClick: () => void;
        onIconClick?: () => void;
    }
    export class LinkButtonComponent extends React.Component<ILinkButtonComponentProps> {
        constructor(props: ILinkButtonComponentProps);
        onLink(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IMessageLineComponentProps {
        text: string;
        color?: string;
    }
    export class MessageLineComponent extends React.Component<IMessageLineComponentProps> {
        constructor(props: IMessageLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IRadioButtonLineComponentProps {
        onSelectionChangedObservable: BABYLON.Observable<RadioButtonLineComponent>;
        label: string;
        isSelected: () => boolean;
        onSelect: () => void;
        icon?: string;
        iconLabel?: string;
    }
    export class RadioButtonLineComponent extends React.Component<IRadioButtonLineComponentProps, {
        isSelected: boolean;
    }> {
        private _onSelectionChangedObserver;
        constructor(props: IRadioButtonLineComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        onChange(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IValueLineComponentProps {
        label: string;
        value: number;
        color?: string;
        fractionDigits?: number;
        units?: string;
        icon?: string;
        iconLabel?: string;
    }
    export class ValueLineComponent extends React.Component<IValueLineComponentProps> {
        constructor(props: IValueLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IVector2LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector2) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        icon?: string;
        iconLabel?: string;
    }
    export class Vector2LineComponent extends React.Component<IVector2LineComponentProps, {
        isExpanded: boolean;
        value: BABYLON.Vector2;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: IVector2LineComponentProps);
        shouldComponentUpdate(nextProps: IVector2LineComponentProps, nextState: {
            isExpanded: boolean;
            value: BABYLON.Vector2;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: BABYLON.Vector2): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector3) => void;
        useEuler?: boolean;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        noSlider?: boolean;
        icon?: string;
        iconLabel?: string;
    }
    export class Vector3LineComponent extends React.Component<IVector3LineComponentProps, {
        isExpanded: boolean;
        value: BABYLON.Vector3;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: IVector3LineComponentProps);
        getCurrentValue(): any;
        shouldComponentUpdate(nextProps: IVector3LineComponentProps, nextState: {
            isExpanded: boolean;
            value: BABYLON.Vector3;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: BABYLON.Vector3): void;
        updateVector3(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IVector4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector4) => void;
        useEuler?: boolean;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        icon?: string;
        iconLabel?: string;
    }
    export class Vector4LineComponent extends React.Component<IVector4LineComponentProps, {
        isExpanded: boolean;
        value: BABYLON.Vector4;
    }> {
        static defaultProps: {
            step: number;
        };
        private _localChange;
        constructor(props: IVector4LineComponentProps);
        getCurrentValue(): any;
        shouldComponentUpdate(nextProps: IVector4LineComponentProps, nextState: {
            isExpanded: boolean;
            value: BABYLON.Vector4;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: BABYLON.Vector4): void;
        updateVector4(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        updateStateW(value: number): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ICommonControlPropertyGridComponentProps {
        controls?: Control[];
        control?: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        constructor(props: ICommonControlPropertyGridComponentProps);
        renderGridInformation(control: Control): JSX.Element | null;
        render(): JSX.Element | undefined;
    }
}
declare module GUIEDITOR {
    interface ICheckboxPropertyGridComponentProps {
        checkbox: Checkbox;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
        constructor(props: ICheckboxPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IColorPickerPropertyGridComponentProps {
        colorPicker: ColorPicker;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
        constructor(props: IColorPickerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IControlPropertyGridComponentProps {
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
        constructor(props: IControlPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IEllipsePropertyGridComponentProps {
        ellipse: Ellipse;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
        constructor(props: IEllipsePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IGridPropertyGridComponentProps {
        grid: Grid;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class GridPropertyGridComponent extends React.Component<IGridPropertyGridComponentProps> {
        constructor(props: IGridPropertyGridComponentProps);
        renderRows(): JSX.Element[];
        renderColumns(): JSX.Element[];
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IImageBasedSliderPropertyGridComponentProps {
        imageBasedSlider: ImageBasedSlider;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
        constructor(props: IImageBasedSliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IImagePropertyGridComponentProps {
        image: Image;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
        constructor(props: IImagePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IInputTextPropertyGridComponentProps {
        inputText: InputText;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
        constructor(props: IInputTextPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ILinePropertyGridComponentProps {
        line: Line;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
        constructor(props: ILinePropertyGridComponentProps);
        onDashChange(value: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IRadioButtonPropertyGridComponentProps {
        radioButtons: RadioButton[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
        constructor(props: IRadioButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IRectanglePropertyGridComponentProps {
        rectangle: Rectangle;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
        constructor(props: IRectanglePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IScrollViewerPropertyGridComponentProps {
        scrollViewer: ScrollViewer;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
        constructor(props: IScrollViewerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ISliderPropertyGridComponentProps {
        slider: Slider;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
        constructor(props: ISliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IStackPanelPropertyGridComponentProps {
        stackPanel: StackPanel;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
        constructor(props: IStackPanelPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ITextBlockPropertyGridComponentProps {
        textBlock: TextBlock;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
        constructor(props: ITextBlockPropertyGridComponentProps);
        render(): JSX.Element;
    }
}