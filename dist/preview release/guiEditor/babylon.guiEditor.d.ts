/// <reference types="react" />
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
    export interface IWorkbenchComponentProps {
        globalState: GlobalState;
    }
    export type FramePortData = {};
    export const isFramePortData: (variableToCheck: any) => variableToCheck is FramePortData;
    export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
        private _gridCanvas;
        private _svgCanvas;
        private _rootContainer;
        private _guiNodes;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _textureMesh;
        private _scene;
        private _selectedGuiNodes;
        private _ctrlKeyIsPressed;
        _frameIsMoving: boolean;
        _isLoading: boolean;
        isOverGUINode: boolean;
        private _panning;
        get globalState(): GlobalState;
        get nodes(): GUINode[];
        get selectedGuiNodes(): GUINode[];
        constructor(props: IWorkbenchComponentProps);
        clearGuiTexture(): void;
        loadFromJson(serializationObject: any): void;
        loadFromSnippet(snippedID: string): Promise<void>;
        loadFromGuiTexture(): void;
        resizeGuiTexture(newvalue: BABYLON.Vector2): void;
        onKeyUp(): void;
        findNodeFromGuiElement(guiControl: Control): GUINode;
        reset(): void;
        appendBlock(guiElement: Control): GUINode;
        componentDidMount(): void;
        onMove(evt: React.PointerEvent): void;
        getGroundPosition(): BABYLON.Nullable<BABYLON.Vector3>;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        isUp: boolean;
        onUp(evt: React.PointerEvent): void;
        createGUICanvas(): void;
        addControls(scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera): void;
        getPosition(scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera, plane: BABYLON.Plane): BABYLON.Vector3;
        panning(newPos: BABYLON.Vector3, initialPos: BABYLON.Vector3, inertia: number, ref: BABYLON.Vector3): BABYLON.Vector3;
        zoomWheel(p: BABYLON.PointerInfo, e: BABYLON.EventState, camera: BABYLON.ArcRotateCamera): number;
        zooming(delta: number, scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera, plane: BABYLON.Plane, ref: BABYLON.Vector3): void;
        zeroIfClose(vec: BABYLON.Vector3): void;
        updateGUIs(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class GUINode {
        guiControl: Control;
        private _x;
        private _y;
        private _gridAlignedX;
        private _gridAlignedY;
        private _globalState;
        private _onSelectionChangedObserver;
        private _onSelectionBoxMovedObserver;
        private _onUpdateRequiredObserver;
        private _ownerCanvas;
        private _isSelected;
        private _isVisible;
        private _enclosingFrameId;
        children: GUINode[];
        get isVisible(): boolean;
        set isVisible(value: boolean);
        get gridAlignedX(): number;
        get gridAlignedY(): number;
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get width(): number;
        get height(): number;
        get id(): number;
        get name(): string | undefined;
        get isSelected(): boolean;
        get enclosingFrameId(): number;
        set enclosingFrameId(value: number);
        set isSelected(value: boolean);
        constructor(globalState: GlobalState, guiControl: Control);
        enableEditorProperties(): void;
        clicked: boolean;
        _onMove(evt: BABYLON.Vector2, startPos: BABYLON.Vector2, ignorClick?: boolean): boolean;
        updateVisual(): void;
        private _isContainer;
        addGui(childNode: GUINode): void;
        dispose(): void;
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
    export class GlobalState {
        guiTexture: AdvancedDynamicTexture;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        onSelectionChangedObservable: BABYLON.Observable<BABYLON.Nullable<GUINode>>;
        onResizeObservable: BABYLON.Observable<BABYLON.Vector2>;
        onRebuildRequiredObservable: BABYLON.Observable<void>;
        onBuiltObservable: BABYLON.Observable<void>;
        onResetRequiredObservable: BABYLON.Observable<void>;
        onUpdateRequiredObservable: BABYLON.Observable<void>;
        onReOrganizedRequiredObservable: BABYLON.Observable<void>;
        onLogRequiredObservable: BABYLON.Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: BABYLON.Observable<string>;
        onIsLoadingChanged: BABYLON.Observable<boolean>;
        onSelectionBoxMoved: BABYLON.Observable<ClientRect | DOMRect>;
        onGuiNodeRemovalObservable: BABYLON.Observable<GUINode>;
        backgroundColor: BABYLON.Color4;
        blockKeyboardEvents: boolean;
        controlCamera: boolean;
        workbench: WorkbenchComponent;
        onPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        storeEditorData: (serializationObject: any) => void;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
    }
}
declare module GUIEDITOR {
    interface ILineContainerComponentProps {
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
    }> {
        constructor(props: ILineContainerComponentProps);
        switchExpandedState(): void;
        renderHeader(): JSX.Element;
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
    export interface IButtonLineComponentProps {
        label: string;
        onClick: () => void;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
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
    export interface ICheckBoxLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        isSelected?: () => boolean;
        onSelect?: (value: boolean) => void;
        onValueChanged?: () => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        disabled?: boolean;
    }
    export class CheckBoxLineComponent extends React.Component<ICheckBoxLineComponentProps, {
        isSelected: boolean;
        isDisabled?: boolean;
    }> {
        private static _UniqueIdSeed;
        private _uniqueId;
        private _localChange;
        constructor(props: ICheckBoxLineComponentProps);
        shouldComponentUpdate(nextProps: ICheckBoxLineComponentProps, nextState: {
            isSelected: boolean;
            isDisabled: boolean;
        }): boolean;
        onChange(): void;
        render(): JSX.Element;
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
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element | null;
        render(): JSX.Element;
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
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        constructor(props: IFloatLineComponentProps);
        componentWillUnmount(): void;
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
        lockObject: LockObject;
        target?: any;
        propertyName?: string;
        value?: string;
        onChange?: (value: string) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        constructor(props: ITextInputLineComponentProps);
        componentWillUnmount(): void;
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export const Null_Value: number;
    export class ListLineOption {
        label: string;
        value: number;
        selected?: boolean;
    }
    export interface IOptionsLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        options: ListLineOption[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number) => void;
        extractValue?: () => number;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        allowNullValue?: boolean;
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
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        constructor(props: ICommonControlPropertyGridComponentProps);
        renderGridInformation(): JSX.Element | null;
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
        radioButton: RadioButton;
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
        textBlock: TextBlock;
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
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
        precision?: number;
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
        onColorChanged: (newOne: string) => void;
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
        componentDidUpdate(): void;
        componentDidMount(): void;
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
    }
    export class Color3LineComponent extends React.Component<IColor3LineComponentProps, {
        isExpanded: boolean;
        color: BABYLON.Color3;
    }> {
        private _localChange;
        constructor(props: IColor3LineComponentProps);
        shouldComponentUpdate(nextProps: IColor3LineComponentProps, nextState: {
            color: BABYLON.Color3;
        }): boolean;
        setPropertyValue(newColor: BABYLON.Color3): void;
        onChange(newValue: string): void;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: BABYLON.Color3): void;
        updateStateR(value: number): void;
        updateStateG(value: number): void;
        updateStateB(value: number): void;
        copyToClipboard(): void;
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
    interface IVector2LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector2) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
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
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    interface IPropertyTabComponentState {
        currentNode: BABYLON.Nullable<GUINode>;
        textureSize: BABYLON.Vector2;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
        private _onBuiltObserver;
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPropertyTabComponentProps);
        timerRefresh(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        load(file: File): void;
        save(): void;
        saveToSnippetServer(): void;
        loadFromSnippet(): void;
        renderProperties(): JSX.Element | JSX.Element[] | null;
        render(): JSX.Element;
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
    export class GUINodeTools {
        static CreateControlFromString(data: string): Rectangle | Grid | Slider | Line | TextBlock | InputText | ColorPicker | Image | StackPanel | Ellipse | Checkbox | DisplayGrid;
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
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    interface IGraphEditorState {
        showPreviewPopUp: boolean;
    }
    export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
        private _workbenchCanvas;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _onWidgetKeyUpPointer;
        private _popUpWindow;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        pasteSelection(copiedNodes: GUINode[], currentX: number, currentY: number, selectNew?: boolean): GUINode[];
        showWaitScreen(): void;
        hideWaitScreen(): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        emitNewBlock(event: React.DragEvent<HTMLDivElement>): void;
        handlePopUp: () => void;
        handleClosingPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        render(): JSX.Element;
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
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
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
        static Show(options: IGUIEditorOptions): void;
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
    }
    export class BooleanLineComponent extends React.Component<IBooleanLineComponentProps> {
        constructor(props: IBooleanLineComponentProps);
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IColor4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onChange?: () => void;
        isLinear?: boolean;
    }
    export class Color4LineComponent extends React.Component<IColor4LineComponentProps, {
        isExpanded: boolean;
        color: BABYLON.Color4;
    }> {
        private _localChange;
        constructor(props: IColor4LineComponentProps);
        shouldComponentUpdate(nextProps: IColor4LineComponentProps, nextState: {
            color: BABYLON.Color4;
        }): boolean;
        setPropertyValue(newColor: BABYLON.Color4): void;
        onChange(newValue: string): void;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: BABYLON.Color4): void;
        updateStateR(value: number): void;
        updateStateG(value: number): void;
        updateStateB(value: number): void;
        updateStateA(value: number): void;
        copyToClipboard(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface IFileMultipleButtonLineComponentProps {
        label: string;
        onClick: (event: any) => void;
        accept: string;
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
    }
    export class ValueLineComponent extends React.Component<IValueLineComponentProps> {
        constructor(props: IValueLineComponentProps);
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