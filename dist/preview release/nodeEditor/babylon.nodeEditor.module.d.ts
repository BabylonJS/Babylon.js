/// <reference types="react" />
declare module "babylonjs-node-editor/components/diagram/generic/genericNodeWidget" {
    import * as React from "react";
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * GenericNodeWidgetProps
     */
    export interface GenericNodeWidgetProps {
        node: Nullable<GenericNodeModel>;
        globalState: GlobalState;
    }
    /**
     * GenericNodeWidgetState
     */
    export interface GenericNodeWidgetState {
    }
    /**
     * Used to display a node block for the node editor
     */
    export class GenericNodeWidget extends React.Component<GenericNodeWidgetProps, GenericNodeWidgetState> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: GenericNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/generic/genericNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Node factory which creates editor nodes
     */
    export class GenericNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        /**
         * Constructs a GenericNodeFactory
         */
        constructor(globalState: GlobalState);
        /**
         * Generates a node widget
         * @param diagramEngine diagram engine
         * @param node node to generate
         * @returns node widget jsx
         */
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GenericNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns generic node model
         */
        getNewInstance(): GenericNodeModel;
    }
}
declare module "babylonjs-node-editor/sharedComponents/lineContainerComponent" {
    import * as React from "react";
    interface ILineContainerComponentProps {
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
    }> {
        private static _InMemoryStorage;
        constructor(props: ILineContainerComponentProps);
        switchExpandedState(): void;
        renderHeader(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/buttonLineComponent" {
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
declare module "babylonjs-node-editor/components/nodeList/nodeListComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    interface INodeListComponentProps {
        globalState: GlobalState;
        onAddValueNode: (b: string) => void;
        onAddNodeFromClass: (ObjectClass: typeof NodeMaterialBlock) => void;
    }
    export class NodeListComponent extends React.Component<INodeListComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/propertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, {
        currentNode: Nullable<DefaultNodeModel>;
    }> {
        constructor(props: IPropertyTabComponentProps);
        componentWillMount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/portal" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface IPortalProps {
        globalState: GlobalState;
    }
    export class Portal extends React.Component<IPortalProps> {
        render(): React.ReactPortal;
    }
}
declare module "babylonjs-node-editor/sharedComponents/fileButtonLineComponent" {
    import * as React from "react";
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
    }
    export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
        constructor(props: IFileButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/properties/texturePropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { TextureNodeModel } from "babylonjs-node-editor/components/diagram/texture/textureNodeModel";
    interface ITexturePropertyTabComponentProps {
        globalState: GlobalState;
        node: TextureNodeModel;
    }
    export class TexturePropertyTabComponent extends React.Component<ITexturePropertyTabComponentProps> {
        /**
         * Replaces the texture of the node
         * @param file the file of the texture to use
         */
        replaceTexture(file: File): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/texture/textureNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { Texture } from 'babylonjs/Materials/Textures/texture';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Texture node model which stores information about a node editor block
     */
    export class TextureNodeModel extends DefaultNodeModel {
        /**
         * Texture for the node if it exists
         */
        texture: Nullable<Texture>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/textureLineComponent" {
    import * as React from "react";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    interface ITextureLineComponentProps {
        texture: BaseTexture;
        width: number;
        height: number;
        globalState?: any;
        hideChannelSelect?: boolean;
    }
    export class TextureLineComponent extends React.Component<ITextureLineComponentProps, {
        displayRed: boolean;
        displayGreen: boolean;
        displayBlue: boolean;
        displayAlpha: boolean;
        face: number;
    }> {
        constructor(props: ITextureLineComponentProps);
        shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: {
            displayRed: boolean;
            displayGreen: boolean;
            displayBlue: boolean;
            displayAlpha: boolean;
            face: number;
        }): boolean;
        componentDidMount(): void;
        componentDidUpdate(): void;
        updatePreview(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/texture/textureNodeWidget" {
    import * as React from "react";
    import { TextureNodeModel } from "babylonjs-node-editor/components/diagram/texture/textureNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * GenericNodeWidgetProps
     */
    export interface TextureNodeWidgetProps {
        node: Nullable<TextureNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class TextureNodeWidget extends React.Component<TextureNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: TextureNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/texture/textureNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { TextureNodeModel } from "babylonjs-node-editor/components/diagram/texture/textureNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Node factory which creates editor nodes
     */
    export class TextureNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        /**
         * Constructs a TextureNodeFactory
         */
        constructor(globalState: GlobalState);
        /**
         * Generates a node widget
         * @param diagramEngine diagram engine
         * @param node node to generate
         * @returns node widget jsx
         */
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: TextureNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns texture node model
         */
        getNewInstance(): TextureNodeModel;
    }
}
declare module "babylonjs-node-editor/graphEditor" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { TextureNodeModel } from "babylonjs-node-editor/components/diagram/texture/textureNodeModel";
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class NodeCreationOptions {
        column: number;
        nodeMaterialBlock?: NodeMaterialBlock;
        type?: string;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        private _engine;
        private _model;
        private _nodes;
        /**
         * Current row/column position used when adding new nodes
         */
        private _rowPos;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(options: NodeCreationOptions): GenericNodeModel | TextureNodeModel;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        addNodeFromClass(ObjectClass: typeof NodeMaterialBlock): GenericNodeModel | TextureNodeModel;
        addValueNode(type: string, column?: number, connection?: NodeMaterialConnectionPoint): GenericNodeModel | TextureNodeModel | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/numericInputComponent" {
    import * as React from "react";
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
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
declare module "babylonjs-node-editor/sharedComponents/propertyChangedEvent" {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module "babylonjs-node-editor/sharedComponents/vector2LineComponent" {
    import * as React from "react";
    import { Vector2 } from "babylonjs/Maths/math";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    interface IVector2LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector2) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
declare module "babylonjs-node-editor/components/propertyTab/properties/vector2PropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
    interface IVector2PropertyTabComponentProps {
        globalState: GlobalState;
        node: GenericNodeModel;
    }
    export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/vector3LineComponent" {
    import * as React from "react";
    import { Vector3 } from "babylonjs/Maths/math";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector3) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
declare module "babylonjs-node-editor/components/propertyTab/properties/vector3PropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
    interface IVector3PropertyTabComponentProps {
        globalState: GlobalState;
        node: GenericNodeModel;
    }
    export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/generic/genericNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    import { GraphEditor, NodeCreationOptions } from "babylonjs-node-editor/graphEditor";
    import { GenericPortModel } from "babylonjs-node-editor/components/diagram/generic/genericPortModel";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Generic node model which stores information about a node editor block
     */
    export class GenericNodeModel extends DefaultNodeModel {
        /**
         * Labels for the block
         */
        headerLabels: Array<{
            text: string;
        }>;
        /**
         * Vector2 for the node if it exists
         */
        vector2: Nullable<Vector2>;
        /**
         * Vector3 for the node if it exists
         */
        vector3: Nullable<Vector3>;
        /**
         * Vector4 for the node if it exists
         */
        vector4: Nullable<Vector4>;
        /**
         * Matrix for the node if it exists
         */
        matrix: Nullable<Matrix>;
        /**
         * Constructs the node model
         */
        constructor();
        prepareConnection(type: string, outPort: GenericPortModel, connection?: NodeMaterialConnectionPoint): void;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module "babylonjs-node-editor/components/diagram/generic/genericPortModel" {
    import { LinkModel, PortModel } from "storm-react-diagrams";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
    /**
     * Port model for the generic node
     */
    export class GenericPortModel extends PortModel {
        /**
         * If the port is input or output
         */
        position: string | "input" | "output";
        /**
         * What the port is connected to
         */
        connection: Nullable<NodeMaterialConnectionPoint>;
        static idCounter: number;
        constructor(name: string, type?: string);
        syncWithNodeMaterialConnectionPoint(connection: NodeMaterialConnectionPoint): void;
        getNodeModel(): GenericNodeModel;
        link(outPort: GenericPortModel): LinkModel<import("storm-react-diagrams").LinkModelListener>;
        getInputFromBlock(): void;
        createLinkModel(): LinkModel;
        getValue: Function;
        static SortInputOutput(a: Nullable<GenericPortModel>, b: Nullable<GenericPortModel>): {
            input: GenericPortModel;
            output: GenericPortModel;
        } | null;
    }
}
declare module "babylonjs-node-editor/components/diagram/defaultNodeModel" {
    import { NodeModel, DiagramModel } from "storm-react-diagrams";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { GenericPortModel } from "babylonjs-node-editor/components/diagram/generic/genericPortModel";
    import { GraphEditor, NodeCreationOptions } from "babylonjs-node-editor/graphEditor";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Generic node model which stores information about a node editor block
     */
    export class DefaultNodeModel extends NodeModel {
        /**
         * The babylon block this node represents
         */
        block: Nullable<NodeMaterialBlock>;
        ports: {
            [s: string]: GenericPortModel;
        };
        /**
         * Constructs the node model
         */
        constructor(key: string);
        prepareConnection(type: string, outPort: GenericPortModel, connection?: NodeMaterialConnectionPoint): void;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module "babylonjs-node-editor/globalState" {
    import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
    import { Nullable } from "babylonjs/types";
    import { Observable } from 'babylonjs/Misc/observable';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    export class GlobalState {
        nodeMaterial?: NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        onSelectionChangedObservable: Observable<Nullable<DefaultNodeModel>>;
    }
}
declare module "babylonjs-node-editor/sharedComponents/popup" {
    export class Popup {
        static CreatePopup(title: string, windowVariableName: string, width?: number, height?: number): HTMLDivElement | null;
        private static _CopyStyles;
    }
}
declare module "babylonjs-node-editor/nodeEditor" {
    import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
    /**
     * Interface used to specify creation options for the node editor
     */
    export interface INodeEditorOptions {
        nodeMaterial: NodeMaterial;
    }
    /**
     * Class used to create a node editor
     */
    export class NodeEditor {
        /**
         * Show the node editor
         * @param options defines the options to use to configure the node editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}
declare module "babylonjs-node-editor/index" {
    export * from "babylonjs-node-editor/nodeEditor";
}
declare module "babylonjs-node-editor/legacy/legacy" {
    export * from "babylonjs-node-editor/index";
}
declare module "babylonjs-node-editor" {
    export * from "babylonjs-node-editor/legacy/legacy";
}
/// <reference types="react" />
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface GenericNodeWidgetProps {
        node: BABYLON.Nullable<GenericNodeModel>;
        globalState: GlobalState;
    }
    /**
     * GenericNodeWidgetState
     */
    export interface GenericNodeWidgetState {
    }
    /**
     * Used to display a node block for the node editor
     */
    export class GenericNodeWidget extends React.Component<GenericNodeWidgetProps, GenericNodeWidgetState> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: GenericNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class GenericNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        /**
         * Constructs a GenericNodeFactory
         */
        constructor(globalState: GlobalState);
        /**
         * Generates a node widget
         * @param diagramEngine diagram engine
         * @param node node to generate
         * @returns node widget jsx
         */
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GenericNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns generic node model
         */
        getNewInstance(): GenericNodeModel;
    }
}
declare module NODEEDITOR {
    interface ILineContainerComponentProps {
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
    }> {
        private static _InMemoryStorage;
        constructor(props: ILineContainerComponentProps);
        switchExpandedState(): void;
        renderHeader(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IButtonLineComponentProps {
        label: string;
        onClick: () => void;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface INodeListComponentProps {
        globalState: GlobalState;
        onAddValueNode: (b: string) => void;
        onAddNodeFromClass: (ObjectClass: typeof BABYLON.NodeMaterialBlock) => void;
    }
    export class NodeListComponent extends React.Component<INodeListComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, {
        currentNode: BABYLON.Nullable<DefaultNodeModel>;
    }> {
        constructor(props: IPropertyTabComponentProps);
        componentWillMount(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IPortalProps {
        globalState: GlobalState;
    }
    export class Portal extends React.Component<IPortalProps> {
        render(): React.ReactPortal;
    }
}
declare module NODEEDITOR {
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
    }
    export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
        constructor(props: IFileButtonLineComponentProps);
        onChange(evt: any): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface ITexturePropertyTabComponentProps {
        globalState: GlobalState;
        node: TextureNodeModel;
    }
    export class TexturePropertyTabComponent extends React.Component<ITexturePropertyTabComponentProps> {
        /**
         * Replaces the texture of the node
         * @param file the file of the texture to use
         */
        replaceTexture(file: File): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * BABYLON.Texture node model which stores information about a node editor block
     */
    export class TextureNodeModel extends DefaultNodeModel {
        /**
         * BABYLON.Texture for the node if it exists
         */
        texture: BABYLON.Nullable<BABYLON.Texture>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface ITextureLineComponentProps {
        texture: BABYLON.BaseTexture;
        width: number;
        height: number;
        globalState?: any;
        hideChannelSelect?: boolean;
    }
    export class TextureLineComponent extends React.Component<ITextureLineComponentProps, {
        displayRed: boolean;
        displayGreen: boolean;
        displayBlue: boolean;
        displayAlpha: boolean;
        face: number;
    }> {
        constructor(props: ITextureLineComponentProps);
        shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: {
            displayRed: boolean;
            displayGreen: boolean;
            displayBlue: boolean;
            displayAlpha: boolean;
            face: number;
        }): boolean;
        componentDidMount(): void;
        componentDidUpdate(): void;
        updatePreview(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface TextureNodeWidgetProps {
        node: BABYLON.Nullable<TextureNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class TextureNodeWidget extends React.Component<TextureNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: TextureNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class TextureNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        /**
         * Constructs a TextureNodeFactory
         */
        constructor(globalState: GlobalState);
        /**
         * Generates a node widget
         * @param diagramEngine diagram engine
         * @param node node to generate
         * @returns node widget jsx
         */
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: TextureNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns texture node model
         */
        getNewInstance(): TextureNodeModel;
    }
}
declare module NODEEDITOR {
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class NodeCreationOptions {
        column: number;
        nodeMaterialBlock?: BABYLON.NodeMaterialBlock;
        type?: string;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        private _engine;
        private _model;
        private _nodes;
        /**
         * Current row/column position used when adding new nodes
         */
        private _rowPos;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(options: NodeCreationOptions): GenericNodeModel | TextureNodeModel;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        addNodeFromClass(ObjectClass: typeof BABYLON.NodeMaterialBlock): GenericNodeModel | TextureNodeModel;
        addValueNode(type: string, column?: number, connection?: BABYLON.NodeMaterialConnectionPoint): GenericNodeModel | TextureNodeModel | null;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
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
declare module NODEEDITOR {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module NODEEDITOR {
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
declare module NODEEDITOR {
    interface IVector2PropertyTabComponentProps {
        globalState: GlobalState;
        node: GenericNodeModel;
    }
    export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector3) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
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
declare module NODEEDITOR {
    interface IVector3PropertyTabComponentProps {
        globalState: GlobalState;
        node: GenericNodeModel;
    }
    export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Generic node model which stores information about a node editor block
     */
    export class GenericNodeModel extends DefaultNodeModel {
        /**
         * Labels for the block
         */
        headerLabels: Array<{
            text: string;
        }>;
        /**
         * BABYLON.Vector2 for the node if it exists
         */
        vector2: BABYLON.Nullable<BABYLON.Vector2>;
        /**
         * BABYLON.Vector3 for the node if it exists
         */
        vector3: BABYLON.Nullable<BABYLON.Vector3>;
        /**
         * BABYLON.Vector4 for the node if it exists
         */
        vector4: BABYLON.Nullable<BABYLON.Vector4>;
        /**
         * BABYLON.Matrix for the node if it exists
         */
        matrix: BABYLON.Nullable<BABYLON.Matrix>;
        /**
         * Constructs the node model
         */
        constructor();
        prepareConnection(type: string, outPort: GenericPortModel, connection?: BABYLON.NodeMaterialConnectionPoint): void;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module NODEEDITOR {
    /**
     * Port model for the generic node
     */
    export class GenericPortModel extends PortModel {
        /**
         * If the port is input or output
         */
        position: string | "input" | "output";
        /**
         * What the port is connected to
         */
        connection: BABYLON.Nullable<BABYLON.NodeMaterialConnectionPoint>;
        static idCounter: number;
        constructor(name: string, type?: string);
        syncWithNodeMaterialConnectionPoint(connection: BABYLON.NodeMaterialConnectionPoint): void;
        getNodeModel(): GenericNodeModel;
        link(outPort: GenericPortModel): LinkModel<import("storm-react-diagrams").LinkModelListener>;
        getInputFromBlock(): void;
        createLinkModel(): LinkModel;
        getValue: Function;
        static SortInputOutput(a: BABYLON.Nullable<GenericPortModel>, b: BABYLON.Nullable<GenericPortModel>): {
            input: GenericPortModel;
            output: GenericPortModel;
        } | null;
    }
}
declare module NODEEDITOR {
    /**
     * Generic node model which stores information about a node editor block
     */
    export class DefaultNodeModel extends NodeModel {
        /**
         * The babylon block this node represents
         */
        block: BABYLON.Nullable<BABYLON.NodeMaterialBlock>;
        ports: {
            [s: string]: GenericPortModel;
        };
        /**
         * Constructs the node model
         */
        constructor(key: string);
        prepareConnection(type: string, outPort: GenericPortModel, connection?: BABYLON.NodeMaterialConnectionPoint): void;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module NODEEDITOR {
    export class GlobalState {
        nodeMaterial?: BABYLON.NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        onSelectionChangedObservable: BABYLON.Observable<BABYLON.Nullable<DefaultNodeModel>>;
    }
}
declare module NODEEDITOR {
    export class Popup {
        static CreatePopup(title: string, windowVariableName: string, width?: number, height?: number): HTMLDivElement | null;
        private static _CopyStyles;
    }
}
declare module NODEEDITOR {
    /**
     * Interface used to specify creation options for the node editor
     */
    export interface INodeEditorOptions {
        nodeMaterial: BABYLON.NodeMaterial;
    }
    /**
     * Class used to create a node editor
     */
    export class NodeEditor {
        /**
         * Show the node editor
         * @param options defines the options to use to configure the node editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}