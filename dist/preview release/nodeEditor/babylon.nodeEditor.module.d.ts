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
    import { ModBlock } from 'babylonjs/Materials/Node/Blocks/modBlock';
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
    import { FrontFacingBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/frontFacingBlock';
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
    import { WorleyNoise3DBlock } from 'babylonjs/Materials/Node/Blocks/worleyNoise3DBlock';
    import { SimplexPerlin3DBlock } from 'babylonjs/Materials/Node/Blocks/simplexPerlin3DBlock';
    import { NormalBlendBlock } from 'babylonjs/Materials/Node/Blocks/normalBlendBlock';
    import { Rotate2dBlock } from 'babylonjs/Materials/Node/Blocks/rotate2dBlock';
    import { DerivativeBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/derivativeBlock';
    import { RefractBlock } from 'babylonjs/Materials/Node/Blocks/refractBlock';
    import { ReflectBlock } from 'babylonjs/Materials/Node/Blocks/reflectBlock';
    import { DesaturateBlock } from 'babylonjs/Materials/Node/Blocks/desaturateBlock';
    import { PBRMetallicRoughnessBlock } from 'babylonjs/Materials/Node/Blocks/PBR/pbrMetallicRoughnessBlock';
    import { SheenBlock } from 'babylonjs/Materials/Node/Blocks/PBR/sheenBlock';
    import { AmbientOcclusionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/ambientOcclusionBlock';
    import { ReflectivityBlock } from 'babylonjs/Materials/Node/Blocks/PBR/reflectivityBlock';
    import { AnisotropyBlock } from 'babylonjs/Materials/Node/Blocks/PBR/anisotropyBlock';
    import { ReflectionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/reflectionBlock';
    import { ClearCoatBlock } from 'babylonjs/Materials/Node/Blocks/PBR/clearCoatBlock';
    import { RefractionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/refractionBlock';
    import { SubSurfaceBlock } from 'babylonjs/Materials/Node/Blocks/PBR/subSurfaceBlock';
    import { CurrentScreenBlock } from 'babylonjs/Materials/Node/Blocks/Dual/currentScreenBlock';
    import { ParticleTextureBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleTextureBlock';
    import { ParticleRampGradientBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleRampGradientBlock';
    import { ParticleBlendMultiplyBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleBlendMultiplyBlock';
    import { FragCoordBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragCoordBlock';
    import { ScreenSizeBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/screenSizeBlock';
    export class BlockTools {
        static GetBlockFromString(data: string, scene: Scene, nodeMaterial: NodeMaterial): DesaturateBlock | RefractBlock | ReflectBlock | DerivativeBlock | Rotate2dBlock | NormalBlendBlock | WorleyNoise3DBlock | SimplexPerlin3DBlock | BonesBlock | InstancesBlock | MorphTargetsBlock | DiscardBlock | ImageProcessingBlock | ColorMergerBlock | VectorMergerBlock | ColorSplitterBlock | VectorSplitterBlock | TextureBlock | ReflectionTextureBlock | LightBlock | FogBlock | VertexOutputBlock | FragmentOutputBlock | AddBlock | ClampBlock | ScaleBlock | CrossBlock | DotBlock | PowBlock | MultiplyBlock | TransformBlock | TrigonometryBlock | RemapBlock | NormalizeBlock | FresnelBlock | LerpBlock | NLerpBlock | DivideBlock | SubtractBlock | ModBlock | StepBlock | SmoothStepBlock | OneMinusBlock | ReciprocalBlock | ViewDirectionBlock | LightInformationBlock | MaxBlock | MinBlock | LengthBlock | DistanceBlock | NegateBlock | PerturbNormalBlock | RandomNumberBlock | ReplaceColorBlock | PosterizeBlock | ArcTan2Block | GradientBlock | FrontFacingBlock | WaveBlock | InputBlock | PBRMetallicRoughnessBlock | SheenBlock | AmbientOcclusionBlock | ReflectivityBlock | AnisotropyBlock | ReflectionBlock | ClearCoatBlock | RefractionBlock | SubSurfaceBlock | CurrentScreenBlock | ParticleTextureBlock | ParticleRampGradientBlock | ParticleBlendMultiplyBlock | FragCoordBlock | ScreenSizeBlock | null;
        static GetColorFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes): string;
        static GetConnectionNodeTypeFromString(type: string): NodeMaterialBlockConnectionPointTypes.Float | NodeMaterialBlockConnectionPointTypes.Vector2 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4 | NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Color4 | NodeMaterialBlockConnectionPointTypes.Matrix | NodeMaterialBlockConnectionPointTypes.AutoDetect;
        static GetStringFromConnectionNodeType(type: NodeMaterialBlockConnectionPointTypes): "Float" | "Vector2" | "Vector3" | "Vector4" | "Matrix" | "Color3" | "Color4" | "";
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
declare module "babylonjs-node-editor/components/preview/previewType" {
    export enum PreviewType {
        Sphere = 0,
        Box = 1,
        Torus = 2,
        Cylinder = 3,
        Plane = 4,
        ShaderBall = 5,
        DefaultParticleSystem = 6,
        Bubbles = 7,
        Smoke = 8,
        Rain = 9,
        Explosion = 10,
        Fire = 11,
        Custom = 12
    }
}
declare module "babylonjs-node-editor/diagram/display/displayManager" {
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export interface IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
        getBackgroundColor(block: NodeMaterialBlock): string;
        getHeaderText(block: NodeMaterialBlock): string;
    }
}
declare module "babylonjs-node-editor/nodeLocationInfo" {
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
declare module "babylonjs-node-editor/serializationTools" {
    import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    export class SerializationTools {
        static UpdateLocations(material: NodeMaterial, globalState: GlobalState, frame?: Nullable<GraphFrame>): void;
        static Serialize(material: NodeMaterial, globalState: GlobalState, frame?: Nullable<GraphFrame>): string;
        static Deserialize(serializationObject: any, globalState: GlobalState): void;
        static AddFrameToMaterial(serializationObject: any, globalState: GlobalState, currentMaterial: NodeMaterial): void;
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
declare module "babylonjs-node-editor/diagram/frameNodePort" {
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { FramePortPosition } from "babylonjs-node-editor/diagram/graphFrame";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { Observable } from 'babylonjs/Misc/observable';
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    export class FrameNodePort extends NodePort {
        connectionPoint: NodeMaterialConnectionPoint;
        node: GraphNode;
        private _parentFrameId;
        private _isInput;
        private _framePortPosition;
        private _framePortId;
        private _onFramePortPositionChangedObservable;
        get parentFrameId(): number;
        get onFramePortPositionChangedObservable(): Observable<FrameNodePort>;
        get isInput(): boolean;
        get framePortId(): number;
        get framePortPosition(): FramePortPosition;
        set framePortPosition(position: FramePortPosition);
        constructor(portContainer: HTMLElement, connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, globalState: GlobalState, isInput: boolean, framePortId: number, parentFrameId: number);
        static CreateFrameNodePortElement(connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, displayManager: Nullable<IDisplayManager>, globalState: GlobalState, isInput: boolean, framePortId: number, parentFrameId: number): FrameNodePort;
    }
}
declare module "babylonjs-node-editor/diagram/graphFrame" {
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { GraphCanvasComponent } from "babylonjs-node-editor/diagram/graphCanvas";
    import { Nullable } from 'babylonjs/types';
    import { Observable } from 'babylonjs/Misc/observable';
    import { IFrameData } from "babylonjs-node-editor/nodeLocationInfo";
    import { Color3 } from 'babylonjs/Maths/math.color';
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    export enum FramePortPosition {
        Top = 0,
        Middle = 1,
        Bottom = 2
    }
    export class GraphFrame {
        private readonly CollapsedWidth;
        private static _FrameCounter;
        private static _FramePortCounter;
        private _name;
        private _color;
        private _x;
        private _y;
        private _gridAlignedX;
        private _gridAlignedY;
        private _width;
        private _height;
        element: HTMLDivElement;
        private _borderElement;
        private _headerElement;
        private _headerTextElement;
        private _headerCollapseElement;
        private _headerCloseElement;
        private _commentsElement;
        private _portContainer;
        private _outputPortContainer;
        private _inputPortContainer;
        private _nodes;
        private _ownerCanvas;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _onSelectionChangedObserver;
        private _onGraphNodeRemovalObserver;
        private _onExposePortOnFrameObserver;
        private _onNodeLinkDisposedObservers;
        private _isCollapsed;
        private _frameInPorts;
        private _frameOutPorts;
        private _controlledPorts;
        private _id;
        private _comments;
        private _frameIsResizing;
        private _resizingDirection;
        private _minFrameHeight;
        private _minFrameWidth;
        private mouseXLimit;
        onExpandStateChanged: Observable<GraphFrame>;
        private readonly CloseSVG;
        private readonly ExpandSVG;
        private readonly CollapseSVG;
        get id(): number;
        get isCollapsed(): boolean;
        private _createInputPort;
        private _markFramePortPositions;
        private _createFramePorts;
        private _redrawFramePorts;
        set isCollapsed(value: boolean);
        get nodes(): GraphNode[];
        get ports(): FrameNodePort[];
        get name(): string;
        set name(value: string);
        get color(): Color3;
        set color(value: Color3);
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get width(): number;
        set width(value: number);
        get height(): number;
        set height(value: number);
        get comments(): string;
        set comments(comments: string);
        constructor(candidate: Nullable<HTMLDivElement>, canvas: GraphCanvasComponent, doNotCaptureNodes?: boolean);
        refresh(): void;
        addNode(node: GraphNode): void;
        removeNode(node: GraphNode): void;
        syncNode(node: GraphNode): void;
        cleanAccumulation(): void;
        private _onDown;
        move(newX: number, newY: number, align?: boolean): void;
        private _onUp;
        private _moveFrame;
        private _onMove;
        moveFramePortUp(nodePort: FrameNodePort): void;
        private _movePortUp;
        moveFramePortDown(nodePort: FrameNodePort): void;
        private _movePortDown;
        private initResizing;
        private cleanUpResizing;
        private updateMinHeightWithComments;
        private _isResizingTop;
        private _isResizingRight;
        private _isResizingBottom;
        private _isResizingLeft;
        private _onRightHandlePointerDown;
        private _onRightHandlePointerMove;
        private _moveRightHandle;
        private _onRightHandlePointerUp;
        private _onBottomHandlePointerDown;
        private _onBottomHandlePointerMove;
        private _moveBottomHandle;
        private _onBottomHandlePointerUp;
        private _onLeftHandlePointerDown;
        private _onLeftHandlePointerMove;
        private _moveLeftHandle;
        private _onLeftHandlePointerUp;
        private _onTopHandlePointerDown;
        private _onTopHandlePointerMove;
        private _moveTopHandle;
        private _onTopHandlePointerUp;
        private _onTopRightHandlePointerDown;
        private _onTopRightHandlePointerMove;
        private _moveTopRightHandle;
        private _onTopRightHandlePointerUp;
        private _onBottomRightHandlePointerDown;
        private _onBottomRightHandlePointerMove;
        private _moveBottomRightHandle;
        private _onBottomRightHandlePointerUp;
        private _onBottomLeftHandlePointerDown;
        private _onBottomLeftHandlePointerMove;
        private _moveBottomLeftHandle;
        private _onBottomLeftHandlePointerUp;
        private _onTopLeftHandlePointerDown;
        private _onTopLeftHandlePointerMove;
        private _moveTopLeftHandle;
        private _onTopLeftHandlePointerUp;
        private _expandLeft;
        private _expandTop;
        private _expandRight;
        private _expandBottom;
        dispose(): void;
        serialize(): IFrameData;
        export(): void;
        static Parse(serializationData: IFrameData, canvas: GraphCanvasComponent, map?: {
            [key: number]: number;
        }): GraphFrame;
    }
}
declare module "babylonjs-node-editor/diagram/nodePort" {
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { Observer } from 'babylonjs/Misc/observable';
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { NodeLink } from "babylonjs-node-editor/diagram/nodeLink";
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    import { FramePortData } from "babylonjs-node-editor/diagram/graphCanvas";
    export class NodePort {
        connectionPoint: NodeMaterialConnectionPoint;
        node: GraphNode;
        protected _element: HTMLDivElement;
        protected _img: HTMLImageElement;
        protected _globalState: GlobalState;
        protected _portLabelElement: Element;
        protected _onCandidateLinkMovedObserver: Nullable<Observer<Nullable<Vector2>>>;
        protected _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphFrame | GraphNode | NodeLink | NodePort | FramePortData>>>;
        protected _exposedOnFrame: boolean;
        delegatedPort: Nullable<FrameNodePort>;
        get element(): HTMLDivElement;
        get portName(): string;
        set portName(newName: string);
        get disabled(): boolean;
        hasLabel(): boolean;
        get exposedOnFrame(): boolean;
        set exposedOnFrame(value: boolean);
        private _isConnectedToNodeOutsideOfFrame;
        refresh(): void;
        constructor(portContainer: HTMLElement, connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, globalState: GlobalState);
        dispose(): void;
        static CreatePortElement(connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, displayManager: Nullable<IDisplayManager>, globalState: GlobalState): NodePort;
    }
}
declare module "babylonjs-node-editor/diagram/nodeLink" {
    import { GraphCanvasComponent } from "babylonjs-node-editor/diagram/graphCanvas";
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    import { Observable } from 'babylonjs/Misc/observable';
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    export class NodeLink {
        private _graphCanvas;
        private _portA;
        private _portB?;
        private _nodeA;
        private _nodeB?;
        private _path;
        private _selectionPath;
        private _onSelectionChangedObserver;
        private _isVisible;
        onDisposedObservable: Observable<NodeLink>;
        get isVisible(): boolean;
        set isVisible(value: boolean);
        get portA(): FrameNodePort | NodePort;
        get portB(): FrameNodePort | NodePort | undefined;
        get nodeA(): GraphNode;
        get nodeB(): GraphNode | undefined;
        update(endX?: number, endY?: number, straight?: boolean): void;
        constructor(graphCanvas: GraphCanvasComponent, portA: NodePort, nodeA: GraphNode, portB?: NodePort, nodeB?: GraphNode);
        onClick(): void;
        dispose(notify?: boolean): void;
    }
}
declare module "babylonjs-node-editor/diagram/graphCanvas" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { Nullable } from 'babylonjs/types';
    import { NodeLink } from "babylonjs-node-editor/diagram/nodeLink";
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    import { IEditorData, IFrameData } from "babylonjs-node-editor/nodeLocationInfo";
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    export interface IGraphCanvasComponentProps {
        globalState: GlobalState;
    }
    export type FramePortData = {
        frame: GraphFrame;
        port: FrameNodePort;
    };
    export const isFramePortData: (variableToCheck: any) => variableToCheck is FramePortData;
    export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> {
        private readonly MinZoom;
        private readonly MaxZoom;
        private _hostCanvas;
        private _graphCanvas;
        private _selectionContainer;
        private _frameContainer;
        private _svgCanvas;
        private _rootContainer;
        private _nodes;
        private _links;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _dropPointX;
        private _dropPointY;
        private _selectionStartX;
        private _selectionStartY;
        private _candidateLinkedHasMoved;
        private _x;
        private _y;
        private _zoom;
        private _selectedNodes;
        private _selectedLink;
        private _selectedPort;
        private _candidateLink;
        private _candidatePort;
        private _gridSize;
        private _selectionBox;
        private _selectedFrame;
        private _frameCandidate;
        private _frames;
        private _altKeyIsPressed;
        private _ctrlKeyIsPressed;
        private _oldY;
        _frameIsMoving: boolean;
        _isLoading: boolean;
        get gridSize(): number;
        set gridSize(value: number);
        get globalState(): GlobalState;
        get nodes(): GraphNode[];
        get links(): NodeLink[];
        get frames(): GraphFrame[];
        get zoom(): number;
        set zoom(value: number);
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get selectedNodes(): GraphNode[];
        get selectedLink(): Nullable<NodeLink>;
        get selectedFrame(): Nullable<GraphFrame>;
        get selectedPort(): Nullable<NodePort>;
        get canvasContainer(): HTMLDivElement;
        get hostCanvas(): HTMLDivElement;
        get svgCanvas(): HTMLElement;
        get selectionContainer(): HTMLDivElement;
        get frameContainer(): HTMLDivElement;
        constructor(props: IGraphCanvasComponentProps);
        getGridPosition(position: number, useCeil?: boolean): number;
        getGridPositionCeil(position: number): number;
        updateTransform(): void;
        onKeyUp(): void;
        findNodeFromBlock(block: NodeMaterialBlock): GraphNode;
        reset(): void;
        connectPorts(pointA: NodeMaterialConnectionPoint, pointB: NodeMaterialConnectionPoint): void;
        removeLink(link: NodeLink): void;
        appendBlock(block: NodeMaterialBlock): GraphNode;
        distributeGraph(): void;
        componentDidMount(): void;
        onMove(evt: React.PointerEvent): void;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        onUp(evt: React.PointerEvent): void;
        onWheel(evt: React.WheelEvent): void;
        zoomToFit(): void;
        processCandidatePort(): void;
        processEditorData(editorData: IEditorData): void;
        addFrame(frameData: IFrameData): void;
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
declare module "babylonjs-node-editor/sharedComponents/floatLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
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
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IFloatPropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
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
declare module "babylonjs-node-editor/sharedComponents/numericInputComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
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
declare module "babylonjs-node-editor/sharedComponents/vector2LineComponent" {
    import * as React from "react";
    import { Vector2 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface IVector2LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector2) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        globalState: GlobalState;
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
declare module "babylonjs-node-editor/sharedComponents/colorPickerComponent" {
    import * as React from "react";
    import { Color4, Color3 } from 'babylonjs/Maths/math.color';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export interface IColorPickerComponentProps {
        value: Color4 | Color3;
        onColorChanged: (newOne: string) => void;
        globalState: GlobalState;
        disableAlpha?: boolean;
    }
    interface IColorPickerComponentState {
        pickerEnabled: boolean;
        color: {
            r: number;
            g: number;
            b: number;
            a?: number;
        };
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
        setPickerState(enabled: boolean): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/color3LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Color3 } from "babylonjs/Maths/math.color";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onChange?: () => void;
        globalState: GlobalState;
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
declare module "babylonjs-node-editor/sharedComponents/vector3LineComponent" {
    import * as React from "react";
    import { Vector3 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector3) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        globalState: GlobalState;
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
declare module "babylonjs-node-editor/sharedComponents/vector4LineComponent" {
    import * as React from "react";
    import { Vector4 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface IVector4LineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        value?: Vector4;
        step?: number;
        onChange?: (newvalue: Vector4) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        globalState: GlobalState;
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
        setValue(value: string | number): void;
        shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: {
            value: number;
        }): boolean;
        raiseOnPropertyChanged(newValue: number | string, previousValue: number | string): void;
        updateValue(valueString: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/matrixLineComponent" {
    import * as React from "react";
    import { Vector3, Matrix, Vector4 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface IMatrixLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newValue: Matrix) => void;
        onModeChange?: (mode: number) => void;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        mode?: number;
        globalState: GlobalState;
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
declare module "babylonjs-node-editor/diagram/properties/propertyComponentProps" {
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export interface IPropertyComponentProps {
        globalState: GlobalState;
        block: NodeMaterialBlock;
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
declare module "babylonjs-node-editor/diagram/properties/genericNodePropertyComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
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
declare module "babylonjs-node-editor/sharedComponents/color4LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Color4 } from "babylonjs/Maths/math.color";
    import { PropertyChangedEvent } from "babylonjs-node-editor/sharedComponents/propertyChangedEvent";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export interface IColor4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onChange?: () => void;
        globalState: GlobalState;
    }
    export class Color4LineComponent extends React.Component<IColor4LineComponentProps, {
        isExpanded: boolean;
        color: Color4;
    }> {
        private _localChange;
        constructor(props: IColor4LineComponentProps);
        shouldComponentUpdate(nextProps: IColor4LineComponentProps, nextState: {
            color: Color4;
        }): boolean;
        onChange(newValue: string): void;
        switchExpandState(): void;
        raiseOnPropertyChanged(previousValue: Color4): void;
        updateStateR(value: number): void;
        updateStateG(value: number): void;
        updateStateB(value: number): void;
        updateStateA(value: number): void;
        copyToClipboard(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/properties/color4PropertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface IColor4PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: InputBlock;
    }
    export class Color4PropertyTabComponent extends React.Component<IColor4PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/inputNodePropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        private onValueChangedObserver;
        constructor(props: IPropertyComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        renderValue(globalState: GlobalState): JSX.Element | null;
        setDefaultValue(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/transformNodePropertyComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class TransformPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/gradientStepComponent" {
    import * as React from 'react';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    interface IGradientStepComponentProps {
        globalState: GlobalState;
        step: GradientBlockColorStep;
        lineIndex: number;
        onDelete: () => void;
        onUpdateStep: () => void;
        onCheckForReOrder: () => void;
    }
    export class GradientStepComponent extends React.Component<IGradientStepComponentProps, {
        gradient: number;
    }> {
        constructor(props: IGradientStepComponentProps);
        updateColor(color: string): void;
        updateStep(gradient: number): void;
        onPointerUp(): void;
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
declare module "babylonjs-node-editor/diagram/properties/gradientNodePropertyComponent" {
    import * as React from "react";
    import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        private onValueChangedObserver;
        constructor(props: IPropertyComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        forceRebuild(): void;
        deleteStep(step: GradientBlockColorStep): void;
        addNewStep(): void;
        checkForReOrder(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/lightPropertyTabComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class LightPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/lightInformationPropertyTabComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class LightInformationPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/fileButtonLineComponent" {
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
declare module "babylonjs-node-editor/diagram/properties/texturePropertyTabComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
    import { ReflectionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/reflectionBlock';
    import { RefractionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/refractionBlock';
    import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
    import { CurrentScreenBlock } from 'babylonjs/Materials/Node/Blocks/Dual/currentScreenBlock';
    import { ParticleTextureBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleTextureBlock';
    type ReflectionTexture = ReflectionTextureBlock | ReflectionBlock | RefractionBlock;
    type AnyTexture = TextureBlock | ReflectionTexture | CurrentScreenBlock | ParticleTextureBlock;
    export class TexturePropertyTabComponent extends React.Component<IPropertyComponentProps, {
        isEmbedded: boolean;
        loadAsCubeTexture: boolean;
    }> {
        get textureBlock(): AnyTexture;
        constructor(props: IPropertyComponentProps);
        UNSAFE_componentWillUpdate(nextProps: IPropertyComponentProps, nextState: {
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
declare module "babylonjs-node-editor/diagram/properties/trigonometryNodePropertyComponent" {
    import * as React from "react";
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class TrigonometryPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/propertyLedger" {
    import { ComponentClass } from 'react';
    import { IPropertyComponentProps } from "babylonjs-node-editor/diagram/properties/propertyComponentProps";
    export class PropertyLedger {
        static RegisteredControls: {
            [key: string]: ComponentClass<IPropertyComponentProps>;
        };
    }
}
declare module "babylonjs-node-editor/diagram/display/inputDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class InputDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): "" | "constant" | "inspector";
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/display/outputDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class OutputDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/display/clampDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class ClampDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/display/gradientDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class GradientDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/display/remapDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class RemapDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        private _extractInputValue;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/display/trigonometryDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class TrigonometryDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
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
    export interface ITextureLineComponentState {
        displayRed: boolean;
        displayGreen: boolean;
        displayBlue: boolean;
        displayAlpha: boolean;
        face: number;
    }
    export class TextureLineComponent extends React.Component<ITextureLineComponentProps, ITextureLineComponentState> {
        private canvasRef;
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
        static UpdatePreview(previewCanvas: HTMLCanvasElement, texture: BaseTexture, width: number, options: ITextureLineComponentState, onReady?: () => void, globalState?: any): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/display/textureDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class TextureDisplayManager implements IDisplayManager {
        private _previewCanvas;
        private _previewImage;
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/display/discardDisplayManager" {
    import { IDisplayManager } from "babylonjs-node-editor/diagram/display/displayManager";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export class DiscardDisplayManager implements IDisplayManager {
        getHeaderClass(block: NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
        getHeaderText(block: NodeMaterialBlock): string;
        getBackgroundColor(block: NodeMaterialBlock): string;
        updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module "babylonjs-node-editor/diagram/displayLedger" {
    export class DisplayLedger {
        static RegisteredControls: {
            [key: string]: any;
        };
    }
}
declare module "babylonjs-node-editor/diagram/graphNode" {
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
    import { GraphCanvasComponent } from "babylonjs-node-editor/diagram/graphCanvas";
    import { NodeLink } from "babylonjs-node-editor/diagram/nodeLink";
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    export class GraphNode {
        block: NodeMaterialBlock;
        private _visual;
        private _header;
        private _connections;
        private _inputsContainer;
        private _outputsContainer;
        private _content;
        private _comments;
        private _inputPorts;
        private _outputPorts;
        private _links;
        private _x;
        private _y;
        private _gridAlignedX;
        private _gridAlignedY;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _globalState;
        private _onSelectionChangedObserver;
        private _onSelectionBoxMovedObserver;
        private _onFrameCreatedObserver;
        private _onUpdateRequiredObserver;
        private _ownerCanvas;
        private _isSelected;
        private _displayManager;
        private _isVisible;
        private _enclosingFrameId;
        get isVisible(): boolean;
        set isVisible(value: boolean);
        private _upateNodePortNames;
        get outputPorts(): NodePort[];
        get inputPorts(): NodePort[];
        get links(): NodeLink[];
        get gridAlignedX(): number;
        get gridAlignedY(): number;
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get width(): number;
        get height(): number;
        get id(): number;
        get name(): string;
        get isSelected(): boolean;
        get enclosingFrameId(): number;
        set enclosingFrameId(value: number);
        set isSelected(value: boolean);
        constructor(block: NodeMaterialBlock, globalState: GlobalState);
        isOverlappingFrame(frame: GraphFrame): boolean;
        getPortForConnectionPoint(point: NodeMaterialConnectionPoint): Nullable<NodePort>;
        getLinksForConnectionPoint(point: NodeMaterialConnectionPoint): NodeLink[];
        private _refreshFrames;
        _refreshLinks(): void;
        refresh(): void;
        private _onDown;
        cleanAccumulation(useCeil?: boolean): void;
        private _onUp;
        private _onMove;
        renderProperties(): Nullable<JSX.Element>;
        appendVisual(root: HTMLDivElement, owner: GraphCanvasComponent): void;
        dispose(): void;
    }
}
declare module "babylonjs-node-editor/globalState" {
    import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
    import { Nullable } from "babylonjs/types";
    import { Observable } from 'babylonjs/Misc/observable';
    import { LogEntry } from "babylonjs-node-editor/components/log/logComponent";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { PreviewType } from "babylonjs-node-editor/components/preview/previewType";
    import { Color4 } from 'babylonjs/Maths/math.color';
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    import { NodeLink } from "babylonjs-node-editor/diagram/nodeLink";
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    import { FramePortData } from "babylonjs-node-editor/diagram/graphCanvas";
    import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';
    export class GlobalState {
        nodeMaterial: NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        onSelectionChangedObservable: Observable<Nullable<GraphFrame | GraphNode | NodePort | NodeLink | FramePortData>>;
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
        onFrameCreatedObservable: Observable<GraphFrame>;
        onCandidatePortSelectedObservable: Observable<Nullable<FrameNodePort | NodePort>>;
        onImportFrameObservable: Observable<any>;
        onGraphNodeRemovalObservable: Observable<GraphNode>;
        onGetNodeFromBlock: (block: NodeMaterialBlock) => GraphNode;
        onGridSizeChanged: Observable<void>;
        onExposePortOnFrameObservable: Observable<GraphNode>;
        previewType: PreviewType;
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
        storeEditorData: (serializationObject: any, frame?: Nullable<GraphFrame>) => void;
        _mode: NodeMaterialModes;
        /** Gets the mode */
        get mode(): NodeMaterialModes;
        /** Sets the mode */
        set mode(m: NodeMaterialModes);
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
    }
}
declare module "babylonjs-node-editor/sharedComponents/draggableLineComponent" {
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
declare module "babylonjs-node-editor/sharedComponents/draggableLineWithButtonComponent" {
    import * as React from "react";
    export interface IDraggableLineWithButtonComponent {
        data: string;
        tooltip: string;
        iconImage: any;
        onIconClick: (value: string) => void;
        iconTitle: string;
    }
    export class DraggableLineWithButtonComponent extends React.Component<IDraggableLineWithButtonComponent> {
        constructor(props: IDraggableLineWithButtonComponent);
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/sharedComponents/lineWithFileButtonComponent" {
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
declare module "babylonjs-node-editor/components/nodeList/nodeListComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    interface INodeListComponentProps {
        globalState: GlobalState;
    }
    export class NodeListComponent extends React.Component<INodeListComponentProps, {
        filter: string;
    }> {
        private _onResetRequiredObserver;
        private static _Tooltips;
        private _customFrameList;
        constructor(props: INodeListComponentProps);
        componentWillUnmount(): void;
        filterContent(filter: string): void;
        loadCustomFrame(file: File): void;
        removeItem(value: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/framePropertyComponent" {
    import * as React from "react";
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    export interface IFramePropertyTabComponentProps {
        globalState: GlobalState;
        frame: GraphFrame;
    }
    export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
        private onFrameExpandStateChangedObserver;
        constructor(props: IFramePropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/frameNodePortPropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    export interface IFrameNodePortPropertyTabComponentProps {
        globalState: GlobalState;
        frameNodePort: FrameNodePort;
        frame: GraphFrame;
    }
    export class FrameNodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps, {
        port: FrameNodePort;
    }> {
        private _onFramePortPositionChangedObserver;
        private _onSelectionChangedObserver;
        constructor(props: IFrameNodePortPropertyTabComponentProps);
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/diagram/properties/nodePortPropertyComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    export interface IFrameNodePortPropertyTabComponentProps {
        globalState: GlobalState;
        nodePort: NodePort;
    }
    export class NodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps> {
        private _onSelectionChangedObserver;
        constructor(props: IFrameNodePortPropertyTabComponentProps);
        componentWillUnmount(): void;
        toggleExposeOnFrame(value: boolean): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/components/propertyTab/propertyTabComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { Nullable } from 'babylonjs/types';
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { GraphFrame } from "babylonjs-node-editor/diagram/graphFrame";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    import { FrameNodePort } from "babylonjs-node-editor/diagram/frameNodePort";
    import { NodePort } from "babylonjs-node-editor/diagram/nodePort";
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    interface IPropertyTabComponentState {
        currentNode: Nullable<GraphNode>;
        currentFrame: Nullable<GraphFrame>;
        currentFrameNodePort: Nullable<FrameNodePort>;
        currentNodePort: Nullable<NodePort>;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
        private _onBuiltObserver;
        private _modeSelect;
        constructor(props: IPropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        processInputBlockUpdate(ib: InputBlock): void;
        renderInputBlock(block: InputBlock): JSX.Element | null;
        load(file: File): void;
        loadFrame(file: File): void;
        save(): void;
        customSave(): void;
        saveToSnippetServer(): void;
        loadFromSnippet(): void;
        changeMode(value: any, force?: boolean, loadDefault?: boolean): boolean;
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
        private _postprocess;
        private _particleSystem;
        constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState);
        private _handleAnimations;
        private _prepareLights;
        private _prepareScene;
        private _refreshPreviewMesh;
        private _loadParticleSystem;
        private _forceCompilationAsync;
        private _updatePreview;
        dispose(): void;
    }
}
declare module "babylonjs-node-editor/components/preview/previewMeshControlComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { PreviewType } from "babylonjs-node-editor/components/preview/previewType";
    interface IPreviewMeshControlComponent {
        globalState: GlobalState;
        togglePreviewAreaComponent: () => void;
    }
    export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {
        private colorInputRef;
        private filePickerRef;
        private _onResetRequiredObserver;
        constructor(props: IPreviewMeshControlComponent);
        componentWillUnmount(): void;
        changeMeshType(newOne: PreviewType): void;
        useCustomMesh(evt: any): void;
        onPopUp(): void;
        changeAnimation(): void;
        changeBackground(value: string): void;
        changeBackgroundClick(): void;
        render(): JSX.Element;
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
        private _onIsLoadingChangedObserver;
        private _onResetRequiredObserver;
        constructor(props: IPreviewAreaComponentProps);
        componentWillUnmount(): void;
        changeBackFaceCulling(value: boolean): void;
        changeDepthPrePass(value: boolean): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-node-editor/graphEditor" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-node-editor/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    import { Nullable } from 'babylonjs/types';
    import { IEditorData } from "babylonjs-node-editor/nodeLocationInfo";
    import { GraphNode } from "babylonjs-node-editor/diagram/graphNode";
    import { IInspectorOptions } from "babylonjs/Debug/debugLayer";
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    interface IGraphEditorState {
        showPreviewPopUp: boolean;
    }
    interface IInternalPreviewAreaOptions extends IInspectorOptions {
        popup: boolean;
        original: boolean;
        explorerWidth?: string;
        inspectorWidth?: string;
        embedHostWidth?: string;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
        private readonly NodeWidth;
        private _graphCanvas;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _blocks;
        private _previewManager;
        private _copiedNodes;
        private _copiedFrame;
        private _mouseLocationX;
        private _mouseLocationY;
        private _onWidgetKeyUpPointer;
        private _previewHost;
        private _popUpWindow;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(block: NodeMaterialBlock, recursion?: boolean): GraphNode;
        addValueNode(type: string): GraphNode;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        reconnectNewNodes(nodeIndex: number, newNodes: GraphNode[], sourceNodes: GraphNode[], done: boolean[]): void;
        pasteSelection(copiedNodes: GraphNode[], currentX: number, currentY: number, selectNew?: boolean): GraphNode[] | undefined;
        zoomToFit(): void;
        buildMaterial(): void;
        build(): void;
        loadGraph(): void;
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
        initiatePreviewArea: (canvas?: HTMLCanvasElement) => void;
        createPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        createPreviewMeshControlHost: (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => void;
        createPreviewHost: (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => void;
        fixPopUpStyles: (document: Document) => void;
        render(): JSX.Element;
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
        static GetBlockFromString(data: string, scene: BABYLON.Scene, nodeMaterial: BABYLON.NodeMaterial): BABYLON.DesaturateBlock | BABYLON.RefractBlock | BABYLON.ReflectBlock | BABYLON.DerivativeBlock | BABYLON.Rotate2dBlock | BABYLON.NormalBlendBlock | BABYLON.WorleyNoise3DBlock | BABYLON.SimplexPerlin3DBlock | BABYLON.BonesBlock | BABYLON.InstancesBlock | BABYLON.MorphTargetsBlock | BABYLON.DiscardBlock | BABYLON.ImageProcessingBlock | BABYLON.ColorMergerBlock | BABYLON.VectorMergerBlock | BABYLON.ColorSplitterBlock | BABYLON.VectorSplitterBlock | BABYLON.TextureBlock | BABYLON.ReflectionTextureBlock | BABYLON.LightBlock | BABYLON.FogBlock | BABYLON.VertexOutputBlock | BABYLON.FragmentOutputBlock | BABYLON.AddBlock | BABYLON.ClampBlock | BABYLON.ScaleBlock | BABYLON.CrossBlock | BABYLON.DotBlock | BABYLON.PowBlock | BABYLON.MultiplyBlock | BABYLON.TransformBlock | BABYLON.TrigonometryBlock | BABYLON.RemapBlock | BABYLON.NormalizeBlock | BABYLON.FresnelBlock | BABYLON.LerpBlock | BABYLON.NLerpBlock | BABYLON.DivideBlock | BABYLON.SubtractBlock | BABYLON.ModBlock | BABYLON.StepBlock | BABYLON.SmoothStepBlock | BABYLON.OneMinusBlock | BABYLON.ReciprocalBlock | BABYLON.ViewDirectionBlock | BABYLON.LightInformationBlock | BABYLON.MaxBlock | BABYLON.MinBlock | BABYLON.LengthBlock | BABYLON.DistanceBlock | BABYLON.NegateBlock | BABYLON.PerturbNormalBlock | BABYLON.RandomNumberBlock | BABYLON.ReplaceColorBlock | BABYLON.PosterizeBlock | BABYLON.ArcTan2Block | BABYLON.GradientBlock | BABYLON.FrontFacingBlock | BABYLON.WaveBlock | BABYLON.InputBlock | BABYLON.PBRMetallicRoughnessBlock | BABYLON.SheenBlock | BABYLON.AmbientOcclusionBlock | BABYLON.ReflectivityBlock | BABYLON.AnisotropyBlock | BABYLON.ReflectionBlock | BABYLON.ClearCoatBlock | BABYLON.RefractionBlock | BABYLON.SubSurfaceBlock | BABYLON.CurrentScreenBlock | BABYLON.ParticleTextureBlock | BABYLON.ParticleRampGradientBlock | BABYLON.ParticleBlendMultiplyBlock | BABYLON.FragCoordBlock | BABYLON.ScreenSizeBlock | null;
        static GetColorFromConnectionNodeType(type: BABYLON.NodeMaterialBlockConnectionPointTypes): string;
        static GetConnectionNodeTypeFromString(type: string): BABYLON.NodeMaterialBlockConnectionPointTypes.Float | BABYLON.NodeMaterialBlockConnectionPointTypes.Vector2 | BABYLON.NodeMaterialBlockConnectionPointTypes.Vector3 | BABYLON.NodeMaterialBlockConnectionPointTypes.Vector4 | BABYLON.NodeMaterialBlockConnectionPointTypes.Color3 | BABYLON.NodeMaterialBlockConnectionPointTypes.Color4 | BABYLON.NodeMaterialBlockConnectionPointTypes.Matrix | BABYLON.NodeMaterialBlockConnectionPointTypes.AutoDetect;
        static GetStringFromConnectionNodeType(type: BABYLON.NodeMaterialBlockConnectionPointTypes): "Float" | "Vector2" | "Vector3" | "Vector4" | "Matrix" | "Color3" | "Color4" | "";
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
    export enum PreviewType {
        Sphere = 0,
        Box = 1,
        Torus = 2,
        Cylinder = 3,
        Plane = 4,
        ShaderBall = 5,
        DefaultParticleSystem = 6,
        Bubbles = 7,
        Smoke = 8,
        Rain = 9,
        Explosion = 10,
        Fire = 11,
        Custom = 12
    }
}
declare module NODEEDITOR {
    export interface IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
    }
}
declare module NODEEDITOR {
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
declare module NODEEDITOR {
    export class SerializationTools {
        static UpdateLocations(material: BABYLON.NodeMaterial, globalState: GlobalState, frame?: BABYLON.Nullable<GraphFrame>): void;
        static Serialize(material: BABYLON.NodeMaterial, globalState: GlobalState, frame?: BABYLON.Nullable<GraphFrame>): string;
        static Deserialize(serializationObject: any, globalState: GlobalState): void;
        static AddFrameToMaterial(serializationObject: any, globalState: GlobalState, currentMaterial: BABYLON.NodeMaterial): void;
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
    export class FrameNodePort extends NodePort {
        connectionPoint: BABYLON.NodeMaterialConnectionPoint;
        node: GraphNode;
        private _parentFrameId;
        private _isInput;
        private _framePortPosition;
        private _framePortId;
        private _onFramePortPositionChangedObservable;
        get parentFrameId(): number;
        get onFramePortPositionChangedObservable(): BABYLON.Observable<FrameNodePort>;
        get isInput(): boolean;
        get framePortId(): number;
        get framePortPosition(): FramePortPosition;
        set framePortPosition(position: FramePortPosition);
        constructor(portContainer: HTMLElement, connectionPoint: BABYLON.NodeMaterialConnectionPoint, node: GraphNode, globalState: GlobalState, isInput: boolean, framePortId: number, parentFrameId: number);
        static CreateFrameNodePortElement(connectionPoint: BABYLON.NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, displayManager: BABYLON.Nullable<IDisplayManager>, globalState: GlobalState, isInput: boolean, framePortId: number, parentFrameId: number): FrameNodePort;
    }
}
declare module NODEEDITOR {
    export enum FramePortPosition {
        Top = 0,
        Middle = 1,
        Bottom = 2
    }
    export class GraphFrame {
        private readonly CollapsedWidth;
        private static _FrameCounter;
        private static _FramePortCounter;
        private _name;
        private _color;
        private _x;
        private _y;
        private _gridAlignedX;
        private _gridAlignedY;
        private _width;
        private _height;
        element: HTMLDivElement;
        private _borderElement;
        private _headerElement;
        private _headerTextElement;
        private _headerCollapseElement;
        private _headerCloseElement;
        private _commentsElement;
        private _portContainer;
        private _outputPortContainer;
        private _inputPortContainer;
        private _nodes;
        private _ownerCanvas;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _onSelectionChangedObserver;
        private _onGraphNodeRemovalObserver;
        private _onExposePortOnFrameObserver;
        private _onNodeLinkDisposedObservers;
        private _isCollapsed;
        private _frameInPorts;
        private _frameOutPorts;
        private _controlledPorts;
        private _id;
        private _comments;
        private _frameIsResizing;
        private _resizingDirection;
        private _minFrameHeight;
        private _minFrameWidth;
        private mouseXLimit;
        onExpandStateChanged: BABYLON.Observable<GraphFrame>;
        private readonly CloseSVG;
        private readonly ExpandSVG;
        private readonly CollapseSVG;
        get id(): number;
        get isCollapsed(): boolean;
        private _createInputPort;
        private _markFramePortPositions;
        private _createFramePorts;
        private _redrawFramePorts;
        set isCollapsed(value: boolean);
        get nodes(): GraphNode[];
        get ports(): FrameNodePort[];
        get name(): string;
        set name(value: string);
        get color(): BABYLON.Color3;
        set color(value: BABYLON.Color3);
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get width(): number;
        set width(value: number);
        get height(): number;
        set height(value: number);
        get comments(): string;
        set comments(comments: string);
        constructor(candidate: BABYLON.Nullable<HTMLDivElement>, canvas: GraphCanvasComponent, doNotCaptureNodes?: boolean);
        refresh(): void;
        addNode(node: GraphNode): void;
        removeNode(node: GraphNode): void;
        syncNode(node: GraphNode): void;
        cleanAccumulation(): void;
        private _onDown;
        move(newX: number, newY: number, align?: boolean): void;
        private _onUp;
        private _moveFrame;
        private _onMove;
        moveFramePortUp(nodePort: FrameNodePort): void;
        private _movePortUp;
        moveFramePortDown(nodePort: FrameNodePort): void;
        private _movePortDown;
        private initResizing;
        private cleanUpResizing;
        private updateMinHeightWithComments;
        private _isResizingTop;
        private _isResizingRight;
        private _isResizingBottom;
        private _isResizingLeft;
        private _onRightHandlePointerDown;
        private _onRightHandlePointerMove;
        private _moveRightHandle;
        private _onRightHandlePointerUp;
        private _onBottomHandlePointerDown;
        private _onBottomHandlePointerMove;
        private _moveBottomHandle;
        private _onBottomHandlePointerUp;
        private _onLeftHandlePointerDown;
        private _onLeftHandlePointerMove;
        private _moveLeftHandle;
        private _onLeftHandlePointerUp;
        private _onTopHandlePointerDown;
        private _onTopHandlePointerMove;
        private _moveTopHandle;
        private _onTopHandlePointerUp;
        private _onTopRightHandlePointerDown;
        private _onTopRightHandlePointerMove;
        private _moveTopRightHandle;
        private _onTopRightHandlePointerUp;
        private _onBottomRightHandlePointerDown;
        private _onBottomRightHandlePointerMove;
        private _moveBottomRightHandle;
        private _onBottomRightHandlePointerUp;
        private _onBottomLeftHandlePointerDown;
        private _onBottomLeftHandlePointerMove;
        private _moveBottomLeftHandle;
        private _onBottomLeftHandlePointerUp;
        private _onTopLeftHandlePointerDown;
        private _onTopLeftHandlePointerMove;
        private _moveTopLeftHandle;
        private _onTopLeftHandlePointerUp;
        private _expandLeft;
        private _expandTop;
        private _expandRight;
        private _expandBottom;
        dispose(): void;
        serialize(): IFrameData;
        export(): void;
        static Parse(serializationData: IFrameData, canvas: GraphCanvasComponent, map?: {
            [key: number]: number;
        }): GraphFrame;
    }
}
declare module NODEEDITOR {
    export class NodePort {
        connectionPoint: BABYLON.NodeMaterialConnectionPoint;
        node: GraphNode;
        protected _element: HTMLDivElement;
        protected _img: HTMLImageElement;
        protected _globalState: GlobalState;
        protected _portLabelElement: Element;
        protected _onCandidateLinkMovedObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.Nullable<BABYLON.Vector2>>>;
        protected _onSelectionChangedObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.Nullable<GraphFrame | GraphNode | NodeLink | NodePort | FramePortData>>>;
        protected _exposedOnFrame: boolean;
        delegatedPort: BABYLON.Nullable<FrameNodePort>;
        get element(): HTMLDivElement;
        get portName(): string;
        set portName(newName: string);
        get disabled(): boolean;
        hasLabel(): boolean;
        get exposedOnFrame(): boolean;
        set exposedOnFrame(value: boolean);
        private _isConnectedToNodeOutsideOfFrame;
        refresh(): void;
        constructor(portContainer: HTMLElement, connectionPoint: BABYLON.NodeMaterialConnectionPoint, node: GraphNode, globalState: GlobalState);
        dispose(): void;
        static CreatePortElement(connectionPoint: BABYLON.NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, displayManager: BABYLON.Nullable<IDisplayManager>, globalState: GlobalState): NodePort;
    }
}
declare module NODEEDITOR {
    export class NodeLink {
        private _graphCanvas;
        private _portA;
        private _portB?;
        private _nodeA;
        private _nodeB?;
        private _path;
        private _selectionPath;
        private _onSelectionChangedObserver;
        private _isVisible;
        onDisposedObservable: BABYLON.Observable<NodeLink>;
        get isVisible(): boolean;
        set isVisible(value: boolean);
        get portA(): FrameNodePort | NodePort;
        get portB(): FrameNodePort | NodePort | undefined;
        get nodeA(): GraphNode;
        get nodeB(): GraphNode | undefined;
        update(endX?: number, endY?: number, straight?: boolean): void;
        constructor(graphCanvas: GraphCanvasComponent, portA: NodePort, nodeA: GraphNode, portB?: NodePort, nodeB?: GraphNode);
        onClick(): void;
        dispose(notify?: boolean): void;
    }
}
declare module NODEEDITOR {
    export interface IGraphCanvasComponentProps {
        globalState: GlobalState;
    }
    export type FramePortData = {
        frame: GraphFrame;
        port: FrameNodePort;
    };
    export const isFramePortData: (variableToCheck: any) => variableToCheck is FramePortData;
    export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> {
        private readonly MinZoom;
        private readonly MaxZoom;
        private _hostCanvas;
        private _graphCanvas;
        private _selectionContainer;
        private _frameContainer;
        private _svgCanvas;
        private _rootContainer;
        private _nodes;
        private _links;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _dropPointX;
        private _dropPointY;
        private _selectionStartX;
        private _selectionStartY;
        private _candidateLinkedHasMoved;
        private _x;
        private _y;
        private _zoom;
        private _selectedNodes;
        private _selectedLink;
        private _selectedPort;
        private _candidateLink;
        private _candidatePort;
        private _gridSize;
        private _selectionBox;
        private _selectedFrame;
        private _frameCandidate;
        private _frames;
        private _altKeyIsPressed;
        private _ctrlKeyIsPressed;
        private _oldY;
        _frameIsMoving: boolean;
        _isLoading: boolean;
        get gridSize(): number;
        set gridSize(value: number);
        get globalState(): GlobalState;
        get nodes(): GraphNode[];
        get links(): NodeLink[];
        get frames(): GraphFrame[];
        get zoom(): number;
        set zoom(value: number);
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get selectedNodes(): GraphNode[];
        get selectedLink(): BABYLON.Nullable<NodeLink>;
        get selectedFrame(): BABYLON.Nullable<GraphFrame>;
        get selectedPort(): BABYLON.Nullable<NodePort>;
        get canvasContainer(): HTMLDivElement;
        get hostCanvas(): HTMLDivElement;
        get svgCanvas(): HTMLElement;
        get selectionContainer(): HTMLDivElement;
        get frameContainer(): HTMLDivElement;
        constructor(props: IGraphCanvasComponentProps);
        getGridPosition(position: number, useCeil?: boolean): number;
        getGridPositionCeil(position: number): number;
        updateTransform(): void;
        onKeyUp(): void;
        findNodeFromBlock(block: BABYLON.NodeMaterialBlock): GraphNode;
        reset(): void;
        connectPorts(pointA: BABYLON.NodeMaterialConnectionPoint, pointB: BABYLON.NodeMaterialConnectionPoint): void;
        removeLink(link: NodeLink): void;
        appendBlock(block: BABYLON.NodeMaterialBlock): GraphNode;
        distributeGraph(): void;
        componentDidMount(): void;
        onMove(evt: React.PointerEvent): void;
        onDown(evt: React.PointerEvent<HTMLElement>): void;
        onUp(evt: React.PointerEvent): void;
        onWheel(evt: React.WheelEvent): void;
        zoomToFit(): void;
        processCandidatePort(): void;
        processEditorData(editorData: IEditorData): void;
        addFrame(frameData: IFrameData): void;
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
        inputBlock: BABYLON.InputBlock;
    }
    export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
        render(): JSX.Element;
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
declare module NODEEDITOR {
    interface IVector2LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector2) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        globalState: GlobalState;
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
    export interface IColorPickerComponentProps {
        value: BABYLON.Color4 | BABYLON.Color3;
        onColorChanged: (newOne: string) => void;
        globalState: GlobalState;
        disableAlpha?: boolean;
    }
    interface IColorPickerComponentState {
        pickerEnabled: boolean;
        color: {
            r: number;
            g: number;
            b: number;
            a?: number;
        };
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
        setPickerState(enabled: boolean): void;
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
        globalState: GlobalState;
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
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector3) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        globalState: GlobalState;
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
    interface IVector4LineComponentProps {
        label: string;
        target?: any;
        propertyName?: string;
        value?: BABYLON.Vector4;
        step?: number;
        onChange?: (newvalue: BABYLON.Vector4) => void;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        globalState: GlobalState;
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
        setValue(value: string | number): void;
        shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: {
            value: number;
        }): boolean;
        raiseOnPropertyChanged(newValue: number | string, previousValue: number | string): void;
        updateValue(valueString: string): void;
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
        globalState: GlobalState;
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
    export interface IPropertyComponentProps {
        globalState: GlobalState;
        block: BABYLON.NodeMaterialBlock;
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
declare module NODEEDITOR {
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
declare module NODEEDITOR {
    export interface IColor4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onChange?: () => void;
        globalState: GlobalState;
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
declare module NODEEDITOR {
    interface IColor4PropertyTabComponentProps {
        globalState: GlobalState;
        inputBlock: BABYLON.InputBlock;
    }
    export class Color4PropertyTabComponent extends React.Component<IColor4PropertyTabComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        private onValueChangedObserver;
        constructor(props: IPropertyComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        renderValue(globalState: GlobalState): JSX.Element | null;
        setDefaultValue(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class TransformPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
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
        onCheckForReOrder: () => void;
    }
    export class GradientStepComponent extends React.Component<IGradientStepComponentProps, {
        gradient: number;
    }> {
        constructor(props: IGradientStepComponentProps);
        updateColor(color: string): void;
        updateStep(gradient: number): void;
        onPointerUp(): void;
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
    export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        private onValueChangedObserver;
        constructor(props: IPropertyComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        forceRebuild(): void;
        deleteStep(step: BABYLON.GradientBlockColorStep): void;
        addNewStep(): void;
        checkForReOrder(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class LightPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class LightInformationPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
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
declare module NODEEDITOR {
    type ReflectionTexture = BABYLON.ReflectionTextureBlock | BABYLON.ReflectionBlock | BABYLON.RefractionBlock;
    type AnyTexture = BABYLON.TextureBlock | ReflectionTexture | BABYLON.CurrentScreenBlock | BABYLON.ParticleTextureBlock;
    export class TexturePropertyTabComponent extends React.Component<IPropertyComponentProps, {
        isEmbedded: boolean;
        loadAsCubeTexture: boolean;
    }> {
        get textureBlock(): AnyTexture;
        constructor(props: IPropertyComponentProps);
        UNSAFE_componentWillUpdate(nextProps: IPropertyComponentProps, nextState: {
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
    export class TrigonometryPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        constructor(props: IPropertyComponentProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class PropertyLedger {
        static RegisteredControls: {
            [key: string]: React.ComponentClass<IPropertyComponentProps>;
        };
    }
}
declare module NODEEDITOR {
    export class InputDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): "" | "constant" | "inspector";
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class OutputDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class ClampDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class GradientDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class RemapDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        private _extractInputValue;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class TrigonometryDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
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
    export interface ITextureLineComponentState {
        displayRed: boolean;
        displayGreen: boolean;
        displayBlue: boolean;
        displayAlpha: boolean;
        face: number;
    }
    export class TextureLineComponent extends React.Component<ITextureLineComponentProps, ITextureLineComponentState> {
        private canvasRef;
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
        static UpdatePreview(previewCanvas: HTMLCanvasElement, texture: BABYLON.BaseTexture, width: number, options: ITextureLineComponentState, onReady?: () => void, globalState?: any): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export class TextureDisplayManager implements IDisplayManager {
        private _previewCanvas;
        private _previewImage;
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class DiscardDisplayManager implements IDisplayManager {
        getHeaderClass(block: BABYLON.NodeMaterialBlock): string;
        shouldDisplayPortLabels(block: BABYLON.NodeMaterialBlock): boolean;
        getHeaderText(block: BABYLON.NodeMaterialBlock): string;
        getBackgroundColor(block: BABYLON.NodeMaterialBlock): string;
        updatePreviewContent(block: BABYLON.NodeMaterialBlock, contentArea: HTMLDivElement): void;
    }
}
declare module NODEEDITOR {
    export class DisplayLedger {
        static RegisteredControls: {
            [key: string]: any;
        };
    }
}
declare module NODEEDITOR {
    export class GraphNode {
        block: BABYLON.NodeMaterialBlock;
        private _visual;
        private _header;
        private _connections;
        private _inputsContainer;
        private _outputsContainer;
        private _content;
        private _comments;
        private _inputPorts;
        private _outputPorts;
        private _links;
        private _x;
        private _y;
        private _gridAlignedX;
        private _gridAlignedY;
        private _mouseStartPointX;
        private _mouseStartPointY;
        private _globalState;
        private _onSelectionChangedObserver;
        private _onSelectionBoxMovedObserver;
        private _onFrameCreatedObserver;
        private _onUpdateRequiredObserver;
        private _ownerCanvas;
        private _isSelected;
        private _displayManager;
        private _isVisible;
        private _enclosingFrameId;
        get isVisible(): boolean;
        set isVisible(value: boolean);
        private _upateNodePortNames;
        get outputPorts(): NodePort[];
        get inputPorts(): NodePort[];
        get links(): NodeLink[];
        get gridAlignedX(): number;
        get gridAlignedY(): number;
        get x(): number;
        set x(value: number);
        get y(): number;
        set y(value: number);
        get width(): number;
        get height(): number;
        get id(): number;
        get name(): string;
        get isSelected(): boolean;
        get enclosingFrameId(): number;
        set enclosingFrameId(value: number);
        set isSelected(value: boolean);
        constructor(block: BABYLON.NodeMaterialBlock, globalState: GlobalState);
        isOverlappingFrame(frame: GraphFrame): boolean;
        getPortForConnectionPoint(point: BABYLON.NodeMaterialConnectionPoint): BABYLON.Nullable<NodePort>;
        getLinksForConnectionPoint(point: BABYLON.NodeMaterialConnectionPoint): NodeLink[];
        private _refreshFrames;
        _refreshLinks(): void;
        refresh(): void;
        private _onDown;
        cleanAccumulation(useCeil?: boolean): void;
        private _onUp;
        private _onMove;
        renderProperties(): BABYLON.Nullable<JSX.Element>;
        appendVisual(root: HTMLDivElement, owner: GraphCanvasComponent): void;
        dispose(): void;
    }
}
declare module NODEEDITOR {
    export class GlobalState {
        nodeMaterial: BABYLON.NodeMaterial;
        hostElement: HTMLElement;
        hostDocument: HTMLDocument;
        hostWindow: Window;
        onSelectionChangedObservable: BABYLON.Observable<BABYLON.Nullable<GraphFrame | GraphNode | NodePort | NodeLink | FramePortData>>;
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
        onFrameCreatedObservable: BABYLON.Observable<GraphFrame>;
        onCandidatePortSelectedObservable: BABYLON.Observable<BABYLON.Nullable<FrameNodePort | NodePort>>;
        onImportFrameObservable: BABYLON.Observable<any>;
        onGraphNodeRemovalObservable: BABYLON.Observable<GraphNode>;
        onGetNodeFromBlock: (block: BABYLON.NodeMaterialBlock) => GraphNode;
        onGridSizeChanged: BABYLON.Observable<void>;
        onExposePortOnFrameObservable: BABYLON.Observable<GraphNode>;
        previewType: PreviewType;
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
        storeEditorData: (serializationObject: any, frame?: BABYLON.Nullable<GraphFrame>) => void;
        _mode: BABYLON.NodeMaterialModes;
        /** Gets the mode */
        get mode(): BABYLON.NodeMaterialModes;
        /** Sets the mode */
        set mode(m: BABYLON.NodeMaterialModes);
        customSave?: {
            label: string;
            action: (data: string) => Promise<void>;
        };
        constructor();
    }
}
declare module NODEEDITOR {
    export interface IButtonLineComponentProps {
        data: string;
        tooltip: string;
    }
    export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IDraggableLineWithButtonComponent {
        data: string;
        tooltip: string;
        iconImage: any;
        onIconClick: (value: string) => void;
        iconTitle: string;
    }
    export class DraggableLineWithButtonComponent extends React.Component<IDraggableLineWithButtonComponent> {
        constructor(props: IDraggableLineWithButtonComponent);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
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
declare module NODEEDITOR {
    interface INodeListComponentProps {
        globalState: GlobalState;
    }
    export class NodeListComponent extends React.Component<INodeListComponentProps, {
        filter: string;
    }> {
        private _onResetRequiredObserver;
        private static _Tooltips;
        private _customFrameList;
        constructor(props: INodeListComponentProps);
        componentWillUnmount(): void;
        filterContent(filter: string): void;
        loadCustomFrame(file: File): void;
        removeItem(value: string): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IFramePropertyTabComponentProps {
        globalState: GlobalState;
        frame: GraphFrame;
    }
    export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
        private onFrameExpandStateChangedObserver;
        constructor(props: IFramePropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IFrameNodePortPropertyTabComponentProps {
        globalState: GlobalState;
        frameNodePort: FrameNodePort;
        frame: GraphFrame;
    }
    export class FrameNodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps, {
        port: FrameNodePort;
    }> {
        private _onFramePortPositionChangedObserver;
        private _onSelectionChangedObserver;
        constructor(props: IFrameNodePortPropertyTabComponentProps);
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    export interface IFrameNodePortPropertyTabComponentProps {
        globalState: GlobalState;
        nodePort: NodePort;
    }
    export class NodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps> {
        private _onSelectionChangedObserver;
        constructor(props: IFrameNodePortPropertyTabComponentProps);
        componentWillUnmount(): void;
        toggleExposeOnFrame(value: boolean): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IPropertyTabComponentProps {
        globalState: GlobalState;
    }
    interface IPropertyTabComponentState {
        currentNode: BABYLON.Nullable<GraphNode>;
        currentFrame: BABYLON.Nullable<GraphFrame>;
        currentFrameNodePort: BABYLON.Nullable<FrameNodePort>;
        currentNodePort: BABYLON.Nullable<NodePort>;
    }
    export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
        private _onBuiltObserver;
        private _modeSelect;
        constructor(props: IPropertyTabComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        processInputBlockUpdate(ib: BABYLON.InputBlock): void;
        renderInputBlock(block: BABYLON.InputBlock): JSX.Element | null;
        load(file: File): void;
        loadFrame(file: File): void;
        save(): void;
        customSave(): void;
        saveToSnippetServer(): void;
        loadFromSnippet(): void;
        changeMode(value: any, force?: boolean, loadDefault?: boolean): boolean;
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
        private _postprocess;
        private _particleSystem;
        constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState);
        private _handleAnimations;
        private _prepareLights;
        private _prepareScene;
        private _refreshPreviewMesh;
        private _loadParticleSystem;
        private _forceCompilationAsync;
        private _updatePreview;
        dispose(): void;
    }
}
declare module NODEEDITOR {
    interface IPreviewMeshControlComponent {
        globalState: GlobalState;
        togglePreviewAreaComponent: () => void;
    }
    export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {
        private colorInputRef;
        private filePickerRef;
        private _onResetRequiredObserver;
        constructor(props: IPreviewMeshControlComponent);
        componentWillUnmount(): void;
        changeMeshType(newOne: PreviewType): void;
        useCustomMesh(evt: any): void;
        onPopUp(): void;
        changeAnimation(): void;
        changeBackground(value: string): void;
        changeBackgroundClick(): void;
        render(): JSX.Element;
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
        private _onIsLoadingChangedObserver;
        private _onResetRequiredObserver;
        constructor(props: IPreviewAreaComponentProps);
        componentWillUnmount(): void;
        changeBackFaceCulling(value: boolean): void;
        changeDepthPrePass(value: boolean): void;
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    interface IGraphEditorState {
        showPreviewPopUp: boolean;
    }
    interface IInternalPreviewAreaOptions extends BABYLON.IInspectorOptions {
        popup: boolean;
        original: boolean;
        explorerWidth?: string;
        inspectorWidth?: string;
        embedHostWidth?: string;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
        private readonly NodeWidth;
        private _graphCanvas;
        private _startX;
        private _moveInProgress;
        private _leftWidth;
        private _rightWidth;
        private _blocks;
        private _previewManager;
        private _copiedNodes;
        private _copiedFrame;
        private _mouseLocationX;
        private _mouseLocationY;
        private _onWidgetKeyUpPointer;
        private _previewHost;
        private _popUpWindow;
        /**
         * Creates a node and recursivly creates its parent nodes from it's input
         * @param nodeMaterialBlock
         */
        createNodeFromObject(block: BABYLON.NodeMaterialBlock, recursion?: boolean): GraphNode;
        addValueNode(type: string): GraphNode;
        componentDidMount(): void;
        componentWillUnmount(): void;
        constructor(props: IGraphEditorProps);
        reconnectNewNodes(nodeIndex: number, newNodes: GraphNode[], sourceNodes: GraphNode[], done: boolean[]): void;
        pasteSelection(copiedNodes: GraphNode[], currentX: number, currentY: number, selectNew?: boolean): GraphNode[] | undefined;
        zoomToFit(): void;
        buildMaterial(): void;
        build(): void;
        loadGraph(): void;
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
        initiatePreviewArea: (canvas?: HTMLCanvasElement) => void;
        createPopUp: () => void;
        createPopupWindow: (title: string, windowVariableName: string, width?: number, height?: number) => Window | null;
        copyStyles: (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => void;
        createPreviewMeshControlHost: (options: IInternalPreviewAreaOptions, parentControl: BABYLON.Nullable<HTMLElement>) => void;
        createPreviewHost: (options: IInternalPreviewAreaOptions, parentControl: BABYLON.Nullable<HTMLElement>) => void;
        fixPopUpStyles: (document: Document) => void;
        render(): JSX.Element;
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