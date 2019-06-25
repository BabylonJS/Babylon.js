/// <reference types="react" />
declare module "babylonjs-node-editor/dataStorage" {
    export class DataStorage {
        private static _InMemoryStorage;
        static ReadBoolean(key: string, defaultValue: boolean): boolean;
        static StoreBoolean(key: string, value: boolean): void;
        static ReadNumber(key: string, defaultValue: number): number;
        static StoreNumber(key: string, value: number): void;
    }
}
declare module "babylonjs-node-editor/components/diagram/defaultPortModel" {
    import { LinkModel, PortModel } from "storm-react-diagrams";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    /**
     * Port model
     */
    export class DefaultPortModel extends PortModel {
        /**
         * If the port is input or output
         */
        position: string | "input" | "output";
        /**
         * What the port is connected to
         */
        connection: Nullable<NodeMaterialConnectionPoint>;
        defaultValue: any;
        static idCounter: number;
        constructor(name: string, type?: string);
        canLinkToPort(port: DefaultPortModel): boolean;
        syncWithNodeMaterialConnectionPoint(connection: NodeMaterialConnectionPoint): void;
        getNodeModel(): DefaultNodeModel;
        link(outPort: DefaultPortModel): LinkModel<import("storm-react-diagrams").LinkModelListener>;
        createLinkModel(): LinkModel;
        static SortInputOutput(a: Nullable<DefaultPortModel>, b: Nullable<DefaultPortModel>): {
            input: DefaultPortModel;
            output: DefaultPortModel;
        } | null;
    }
}
declare module "babylonjs-node-editor/sharedComponents/textLineComponent" {
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
        constructor(props: ILineContainerComponentProps);
        switchExpandedState(): void;
        renderHeader(): JSX.Element;
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
declare module "babylonjs-node-editor/sharedComponents/textInputLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    interface ITextInputLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        value?: string;
        onChange?: (value: string) => void;
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
        updateValue(value: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/generic/genericNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    import { GraphEditor, NodeCreationOptions } from "babylonjs-node-editor/graphEditor";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Generic node model which stores information about a node editor block
     */
    export class GenericNodeModel extends DefaultNodeModel {
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/generic/genericNodeWidget" {
    import * as React from "react";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GenericNodeModel } from "babylonjs-node-editor/components/diagram/generic/genericNodeModel";
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
declare module "babylonjs-node-editor/sharedComponents/checkBoxLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    export interface ICheckBoxLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        isSelected?: () => boolean;
        onSelect?: (value: boolean) => void;
        onValueChanged?: () => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CheckBoxLineComponent extends React.Component<ICheckBoxLineComponentProps, {
        isSelected: boolean;
    }> {
        private static _UniqueIdSeed;
        private _uniqueId;
        private _localChange;
        constructor(props: ICheckBoxLineComponentProps);
        shouldComponentUpdate(nextProps: ICheckBoxLineComponentProps, nextState: {
            isSelected: boolean;
        }): boolean;
        onChange(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/texture/texturePropertyTabComponent" {
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
    import { NodeCreationOptions, GraphEditor } from "babylonjs-node-editor/graphEditor";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    /**
     * Texture node model which stores information about a node editor block
     */
    export class TextureNodeModel extends DefaultNodeModel {
        private _block;
        /**
         * Texture for the node if it exists
         */
        texture: Nullable<Texture>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
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
    export interface ITextureNodeWidgetProps {
        node: Nullable<TextureNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class TextureNodeWidget extends React.Component<ITextureNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ITextureNodeWidgetProps);
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
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    interface IVector2PropertyTabComponentProps {
        globalState: GlobalState;
        connection: NodeMaterialConnectionPoint;
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
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    interface IVector3PropertyTabComponentProps {
        globalState: GlobalState;
        connection: NodeMaterialConnectionPoint;
    }
    export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/optionsLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    class ListLineOption {
        label: string;
        value: number | string;
    }
    interface IOptionsLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        options: ListLineOption[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number | string) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        valuesAreStrings?: boolean;
        defaultIfNull?: number;
    }
    export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, {
        value: number | string;
    }> {
        private _localChange;
        private _getValue;
        constructor(props: IOptionsLineComponentProps);
        shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: {
            value: number;
        }): boolean;
        raiseOnPropertyChanged(newValue: number | string, previousValue: number | string): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/color3LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Color3 } from "babylonjs/Maths/math";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onChange?: () => void;
    }
    export class Color3LineComponent extends React.Component<IColor3LineComponentProps, {
        isExpanded: boolean;
        color: Color3;
    }> {
        private _localChange;
        constructor(props: IColor3LineComponentProps);
        shouldComponentUpdate(nextProps: IColor3LineComponentProps, nextState: {
            color: Color3;
        }): boolean;
        onChange(newValue: string): void;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: Color3): void;
        updateStateR(value: number): void;
        updateStateG(value: number): void;
        updateStateB(value: number): void;
        copyToClipboard(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/properties/color3PropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    interface IColor3PropertyTabComponentProps {
        globalState: GlobalState;
        connection: NodeMaterialConnectionPoint;
    }
    export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/floatLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
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
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        constructor(props: IFloatLineComponentProps);
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/properties/floatPropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        connection: NodeMaterialConnectionPoint;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/stringTools" {
    import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
    export class StringTools {
        /**
         * Gets the base math type of node material block connection point.
         * @param type Type to parse.
         */
        static GetBaseType(type: NodeMaterialBlockConnectionPointTypes): string;
    }
}
declare module "babylonjs-node-editor/components/diagram/input/inputNodePropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputNodeModel } from "babylonjs-node-editor/components/diagram/input/inputNodeModel";
    interface IInputPropertyTabComponentProps {
        globalState: GlobalState;
        inputNode: InputNodeModel;
    }
    export class InputPropertyTabComponentProps extends React.Component<IInputPropertyTabComponentProps> {
        constructor(props: IInputPropertyTabComponentProps);
        renderValue(globalState: GlobalState): JSX.Element | null;
        setDefaultValue(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/input/inputNodeModel" {
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Generic node model which stores information about a node editor block
     */
    export class InputNodeModel extends DefaultNodeModel {
        connection?: NodeMaterialConnectionPoint;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module "babylonjs-node-editor/components/diagram/input/inputNodeWidget" {
    import * as React from "react";
    import { InputNodeModel } from "babylonjs-node-editor/components/diagram/input/inputNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * GenericNodeWidgetProps
     */
    export interface InputNodeWidgetProps {
        node: Nullable<InputNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class InputNodeWidget extends React.Component<InputNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: InputNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/input/inputNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputNodeModel } from "babylonjs-node-editor/components/diagram/input/inputNodeModel";
    /**
     * Node factory which creates editor nodes
     */
    export class InputNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: InputNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns input node model
         */
        getNewInstance(): InputNodeModel;
    }
}
declare module "babylonjs-node-editor/components/log/logComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
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
        componentWillMount(): void;
        componentDidUpdate(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/light/lightPropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { LightNodeModel } from "babylonjs-node-editor/components/diagram/light/lightNodeModel";
    interface ILightPropertyTabComponentProps {
        globalState: GlobalState;
        node: LightNodeModel;
    }
    export class LightPropertyTabComponent extends React.Component<ILightPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/light/lightNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { Light } from 'babylonjs/Lights/light';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeCreationOptions, GraphEditor } from "babylonjs-node-editor/graphEditor";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    /**
     * Light node model which stores information about a node editor block
     */
    export class LightNodeModel extends DefaultNodeModel {
        private _block;
        /**
         * Light for the node if it exists
         */
        light: Nullable<Light>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
    }
}
declare module "babylonjs-node-editor/components/diagram/light/lightNodeWidget" {
    import * as React from "react";
    import { LightNodeModel } from "babylonjs-node-editor/components/diagram/light/lightNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * GenericNodeWidgetProps
     */
    export interface ILightNodeWidgetProps {
        node: Nullable<LightNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class LightNodeWidget extends React.Component<ILightNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ILightNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/light/lightNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { LightNodeModel } from "babylonjs-node-editor/components/diagram/light/lightNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Node factory which creates editor nodes
     */
    export class LightNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        /**
         * Constructs a LightNodeFactory
         */
        constructor(globalState: GlobalState);
        /**
         * Generates a node widget
         * @param diagramEngine diagram engine
         * @param node node to generate
         * @returns node widget jsx
         */
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: LightNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns light node model
         */
        getNewInstance(): LightNodeModel;
    }
}
declare module "babylonjs-node-editor/graphEditor" {
    import { LinkModel } from "storm-react-diagrams";
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class NodeCreationOptions {
        column: number;
        nodeMaterialBlock?: NodeMaterialBlock;
        type?: string;
        connection?: NodeMaterialConnectionPoint;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        private _engine;
        private _model;
        private _nodes;
        /** @hidden */
        _toAdd: LinkModel[] | null;
        /**
         * Current row/column position used when adding new nodes
         */
        private _rowPos;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(options: NodeCreationOptions): DefaultNodeModel;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        buildMaterial(): void;
        build(): void;
        addNodeFromClass(ObjectClass: typeof NodeMaterialBlock): DefaultNodeModel;
        addValueNode(type: string, column?: number, connection?: NodeMaterialConnectionPoint): DefaultNodeModel;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/defaultNodeModel" {
    import { NodeModel, DiagramModel } from "storm-react-diagrams";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { GraphEditor, NodeCreationOptions } from "babylonjs-node-editor/graphEditor";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { DefaultPortModel } from "babylonjs-node-editor/components/diagram/defaultPortModel";
    /**
     * Generic node model which stores information about a node editor block
     */
    export class DefaultNodeModel extends NodeModel {
        /**
         * The babylon block this node represents
         */
        block: Nullable<NodeMaterialBlock>;
        ports: {
            [s: string]: DefaultPortModel;
        };
        /**
         * Constructs the node model
         */
        constructor(key: string);
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module "babylonjs-node-editor/globalState" {
    import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
    import { Nullable } from "babylonjs/types";
    import { Observable } from 'babylonjs/Misc/observable';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { LogEntry } from "babylonjs-node-editor/components/log/logComponent";
    export class GlobalState {
        nodeMaterial?: NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        onSelectionChangedObservable: Observable<Nullable<DefaultNodeModel>>;
        onRebuildRequiredObservable: Observable<void>;
        onResetRequiredObservable: Observable<void>;
        onUpdateRequiredObservable: Observable<void>;
        onZoomToFitRequiredObservable: Observable<void>;
        onLogRequiredObservable: Observable<LogEntry>;
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
    export class DataStorage {
        private static _InMemoryStorage;
        static ReadBoolean(key: string, defaultValue: boolean): boolean;
        static StoreBoolean(key: string, value: boolean): void;
        static ReadNumber(key: string, defaultValue: number): number;
        static StoreNumber(key: string, value: number): void;
    }
}
declare module NODEEDITOR {
    /**
     * Port model
     */
    export class DefaultPortModel extends PortModel {
        /**
         * If the port is input or output
         */
        position: string | "input" | "output";
        /**
         * What the port is connected to
         */
        connection: BABYLON.Nullable<BABYLON.NodeMaterialConnectionPoint>;
        defaultValue: any;
        static idCounter: number;
        constructor(name: string, type?: string);
        canLinkToPort(port: DefaultPortModel): boolean;
        syncWithNodeMaterialConnectionPoint(connection: BABYLON.NodeMaterialConnectionPoint): void;
        getNodeModel(): DefaultNodeModel;
        link(outPort: DefaultPortModel): LinkModel<import("storm-react-diagrams").LinkModelListener>;
        createLinkModel(): LinkModel;
        static SortInputOutput(a: BABYLON.Nullable<DefaultPortModel>, b: BABYLON.Nullable<DefaultPortModel>): {
            input: DefaultPortModel;
            output: DefaultPortModel;
        } | null;
    }
}
declare module NODEEDITOR {
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
declare module NODEEDITOR {
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
declare module NODEEDITOR {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module NODEEDITOR {
    interface ITextInputLineComponentProps {
        label: string;
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
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Generic node model which stores information about a node editor block
     */
    export class GenericNodeModel extends DefaultNodeModel {
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
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
    export interface ICheckBoxLineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        isSelected?: () => boolean;
        onSelect?: (value: boolean) => void;
        onValueChanged?: () => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CheckBoxLineComponent extends React.Component<ICheckBoxLineComponentProps, {
        isSelected: boolean;
    }> {
        private static _UniqueIdSeed;
        private _uniqueId;
        private _localChange;
        constructor(props: ICheckBoxLineComponentProps);
        shouldComponentUpdate(nextProps: ICheckBoxLineComponentProps, nextState: {
            isSelected: boolean;
        }): boolean;
        onChange(): void;
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
        private _block;
        /**
         * BABYLON.Texture for the node if it exists
         */
        texture: BABYLON.Nullable<BABYLON.Texture>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
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
    export interface ITextureNodeWidgetProps {
        node: BABYLON.Nullable<TextureNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class TextureNodeWidget extends React.Component<ITextureNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ITextureNodeWidgetProps);
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
        connection: BABYLON.NodeMaterialConnectionPoint;
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
        connection: BABYLON.NodeMaterialConnectionPoint;
    }
    export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    class ListLineOption {
        label: string;
        value: number | string;
    }
    interface IOptionsLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        options: ListLineOption[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number | string) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        valuesAreStrings?: boolean;
        defaultIfNull?: number;
    }
    export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, {
        value: number | string;
    }> {
        private _localChange;
        private _getValue;
        constructor(props: IOptionsLineComponentProps);
        shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: {
            value: number;
        }): boolean;
        raiseOnPropertyChanged(newValue: number | string, previousValue: number | string): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onChange?: () => void;
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
declare module NODEEDITOR {
    interface IColor3PropertyTabComponentProps {
        globalState: GlobalState;
        connection: BABYLON.NodeMaterialConnectionPoint;
    }
    export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
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
    }
    export class FloatLineComponent extends React.Component<IFloatLineComponentProps, {
        value: string;
    }> {
        private _localChange;
        private _store;
        constructor(props: IFloatLineComponentProps);
        shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: number, previousValue: number): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        connection: BABYLON.NodeMaterialConnectionPoint;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class StringTools {
        /**
         * Gets the base math type of node material block connection point.
         * @param type Type to parse.
         */
        static GetBaseType(type: BABYLON.NodeMaterialBlockConnectionPointTypes): string;
    }
}
declare module NODEEDITOR {
    interface IInputPropertyTabComponentProps {
        globalState: GlobalState;
        inputNode: InputNodeModel;
    }
    export class InputPropertyTabComponentProps extends React.Component<IInputPropertyTabComponentProps> {
        constructor(props: IInputPropertyTabComponentProps);
        renderValue(globalState: GlobalState): JSX.Element | null;
        setDefaultValue(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Generic node model which stores information about a node editor block
     */
    export class InputNodeModel extends DefaultNodeModel {
        connection?: BABYLON.NodeMaterialConnectionPoint;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface InputNodeWidgetProps {
        node: BABYLON.Nullable<InputNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class InputNodeWidget extends React.Component<InputNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: InputNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class InputNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: InputNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns input node model
         */
        getNewInstance(): InputNodeModel;
    }
}
declare module NODEEDITOR {
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
        componentWillMount(): void;
        componentDidUpdate(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface ILightPropertyTabComponentProps {
        globalState: GlobalState;
        node: LightNodeModel;
    }
    export class LightPropertyTabComponent extends React.Component<ILightPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * BABYLON.Light node model which stores information about a node editor block
     */
    export class LightNodeModel extends DefaultNodeModel {
        private _block;
        /**
         * BABYLON.Light for the node if it exists
         */
        light: BABYLON.Nullable<BABYLON.Light>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface ILightNodeWidgetProps {
        node: BABYLON.Nullable<LightNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class LightNodeWidget extends React.Component<ILightNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ILightNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class LightNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        /**
         * Constructs a LightNodeFactory
         */
        constructor(globalState: GlobalState);
        /**
         * Generates a node widget
         * @param diagramEngine diagram engine
         * @param node node to generate
         * @returns node widget jsx
         */
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: LightNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns light node model
         */
        getNewInstance(): LightNodeModel;
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
        connection?: BABYLON.NodeMaterialConnectionPoint;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        private _engine;
        private _model;
        private _nodes;
        /** @hidden */
        _toAdd: LinkModel[] | null;
        /**
         * Current row/column position used when adding new nodes
         */
        private _rowPos;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(options: NodeCreationOptions): DefaultNodeModel;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        buildMaterial(): void;
        build(): void;
        addNodeFromClass(ObjectClass: typeof BABYLON.NodeMaterialBlock): DefaultNodeModel;
        addValueNode(type: string, column?: number, connection?: BABYLON.NodeMaterialConnectionPoint): DefaultNodeModel;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        render(): JSX.Element;
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
            [s: string]: DefaultPortModel;
        };
        /**
         * Constructs the node model
         */
        constructor(key: string);
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module NODEEDITOR {
    export class GlobalState {
        nodeMaterial?: BABYLON.NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        onSelectionChangedObservable: BABYLON.Observable<BABYLON.Nullable<DefaultNodeModel>>;
        onRebuildRequiredObservable: BABYLON.Observable<void>;
        onResetRequiredObservable: BABYLON.Observable<void>;
        onUpdateRequiredObservable: BABYLON.Observable<void>;
        onZoomToFitRequiredObservable: BABYLON.Observable<void>;
        onLogRequiredObservable: BABYLON.Observable<LogEntry>;
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