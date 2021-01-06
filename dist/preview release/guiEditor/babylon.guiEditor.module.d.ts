/// <reference types="react" />
declare module "babylonjs-gui-editor/blockTools" {
    import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
    import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
    import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
    import { Line } from "babylonjs-gui/2D/controls/line";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
    import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
    export class BlockTools {
        static GetGuiFromString(data: string): Slider | Checkbox | ColorPicker | Ellipse | Rectangle | Line | TextBlock;
    }
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
declare module "babylonjs-gui-editor/diagram/workbench" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { GUINode } from "babylonjs-gui-editor/diagram/guiNode";
    import { Control } from 'babylonjs-gui/2D/controls/control';
    export interface IWorkbenchComponentProps {
        globalState: GlobalState;
    }
    export type FramePortData = {};
    export const isFramePortData: (variableToCheck: any) => variableToCheck is FramePortData;
    export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
        private readonly MinZoom;
        private readonly MaxZoom;
        private _hostCanvas;
        private _graphCanvas;
        private _selectionContainer;
        private _frameContainer;
        private _svgCanvas;
        private _rootContainer;
        private _guiNodes;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _selectionStartX;
        private _selectionStartY;
        private _x;
        private _y;
        private _zoom;
        private _selectedGuiNodes;
        private _gridSize;
        private _selectionBox;
        private _frameCandidate;
        private _altKeyIsPressed;
        private _ctrlKeyIsPressed;
        private _oldY;
        _frameIsMoving: boolean;
        _isLoading: boolean;
        isOverGUINode: boolean;
        get gridSize(): number;
        set gridSize(value: number);
        get globalState(): GlobalState;
        get nodes(): GUINode[];
        get zoom(): number;
        set zoom(value: number);
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get selectedGuiNodes(): GUINode[];
        get canvasContainer(): HTMLDivElement;
        get hostCanvas(): HTMLDivElement;
        get svgCanvas(): HTMLElement;
        get selectionContainer(): HTMLDivElement;
        get frameContainer(): HTMLDivElement;
        constructor(props: IWorkbenchComponentProps);
        getGridPosition(position: number, useCeil?: boolean): number;
        getGridPositionCeil(position: number): number;
        updateTransform(): void;
        onKeyUp(): void;
        findNodeFromGuiElement(guiElement: Control): GUINode;
        reset(): void;
        appendBlock(guiElement: Control): GUINode;
        distributeGraph(): void;
        componentDidMount(): void;
        onMove(evt: React.PointerEvent): void;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        onUp(evt: React.PointerEvent): void;
        onWheel(evt: React.WheelEvent): void;
        zoomToFit(): void;
        createGUICanvas(): void;
        updateGUIs(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/diagram/properties/propertyComponentProps" {
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    export interface IPropertyComponentProps {
        globalState: GlobalState;
        guiBlock: Control;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/lineContainerComponent" {
    import * as React from "react";
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
declare module "babylonjs-gui-editor/sharedComponents/propertyChangedEvent" {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/checkBoxLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-gui-editor/sharedComponents/propertyChangedEvent";
    export interface ICheckBoxLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        isSelected?: () => boolean;
        onSelect?: (value: boolean) => void;
        onValueChanged?: () => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
        constructor(props: IFloatLineComponentProps);
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
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
declare module "babylonjs-gui-editor/diagram/properties/genericNodePropertyComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-gui-editor/diagram/properties/propertyComponentProps";
    export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
    export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
    export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        forceRebuild(notifiers?: {
            "rebuild"?: boolean;
            "update"?: boolean;
        }): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/textLineComponent" {
    import * as React from "react";
    interface ITextLineComponentProps {
        label: string;
        value: string;
        color?: string;
        underline?: boolean;
        onLink?: () => void;
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element;
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
declare module "babylonjs-gui-editor/diagram/properties/sliderGuiPropertyComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-gui-editor/diagram/properties/propertyComponentProps";
    export class SliderPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        private slider;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/diagram/propertyLedger" {
    import { ComponentClass } from 'react';
    import { IPropertyComponentProps } from "babylonjs-gui-editor/diagram/properties/propertyComponentProps";
    export class PropertyGuiLedger {
        static RegisteredControls: {
            [key: string]: ComponentClass<IPropertyComponentProps>;
        };
    }
}
declare module "babylonjs-gui-editor/diagram/guiNode" {
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { WorkbenchComponent } from "babylonjs-gui-editor/diagram/workbench";
    import { Control } from 'babylonjs-gui/2D/controls/control';
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    export class GUINode {
        guiNode: Control;
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
        constructor(globalState: GlobalState, guiNode: Control);
        cleanAccumulation(useCeil?: boolean): void;
        clicked: boolean;
        _onMove(evt: Vector2, startPos: Vector2): boolean;
        renderProperties(): Nullable<JSX.Element>;
        updateVisual(): void;
        appendVisual(root: HTMLDivElement, owner: WorkbenchComponent): void;
        dispose(): void;
    }
}
declare module "babylonjs-gui-editor/globalState" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from 'babylonjs/Misc/observable';
    import { LogEntry } from "babylonjs-gui-editor/components/log/logComponent";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { Color4 } from 'babylonjs/Maths/math.color';
    import { GUINode } from "babylonjs-gui-editor/diagram/guiNode";
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    import { FramePortData, WorkbenchComponent } from "babylonjs-gui-editor/diagram/workbench";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    export class GlobalState {
        guiTexture: AdvancedDynamicTexture;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        onSelectionChangedObservable: Observable<Nullable<FramePortData | GUINode>>;
        onRebuildRequiredObservable: Observable<void>;
        onBuiltObservable: Observable<void>;
        onResetRequiredObservable: Observable<void>;
        onUpdateRequiredObservable: Observable<void>;
        onZoomToFitRequiredObservable: Observable<void>;
        onReOrganizedRequiredObservable: Observable<void>;
        onLogRequiredObservable: Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: Observable<string>;
        onIsLoadingChanged: Observable<boolean>;
        onPreviewCommandActivated: Observable<boolean>;
        onLightUpdated: Observable<void>;
        onPreviewBackgroundChanged: Observable<void>;
        onBackFaceCullingChanged: Observable<void>;
        onDepthPrePassChanged: Observable<void>;
        onAnimationCommandActivated: Observable<void>;
        onCandidateLinkMoved: Observable<Nullable<Vector2>>;
        onSelectionBoxMoved: Observable<DOMRect | ClientRect>;
        onImportFrameObservable: Observable<any>;
        onGraphNodeRemovalObservable: Observable<GUINode>;
        onGetNodeFromBlock: (block: NodeMaterialBlock) => GUINode;
        onGridSizeChanged: Observable<void>;
        onExposePortOnFrameObservable: Observable<GUINode>;
        previewFile: File;
        listOfCustomPreviewFiles: File[];
        rotatePreview: boolean;
        backgroundColor: Color4;
        backFaceCulling: boolean;
        depthPrePass: boolean;
        blockKeyboardEvents: boolean;
        hemisphericLight: boolean;
        directionalLight0: boolean;
        directionalLight1: boolean;
        controlCamera: boolean;
        workbench: WorkbenchComponent;
        storeEditorData: (serializationObject: any, frame?: Nullable<null>) => void;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
    }
}
declare module "babylonjs-gui-editor/sharedComponents/draggableLineComponent" {
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
declare module "babylonjs-gui-editor/components/nodeList/guiListComponent" {
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
declare module "babylonjs-gui-editor/sharedComponents/buttonLineComponent" {
    import * as React from "react";
    export interface IButtonLineComponentProps {
        label: string;
        onClick: () => void;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/fileButtonLineComponent" {
    import * as React from "react";
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
        uploadName?: string;
    }
    export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
        private uploadRef;
        constructor(props: IFileButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/serializationTools" {
    import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    export class SerializationTools {
        static UpdateLocations(material: NodeMaterial, globalState: GlobalState): void;
        static Serialize(material: NodeMaterial, globalState: GlobalState): string;
        static Deserialize(serializationObject: any, globalState: GlobalState): void;
        static AddFrameToMaterial(serializationObject: any, globalState: GlobalState, currentMaterial: NodeMaterial): void;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/propertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { GUINode } from "babylonjs-gui-editor/diagram/guiNode";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    interface IPropertyTabComponentState {
        currentNode: Nullable<GUINode>;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
        private _onBuiltObserver;
        constructor(props: IPropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        processInputBlockUpdate(ib: InputBlock): void;
        load(file: File): void;
        loadFrame(file: File): void;
        save(): void;
        customSave(): void;
        saveToSnippetServer(): void;
        loadFromSnippet(): void;
        render(): JSX.Element;
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
declare module "babylonjs-gui-editor/workbenchEditor" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { IEditorData } from "babylonjs-gui-editor/nodeLocationInfo";
    import { GUINode } from "babylonjs-gui-editor/diagram/guiNode";
    import { Control } from "babylonjs-gui/2D/controls/control";
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
        private _blocks;
        private _onWidgetKeyUpPointer;
        private _popUpWindow;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param block
         */
        createNodeFromObject(block: Control, recursion?: boolean): Nullable<GUINode>;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        pasteSelection(copiedNodes: GUINode[], currentX: number, currentY: number, selectNew?: boolean): GUINode[];
        zoomToFit(): void;
        buildMaterial(): void;
        showWaitScreen(): void;
        hideWaitScreen(): void;
        reOrganize(editorData?: Nullable<IEditorData>, isImportingAFrame?: boolean): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        emitNewBlock(event: React.DragEvent<HTMLDivElement>): void;
        handlePopUp: () => void;
        handleClosingPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        fixPopUpStyles: (document: Document) => void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedComponents/popup" {
    export class Popup {
        static CreatePopup(title: string, windowVariableName: string, width?: number, height?: number): HTMLDivElement | null;
        private static _CopyStyles;
    }
}
declare module "babylonjs-gui-editor/guiEditor" {
    import { Observable } from 'babylonjs/Misc/observable';
    /**
     * Interface used to specify creation options for the gui editor
     */
    export interface INodeEditorOptions {
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        customLoadObservable?: Observable<any>;
    }
    /**
     * Class used to create a gui editor
     */
    export class GuiEditor {
        private static _CurrentState;
        /**
         * Show the gui editor
         * @param options defines the options to use to configure the gui editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}
declare module "babylonjs-gui-editor/index" {
    export * from "babylonjs-gui-editor/guiEditor";
}
declare module "babylonjs-gui-editor/stringTools" {
    import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
    export class StringTools {
        private static _SaveAs;
        private static _Click;
        /**
         * Gets the base math type of node material block connection point.
         * @param type Type to parse.
         */
        static GetBaseType(type: NodeMaterialBlockConnectionPointTypes): string;
        /**
         * Download a string into a file that will be saved locally by the browser
         * @param content defines the string to download locally as a file
         */
        static DownloadAsFile(document: HTMLDocument, content: string, filename: string): void;
    }
}
declare module "babylonjs-gui-editor/components/propertyTab/properties/floatPropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-gui-editor/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/legacy/legacy" {
    export * from "babylonjs-gui-editor/index";
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
declare module "babylonjs-gui-editor/sharedUiComponents/lines/booleanLineComponent" {
    import * as React from "react";
    export interface IBooleanLineComponentProps {
        label: string;
        value: boolean;
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
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor/sharedUiComponents/lines/fileButtonLineComponent" {
    import * as React from "react";
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
declare module "babylonjs-gui-editor/sharedUiComponents/lines/fileMultipleButtonLineComponent" {
    import * as React from "react";
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
declare module "babylonjs-gui-editor/sharedUiComponents/lines/iconButtonLineComponent" {
    import * as React from 'react';
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
declare module "babylonjs-gui-editor/sharedUiComponents/lines/numericInputComponent" {
    import * as React from "react";
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
declare module "babylonjs-gui-editor/sharedUiComponents/lines/radioLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    interface IRadioButtonLineComponentProps {
        onSelectionChangedObservable: Observable<RadioButtonLineComponent>;
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
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element | null;
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
    }
    export class ValueLineComponent extends React.Component<IValueLineComponentProps> {
        constructor(props: IValueLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-gui-editor" {
    export * from "babylonjs-gui-editor/legacy/legacy";
}
/// <reference types="react" />
declare module GUIEDITOR {
    export class BlockTools {
        static GetGuiFromString(data: string): Slider | Checkbox | ColorPicker | Ellipse | Rectangle | Line | TextBlock;
    }
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
    export interface IWorkbenchComponentProps {
        globalState: GlobalState;
    }
    export type FramePortData = {};
    export const isFramePortData: (variableToCheck: any) => variableToCheck is FramePortData;
    export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
        private readonly MinZoom;
        private readonly MaxZoom;
        private _hostCanvas;
        private _graphCanvas;
        private _selectionContainer;
        private _frameContainer;
        private _svgCanvas;
        private _rootContainer;
        private _guiNodes;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _selectionStartX;
        private _selectionStartY;
        private _x;
        private _y;
        private _zoom;
        private _selectedGuiNodes;
        private _gridSize;
        private _selectionBox;
        private _frameCandidate;
        private _altKeyIsPressed;
        private _ctrlKeyIsPressed;
        private _oldY;
        _frameIsMoving: boolean;
        _isLoading: boolean;
        isOverGUINode: boolean;
        get gridSize(): number;
        set gridSize(value: number);
        get globalState(): GlobalState;
        get nodes(): GUINode[];
        get zoom(): number;
        set zoom(value: number);
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get selectedGuiNodes(): GUINode[];
        get canvasContainer(): HTMLDivElement;
        get hostCanvas(): HTMLDivElement;
        get svgCanvas(): HTMLElement;
        get selectionContainer(): HTMLDivElement;
        get frameContainer(): HTMLDivElement;
        constructor(props: IWorkbenchComponentProps);
        getGridPosition(position: number, useCeil?: boolean): number;
        getGridPositionCeil(position: number): number;
        updateTransform(): void;
        onKeyUp(): void;
        findNodeFromGuiElement(guiElement: Control): GUINode;
        reset(): void;
        appendBlock(guiElement: Control): GUINode;
        distributeGraph(): void;
        componentDidMount(): void;
        onMove(evt: React.PointerEvent): void;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        onUp(evt: React.PointerEvent): void;
        onWheel(evt: React.WheelEvent): void;
        zoomToFit(): void;
        createGUICanvas(): void;
        updateGUIs(): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export interface IPropertyComponentProps {
        globalState: GlobalState;
        guiBlock: Control;
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
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
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
    export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
    export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
    export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        forceRebuild(notifiers?: {
            "rebuild"?: boolean;
            "update"?: boolean;
        }): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    interface ITextLineComponentProps {
        label: string;
        value: string;
        color?: string;
        underline?: boolean;
        onLink?: () => void;
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element;
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
    export class SliderPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        private slider;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class PropertyGuiLedger {
        static RegisteredControls: {
            [key: string]: React.ComponentClass<IPropertyComponentProps>;
        };
    }
}
declare module GUIEDITOR {
    export class GUINode {
        guiNode: Control;
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
        constructor(globalState: GlobalState, guiNode: Control);
        cleanAccumulation(useCeil?: boolean): void;
        clicked: boolean;
        _onMove(evt: BABYLON.Vector2, startPos: BABYLON.Vector2): boolean;
        renderProperties(): BABYLON.Nullable<JSX.Element>;
        updateVisual(): void;
        appendVisual(root: HTMLDivElement, owner: WorkbenchComponent): void;
        dispose(): void;
    }
}
declare module GUIEDITOR {
    export class GlobalState {
        guiTexture: AdvancedDynamicTexture;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        onSelectionChangedObservable: BABYLON.Observable<BABYLON.Nullable<FramePortData | GUINode>>;
        onRebuildRequiredObservable: BABYLON.Observable<void>;
        onBuiltObservable: BABYLON.Observable<void>;
        onResetRequiredObservable: BABYLON.Observable<void>;
        onUpdateRequiredObservable: BABYLON.Observable<void>;
        onZoomToFitRequiredObservable: BABYLON.Observable<void>;
        onReOrganizedRequiredObservable: BABYLON.Observable<void>;
        onLogRequiredObservable: BABYLON.Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: BABYLON.Observable<string>;
        onIsLoadingChanged: BABYLON.Observable<boolean>;
        onPreviewCommandActivated: BABYLON.Observable<boolean>;
        onLightUpdated: BABYLON.Observable<void>;
        onPreviewBackgroundChanged: BABYLON.Observable<void>;
        onBackFaceCullingChanged: BABYLON.Observable<void>;
        onDepthPrePassChanged: BABYLON.Observable<void>;
        onAnimationCommandActivated: BABYLON.Observable<void>;
        onCandidateLinkMoved: BABYLON.Observable<BABYLON.Nullable<BABYLON.Vector2>>;
        onSelectionBoxMoved: BABYLON.Observable<DOMRect | ClientRect>;
        onImportFrameObservable: BABYLON.Observable<any>;
        onGraphNodeRemovalObservable: BABYLON.Observable<GUINode>;
        onGetNodeFromBlock: (block: BABYLON.NodeMaterialBlock) => GUINode;
        onGridSizeChanged: BABYLON.Observable<void>;
        onExposePortOnFrameObservable: BABYLON.Observable<GUINode>;
        previewFile: File;
        listOfCustomPreviewFiles: File[];
        rotatePreview: boolean;
        backgroundColor: BABYLON.Color4;
        backFaceCulling: boolean;
        depthPrePass: boolean;
        blockKeyboardEvents: boolean;
        hemisphericLight: boolean;
        directionalLight0: boolean;
        directionalLight1: boolean;
        controlCamera: boolean;
        workbench: WorkbenchComponent;
        storeEditorData: (serializationObject: any, frame?: BABYLON.Nullable<null>) => void;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
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
        uploadName?: string;
    }
    export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
        private uploadRef;
        constructor(props: IFileButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module GUIEDITOR {
    export class SerializationTools {
        static UpdateLocations(material: BABYLON.NodeMaterial, globalState: GlobalState): void;
        static Serialize(material: BABYLON.NodeMaterial, globalState: GlobalState): string;
        static Deserialize(serializationObject: any, globalState: GlobalState): void;
        static AddFrameToMaterial(serializationObject: any, globalState: GlobalState, currentMaterial: BABYLON.NodeMaterial): void;
    }
}
declare module GUIEDITOR {
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    interface IPropertyTabComponentState {
        currentNode: BABYLON.Nullable<GUINode>;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
        private _onBuiltObserver;
        constructor(props: IPropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        processInputBlockUpdate(ib: BABYLON.InputBlock): void;
        load(file: File): void;
        loadFrame(file: File): void;
        save(): void;
        customSave(): void;
        saveToSnippetServer(): void;
        loadFromSnippet(): void;
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
        private _blocks;
        private _onWidgetKeyUpPointer;
        private _popUpWindow;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param block
         */
        createNodeFromObject(block: Control, recursion?: boolean): BABYLON.Nullable<GUINode>;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        pasteSelection(copiedNodes: GUINode[], currentX: number, currentY: number, selectNew?: boolean): GUINode[];
        zoomToFit(): void;
        buildMaterial(): void;
        showWaitScreen(): void;
        hideWaitScreen(): void;
        reOrganize(editorData?: BABYLON.Nullable<IEditorData>, isImportingAFrame?: boolean): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        emitNewBlock(event: React.DragEvent<HTMLDivElement>): void;
        handlePopUp: () => void;
        handleClosingPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        fixPopUpStyles: (document: Document) => void;
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
    export interface INodeEditorOptions {
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        customLoadObservable?: BABYLON.Observable<any>;
    }
    /**
     * Class used to create a gui editor
     */
    export class GuiEditor {
        private static _CurrentState;
        /**
         * Show the gui editor
         * @param options defines the options to use to configure the gui editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}
declare module GUIEDITOR {
    export class StringTools {
        private static _SaveAs;
        private static _Click;
        /**
         * Gets the base math type of node material block connection point.
         * @param type Type to parse.
         */
        static GetBaseType(type: BABYLON.NodeMaterialBlockConnectionPointTypes): string;
        /**
         * Download a string into a file that will be saved locally by the browser
         * @param content defines the string to download locally as a file
         */
        static DownloadAsFile(document: HTMLDocument, content: string, filename: string): void;
    }
}
declare module GUIEDITOR {
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: BABYLON.InputBlock;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
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