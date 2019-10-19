/// <reference types="react" />
declare module "babylonjs-node-editor/blockTools" {
    import { DiscardBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/discardBlock';
    import { BonesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/bonesBlock';
    import { InstancesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/instancesBlock';
    import { MorphTargetsBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/morphTargetsBlock';
    import { ImageProcessingBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/imageProcessingBlock';
    import { ColorMergerBlock } from 'babylonjs/Materials/Node/Blocks/colorMergerBlock';
    import { VectorMergerBlock } from 'babylonjs/Materials/Node/Blocks/vectorMergerBlock';
    import { ColorSplitterBlock } from 'babylonjs/Materials/Node/Blocks/colorSplitterBlock';
    import { VectorSplitterBlock } from 'babylonjs/Materials/Node/Blocks/vectorSplitterBlock';
    import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
    import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
    import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
    import { LightBlock } from 'babylonjs/Materials/Node/Blocks/Dual/lightBlock';
    import { FogBlock } from 'babylonjs/Materials/Node/Blocks/Dual/fogBlock';
    import { VertexOutputBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/vertexOutputBlock';
    import { FragmentOutputBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragmentOutputBlock';
    import { NormalizeBlock } from 'babylonjs/Materials/Node/Blocks/normalizeBlock';
    import { AddBlock } from 'babylonjs/Materials/Node/Blocks/addBlock';
    import { ScaleBlock } from 'babylonjs/Materials/Node/Blocks/scaleBlock';
    import { TrigonometryBlock } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';
    import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
    import { CrossBlock } from 'babylonjs/Materials/Node/Blocks/crossBlock';
    import { DotBlock } from 'babylonjs/Materials/Node/Blocks/dotBlock';
    import { MultiplyBlock } from 'babylonjs/Materials/Node/Blocks/multiplyBlock';
    import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';
    import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
    import { FresnelBlock } from 'babylonjs/Materials/Node/Blocks/fresnelBlock';
    import { LerpBlock } from 'babylonjs/Materials/Node/Blocks/lerpBlock';
    import { NLerpBlock } from 'babylonjs/Materials/Node/Blocks/nLerpBlock';
    import { DivideBlock } from 'babylonjs/Materials/Node/Blocks/divideBlock';
    import { SubtractBlock } from 'babylonjs/Materials/Node/Blocks/subtractBlock';
    import { StepBlock } from 'babylonjs/Materials/Node/Blocks/stepBlock';
    import { SmoothStepBlock } from 'babylonjs/Materials/Node/Blocks/smoothStepBlock';
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    import { OneMinusBlock } from 'babylonjs/Materials/Node/Blocks/oneMinusBlock';
    import { ViewDirectionBlock } from 'babylonjs/Materials/Node/Blocks/viewDirectionBlock';
    import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';
    import { MaxBlock } from 'babylonjs/Materials/Node/Blocks/maxBlock';
    import { MinBlock } from 'babylonjs/Materials/Node/Blocks/minBlock';
    import { PerturbNormalBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/perturbNormalBlock';
    import { LengthBlock } from 'babylonjs/Materials/Node/Blocks/lengthBlock';
    import { DistanceBlock } from 'babylonjs/Materials/Node/Blocks/distanceBlock';
    import { FrontFacingBlock } from 'babylonjs/Materials/Node/Blocks/frontFacingBlock';
    import { NegateBlock } from 'babylonjs/Materials/Node/Blocks/negateBlock';
    import { PowBlock } from 'babylonjs/Materials/Node/Blocks/powBlock';
    import { Scene } from 'babylonjs/scene';
    import { RandomNumberBlock } from 'babylonjs/Materials/Node/Blocks/randomNumberBlock';
    import { ReplaceColorBlock } from 'babylonjs/Materials/Node/Blocks/replaceColorBlock';
    import { PosterizeBlock } from 'babylonjs/Materials/Node/Blocks/posterizeBlock';
    import { ArcTan2Block } from 'babylonjs/Materials/Node/Blocks/arcTan2Block';
    import { ReciprocalBlock } from 'babylonjs/Materials/Node/Blocks/reciprocalBlock';
    import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    import { WaveBlock } from 'babylonjs/Materials/Node/Blocks/waveBlock';
    import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
    export class BlockTools {
        static GetBlockFromString(data: string, scene: Scene, nodeMaterial: NodeMaterial): BonesBlock | InstancesBlock | MorphTargetsBlock | DiscardBlock | ImageProcessingBlock | ColorMergerBlock | VectorMergerBlock | ColorSplitterBlock | VectorSplitterBlock | TextureBlock | ReflectionTextureBlock | LightBlock | FogBlock | VertexOutputBlock | FragmentOutputBlock | AddBlock | ClampBlock | ScaleBlock | CrossBlock | DotBlock | PowBlock | MultiplyBlock | TransformBlock | TrigonometryBlock | RemapBlock | NormalizeBlock | FresnelBlock | LerpBlock | NLerpBlock | DivideBlock | SubtractBlock | StepBlock | SmoothStepBlock | OneMinusBlock | ReciprocalBlock | ViewDirectionBlock | LightInformationBlock | MaxBlock | MinBlock | LengthBlock | DistanceBlock | NegateBlock | PerturbNormalBlock | RandomNumberBlock | ReplaceColorBlock | PosterizeBlock | ArcTan2Block | GradientBlock | FrontFacingBlock | WaveBlock | InputBlock | null;
        static GetColorFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes): string;
        static GetConnectionNodeTypeFromString(type: string): NodeMaterialBlockConnectionPointTypes.Float | NodeMaterialBlockConnectionPointTypes.Vector2 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4 | NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Color4 | NodeMaterialBlockConnectionPointTypes.Matrix | NodeMaterialBlockConnectionPointTypes.AutoDetect;
        static GetStringFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes): "Float" | "Vector2" | "Vector3" | "Vector4" | "Matrix" | "Color3" | "Color4" | "";
    }
}
declare module "babylonjs-node-editor/dataStorage" {
    export class DataStorage {
        private static _InMemoryStorage;
        static ReadBoolean(key: string, defaultValue: boolean): boolean;
        static StoreBoolean(key: string, value: boolean): void;
        static ReadNumber(key: string, defaultValue: number): number;
        static StoreNumber(key: string, value: number): void;
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
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface ITextInputLineComponentProps {
        label: string;
        globalState: GlobalState;
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
        updateValue(value: string, raisePropertyChanged: boolean): void;
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/link/advancedLinkModel" {
    import { DefaultLinkModel } from 'storm-react-diagrams';
    export class AdvancedLinkModel extends DefaultLinkModel {
        constructor();
    }
}
declare module "babylonjs-node-editor/components/diagram/port/defaultPortModel" {
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
declare module "babylonjs-node-editor/components/diagram/port/defaultPortWidget" {
    import { BaseWidget, PortState, NodeModel, BaseWidgetProps } from 'storm-react-diagrams';
    export interface IDefaultPortWidgetProps extends BaseWidgetProps {
        name: string;
        node: NodeModel;
        style: any;
    }
    export class DefaultPortWidget extends BaseWidget<IDefaultPortWidgetProps, PortState> {
        constructor(props: IDefaultPortWidgetProps);
        getClassName(): string;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/portHelper" {
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
    export class PortHelper {
        private static _GetPortTypeIndicator;
        static _GetPortStyle(type: NodeMaterialBlockConnectionPointTypes): {
            background: string;
        };
        static GenerateOutputPorts(node: Nullable<DefaultNodeModel>, ignoreLabel: boolean): JSX.Element[];
        static GenerateInputPorts(node: Nullable<DefaultNodeModel>, includeOnly?: string[], ignoreLabel?: boolean): JSX.Element[];
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
declare module "babylonjs-node-editor/sharedComponents/draggableLineComponent" {
    import * as React from "react";
    export interface IButtonLineComponentProps {
        data: string;
    }
    export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/nodeList/nodeListComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface INodeListComponentProps {
        globalState: GlobalState;
    }
    export class NodeListComponent extends React.Component<INodeListComponentProps, {
        filter: string;
    }> {
        constructor(props: INodeListComponentProps);
        filterContent(filter: string): void;
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
declare module "babylonjs-node-editor/stringTools" {
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
declare module "babylonjs-node-editor/nodeLocationInfo" {
    export interface INodeLocationInfo {
        blockId: number;
        x: number;
        y: number;
    }
}
declare module "babylonjs-node-editor/serializationTools" {
    import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export class SerializationTools {
        static Serialize(material: NodeMaterial, globalState: GlobalState): string;
        static Deserialize(serializationObject: any, globalState: GlobalState): void;
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
        componentDidMount(): void;
        load(file: File): void;
        save(): void;
        customSave(): void;
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
declare module "babylonjs-node-editor/sharedComponents/sliderLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
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
declare module "babylonjs-node-editor/components/diagram/reflectionTexture/reflectionTextureNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeCreationOptions, GraphEditor } from "babylonjs-node-editor/graphEditor";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    /**
     * Texture node model which stores information about a node editor block
     */
    export class ReflectionTextureNodeModel extends DefaultNodeModel {
        private _block;
        /**
         * Texture for the node if it exists
         */
        texture: Nullable<BaseTexture>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
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
        className?: string;
        propertyName?: string;
        options: ListLineOption[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number | string) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        valuesAreStrings?: boolean;
        defaultIfNull?: number;
        getSelection?: (target: any) => number;
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
declare module "babylonjs-node-editor/components/diagram/texture/texturePropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { TextureNodeModel } from "babylonjs-node-editor/components/diagram/texture/textureNodeModel";
    import { ReflectionTextureNodeModel } from "babylonjs-node-editor/components/diagram/reflectionTexture/reflectionTextureNodeModel";
    interface ITexturePropertyTabComponentProps {
        globalState: GlobalState;
        node: TextureNodeModel | ReflectionTextureNodeModel;
    }
    export class TexturePropertyTabComponent extends React.Component<ITexturePropertyTabComponentProps, {
        isEmbedded: boolean;
        loadAsCubeTexture: boolean;
    }> {
        constructor(props: ITexturePropertyTabComponentProps);
        UNSAFE_componentWillUpdate(nextProps: ITexturePropertyTabComponentProps, nextState: {
            isEmbedded: boolean;
            loadAsCubeTexture: boolean;
        }): void;
        private _generateRandomForCache;
        updateAfterTextureLoad(): void;
        removeTexture(): void;
        _prepareTexture(): void;
        /**
         * Replaces the texture of the node
         * @param file the file of the texture to use
         */
        replaceTexture(file: File): void;
        replaceTextureWithUrl(url: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/texture/textureNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeCreationOptions, GraphEditor } from "babylonjs-node-editor/graphEditor";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    import { Texture } from 'babylonjs/Materials/Textures/texture';
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
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
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IVector2PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
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
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IVector3PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
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
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IColor3PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/properties/floatPropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/vector4LineComponent" {
    import * as React from "react";
    import { Vector4 } from "babylonjs/Maths/math";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    interface IVector4LineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        value?: Vector4;
        step?: number;
        onChange?: (newvalue: Vector4) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
declare module "babylonjs-node-editor/components/propertyTab/properties/vector4PropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IVector4PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class Vector4PropertyTabComponent extends React.Component<IVector4PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/matrixLineComponent" {
    import * as React from "react";
    import { Vector3, Matrix, Vector4 } from "babylonjs/Maths/math";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    interface IMatrixLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newValue: Matrix) => void;
        onModeChange?: (mode: number) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        mode?: number;
    }
    export class MatrixLineComponent extends React.Component<IMatrixLineComponentProps, {
        value: Matrix;
        mode: number;
        angle: number;
    }> {
        private _localChange;
        constructor(props: IMatrixLineComponentProps);
        shouldComponentUpdate(nextProps: IMatrixLineComponentProps, nextState: {
            value: Matrix;
            mode: number;
            angle: number;
        }): boolean;
        raiseOnPropertyChanged(previousValue: Vector3): void;
        updateMatrix(): void;
        updateRow(value: Vector4, row: number): void;
        updateBasedOnMode(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/properties/matrixPropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IMatrixPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class MatrixPropertyTabComponent extends React.Component<IMatrixPropertyTabComponentProps> {
        render(): JSX.Element;
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
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    /**
     * Generic node model which stores information about a node editor block
     */
    export class InputNodeModel extends DefaultNodeModel {
        readonly inputBlock: InputBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
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
    export interface IInputNodeWidgetProps {
        node: Nullable<InputNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class InputNodeWidget extends React.Component<IInputNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: IInputNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element | null;
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
        componentDidMount(): void;
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
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
declare module "babylonjs-node-editor/sharedComponents/messageDialog" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
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
declare module "babylonjs-node-editor/components/diagram/link/advancedLinkFactory" {
    import { DefaultLinkFactory, DefaultLinkWidget } from 'storm-react-diagrams';
    import { AdvancedLinkModel } from "babylonjs-node-editor/components/diagram/link/advancedLinkModel";
    export class AdvancedLinkFactory extends DefaultLinkFactory {
        constructor();
        getNewInstance(initialConfig?: any): AdvancedLinkModel;
        generateLinkSegment(model: AdvancedLinkModel, widget: DefaultLinkWidget, selected: boolean, path: string): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/remap/remapNodePropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { RemapNodeModel } from "babylonjs-node-editor/components/diagram/remap/remapNodeModel";
    interface IRemapPropertyTabComponentProps {
        globalState: GlobalState;
        remapNode: RemapNodeModel;
    }
    export class RemapPropertyTabComponentProps extends React.Component<IRemapPropertyTabComponentProps> {
        constructor(props: IRemapPropertyTabComponentProps);
        forceRebuild(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/remap/remapNodeModel" {
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
    /**
     * Generic node model which stores information about a node editor block
     */
    export class RemapNodeModel extends DefaultNodeModel {
        readonly remapBlock: RemapBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/remap/remapNodeWidget" {
    import * as React from "react";
    import { RemapNodeModel } from "babylonjs-node-editor/components/diagram/remap/remapNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    /**
     * RemapNodeWidgetProps
     */
    export interface RemapNodeWidgetProps {
        node: Nullable<RemapNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class RemapNodeWidget extends React.Component<RemapNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: RemapNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        extractInputValue(connectionPoint: NodeMaterialConnectionPoint): any;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/remap/remapNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { RemapNodeModel } from "babylonjs-node-editor/components/diagram/remap/remapNodeModel";
    /**
     * Node factory which creates editor nodes
     */
    export class RemapNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: RemapNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns input node model
         */
        getNewInstance(): RemapNodeModel;
    }
}
declare module "babylonjs-node-editor/graphHelper" {
    import * as dagre from "babylonjs-node-editor/dagre";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    export class GraphHelper {
        static DistributeGraph(model: DiagramModel): dagre.Node[];
        private static _MapElements;
        private static _MapEdges;
    }
}
declare module "babylonjs-node-editor/components/preview/previewMeshType" {
    export enum PreviewMeshType {
        Sphere = 0,
        Box = 1,
        Torus = 2,
        Cylinder = 3,
        Plane = 4,
        ShaderBall = 5,
        Custom = 6
    }
}
declare module "babylonjs-node-editor/components/preview/previewManager" {
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export class PreviewManager {
        private _nodeMaterial;
        private _onBuildObserver;
        private _onPreviewCommandActivatedObserver;
        private _onAnimationCommandActivatedObserver;
        private _onUpdateRequiredObserver;
        private _onPreviewBackgroundChangedObserver;
        private _onBackFaceCullingChangedObserver;
        private _onDepthPrePassChangedObserver;
        private _onLightUpdatedObserver;
        private _engine;
        private _scene;
        private _meshes;
        private _camera;
        private _material;
        private _globalState;
        private _currentType;
        private _lightParent;
        constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState);
        private _handleAnimations;
        private _prepareLights;
        private _prepareMeshes;
        private _refreshPreviewMesh;
        private _forceCompilationAsync;
        private _updatePreview;
        dispose(): void;
    }
}
declare module "babylonjs-node-editor/components/preview/previewMeshControlComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { PreviewMeshType } from "babylonjs-node-editor/components/preview/previewMeshType";
    interface IPreviewMeshControlComponent {
        globalState: GlobalState;
    }
    export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {
        changeMeshType(newOne: PreviewMeshType): void;
        useCustomMesh(evt: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodePropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { TrigonometryNodeModel } from "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodeModel";
    interface ITrigonometryTabComponentProps {
        globalState: GlobalState;
        trigonometryNode: TrigonometryNodeModel;
    }
    export class TrigonometryPropertyTabComponentProps extends React.Component<ITrigonometryTabComponentProps> {
        constructor(props: ITrigonometryTabComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodeModel" {
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { TrigonometryBlock } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';
    /**
     * Generic node model which stores information about a node editor block
     */
    export class TrigonometryNodeModel extends DefaultNodeModel {
        readonly trigonometryBlock: TrigonometryBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodeWidget" {
    import * as React from "react";
    import { TrigonometryNodeModel } from "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * GenericNodeWidgetProps
     */
    export interface ITrigonometryNodeWidgetProps {
        node: Nullable<TrigonometryNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class TrigonometryNodeWidget extends React.Component<ITrigonometryNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ITrigonometryNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { TrigonometryNodeModel } from "babylonjs-node-editor/components/diagram/trigonometry/trigonometryNodeModel";
    /**
     * Node factory which creates editor nodes
     */
    export class TrigonometryNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: TrigonometryNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns input node model
         */
        getNewInstance(): TrigonometryNodeModel;
    }
}
declare module "babylonjs-node-editor/components/diagram/clamp/clampNodePropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { ClampNodeModel } from "babylonjs-node-editor/components/diagram/clamp/clampNodeModel";
    interface IClampPropertyTabComponentProps {
        globalState: GlobalState;
        remapNode: ClampNodeModel;
    }
    export class ClampPropertyTabComponentProps extends React.Component<IClampPropertyTabComponentProps> {
        constructor(props: IClampPropertyTabComponentProps);
        forceRebuild(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/clamp/clampNodeModel" {
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
    export class ClampNodeModel extends DefaultNodeModel {
        readonly clampBlock: ClampBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/clamp/clampNodeWidget" {
    import * as React from "react";
    import { ClampNodeModel } from "babylonjs-node-editor/components/diagram/clamp/clampNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export interface ClampNodeWidgetProps {
        node: Nullable<ClampNodeModel>;
        globalState: GlobalState;
    }
    export class ClampNodeWidget extends React.Component<ClampNodeWidgetProps> {
        constructor(props: ClampNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/clamp/clampNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { ClampNodeModel } from "babylonjs-node-editor/components/diagram/clamp/clampNodeModel";
    export class ClampNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        constructor(globalState: GlobalState);
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: ClampNodeModel): JSX.Element;
        getNewInstance(): ClampNodeModel;
    }
}
declare module "babylonjs-node-editor/components/diagram/lightInformation/lightInformationPropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { LightInformationNodeModel } from "babylonjs-node-editor/components/diagram/lightInformation/lightInformationNodeModel";
    interface ILightPropertyTabComponentProps {
        globalState: GlobalState;
        node: LightInformationNodeModel;
    }
    export class LightInformationPropertyTabComponent extends React.Component<ILightPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/lightInformation/lightInformationNodeModel" {
    import { Nullable } from 'babylonjs/types';
    import { Light } from 'babylonjs/Lights/light';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeCreationOptions, GraphEditor } from "babylonjs-node-editor/graphEditor";
    import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
    export class LightInformationNodeModel extends DefaultNodeModel {
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
    }
}
declare module "babylonjs-node-editor/components/diagram/lightInformation/lightInformationNodeWidget" {
    import * as React from "react";
    import { LightInformationNodeModel } from "babylonjs-node-editor/components/diagram/lightInformation/lightInformationNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * GenericNodeWidgetProps
     */
    export interface ILightInformationNodeWidgetProps {
        node: Nullable<LightInformationNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class LightInformationNodeWidget extends React.Component<ILightInformationNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ILightInformationNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/lightInformation/lightInformationNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { LightInformationNodeModel } from "babylonjs-node-editor/components/diagram/lightInformation/lightInformationNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    /**
     * Node factory which creates editor nodes
     */
    export class LightInformationNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: LightInformationNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns light node model
         */
        getNewInstance(): LightInformationNodeModel;
    }
}
declare module "babylonjs-node-editor/components/preview/previewAreaComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface IPreviewAreaComponentProps {
        globalState: GlobalState;
        width: number;
    }
    export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, {
        isLoading: boolean;
    }> {
        constructor(props: IPreviewAreaComponentProps);
        changeAnimation(): void;
        changeBackground(value: string): void;
        changeBackFaceCulling(value: boolean): void;
        changeDepthPrePass(value: boolean): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/gradient/gradientStepComponent" {
    import * as React from 'react';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    interface IGradientStepComponentProps {
        globalState: GlobalState;
        step: GradientBlockColorStep;
        lineIndex: number;
        onDelete: () => void;
        onUpdateStep: () => void;
    }
    export class GradientStepComponent extends React.Component<IGradientStepComponentProps, {
        gradient: number;
    }> {
        constructor(props: IGradientStepComponentProps);
        updateColor(color: string): void;
        updateStep(gradient: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/gradient/gradientNodePropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GradientNodeModel } from "babylonjs-node-editor/components/diagram/gradient/gradientNodeModel";
    import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    interface IGradientPropertyTabComponentProps {
        globalState: GlobalState;
        gradientNode: GradientNodeModel;
    }
    export class GradientPropertyTabComponentProps extends React.Component<IGradientPropertyTabComponentProps> {
        constructor(props: IGradientPropertyTabComponentProps);
        forceRebuild(): void;
        deleteStep(step: GradientBlockColorStep): void;
        addNewStep(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/gradient/gradientNodeModel" {
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    export class GradientNodeModel extends DefaultNodeModel {
        readonly gradientBlock: GradientBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/gradient/gradientNodeWidget" {
    import * as React from "react";
    import { GradientNodeModel } from "babylonjs-node-editor/components/diagram/gradient/gradientNodeModel";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export interface IGradientNodeWidgetProps {
        node: Nullable<GradientNodeModel>;
        globalState: GlobalState;
    }
    export class GradientNodeWidget extends React.Component<IGradientNodeWidgetProps> {
        constructor(props: IGradientNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/gradient/gradientNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GradientNodeModel } from "babylonjs-node-editor/components/diagram/gradient/gradientNodeModel";
    export class GradientNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        constructor(globalState: GlobalState);
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GradientNodeModel): JSX.Element;
        getNewInstance(): GradientNodeModel;
    }
}
declare module "babylonjs-node-editor/components/diagram/reflectionTexture/reflectionTextureNodeWidget" {
    import * as React from "react";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { ReflectionTextureNodeModel } from "babylonjs-node-editor/components/diagram/reflectionTexture/reflectionTextureNodeModel";
    /**
     * GenericNodeWidgetProps
     */
    export interface IReflectionTextureNodeWidgetProps {
        node: Nullable<ReflectionTextureNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class ReflectionTextureNodeWidget extends React.Component<IReflectionTextureNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: IReflectionTextureNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/reflectionTexture/reflectionTextureNodeFactory" {
    import * as SRD from "storm-react-diagrams";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { ReflectionTextureNodeModel } from "babylonjs-node-editor/components/diagram/reflectionTexture/reflectionTextureNodeModel";
    /**
     * Node factory which creates editor nodes
     */
    export class ReflectionTextureNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: ReflectionTextureNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns texture node model
         */
        getNewInstance(): ReflectionTextureNodeModel;
    }
}
declare module "babylonjs-node-editor/graphEditor" {
    import { LinkModel } from "storm-react-diagrams";
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { DefaultPortModel } from "babylonjs-node-editor/components/diagram/port/defaultPortModel";
    import { Nullable } from 'babylonjs/types';
    import { INodeLocationInfo } from "babylonjs-node-editor/nodeLocationInfo";
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class NodeCreationOptions {
        nodeMaterialBlock: NodeMaterialBlock;
        type?: string;
        connection?: NodeMaterialConnectionPoint;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        private readonly NodeWidth;
        private _engine;
        private _model;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _nodes;
        private _blocks;
        private _previewManager;
        private _copiedNodes;
        private _mouseLocationX;
        private _mouseLocationY;
        private _onWidgetKeyUpPointer;
        private _altKeyIsPressed;
        private _oldY;
        /** @hidden */
        _toAdd: LinkModel[] | null;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(options: NodeCreationOptions): DefaultNodeModel;
        addValueNode(type: string): DefaultNodeModel;
        onWidgetKeyUp(evt: any): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        zoomToFit(retry?: number): void;
        buildMaterial(): void;
        applyFragmentOutputConstraints(rootInput: DefaultPortModel): void;
        build(needToWait?: boolean, locations?: Nullable<INodeLocationInfo[]>): void;
        reOrganize(locations?: Nullable<INodeLocationInfo[]>): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        emitNewBlock(event: React.DragEvent<HTMLDivElement>): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/diagram/defaultNodeModel" {
    import { NodeModel, DiagramModel } from "storm-react-diagrams";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { GraphEditor, NodeCreationOptions } from "babylonjs-node-editor/graphEditor";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { DefaultPortModel } from "babylonjs-node-editor/components/diagram/port/defaultPortModel";
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module "babylonjs-node-editor/globalState" {
    import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
    import { Nullable } from "babylonjs/types";
    import { Observable } from 'babylonjs/Misc/observable';
    import { DefaultNodeModel } from "babylonjs-node-editor/components/diagram/defaultNodeModel";
    import { LogEntry } from "babylonjs-node-editor/components/log/logComponent";
    import { NodeModel } from 'storm-react-diagrams';
    import { INodeLocationInfo } from "babylonjs-node-editor/nodeLocationInfo";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { PreviewMeshType } from "babylonjs-node-editor/components/preview/previewMeshType";
    import { Color4 } from 'babylonjs/Maths/math.color';
    export class GlobalState {
        nodeMaterial: NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        onSelectionChangedObservable: Observable<Nullable<DefaultNodeModel>>;
        onRebuildRequiredObservable: Observable<void>;
        onResetRequiredObservable: Observable<Nullable<INodeLocationInfo[]>>;
        onUpdateRequiredObservable: Observable<void>;
        onZoomToFitRequiredObservable: Observable<void>;
        onReOrganizedRequiredObservable: Observable<void>;
        onLogRequiredObservable: Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: Observable<string>;
        onIsLoadingChanged: Observable<boolean>;
        onPreviewCommandActivated: Observable<void>;
        onLightUpdated: Observable<void>;
        onPreviewBackgroundChanged: Observable<void>;
        onBackFaceCullingChanged: Observable<void>;
        onDepthPrePassChanged: Observable<void>;
        onAnimationCommandActivated: Observable<void>;
        onGetNodeFromBlock: (block: NodeMaterialBlock) => NodeModel;
        previewMeshType: PreviewMeshType;
        previewMeshFile: File;
        rotatePreview: boolean;
        backgroundColor: Color4;
        backFaceCulling: boolean;
        depthPrePass: boolean;
        blockKeyboardEvents: boolean;
        hemisphericLight: boolean;
        directionalLight0: boolean;
        directionalLight1: boolean;
        controlCamera: boolean;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
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
    import { Observable } from 'babylonjs/Misc/observable';
    /**
     * Interface used to specify creation options for the node editor
     */
    export interface INodeEditorOptions {
        nodeMaterial: NodeMaterial;
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        customLoadObservable?: Observable<any>;
    }
    /**
     * Class used to create a node editor
     */
    export class NodeEditor {
        private static _CurrentState;
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
    export class BlockTools {
        static GetBlockFromString(data: string, scene: BABYLON.Scene, nodeMaterial: BABYLON.NodeMaterial): BABYLON.BonesBlock | BABYLON.InstancesBlock | BABYLON.MorphTargetsBlock | BABYLON.DiscardBlock | BABYLON.ImageProcessingBlock | BABYLON.ColorMergerBlock | BABYLON.VectorMergerBlock | BABYLON.ColorSplitterBlock | BABYLON.VectorSplitterBlock | BABYLON.TextureBlock | BABYLON.ReflectionTextureBlock | BABYLON.LightBlock | BABYLON.FogBlock | BABYLON.VertexOutputBlock | BABYLON.FragmentOutputBlock | BABYLON.AddBlock | BABYLON.ClampBlock | BABYLON.ScaleBlock | BABYLON.CrossBlock | BABYLON.DotBlock | BABYLON.PowBlock | BABYLON.MultiplyBlock | BABYLON.TransformBlock | BABYLON.TrigonometryBlock | BABYLON.RemapBlock | BABYLON.NormalizeBlock | BABYLON.FresnelBlock | BABYLON.LerpBlock | BABYLON.NLerpBlock | BABYLON.DivideBlock | BABYLON.SubtractBlock | BABYLON.StepBlock | BABYLON.SmoothStepBlock | BABYLON.OneMinusBlock | BABYLON.ReciprocalBlock | BABYLON.ViewDirectionBlock | BABYLON.LightInformationBlock | BABYLON.MaxBlock | BABYLON.MinBlock | BABYLON.LengthBlock | BABYLON.DistanceBlock | BABYLON.NegateBlock | BABYLON.PerturbNormalBlock | BABYLON.RandomNumberBlock | BABYLON.ReplaceColorBlock | BABYLON.PosterizeBlock | BABYLON.ArcTan2Block | BABYLON.GradientBlock | BABYLON.FrontFacingBlock | BABYLON.WaveBlock | BABYLON.InputBlock | null;
        static GetColorFromConnectionNodeType(type: BABYLON.NodeMaterialBlockConnectionPointTypes): string;
        static GetConnectionNodeTypeFromString(type: string): BABYLON.NodeMaterialBlockConnectionPointTypes.Float | BABYLON.NodeMaterialBlockConnectionPointTypes.Vector2 | BABYLON.NodeMaterialBlockConnectionPointTypes.Vector3 | BABYLON.NodeMaterialBlockConnectionPointTypes.Vector4 | BABYLON.NodeMaterialBlockConnectionPointTypes.Color3 | BABYLON.NodeMaterialBlockConnectionPointTypes.Color4 | BABYLON.NodeMaterialBlockConnectionPointTypes.Matrix | BABYLON.NodeMaterialBlockConnectionPointTypes.AutoDetect;
        static GetStringFromConnectionNodeType(type: BABYLON.NodeMaterialBlockConnectionPointTypes): "Float" | "Vector2" | "Vector3" | "Vector4" | "Matrix" | "Color3" | "Color4" | "";
    }
}
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
        globalState: GlobalState;
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
        updateValue(value: string, raisePropertyChanged: boolean): void;
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class AdvancedLinkModel extends DefaultLinkModel {
        constructor();
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
    export interface IDefaultPortWidgetProps extends BaseWidgetProps {
        name: string;
        node: NodeModel;
        style: any;
    }
    export class DefaultPortWidget extends BaseWidget<IDefaultPortWidgetProps, PortState> {
        constructor(props: IDefaultPortWidgetProps);
        getClassName(): string;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class PortHelper {
        private static _GetPortTypeIndicator;
        static _GetPortStyle(type: BABYLON.NodeMaterialBlockConnectionPointTypes): {
            background: string;
        };
        static GenerateOutputPorts(node: BABYLON.Nullable<DefaultNodeModel>, ignoreLabel: boolean): JSX.Element[];
        static GenerateInputPorts(node: BABYLON.Nullable<DefaultNodeModel>, includeOnly?: string[], ignoreLabel?: boolean): JSX.Element[];
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
        data: string;
    }
    export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface INodeListComponentProps {
        globalState: GlobalState;
    }
    export class NodeListComponent extends React.Component<INodeListComponentProps, {
        filter: string;
    }> {
        constructor(props: INodeListComponentProps);
        filterContent(filter: string): void;
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
    export interface INodeLocationInfo {
        blockId: number;
        x: number;
        y: number;
    }
}
declare module NODEEDITOR {
    export class SerializationTools {
        static Serialize(material: BABYLON.NodeMaterial, globalState: GlobalState): string;
        static Deserialize(serializationObject: any, globalState: GlobalState): void;
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
        componentDidMount(): void;
        load(file: File): void;
        save(): void;
        customSave(): void;
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
    /**
     * BABYLON.Texture node model which stores information about a node editor block
     */
    export class ReflectionTextureNodeModel extends DefaultNodeModel {
        private _block;
        /**
         * BABYLON.Texture for the node if it exists
         */
        texture: BABYLON.Nullable<BABYLON.BaseTexture>;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
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
        className?: string;
        propertyName?: string;
        options: ListLineOption[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number | string) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        valuesAreStrings?: boolean;
        defaultIfNull?: number;
        getSelection?: (target: any) => number;
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
    interface ITexturePropertyTabComponentProps {
        globalState: GlobalState;
        node: TextureNodeModel | ReflectionTextureNodeModel;
    }
    export class TexturePropertyTabComponent extends React.Component<ITexturePropertyTabComponentProps, {
        isEmbedded: boolean;
        loadAsCubeTexture: boolean;
    }> {
        constructor(props: ITexturePropertyTabComponentProps);
        UNSAFE_componentWillUpdate(nextProps: ITexturePropertyTabComponentProps, nextState: {
            isEmbedded: boolean;
            loadAsCubeTexture: boolean;
        }): void;
        private _generateRandomForCache;
        updateAfterTextureLoad(): void;
        removeTexture(): void;
        _prepareTexture(): void;
        /**
         * Replaces the texture of the node
         * @param file the file of the texture to use
         */
        replaceTexture(file: File): void;
        replaceTextureWithUrl(url: string): void;
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
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
        inputBlock: BABYLON.InputBlock;
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
        inputBlock: BABYLON.InputBlock;
    }
    export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
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
        inputBlock: BABYLON.InputBlock;
    }
    export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: BABYLON.InputBlock;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IVector4LineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        value?: BABYLON.Vector4;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector4) => void;
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
declare module NODEEDITOR {
    interface IVector4PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: BABYLON.InputBlock;
    }
    export class Vector4PropertyTabComponent extends React.Component<IVector4PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IMatrixLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newValue: BABYLON.Matrix) => void;
        onModeChange?: (mode: number) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        mode?: number;
    }
    export class MatrixLineComponent extends React.Component<IMatrixLineComponentProps, {
        value: BABYLON.Matrix;
        mode: number;
        angle: number;
    }> {
        private _localChange;
        constructor(props: IMatrixLineComponentProps);
        shouldComponentUpdate(nextProps: IMatrixLineComponentProps, nextState: {
            value: BABYLON.Matrix;
            mode: number;
            angle: number;
        }): boolean;
        raiseOnPropertyChanged(previousValue: BABYLON.Vector3): void;
        updateMatrix(): void;
        updateRow(value: BABYLON.Vector4, row: number): void;
        updateBasedOnMode(value: number): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IMatrixPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: BABYLON.InputBlock;
    }
    export class MatrixPropertyTabComponent extends React.Component<IMatrixPropertyTabComponentProps> {
        render(): JSX.Element;
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
        readonly inputBlock: BABYLON.InputBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface IInputNodeWidgetProps {
        node: BABYLON.Nullable<InputNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class InputNodeWidget extends React.Component<IInputNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: IInputNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element | null;
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
        componentDidMount(): void;
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
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
declare module NODEEDITOR {
    export class AdvancedLinkFactory extends DefaultLinkFactory {
        constructor();
        getNewInstance(initialConfig?: any): AdvancedLinkModel;
        generateLinkSegment(model: AdvancedLinkModel, widget: DefaultLinkWidget, selected: boolean, path: string): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IRemapPropertyTabComponentProps {
        globalState: GlobalState;
        remapNode: RemapNodeModel;
    }
    export class RemapPropertyTabComponentProps extends React.Component<IRemapPropertyTabComponentProps> {
        constructor(props: IRemapPropertyTabComponentProps);
        forceRebuild(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Generic node model which stores information about a node editor block
     */
    export class RemapNodeModel extends DefaultNodeModel {
        readonly remapBlock: BABYLON.RemapBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * RemapNodeWidgetProps
     */
    export interface RemapNodeWidgetProps {
        node: BABYLON.Nullable<RemapNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class RemapNodeWidget extends React.Component<RemapNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: RemapNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        extractInputValue(connectionPoint: BABYLON.NodeMaterialConnectionPoint): any;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class RemapNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: RemapNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns input node model
         */
        getNewInstance(): RemapNodeModel;
    }
}
declare module NODEEDITOR {
    export class GraphHelper {
        static DistributeGraph(model: DiagramModel): dagre.Node[];
        private static _MapElements;
        private static _MapEdges;
    }
}
declare module NODEEDITOR {
    export enum PreviewMeshType {
        Sphere = 0,
        Box = 1,
        Torus = 2,
        Cylinder = 3,
        Plane = 4,
        ShaderBall = 5,
        Custom = 6
    }
}
declare module NODEEDITOR {
    export class PreviewManager {
        private _nodeMaterial;
        private _onBuildObserver;
        private _onPreviewCommandActivatedObserver;
        private _onAnimationCommandActivatedObserver;
        private _onUpdateRequiredObserver;
        private _onPreviewBackgroundChangedObserver;
        private _onBackFaceCullingChangedObserver;
        private _onDepthPrePassChangedObserver;
        private _onLightUpdatedObserver;
        private _engine;
        private _scene;
        private _meshes;
        private _camera;
        private _material;
        private _globalState;
        private _currentType;
        private _lightParent;
        constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState);
        private _handleAnimations;
        private _prepareLights;
        private _prepareMeshes;
        private _refreshPreviewMesh;
        private _forceCompilationAsync;
        private _updatePreview;
        dispose(): void;
    }
}
declare module NODEEDITOR {
    interface IPreviewMeshControlComponent {
        globalState: GlobalState;
    }
    export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {
        changeMeshType(newOne: PreviewMeshType): void;
        useCustomMesh(evt: any): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface ITrigonometryTabComponentProps {
        globalState: GlobalState;
        trigonometryNode: TrigonometryNodeModel;
    }
    export class TrigonometryPropertyTabComponentProps extends React.Component<ITrigonometryTabComponentProps> {
        constructor(props: ITrigonometryTabComponentProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Generic node model which stores information about a node editor block
     */
    export class TrigonometryNodeModel extends DefaultNodeModel {
        readonly trigonometryBlock: BABYLON.TrigonometryBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface ITrigonometryNodeWidgetProps {
        node: BABYLON.Nullable<TrigonometryNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class TrigonometryNodeWidget extends React.Component<ITrigonometryNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ITrigonometryNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class TrigonometryNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: TrigonometryNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns input node model
         */
        getNewInstance(): TrigonometryNodeModel;
    }
}
declare module NODEEDITOR {
    interface IClampPropertyTabComponentProps {
        globalState: GlobalState;
        remapNode: ClampNodeModel;
    }
    export class ClampPropertyTabComponentProps extends React.Component<IClampPropertyTabComponentProps> {
        constructor(props: IClampPropertyTabComponentProps);
        forceRebuild(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class ClampNodeModel extends DefaultNodeModel {
        readonly clampBlock: BABYLON.ClampBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface ClampNodeWidgetProps {
        node: BABYLON.Nullable<ClampNodeModel>;
        globalState: GlobalState;
    }
    export class ClampNodeWidget extends React.Component<ClampNodeWidgetProps> {
        constructor(props: ClampNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class ClampNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        constructor(globalState: GlobalState);
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: ClampNodeModel): JSX.Element;
        getNewInstance(): ClampNodeModel;
    }
}
declare module NODEEDITOR {
    interface ILightPropertyTabComponentProps {
        globalState: GlobalState;
        node: LightInformationNodeModel;
    }
    export class LightInformationPropertyTabComponent extends React.Component<ILightPropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class LightInformationNodeModel extends DefaultNodeModel {
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface ILightInformationNodeWidgetProps {
        node: BABYLON.Nullable<LightInformationNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class LightInformationNodeWidget extends React.Component<ILightInformationNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: ILightInformationNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class LightInformationNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: LightInformationNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns light node model
         */
        getNewInstance(): LightInformationNodeModel;
    }
}
declare module NODEEDITOR {
    interface IPreviewAreaComponentProps {
        globalState: GlobalState;
        width: number;
    }
    export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, {
        isLoading: boolean;
    }> {
        constructor(props: IPreviewAreaComponentProps);
        changeAnimation(): void;
        changeBackground(value: string): void;
        changeBackFaceCulling(value: boolean): void;
        changeDepthPrePass(value: boolean): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IGradientStepComponentProps {
        globalState: GlobalState;
        step: BABYLON.GradientBlockColorStep;
        lineIndex: number;
        onDelete: () => void;
        onUpdateStep: () => void;
    }
    export class GradientStepComponent extends React.Component<IGradientStepComponentProps, {
        gradient: number;
    }> {
        constructor(props: IGradientStepComponentProps);
        updateColor(color: string): void;
        updateStep(gradient: number): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IGradientPropertyTabComponentProps {
        globalState: GlobalState;
        gradientNode: GradientNodeModel;
    }
    export class GradientPropertyTabComponentProps extends React.Component<IGradientPropertyTabComponentProps> {
        constructor(props: IGradientPropertyTabComponentProps);
        forceRebuild(): void;
        deleteStep(step: BABYLON.GradientBlockColorStep): void;
        addNewStep(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class GradientNodeModel extends DefaultNodeModel {
        readonly gradientBlock: BABYLON.GradientBlock;
        /**
         * Constructs the node model
         */
        constructor();
        renderProperties(globalState: GlobalState): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IGradientNodeWidgetProps {
        node: BABYLON.Nullable<GradientNodeModel>;
        globalState: GlobalState;
    }
    export class GradientNodeWidget extends React.Component<IGradientNodeWidgetProps> {
        constructor(props: IGradientNodeWidgetProps);
        renderValue(value: string): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class GradientNodeFactory extends SRD.AbstractNodeFactory {
        private _globalState;
        constructor(globalState: GlobalState);
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GradientNodeModel): JSX.Element;
        getNewInstance(): GradientNodeModel;
    }
}
declare module NODEEDITOR {
    /**
     * GenericNodeWidgetProps
     */
    export interface IReflectionTextureNodeWidgetProps {
        node: BABYLON.Nullable<ReflectionTextureNodeModel>;
        globalState: GlobalState;
    }
    /**
     * Used to display a node block for the node editor
     */
    export class ReflectionTextureNodeWidget extends React.Component<IReflectionTextureNodeWidgetProps> {
        /**
         * Creates a GenericNodeWidget
         * @param props
         */
        constructor(props: IReflectionTextureNodeWidgetProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Node factory which creates editor nodes
     */
    export class ReflectionTextureNodeFactory extends SRD.AbstractNodeFactory {
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
        generateReactWidget(diagramEngine: SRD.DiagramEngine, node: ReflectionTextureNodeModel): JSX.Element;
        /**
         * Gets a new instance of a node model
         * @returns texture node model
         */
        getNewInstance(): ReflectionTextureNodeModel;
    }
}
declare module NODEEDITOR {
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class NodeCreationOptions {
        nodeMaterialBlock: BABYLON.NodeMaterialBlock;
        type?: string;
        connection?: BABYLON.NodeMaterialConnectionPoint;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        private readonly NodeWidth;
        private _engine;
        private _model;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _nodes;
        private _blocks;
        private _previewManager;
        private _copiedNodes;
        private _mouseLocationX;
        private _mouseLocationY;
        private _onWidgetKeyUpPointer;
        private _altKeyIsPressed;
        private _oldY;
        /** @hidden */
        _toAdd: LinkModel[] | null;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(options: NodeCreationOptions): DefaultNodeModel;
        addValueNode(type: string): DefaultNodeModel;
        onWidgetKeyUp(evt: any): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        zoomToFit(retry?: number): void;
        buildMaterial(): void;
        applyFragmentOutputConstraints(rootInput: DefaultPortModel): void;
        build(needToWait?: boolean, locations?: BABYLON.Nullable<INodeLocationInfo[]>): void;
        reOrganize(locations?: BABYLON.Nullable<INodeLocationInfo[]>): void;
        onPointerDown(evt: React.PointerEvent<HTMLDivElement>): void;
        onPointerUp(evt: React.PointerEvent<HTMLDivElement>): void;
        resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft?: boolean): void;
        buildColumnLayout(): string;
        emitNewBlock(event: React.DragEvent<HTMLDivElement>): void;
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
        prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor): void;
        renderProperties(globalState: GlobalState): JSX.Element | null;
    }
}
declare module NODEEDITOR {
    export class GlobalState {
        nodeMaterial: BABYLON.NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        onSelectionChangedObservable: BABYLON.Observable<BABYLON.Nullable<DefaultNodeModel>>;
        onRebuildRequiredObservable: BABYLON.Observable<void>;
        onResetRequiredObservable: BABYLON.Observable<BABYLON.Nullable<INodeLocationInfo[]>>;
        onUpdateRequiredObservable: BABYLON.Observable<void>;
        onZoomToFitRequiredObservable: BABYLON.Observable<void>;
        onReOrganizedRequiredObservable: BABYLON.Observable<void>;
        onLogRequiredObservable: BABYLON.Observable<LogEntry>;
        onErrorMessageDialogRequiredObservable: BABYLON.Observable<string>;
        onIsLoadingChanged: BABYLON.Observable<boolean>;
        onPreviewCommandActivated: BABYLON.Observable<void>;
        onLightUpdated: BABYLON.Observable<void>;
        onPreviewBackgroundChanged: BABYLON.Observable<void>;
        onBackFaceCullingChanged: BABYLON.Observable<void>;
        onDepthPrePassChanged: BABYLON.Observable<void>;
        onAnimationCommandActivated: BABYLON.Observable<void>;
        onGetNodeFromBlock: (block: BABYLON.NodeMaterialBlock) => NodeModel;
        previewMeshType: PreviewMeshType;
        previewMeshFile: File;
        rotatePreview: boolean;
        backgroundColor: BABYLON.Color4;
        backFaceCulling: boolean;
        depthPrePass: boolean;
        blockKeyboardEvents: boolean;
        hemisphericLight: boolean;
        directionalLight0: boolean;
        directionalLight1: boolean;
        controlCamera: boolean;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
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
        hostElement?: HTMLElement;
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        customLoadObservable?: BABYLON.Observable<any>;
    }
    /**
     * Class used to create a node editor
     */
    export class NodeEditor {
        private static _CurrentState;
        /**
         * Show the node editor
         * @param options defines the options to use to configure the node editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}