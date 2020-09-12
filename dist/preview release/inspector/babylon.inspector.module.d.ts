/// <reference types="react" />
declare module "babylonjs-inspector/components/propertyChangedEvent" {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
        allowNullValue?: boolean;
    }
}
declare module "babylonjs-inspector/components/replayRecorder" {
    import { Scene } from 'babylonjs/scene';
    export class ReplayRecorder {
        private _sceneRecorder;
        private _isRecording;
        get isRecording(): boolean;
        cancel(): void;
        trackScene(scene: Scene): void;
        applyDelta(json: any, scene: Scene): void;
        export(): void;
    }
}
declare module "babylonjs-inspector/components/globalState" {
    import { GLTFFileLoader, IGLTFLoaderExtension } from "babylonjs-loaders/glTF/index";
    import { IGLTFValidationResults } from "babylonjs-gltf2interface";
    import { Nullable } from "babylonjs/types";
    import { Observable, Observer } from "babylonjs/Misc/observable";
    import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs/Loading/sceneLoader";
    import { Scene } from "babylonjs/scene";
    import { Light } from "babylonjs/Lights/light";
    import { Camera } from "babylonjs/Cameras/camera";
    import { LightGizmo } from "babylonjs/Gizmos/lightGizmo";
    import { CameraGizmo } from "babylonjs/Gizmos/cameraGizmo";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { ReplayRecorder } from "babylonjs-inspector/components/replayRecorder";
    export class GlobalState {
        onSelectionChangedObservable: Observable<any>;
        onPropertyChangedObservable: Observable<PropertyChangedEvent>;
        onInspectorClosedObservable: Observable<Scene>;
        onTabChangedObservable: Observable<number>;
        onSelectionRenamedObservable: Observable<void>;
        onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;
        onNewSceneObservable: Observable<Scene>;
        sceneImportDefaults: {
            [key: string]: any;
        };
        validationResults: Nullable<IGLTFValidationResults>;
        onValidationResultsUpdatedObservable: Observable<Nullable<IGLTFValidationResults>>;
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        glTFLoaderExtensionDefaults: {
            [name: string]: {
                [key: string]: any;
            };
        };
        glTFLoaderDefaults: {
            [key: string]: any;
        };
        glTFLoaderExtensions: {
            [key: string]: IGLTFLoaderExtension;
        };
        blockMutationUpdates: boolean;
        selectedLineContainerTitles: Array<string>;
        selectedLineContainerTitlesNoFocus: Array<string>;
        recorder: ReplayRecorder;
        private _onlyUseEulers;
        get onlyUseEulers(): boolean;
        set onlyUseEulers(value: boolean);
        private _ignoreBackfacesForPicking;
        get ignoreBackfacesForPicking(): boolean;
        set ignoreBackfacesForPicking(value: boolean);
        init(propertyChangedObservable: Observable<PropertyChangedEvent>): void;
        prepareGLTFPlugin(loader: GLTFFileLoader): void;
        lightGizmos: Array<LightGizmo>;
        enableLightGizmo(light: Light, enable?: boolean): void;
        cameraGizmos: Array<CameraGizmo>;
        enableCameraGizmo(camera: Camera, enable?: boolean): void;
    }
}
declare module "babylonjs-inspector/components/actionTabs/paneComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Scene } from "babylonjs/scene";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    export interface IPaneComponentProps {
        title: string;
        scene: Scene;
        selectedEntity?: any;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        globalState: GlobalState;
    }
    export class PaneComponent extends React.Component<IPaneComponentProps, {
        tag: any;
    }> {
        constructor(props: IPaneComponentProps);
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabsComponent" {
    import * as React from "react";
    import { PaneComponent } from "babylonjs-inspector/components/actionTabs/paneComponent";
    interface ITabsComponentProps {
        children: any[];
        selectedIndex: number;
        onSelectedIndexChange: (value: number) => void;
    }
    export class TabsComponent extends React.Component<ITabsComponentProps> {
        constructor(props: ITabsComponentProps);
        onSelect(index: number): void;
        renderLabel(child: PaneComponent, index: number): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/textLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/lineContainerComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ILineContainerComponentProps {
        globalState?: GlobalState;
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
        componentDidMount(): void;
        renderHeader(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/valueLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/lines/booleanLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/statisticsTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    export class StatisticsTabComponent extends PaneComponent {
        private _sceneInstrumentation;
        private _engineInstrumentation;
        private _timerIntervalId;
        constructor(props: IPaneComponentProps);
        componentWillUnmount(): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/checkBoxLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/renderGridPropertyGridComponent" {
    import * as React from "react";
    import { Scene } from "babylonjs/scene";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IRenderGridPropertyGridComponentProps {
        globalState: GlobalState;
        scene: Scene;
    }
    export class RenderGridPropertyGridComponent extends React.Component<IRenderGridPropertyGridComponentProps, {
        isEnabled: boolean;
    }> {
        private _gridMesh;
        constructor(props: IRenderGridPropertyGridComponentProps);
        componentDidMount(): void;
        addOrRemoveGrid(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/debugTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    export class DebugTabComponent extends PaneComponent {
        private _physicsViewersEnabled;
        constructor(props: IPaneComponentProps);
        switchPhysicsViewers(): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/sliderLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
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
declare module "babylonjs-inspector/components/actionTabs/lines/optionsLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    export const Null_Value: number;
    class ListLineOption {
        label: string;
        value: number;
    }
    interface IOptionsLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        options: ListLineOption[];
        noDirectUpdate?: boolean;
        onSelect?: (value: number) => void;
        extractValue?: () => number;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject" {
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
declare module "babylonjs-inspector/components/actionTabs/lines/numericInputComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/lines/colorPickerComponent" {
    import * as React from "react";
    import { Color4, Color3 } from 'babylonjs/Maths/math.color';
    export interface IColorPickerComponentProps {
        value: Color4 | Color3;
        onColorChanged: (newOne: string) => void;
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
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/color3LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Color3 } from 'babylonjs/Maths/math.color';
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        isLinear?: boolean;
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
        setPropertyValue(newColor: Color3): void;
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
declare module "babylonjs-inspector/components/actionTabs/lines/vector3LineComponent" {
    import * as React from "react";
    import { Vector3 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    interface IVector3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector3) => void;
        useEuler?: boolean;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        noSlider?: boolean;
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
declare module "babylonjs-inspector/components/actionTabs/lines/quaternionLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Quaternion, Vector3 } from "babylonjs/Maths/math.vector";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    interface IQuaternionLineComponentProps {
        label: string;
        target: any;
        useEuler?: boolean;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, {
        isExpanded: boolean;
        value: Quaternion;
        eulerValue: Vector3;
    }> {
        private _localChange;
        constructor(props: IQuaternionLineComponentProps);
        shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: {
            isExpanded: boolean;
            value: Quaternion;
            eulerValue: Vector3;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(currentValue: Quaternion, previousValue: Quaternion): void;
        updateQuaternion(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        updateStateW(value: number): void;
        updateQuaternionFromEuler(): void;
        updateStateEulerX(value: number): void;
        updateStateEulerY(value: number): void;
        updateStateEulerZ(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/textInputLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    interface ITextInputLineComponentProps {
        label: string;
        lockObject: LockObject;
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
        componentWillUnmount(): void;
        shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: {
            value: string;
        }): boolean;
        raiseOnPropertyChanged(newValue: string, previousValue: string): void;
        updateValue(value: string): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/customPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IInspectable } from 'babylonjs/Misc/iInspectable';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    interface ICustomPropertyGridComponentProps {
        globalState: GlobalState;
        target: any;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CustomPropertyGridComponent extends React.Component<ICustomPropertyGridComponentProps, {
        mode: number;
    }> {
        constructor(props: ICustomPropertyGridComponentProps);
        renderInspectable(inspectable: IInspectable): JSX.Element | null;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/buttonLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/lines/floatLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/anchorSvgPoint" {
    import * as React from 'react';
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    interface IAnchorSvgPointProps {
        control: Vector2;
        anchor: Vector2;
        active: boolean;
        type: string;
        index: string;
        selected: boolean;
        selectControlPoint: (id: string) => void;
    }
    export class AnchorSvgPoint extends React.Component<IAnchorSvgPointProps> {
        constructor(props: IAnchorSvgPointProps);
        select(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/keyframeSvgPoint" {
    import * as React from 'react';
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    export interface IKeyframeSvgPoint {
        keyframePoint: Vector2;
        rightControlPoint: Vector2 | null;
        leftControlPoint: Vector2 | null;
        id: string;
        selected: boolean;
        isLeftActive: boolean;
        isRightActive: boolean;
        curveId?: ICurveMetaData;
    }
    export interface ICurveMetaData {
        id: number;
        animationName: string;
        property: string;
    }
    interface IKeyframeSvgPointProps {
        keyframePoint: Vector2;
        leftControlPoint: Vector2 | null;
        rightControlPoint: Vector2 | null;
        id: string;
        selected: boolean;
        selectKeyframe: (id: string, multiselect: boolean) => void;
        selectedControlPoint: (type: string, id: string) => void;
        isLeftActive: boolean;
        isRightActive: boolean;
    }
    export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps> {
        constructor(props: IKeyframeSvgPointProps);
        select(e: React.MouseEvent<SVGImageElement>): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/svgDraggableArea" {
    import * as React from "react";
    import { Vector2 } from "babylonjs/Maths/math.vector";
    import { IKeyframeSvgPoint } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/keyframeSvgPoint";
    interface ISvgDraggableAreaProps {
        keyframeSvgPoints: IKeyframeSvgPoint[];
        updatePosition: (updatedKeyframe: IKeyframeSvgPoint, id: string) => void;
        scale: number;
        viewBoxScale: number;
        selectKeyframe: (id: string, multiselect: boolean) => void;
        selectedControlPoint: (type: string, id: string) => void;
        deselectKeyframes: () => void;
        removeSelectedKeyframes: (points: IKeyframeSvgPoint[]) => void;
        panningY: (panningY: number) => void;
        panningX: (panningX: number) => void;
        setCurrentFrame: (direction: number) => void;
        positionCanvas?: number;
        repositionCanvas?: boolean;
        canvasPositionEnded: () => void;
        resetActionableKeyframe: () => void;
    }
    export class SvgDraggableArea extends React.Component<ISvgDraggableAreaProps, {
        panX: number;
        panY: number;
    }> {
        private _active;
        private _isCurrentPointControl;
        private _currentPointId;
        private _draggableArea;
        private _panStart;
        private _panStop;
        private _playheadDrag;
        private _playheadSelected;
        private _movedX;
        private _movedY;
        readonly _dragBuffer: number;
        readonly _draggingMultiplier: number;
        constructor(props: ISvgDraggableAreaProps);
        componentDidMount(): void;
        componentWillReceiveProps(newProps: ISvgDraggableAreaProps): void;
        dragStart(e: React.TouchEvent<SVGSVGElement>): void;
        dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        drag(e: React.TouchEvent<SVGSVGElement>): void;
        drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
        dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        getMousePosition(e: React.TouchEvent<SVGSVGElement>): Vector2 | undefined;
        getMousePosition(e: React.MouseEvent<SVGSVGElement, MouseEvent>): Vector2 | undefined;
        panDirection(): void;
        keyDown(e: KeyboardEvent): void;
        keyUp(e: KeyboardEvent): void;
        focus(e: React.MouseEvent<SVGSVGElement>): void;
        isNotControlPointActive(): boolean;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/iconButtonLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/controls" {
    import * as React from "react";
    import { IAnimationKey } from "babylonjs/Animations/animationKey";
    interface IControlsProps {
        keyframes: IAnimationKey[] | null;
        selected: IAnimationKey | null;
        currentFrame: number;
        onCurrentFrameChange: (frame: number) => void;
        repositionCanvas: (frame: number) => void;
        playPause: (direction: number) => void;
        isPlaying: boolean;
        scrollable: React.RefObject<HTMLDivElement>;
    }
    export class Controls extends React.Component<IControlsProps, {
        selected: IAnimationKey;
        playingType: string;
    }> {
        readonly _sizeOfKeyframe: number;
        constructor(props: IControlsProps);
        playBackwards(): void;
        play(): void;
        pause(): void;
        moveToAnimationStart(): void;
        moveToAnimationEnd(): void;
        nextKeyframe(): void;
        previousKeyframe(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/timeline" {
    import * as React from "react";
    import { IAnimationKey } from "babylonjs/Animations/animationKey";
    interface ITimelineProps {
        keyframes: IAnimationKey[] | null;
        selected: IAnimationKey | null;
        currentFrame: number;
        onCurrentFrameChange: (frame: number) => void;
        onAnimationLimitChange: (limit: number) => void;
        dragKeyframe: (frame: number, index: number) => void;
        playPause: (direction: number) => void;
        isPlaying: boolean;
        animationLimit: number;
        fps: number;
        repositionCanvas: (frame: number) => void;
    }
    export class Timeline extends React.Component<ITimelineProps, {
        selected: IAnimationKey;
        activeKeyframe: number | null;
        start: number;
        end: number;
        scrollWidth: number | undefined;
        selectionLength: number[];
        limitValue: number;
    }> {
        private _scrollable;
        private _scrollbarHandle;
        private _scrollContainer;
        private _inputAnimationLimit;
        private _direction;
        private _scrolling;
        private _shiftX;
        private _active;
        readonly _marginScrollbar: number;
        constructor(props: ITimelineProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        isEnterKeyUp(event: KeyboardEvent): void;
        onInputBlur(event: React.FocusEvent<HTMLInputElement>): void;
        setControlState(): void;
        calculateScrollWidth(start: number, end: number): number | undefined;
        playBackwards(event: React.MouseEvent<HTMLDivElement>): void;
        play(event: React.MouseEvent<HTMLDivElement>): void;
        pause(event: React.MouseEvent<HTMLDivElement>): void;
        setCurrentFrame(event: React.MouseEvent<HTMLDivElement>): void;
        handleLimitChange(event: React.ChangeEvent<HTMLInputElement>): void;
        dragStart(e: React.TouchEvent<SVGSVGElement>): void;
        dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        drag(e: React.TouchEvent<SVGSVGElement>): void;
        drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        isFrameBeingUsed(frame: number, direction: number): number | false;
        dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
        dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        scrollDragStart(e: React.TouchEvent<HTMLDivElement>): void;
        scrollDragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        scrollDrag(e: React.TouchEvent<HTMLDivElement>): void;
        scrollDrag(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        scrollDragEnd(e: React.TouchEvent<HTMLDivElement>): void;
        scrollDragEnd(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        moveScrollbar(pageX: number): void;
        resizeScrollbarRight(clientX: number): void;
        resizeScrollbarLeft(clientX: number): void;
        range(start: number, end: number): number[];
        getKeyframe(frame: number): false | IAnimationKey | undefined;
        getCurrentFrame(frame: number): boolean;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/notification" {
    import * as React from 'react';
    interface IPlayheadProps {
        message: string;
        open: boolean;
        close: () => void;
    }
    export class Notification extends React.Component<IPlayheadProps> {
        constructor(props: IPlayheadProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/graphActionsBar" {
    import * as React from 'react';
    import { IActionableKeyFrame } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationCurveEditorComponent";
    interface IGraphActionsBarProps {
        addKeyframe: () => void;
        removeKeyframe: () => void;
        handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        flatTangent: () => void;
        brokeTangents: () => void;
        setLerpMode: () => void;
        brokenMode: boolean;
        lerpMode: boolean;
        actionableKeyframe: IActionableKeyFrame;
        title: string;
        close: (event: any) => void;
        enabled: boolean;
        setKeyframeValue: () => void;
    }
    export class GraphActionsBar extends React.Component<IGraphActionsBarProps> {
        private _frameInput;
        private _valueInput;
        constructor(props: IGraphActionsBarProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        isEnterKeyUp(event: KeyboardEvent): void;
        onBlur(event: React.FocusEvent<HTMLInputElement>): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/addAnimation" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Animation } from "babylonjs/Animations/animation";
    import { IAnimatable } from "babylonjs/Animations/animatable.interface";
    interface IAddAnimationProps {
        isOpen: boolean;
        close: () => void;
        entity: IAnimatable;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        setNotificationMessage: (message: string) => void;
        finishedUpdate: () => void;
        addedNewAnimation: () => void;
        fps: number;
        selectedToUpdate?: Animation | undefined;
    }
    export class AddAnimation extends React.Component<IAddAnimationProps, {
        animationName: string;
        animationTargetProperty: string;
        animationType: number;
        loopMode: number;
        animationTargetPath: string;
        isUpdating: boolean;
    }> {
        constructor(props: IAddAnimationProps);
        setInitialState(editingAnimation?: Animation): {
            animationName: string;
            animationTargetPath: string;
            animationType: number;
            loopMode: number;
            animationTargetProperty: string;
            isUpdating: boolean;
        };
        componentWillReceiveProps(nextProps: IAddAnimationProps): void;
        updateAnimation(): void;
        getTypeAsString(type: number): "Float" | "Quaternion" | "Vector3" | "Vector2" | "Size" | "Color3" | "Color4";
        addAnimation(): void;
        raiseOnPropertyChanged(newValue: Animation[], previousValue: Animation[]): void;
        raiseOnPropertyUpdated(newValue: string | number | undefined, previousValue: string | number, property: string): void;
        handleNameChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handlePathChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>): void;
        handlePropertyChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handleLoopModeChange(event: React.ChangeEvent<HTMLSelectElement>): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationListTree" {
    import * as React from "react";
    import { IAnimatable } from "babylonjs/Animations/animatable.interface";
    import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Animation } from "babylonjs/Animations/animation";
    interface IAnimationListTreeProps {
        isTargetedAnimation: boolean;
        entity: IAnimatable | TargetedAnimation;
        selected: Animation | null;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        selectAnimation: (selected: Animation, coordinate?: SelectedCoordinate) => void;
        empty: () => void;
        editAnimation: (selected: Animation) => void;
        deselectAnimation: () => void;
    }
    interface Item {
        index: number;
        name: string;
        property: string;
        selected: boolean;
        open: boolean;
    }
    export enum SelectedCoordinate {
        x = 0,
        y = 1,
        z = 2,
        w = 3,
        r = 0,
        g = 1,
        b = 2,
        a = 3,
        width = 0,
        height = 1
    }
    interface ItemCoordinate {
        id: string;
        color: string;
        coordinate: SelectedCoordinate;
    }
    export class AnimationListTree extends React.Component<IAnimationListTreeProps, {
        selectedCoordinate: SelectedCoordinate;
        selectedAnimation: number;
        animationList: Item[] | null;
    }> {
        constructor(props: IAnimationListTreeProps);
        deleteAnimation(): void;
        generateList(): Item[] | null;
        toggleProperty(index: number): void;
        setSelectedCoordinate(animation: Animation, coordinate: SelectedCoordinate, index: number): void;
        coordinateItem(i: number, animation: Animation, coordinate: string, color: string, selectedCoordinate: SelectedCoordinate): JSX.Element;
        typeAnimationItem(animation: Animation, i: number, childrenElements: ItemCoordinate[]): JSX.Element;
        setListItem(animation: Animation, i: number): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/fileButtonLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/loadsnippet" {
    import * as React from 'react';
    import { Observable } from 'babylonjs/Misc/observable';
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Animation } from 'babylonjs/Animations/animation';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
    import { TargetedAnimation } from 'babylonjs/Animations/animationGroup';
    interface ILoadSnippetProps {
        animations: Animation[];
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        lockObject: LockObject;
        globalState: GlobalState;
        snippetServer: string;
        setSnippetId: (id: string) => void;
        entity: IAnimatable | TargetedAnimation;
        setNotificationMessage: (message: string) => void;
        animationsLoaded: (numberOfAnimations: number) => void;
    }
    export class LoadSnippet extends React.Component<ILoadSnippetProps, {
        snippetId: string;
    }> {
        private _serverAddress;
        constructor(props: ILoadSnippetProps);
        change(value: string): void;
        loadFromFile(file: File): void;
        loadFromSnippet(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/saveSnippet" {
    import * as React from 'react';
    import { Observable } from 'babylonjs/Misc/observable';
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Animation } from 'babylonjs/Animations/animation';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Nullable } from 'babylonjs/types';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISaveSnippetProps {
        animations: Nullable<Animation[]>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        lockObject: LockObject;
        globalState: GlobalState;
        snippetServer: string;
        snippetId: string;
    }
    export interface Snippet {
        url: string;
        id: string;
    }
    interface SelectedAnimation {
        id: string;
        name: string;
        index: number;
        selected: boolean;
    }
    export class SaveSnippet extends React.Component<ISaveSnippetProps, {
        selectedAnimations: SelectedAnimation[];
    }> {
        constructor(props: ISaveSnippetProps);
        handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>): void;
        stringifySelectedAnimations(): string;
        saveToFile(): void;
        saveToSnippet(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/editorControls" {
    import * as React from 'react';
    import { Observable } from 'babylonjs/Misc/observable';
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Animation } from 'babylonjs/Animations/animation';
    import { SelectedCoordinate } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationListTree";
    import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
    import { TargetedAnimation } from 'babylonjs/Animations/animationGroup';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IEditorControlsProps {
        isTargetedAnimation: boolean;
        entity: IAnimatable | TargetedAnimation;
        selected: Animation | null;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        setNotificationMessage: (message: string) => void;
        selectAnimation: (selected: Animation, axis?: SelectedCoordinate) => void;
        setFps: (fps: number) => void;
        setIsLooping: () => void;
        globalState: GlobalState;
        snippetServer: string;
        deselectAnimation: () => void;
        fps: number;
    }
    export class EditorControls extends React.Component<IEditorControlsProps, {
        isAnimationTabOpen: boolean;
        isEditTabOpen: boolean;
        isLoadTabOpen: boolean;
        isSaveTabOpen: boolean;
        isLoopActive: boolean;
        animationsCount: number;
        framesPerSecond: number;
        snippetId: string;
        selected: Animation | undefined;
    }> {
        constructor(props: IEditorControlsProps);
        componentWillReceiveProps(newProps: IEditorControlsProps): void;
        animationAdded(): void;
        finishedUpdate(): void;
        recountAnimations(): number;
        changeLoopBehavior(): void;
        handleTabs(tab: number): void;
        handleChangeFps(fps: number): void;
        emptiedList(): void;
        animationsLoaded(numberOfAnimations: number): void;
        editAnimation(selected: Animation): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/scale-label" {
    import * as React from 'react';
    import { CurveScale } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationCurveEditorComponent";
    interface ISwitchButtonProps {
        current: CurveScale;
        action?: (event: CurveScale) => void;
    }
    export class ScaleLabel extends React.Component<ISwitchButtonProps, {
        current: CurveScale;
    }> {
        constructor(props: ISwitchButtonProps);
        renderLabel(scale: CurveScale): "" | "DEG" | "FLT" | "INT" | "RAD";
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationCurveEditorComponent" {
    import * as React from "react";
    import { Animation } from "babylonjs/Animations/animation";
    import { Vector2, Vector3, Quaternion } from "babylonjs/Maths/math.vector";
    import { Color3, Color4 } from "babylonjs/Maths/math.color";
    import { Size } from "babylonjs/Maths/math.size";
    import { EasingFunction } from "babylonjs/Animations/easing";
    import { IAnimationKey } from "babylonjs/Animations/animationKey";
    import { IKeyframeSvgPoint } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/keyframeSvgPoint";
    import { Scene } from "babylonjs/scene";
    import { IAnimatable } from "babylonjs/Animations/animatable.interface";
    import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
    import { SelectedCoordinate } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationListTree";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IAnimationCurveEditorComponentProps {
        close: (event: any) => void;
        playOrPause?: () => void;
        scene: Scene;
        entity: IAnimatable | TargetedAnimation;
        lockObject: LockObject;
        globalState: GlobalState;
    }
    interface ICanvasAxis {
        value: number;
        label: number;
    }
    export enum CurveScale {
        float = 0,
        radians = 1,
        degrees = 2,
        integers = 3,
        default = 4
    }
    export interface IActionableKeyFrame {
        frame?: number | string;
        value?: any;
    }
    interface ICurveData {
        pathData: string;
        pathLength: number;
        domCurve: React.RefObject<SVGPathElement>;
        color: string;
        id: string;
    }
    export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, {
        isOpen: boolean;
        selected: Animation | null;
        svgKeyframes: IKeyframeSvgPoint[] | undefined;
        currentFrame: number;
        currentValue: number;
        frameAxisLength: ICanvasAxis[];
        valueAxisLength: ICanvasAxis[];
        isFlatTangentMode: boolean;
        isTangentMode: boolean;
        isBrokenMode: boolean;
        lerpMode: boolean;
        scale: number;
        playheadOffset: number;
        notification: string;
        currentPoint: SVGPoint | undefined;
        playheadPos: number;
        isPlaying: boolean;
        selectedPathData: ICurveData[] | undefined;
        selectedCoordinate: number;
        animationLimit: number;
        fps: number;
        isLooping: boolean;
        panningY: number;
        panningX: number;
        repositionCanvas: boolean;
        actionableKeyframe: IActionableKeyFrame;
        valueScale: CurveScale;
        canvasLength: number;
    }> {
        private _snippetUrl;
        private _heightScale;
        private _scaleFactor;
        private _currentScale;
        readonly _entityName: string;
        private _svgKeyframes;
        private _isPlaying;
        private _graphCanvas;
        private _editor;
        private _svgCanvas;
        private _isTargetedAnimation;
        private _pixelFrameUnit;
        private _onBeforeRenderObserver;
        private _mainAnimatable;
        constructor(props: IAnimationCurveEditorComponentProps);
        componentDidMount(): void;
        componentDidUpdate(prevProps: IAnimationCurveEditorComponentProps, prevState: any): void;
        onCurrentFrameChangeChangeScene(value: number): void;
        /**
         * Notifications
         * To add notification we set the state and clear to make the notification bar hide.
         */
        clearNotification(): void;
        /**
         * Zoom and Scroll
         * This section handles zoom and scroll
         * of the graph area.
         */
        zoom(e: React.WheelEvent<HTMLDivElement>): void;
        setFrameAxis(currentLength: number): {
            value: number;
            label: number;
        }[];
        setValueLines(type: CurveScale): ({
            value: number;
            label: string;
        } | {
            value: number;
            label: number;
        })[];
        getValueLabel(i: number): number;
        resetPlayheadOffset(): void;
        encodeCurveId(animationName: string, coordinate: number): string;
        decodeCurveId(id: string): {
            order: number;
            coordinate: number;
        };
        getKeyframeValueFromAnimation(id: string): {
            frame: number;
            value: number;
        } | undefined;
        /**
         * Keyframe Manipulation
         * This section handles events from SvgDraggableArea.
         */
        selectKeyframe(id: string, multiselect: boolean): void;
        resetActionableKeyframe(): void;
        selectedControlPoint(type: string, id: string): void;
        deselectKeyframes(): void;
        updateValuePerCoordinate(dataType: number, value: number | Vector2 | Vector3 | Color3 | Color4 | Size | Quaternion, newValue: number, coordinate?: number): number | Vector3 | Quaternion | Color3 | Color4 | Vector2 | Size;
        renderPoints(updatedSvgKeyFrame: IKeyframeSvgPoint, id: string): void;
        updateLeftControlPoint(updatedSvgKeyFrame: IKeyframeSvgPoint, key: IAnimationKey, dataType: number, coordinate: number): void;
        updateRightControlPoint(updatedSvgKeyFrame: IKeyframeSvgPoint, key: IAnimationKey, dataType: number, coordinate: number): void;
        handleFrameChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handleValueChange(event: React.ChangeEvent<HTMLInputElement>): void;
        setKeyframeValue(): void;
        setFlatTangent(): void;
        setTangentMode(): void;
        setBrokenMode(): void;
        setLerpMode(): void;
        addKeyframeClick(): void;
        removeKeyframeClick(): void;
        removeKeyframes(points: IKeyframeSvgPoint[]): void;
        addKeyFrame(event: React.MouseEvent<SVGSVGElement>): void;
        /**
         * Curve Rendering Functions
         * This section handles how to render curves.
         */
        setKeyframePointLinear(point: Vector2, index: number): void;
        flatTangents(keyframes: IAnimationKey[], dataType: number): IAnimationKey[];
        returnZero(dataType: number): 0 | Vector3 | Quaternion | Color3 | Color4 | Vector2 | Size;
        getValueAsArray(valueType: number, value: number | Vector2 | Vector3 | Color3 | Color4 | Size | Quaternion): number[];
        setValueAsType(valueType: number, arrayValue: number[]): number | Vector3 | Quaternion | Color3 | Color4 | Vector2 | Size;
        getPathData(animation: Animation | null): ICurveData[] | undefined;
        getAnimationData(animation: Animation): {
            loopMode: number | undefined;
            name: string;
            blendingSpeed: number;
            targetPropertyPath: string[];
            targetProperty: string;
            framesPerSecond: number;
            highestFrame: number;
            usesTangents: boolean;
            easingType: string | undefined;
            easingMode: number | undefined;
            valueType: number;
        };
        curvePathWithTangents(keyframes: IAnimationKey[], data: string, middle: number, type: number, coordinate: number, animationName: string): string;
        curvePath(keyframes: IAnimationKey[], data: string, middle: number, easingFunction: EasingFunction): string;
        setKeyframePoint(controlPoints: Vector2[], index: number, keyframesCount: number): void;
        interpolateControlPoints(p0: Vector2, p1: Vector2, u: number, p2: Vector2, v: number, p3: Vector2): Vector2[] | undefined;
        deselectAnimation(): void;
        /**
         * Core functions
         * This section handles main Curve Editor Functions.
         */
        selectAnimation(animation: Animation, coordinate?: SelectedCoordinate): void;
        setMainAnimatable(): void;
        isAnimationPlaying(): boolean;
        stopAnimation(): void;
        setIsLooping(): void;
        setFramesPerSecond(fps: number): void;
        analizeAnimationForLerp(animation: Animation | null): boolean;
        /**
         * Timeline
         * This section controls the timeline.
         */
        changeCurrentFrame(frame: number): void;
        setCanvasPosition(frame: number): void;
        setCurrentFrame(direction: number): void;
        changeAnimationLimit(limit: number): void;
        updateFrameInKeyFrame(frame: number, index: number): void;
        playPause(direction: number): void;
        moveFrameTo(e: React.MouseEvent<SVGRectElement, MouseEvent>): void;
        registerObs(): void;
        componentWillUnmount(): void;
        isCurrentFrame(frame: number): boolean;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/popupComponent" {
    import * as React from "react";
    interface IPopupComponentProps {
        id: string;
        title: string;
        size: {
            width: number;
            height: number;
        };
        onOpen: (window: Window) => void;
        onClose: (window: Window) => void;
    }
    export class PopupComponent extends React.Component<IPopupComponentProps, {
        isComponentMounted: boolean;
        blockedByBrowser: boolean;
    }> {
        private _container;
        private _window;
        private _curveEditorHost;
        constructor(props: IPopupComponentProps);
        componentDidMount(): void;
        openPopup(): void;
        componentWillUnmount(): void;
        getWindow(): Window | null;
        render(): React.ReactPortal | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationPropertyGridComponent" {
    import * as React from 'react';
    import { Observable } from 'babylonjs/Misc/observable';
    import { Scene } from 'babylonjs/scene';
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
    interface IAnimationGridComponentProps {
        globalState: GlobalState;
        animatable: IAnimatable;
        scene: Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class AnimationGridComponent extends React.Component<IAnimationGridComponentProps, {
        currentFrame: number;
    }> {
        private _animations;
        private _ranges;
        private _mainAnimatable;
        private _onBeforeRenderObserver;
        private _isPlaying;
        private timelineRef;
        private _isCurveEditorOpen;
        private _animationControl;
        constructor(props: IAnimationGridComponentProps);
        playOrPause(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        onCurrentFrameChange(value: number): void;
        onChangeFromOrTo(): void;
        onOpenAnimationCurveEditor(): void;
        onCloseAnimationCurveEditor(window: Window | null): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/commonMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Material } from "babylonjs/Materials/material";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: Material;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonMaterialPropertyGridComponent extends React.Component<ICommonMaterialPropertyGridComponentProps> {
        constructor(props: ICommonMaterialPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/materialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Material } from "babylonjs/Materials/material";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: Material;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class MaterialPropertyGridComponent extends React.Component<IMaterialPropertyGridComponentProps> {
        constructor(props: IMaterialPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/textureLinkLineComponent" {
    import * as React from "react";
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { Material } from "babylonjs/Materials/material";
    export interface ITextureLinkLineComponentProps {
        label: string;
        texture: Nullable<BaseTexture>;
        material?: Material;
        onSelectionChangedObservable?: Observable<any>;
        onDebugSelectionChangeObservable?: Observable<TextureLinkLineComponent>;
        propertyName?: string;
        onTextureCreated?: (texture: BaseTexture) => void;
        customDebugAction?: (state: boolean) => void;
        onTextureRemoved?: () => void;
    }
    export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, {
        isDebugSelected: boolean;
    }> {
        private _onDebugSelectionChangeObserver;
        constructor(props: ITextureLinkLineComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        debugTexture(): void;
        onLink(): void;
        updateTexture(file: File): void;
        removeTexture(): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/standardMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IStandardMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: StandardMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class StandardMaterialPropertyGridComponent extends React.Component<IStandardMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IStandardMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/lod" {
    /** @hidden */
    export var lodPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-inspector/lodCube" {
    /** @hidden */
    export var lodCubePixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-inspector/textureHelper" {
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    import "babylonjs-inspector/lod";
    import "babylonjs-inspector/lodCube";
    export interface TextureChannelsToDisplay {
        R: boolean;
        G: boolean;
        B: boolean;
        A: boolean;
    }
    export class TextureHelper {
        private static _ProcessAsync;
        static GetTextureDataAsync(texture: BaseTexture, width: number, height: number, face: number, channels: TextureChannelsToDisplay, globalState?: GlobalState, lod?: number): Promise<Uint8Array>;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/textureLineComponent" {
    import * as React from "react";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { TextureChannelsToDisplay } from "babylonjs-inspector/textureHelper";
    interface ITextureLineComponentProps {
        texture: BaseTexture;
        width: number;
        height: number;
        globalState?: GlobalState;
        hideChannelSelect?: boolean;
    }
    export class TextureLineComponent extends React.Component<ITextureLineComponentProps, {
        channels: TextureChannelsToDisplay;
        face: number;
    }> {
        private canvasRef;
        private static TextureChannelStates;
        constructor(props: ITextureLineComponentProps);
        shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: {
            channels: TextureChannelsToDisplay;
            face: number;
        }): boolean;
        componentDidMount(): void;
        componentDidUpdate(): void;
        updatePreview(): Promise<void>;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/toolBar" {
    import * as React from 'react';
    import { IToolData, IToolType, IMetadata } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export interface ITool extends IToolData {
        instance: IToolType;
    }
    interface IToolBarProps {
        tools: ITool[];
        addTool(url: string): void;
        changeTool(toolIndex: number): void;
        activeToolIndex: number;
        metadata: IMetadata;
        setMetadata(data: any): void;
        pickerOpen: boolean;
        setPickerOpen(open: boolean): void;
        pickerRef: React.RefObject<HTMLDivElement>;
        hasAlpha: boolean;
    }
    interface IToolBarState {
        toolURL: string;
        addOpen: boolean;
    }
    export class ToolBar extends React.Component<IToolBarProps, IToolBarState> {
        constructor(props: IToolBarProps);
        computeRGBAColor(): string;
        shouldComponentUpdate(nextProps: IToolBarProps): boolean;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/channelsBar" {
    import * as React from 'react';
    export interface IChannel {
        visible: boolean;
        editable: boolean;
        name: string;
        id: 'R' | 'G' | 'B' | 'A';
        icon: any;
    }
    interface IChannelsBarProps {
        channels: IChannel[];
        setChannels(channelState: IChannel[]): void;
    }
    export class ChannelsBar extends React.PureComponent<IChannelsBarProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/canvasShader" {
    export const canvasShader: {
        path: {
            vertexSource: string;
            fragmentSource: string;
        };
        options: {
            attributes: string[];
            uniforms: string[];
        };
    };
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureCanvasManager" {
    import { Scene } from 'babylonjs/scene';
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    import { Nullable } from 'babylonjs/types';
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    import { ISize } from 'babylonjs/Maths/math.size';
    import { PointerInfo } from 'babylonjs/Events/pointerEvents';
    import { ITool } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/toolBar";
    import { IChannel } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/channelsBar";
    import { IMetadata } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export interface IPixelData {
        x?: number;
        y?: number;
        r?: number;
        g?: number;
        b?: number;
        a?: number;
    }
    export class TextureCanvasManager {
        private _engine;
        private _scene;
        private _camera;
        private _cameraPos;
        private _scale;
        private _isPanning;
        private _mouseX;
        private _mouseY;
        private _UICanvas;
        private _size;
        /** The canvas we paint onto using the canvas API */
        private _2DCanvas;
        /** The canvas we apply post processes to */
        private _3DCanvas;
        /** The canvas which handles channel filtering */
        private _channelsTexture;
        private _3DEngine;
        private _3DPlane;
        private _3DCanvasTexture;
        private _3DScene;
        private _channels;
        private _face;
        private _mipLevel;
        /** The texture from the original engine that we invoked the editor on */
        private _originalTexture;
        /** This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
        private _target;
        /** The internal texture representation of the original texture */
        private _originalInternalTexture;
        /** Keeps track of whether we have modified the texture */
        private _didEdit;
        private _plane;
        private _planeMaterial;
        /** Tracks which keys are currently pressed */
        private _keyMap;
        private readonly ZOOM_MOUSE_SPEED;
        private readonly ZOOM_KEYBOARD_SPEED;
        private readonly ZOOM_IN_KEY;
        private readonly ZOOM_OUT_KEY;
        private readonly PAN_SPEED;
        private readonly PAN_MOUSE_BUTTON;
        private readonly MIN_SCALE;
        private readonly GRID_SCALE;
        private readonly MAX_SCALE;
        private readonly SELECT_ALL_KEY;
        private readonly SAVE_KEY;
        private readonly RESET_KEY;
        private readonly DESELECT_KEY;
        /** The number of milliseconds between texture updates */
        private readonly PUSH_FREQUENCY;
        private _tool;
        private _setPixelData;
        private _setMipLevel;
        private _window;
        private _metadata;
        private _editing3D;
        private _onUpdate;
        private _setMetadata;
        private _imageData;
        private _canPush;
        private _shouldPush;
        private _paintCanvas;
        constructor(texture: BaseTexture, window: Window, canvasUI: HTMLCanvasElement, canvas2D: HTMLCanvasElement, canvas3D: HTMLCanvasElement, setPixelData: (pixelData: IPixelData) => void, metadata: IMetadata, onUpdate: () => void, setMetadata: (metadata: any) => void, setMipLevel: (level: number) => void);
        updateTexture(): Promise<void>;
        private pushTexture;
        startPainting(): Promise<CanvasRenderingContext2D>;
        updatePainting(): void;
        stopPainting(): void;
        private updateDisplay;
        set channels(channels: IChannel[]);
        paintPixelsOnCanvas(pixelData: Uint8Array, canvas: HTMLCanvasElement): void;
        grabOriginalTexture(): Promise<Uint8Array>;
        getMouseCoordinates(pointerInfo: PointerInfo): Vector2;
        get scene(): Scene;
        get canvas2D(): HTMLCanvasElement;
        get size(): ISize;
        set tool(tool: Nullable<ITool>);
        get tool(): Nullable<ITool>;
        set face(face: number);
        set mipLevel(mipLevel: number);
        /** Returns the 3D scene used for postprocesses */
        get scene3D(): Scene;
        set metadata(metadata: IMetadata);
        private makePlane;
        reset(): void;
        resize(newSize: ISize): Promise<void>;
        setSize(size: ISize): void;
        upload(file: File): void;
        saveTexture(): void;
        dispose(): void;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/propertiesBar" {
    import * as React from 'react';
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    import { IPixelData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureCanvasManager";
    import { ISize } from 'babylonjs/Maths/math.size';
    interface IPropertiesBarProps {
        texture: BaseTexture;
        size: ISize;
        saveTexture(): void;
        pixelData: IPixelData;
        face: number;
        setFace(face: number): void;
        resetTexture(): void;
        resizeTexture(width: number, height: number): void;
        uploadTexture(file: File): void;
        mipLevel: number;
        setMipLevel: (mipLevel: number) => void;
    }
    interface IPropertiesBarState {
        width: number;
        height: number;
    }
    export class PropertiesBar extends React.PureComponent<IPropertiesBarProps, IPropertiesBarState> {
        private _resetButton;
        private _uploadButton;
        private _saveButton;
        private _babylonLogo;
        private _resizeButton;
        private _mipUp;
        private _mipDown;
        private _faces;
        constructor(props: IPropertiesBarProps);
        private pixelData;
        private getNewDimension;
        componentWillUpdate(nextProps: IPropertiesBarProps): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/bottomBar" {
    import * as React from 'react';
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    interface IBottomBarProps {
        texture: BaseTexture;
        mipLevel: number;
    }
    export class BottomBar extends React.PureComponent<IBottomBarProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureCanvasComponent" {
    import * as React from 'react';
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    interface ITextureCanvasComponentProps {
        canvasUI: React.RefObject<HTMLCanvasElement>;
        canvas2D: React.RefObject<HTMLCanvasElement>;
        canvas3D: React.RefObject<HTMLCanvasElement>;
        texture: BaseTexture;
    }
    export class TextureCanvasComponent extends React.Component<ITextureCanvasComponentProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/defaultTools/paintbrush" {
    import { IToolData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export const Paintbrush: IToolData;
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/defaultTools/eyedropper" {
    import { IToolData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export const Eyedropper: IToolData;
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/defaultTools/floodfill" {
    import { IToolData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export const Floodfill: IToolData;
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/defaultTools/contrast" {
    import { IToolData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export const Contrast: IToolData;
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/defaultTools/rectangleSelect" {
    import { IToolData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent";
    export const RectangleSelect: IToolData;
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/defaultTools/defaultTools" {
    const _default: import("babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent").IToolData[];
    export default _default;
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/toolSettings" {
    import * as React from 'react';
    import { ITool } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/toolBar";
    interface IToolSettingsProps {
        tool: ITool | undefined;
    }
    export class ToolSettings extends React.Component<IToolSettingsProps> {
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent" {
    import * as React from 'react';
    import { IPixelData } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureCanvasManager";
    import { ITool } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/toolBar";
    import { IChannel } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/channelsBar";
    import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
    import { Scene } from 'babylonjs/scene';
    import { ISize } from 'babylonjs/Maths/math.size';
    import { Vector2 } from 'babylonjs/Maths/math.vector';
    import { PointerInfo } from 'babylonjs/Events/pointerEvents';
    import { PopupComponent } from "babylonjs-inspector/components/popupComponent";
    interface ITextureEditorComponentProps {
        texture: BaseTexture;
        url: string;
        window: React.RefObject<PopupComponent>;
        onUpdate: () => void;
    }
    interface ITextureEditorComponentState {
        tools: ITool[];
        activeToolIndex: number;
        metadata: IMetadata;
        channels: IChannel[];
        pixelData: IPixelData;
        face: number;
        mipLevel: number;
        pickerOpen: boolean;
    }
    export interface IToolParameters {
        /** The visible scene in the editor. Useful for adding pointer and keyboard events. */
        scene: Scene;
        /** The 2D canvas which you can sample pixel data from. Tools should not paint directly on this canvas. */
        canvas2D: HTMLCanvasElement;
        /** The 3D scene which tools can add post processes to. */
        scene3D: Scene;
        /** The size of the texture. */
        size: ISize;
        /** Pushes the editor texture back to the original scene. This should be called every time a tool makes any modification to a texture. */
        updateTexture: () => void;
        /** The metadata object which is shared between all tools. Feel free to store any information here. Do not set this directly: instead call setMetadata. */
        metadata: IMetadata;
        /** Call this when you want to mutate the metadata. */
        setMetadata: (data: any) => void;
        /** Returns the texture coordinates under the cursor */
        getMouseCoordinates: (pointerInfo: PointerInfo) => Vector2;
        /** Provides access to the BABYLON namespace */
        BABYLON: any;
        /** Provides a canvas that you can use the canvas API to paint on. */
        startPainting: () => Promise<CanvasRenderingContext2D>;
        /** After you have painted on your canvas, call this method to push the updates back to the texture. */
        updatePainting: () => void;
        /** Call this when you are finished painting. */
        stopPainting: () => void;
    }
    export interface IToolGUIProps {
        instance: IToolType;
    }
    /** An interface representing the definition of a tool */
    export interface IToolData {
        /** Name to display on the toolbar */
        name: string;
        /** A class definition for the tool including setup and cleanup methods */
        type: IToolConstructable;
        /**  An SVG icon encoded in Base64 */
        icon: string;
        /** Whether the tool uses postprocesses */
        is3D?: boolean;
        cursor?: string;
        settingsComponent?: React.ComponentType<IToolGUIProps>;
    }
    export interface IToolType {
        /** Called when the tool is selected. */
        setup: () => void;
        /** Called when the tool is deselected. */
        cleanup: () => void;
        /** Optional. Called when the user resets the texture or uploads a new texture. Tools may want to reset their state when this happens. */
        onReset?: () => void;
    }
    /** For constructable types, TS requires that you define a seperate interface which constructs your actual interface */
    interface IToolConstructable {
        new (getParameters: () => IToolParameters): IToolType;
    }
    export interface IMetadata {
        color: string;
        alpha: number;
        select: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        };
        [key: string]: any;
    }
    global {
        var _TOOL_DATA_: IToolData;
    }
    export class TextureEditorComponent extends React.Component<ITextureEditorComponentProps, ITextureEditorComponentState> {
        private _textureCanvasManager;
        private _UICanvas;
        private _2DCanvas;
        private _3DCanvas;
        private _pickerRef;
        private _timer;
        private static PREVIEW_UPDATE_DELAY_MS;
        constructor(props: ITextureEditorComponentProps);
        componentDidMount(): void;
        componentDidUpdate(): void;
        componentWillUnmount(): void;
        textureDidUpdate(): void;
        loadToolFromURL(url: string): void;
        addTools(tools: IToolData[]): void;
        getToolParameters(): IToolParameters;
        changeTool(index: number): void;
        setMetadata(newMetadata: any): void;
        setPickerOpen(open: boolean): void;
        onPointerDown(evt: React.PointerEvent): void;
        saveTexture(): void;
        resetTexture(): void;
        resizeTexture(width: number, height: number): void;
        uploadTexture(file: File): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/texturePropertyGridComponent" {
    import * as React from "react";
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ITexturePropertyGridComponentProps {
        texture: BaseTexture;
        lockObject: LockObject;
        globalState: GlobalState;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    interface ITexturePropertyGridComponentState {
        isTextureEditorOpen: boolean;
        textureEditing: Nullable<BaseTexture>;
    }
    export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps, ITexturePropertyGridComponentState> {
        private _adtInstrumentation;
        private popoutWindowRef;
        private textureLineRef;
        private _textureInspectorSize;
        constructor(props: ITexturePropertyGridComponentProps);
        componentWillUnmount(): void;
        updateTexture(file: File): void;
        openTextureEditor(): void;
        onOpenTextureEditor(window: Window): void;
        onCloseTextureEditor(callback?: {
            (): void;
        }): void;
        forceRefresh(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/vector2LineComponent" {
    import * as React from "react";
    import { Vector2 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/pbrMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { TextureLinkLineComponent } from "babylonjs-inspector/components/actionTabs/lines/textureLinkLineComponent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IPBRMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: PBRMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class PBRMaterialPropertyGridComponent extends React.Component<IPBRMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IPBRMaterialPropertyGridComponentProps);
        switchAmbientMode(state: boolean): void;
        switchMetallicMode(state: boolean): void;
        switchRoughnessMode(state: boolean): void;
        renderTextures(onDebugSelectionChangeObservable: Observable<TextureLinkLineComponent>): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/radioLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/fogPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Scene } from "babylonjs/scene";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IFogPropertyGridComponentProps {
        globalState: GlobalState;
        scene: Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class FogPropertyGridComponent extends React.Component<IFogPropertyGridComponentProps, {
        mode: number;
    }> {
        constructor(props: IFogPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/scenePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector3 } from "babylonjs/Maths/math.vector";
    import { Scene } from "babylonjs/scene";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IScenePropertyGridComponentProps {
        globalState: GlobalState;
        scene: Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onSelectionChangedObservable?: Observable<any>;
    }
    export class ScenePropertyGridComponent extends React.Component<IScenePropertyGridComponentProps> {
        private _storedEnvironmentTexture;
        private _renderingModeGroupObservable;
        constructor(props: IScenePropertyGridComponentProps);
        setRenderingModes(point: boolean, wireframe: boolean): void;
        switchIBL(): void;
        updateEnvironmentTexture(file: File): void;
        updateGravity(newValue: Vector3): void;
        updateTimeStep(newValue: number): void;
        normalizeScene(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lights/commonLightPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Light } from "babylonjs/Lights/light";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: Light;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonLightPropertyGridComponent extends React.Component<ICommonLightPropertyGridComponentProps> {
        constructor(props: ICommonLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lights/hemisphericLightPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IHemisphericLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: HemisphericLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class HemisphericLightPropertyGridComponent extends React.Component<IHemisphericLightPropertyGridComponentProps> {
        constructor(props: IHemisphericLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lights/commonShadowLightPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { IShadowLight } from "babylonjs/Lights/shadowLight";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonShadowLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: IShadowLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonShadowLightPropertyGridComponent extends React.Component<ICommonShadowLightPropertyGridComponentProps> {
        private _internals;
        constructor(props: ICommonShadowLightPropertyGridComponentProps);
        createShadowGenerator(): void;
        disposeShadowGenerator(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lights/pointLightPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PointLight } from "babylonjs/Lights/pointLight";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IPointLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: PointLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class PointLightPropertyGridComponent extends React.Component<IPointLightPropertyGridComponentProps> {
        constructor(props: IPointLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/hexLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/cameras/commonCameraPropertyGridComponent" {
    import * as React from "react";
    import { Camera } from "babylonjs/Cameras/camera";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: Camera;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonCameraPropertyGridComponent extends React.Component<ICommonCameraPropertyGridComponentProps, {
        mode: number;
    }> {
        constructor(props: ICommonCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/cameras/freeCameraPropertyGridComponent" {
    import * as React from "react";
    import { FreeCamera } from "babylonjs/Cameras/freeCamera";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IFreeCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: FreeCamera;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class FreeCameraPropertyGridComponent extends React.Component<IFreeCameraPropertyGridComponentProps> {
        constructor(props: IFreeCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/cameras/arcRotateCameraPropertyGridComponent" {
    import * as React from "react";
    import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IArcRotateCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: ArcRotateCamera;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ArcRotateCameraPropertyGridComponent extends React.Component<IArcRotateCameraPropertyGridComponentProps> {
        constructor(props: IArcRotateCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/indentedTextLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/commonPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonPropertyGridComponentProps {
        globalState: GlobalState;
        host: {
            metadata: any;
        };
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonPropertyGridComponent extends React.Component<ICommonPropertyGridComponentProps> {
        constructor(props: ICommonPropertyGridComponentProps);
        renderLevel(jsonObject: any): JSX.Element[];
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/variantsPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IVariantsPropertyGridComponentProps {
        globalState: GlobalState;
        host: any;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class VariantsPropertyGridComponent extends React.Component<IVariantsPropertyGridComponentProps> {
        constructor(props: IVariantsPropertyGridComponentProps);
        private _getVariantsExtension;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/meshes/meshPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IMeshPropertyGridComponentProps {
        globalState: GlobalState;
        mesh: Mesh;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class MeshPropertyGridComponent extends React.Component<IMeshPropertyGridComponentProps, {
        displayNormals: boolean;
        displayVertexColors: boolean;
        displayBoneWeights: boolean;
        displayBoneIndex: number;
        displaySkeletonMap: boolean;
    }> {
        constructor(props: IMeshPropertyGridComponentProps);
        renderWireframeOver(): void;
        renderNormalVectors(): void;
        displayNormals(): void;
        displayVertexColors(): void;
        displayBoneWeights(): void;
        displaySkeletonMap(): void;
        onBoneDisplayIndexChange(value: number): void;
        onMaterialLink(): void;
        onSourceMeshLink(): void;
        onSkeletonLink(): void;
        convertPhysicsTypeToString(): string;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/meshes/transformNodePropertyGridComponent" {
    import * as React from "react";
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ITransformNodePropertyGridComponentProps {
        globalState: GlobalState;
        transformNode: TransformNode;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class TransformNodePropertyGridComponent extends React.Component<ITransformNodePropertyGridComponentProps> {
        constructor(props: ITransformNodePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/backgroundMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { BackgroundMaterial } from "babylonjs/Materials/Background/backgroundMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IBackgroundMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BackgroundMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class BackgroundMaterialPropertyGridComponent extends React.Component<IBackgroundMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IBackgroundMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/commonControlPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonControlPropertyGridComponentProps {
        globalState: GlobalState;
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        constructor(props: ICommonControlPropertyGridComponentProps);
        renderGridInformation(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/controlPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    interface IControlPropertyGridComponentProps {
        globalState: GlobalState;
        control: Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
        constructor(props: IControlPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/textBlockPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ITextBlockPropertyGridComponentProps {
        globalState: GlobalState;
        textBlock: TextBlock;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
        constructor(props: ITextBlockPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/inputTextPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { InputText } from "babylonjs-gui/2D/controls/inputText";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IInputTextPropertyGridComponentProps {
        globalState: GlobalState;
        inputText: InputText;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
        constructor(props: IInputTextPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/colorPickerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IColorPickerPropertyGridComponentProps {
        globalState: GlobalState;
        colorPicker: ColorPicker;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
        constructor(props: IColorPickerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/animationGroupPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { AnimationGroup } from "babylonjs/Animations/animationGroup";
    import { Scene } from "babylonjs/scene";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IAnimationGroupGridComponentProps {
        globalState: GlobalState;
        animationGroup: AnimationGroup;
        scene: Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class AnimationGroupGridComponent extends React.Component<IAnimationGroupGridComponentProps, {
        playButtonText: string;
        currentFrame: number;
    }> {
        private _onAnimationGroupPlayObserver;
        private _onAnimationGroupPauseObserver;
        private _onBeforeRenderObserver;
        private timelineRef;
        constructor(props: IAnimationGroupGridComponentProps);
        disconnect(animationGroup: AnimationGroup): void;
        connect(animationGroup: AnimationGroup): void;
        updateCurrentFrame(animationGroup: AnimationGroup): void;
        shouldComponentUpdate(nextProps: IAnimationGroupGridComponentProps): boolean;
        componentWillUnmount(): void;
        playOrPause(): void;
        onCurrentFrameChange(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/imagePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Image } from "babylonjs-gui/2D/controls/image";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IImagePropertyGridComponentProps {
        globalState: GlobalState;
        image: Image;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
        constructor(props: IImagePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/sliderPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISliderPropertyGridComponentProps {
        globalState: GlobalState;
        slider: Slider;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
        constructor(props: ISliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/imageBasedSliderPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IImageBasedSliderPropertyGridComponentProps {
        globalState: GlobalState;
        imageBasedSlider: ImageBasedSlider;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
        constructor(props: IImageBasedSliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/rectanglePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IRectanglePropertyGridComponentProps {
        globalState: GlobalState;
        rectangle: Rectangle;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
        constructor(props: IRectanglePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/ellipsePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IEllipsePropertyGridComponentProps {
        globalState: GlobalState;
        ellipse: Ellipse;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
        constructor(props: IEllipsePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/checkboxPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICheckboxPropertyGridComponentProps {
        globalState: GlobalState;
        checkbox: Checkbox;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
        constructor(props: ICheckboxPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/radioButtonPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IRadioButtonPropertyGridComponentProps {
        globalState: GlobalState;
        radioButton: RadioButton;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
        constructor(props: IRadioButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/linePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Line } from "babylonjs-gui/2D/controls/line";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ILinePropertyGridComponentProps {
        globalState: GlobalState;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/scrollViewerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IScrollViewerPropertyGridComponentProps {
        globalState: GlobalState;
        scrollViewer: ScrollViewer;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
        constructor(props: IScrollViewerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/gridPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Grid } from "babylonjs-gui/2D/controls/grid";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IGridPropertyGridComponentProps {
        globalState: GlobalState;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/pbrMetallicRoughnessMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PBRMetallicRoughnessMaterial } from "babylonjs/Materials/PBR/pbrMetallicRoughnessMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IPBRMetallicRoughnessMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: PBRMetallicRoughnessMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class PBRMetallicRoughnessMaterialPropertyGridComponent extends React.Component<IPBRMetallicRoughnessMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IPBRMetallicRoughnessMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/pbrSpecularGlossinessMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PBRSpecularGlossinessMaterial } from "babylonjs/Materials/PBR/pbrSpecularGlossinessMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IPBRSpecularGlossinessMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: PBRSpecularGlossinessMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class PBRSpecularGlossinessMaterialPropertyGridComponent extends React.Component<IPBRSpecularGlossinessMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IPBRSpecularGlossinessMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/gui/stackPanelPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IStackPanelPropertyGridComponentProps {
        globalState: GlobalState;
        stackPanel: StackPanel;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
        constructor(props: IStackPanelPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/commonPostProcessPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonPostProcessPropertyGridComponentProps {
        globalState: GlobalState;
        postProcess: PostProcess;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonPostProcessPropertyGridComponent extends React.Component<ICommonPostProcessPropertyGridComponentProps> {
        constructor(props: ICommonPostProcessPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/postProcessPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PostProcess } from "babylonjs/PostProcesses/postProcess";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IPostProcessPropertyGridComponentProps {
        globalState: GlobalState;
        postProcess: PostProcess;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class PostProcessPropertyGridComponent extends React.Component<IPostProcessPropertyGridComponentProps> {
        constructor(props: IPostProcessPropertyGridComponentProps);
        edit(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/commonRenderingPipelinePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { PostProcessRenderPipeline } from 'babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipeline';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICommonRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: PostProcessRenderPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CommonRenderingPipelinePropertyGridComponent extends React.Component<ICommonRenderingPipelinePropertyGridComponentProps> {
        constructor(props: ICommonRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/renderingPipelinePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PostProcessRenderPipeline } from "babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipeline";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: PostProcessRenderPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class RenderingPipelinePropertyGridComponent extends React.Component<IRenderingPipelinePropertyGridComponentProps> {
        constructor(props: IRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/defaultRenderingPipelinePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { DefaultRenderingPipeline } from "babylonjs/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IDefaultRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: DefaultRenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class DefaultRenderingPipelinePropertyGridComponent extends React.Component<IDefaultRenderingPipelinePropertyGridComponentProps> {
        constructor(props: IDefaultRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/ssaoRenderingPipelinePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { SSAORenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISSAORenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: SSAORenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SSAORenderingPipelinePropertyGridComponent extends React.Component<ISSAORenderingPipelinePropertyGridComponentProps> {
        constructor(props: ISSAORenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/ssao2RenderingPipelinePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { SSAO2RenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISSAO2RenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: SSAO2RenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SSAO2RenderingPipelinePropertyGridComponent extends React.Component<ISSAO2RenderingPipelinePropertyGridComponentProps> {
        constructor(props: ISSAO2RenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/meshes/skeletonPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { Skeleton } from 'babylonjs/Bones/skeleton';
    interface ISkeletonPropertyGridComponentProps {
        globalState: GlobalState;
        skeleton: Skeleton;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SkeletonPropertyGridComponent extends React.Component<ISkeletonPropertyGridComponentProps> {
        private _skeletonViewersEnabled;
        private _skeletonViewerDisplayOptions;
        private _skeletonViewers;
        constructor(props: ISkeletonPropertyGridComponentProps);
        switchSkeletonViewers(): void;
        checkSkeletonViewerState(props: ISkeletonPropertyGridComponentProps): void;
        changeDisplayMode(): void;
        changeDisplayOptions(option: string, value: number): void;
        shouldComponentUpdate(nextProps: ISkeletonPropertyGridComponentProps): boolean;
        onOverrideMeshLink(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/meshes/bonePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { Bone } from 'babylonjs/Bones/bone';
    interface IBonePropertyGridComponentProps {
        globalState: GlobalState;
        bone: Bone;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class BonePropertyGridComponent extends React.Component<IBonePropertyGridComponentProps> {
        constructor(props: IBonePropertyGridComponentProps);
        onTransformNodeLink(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lights/directionalLightPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { DirectionalLight } from "babylonjs/Lights/directionalLight";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IDirectionalLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: DirectionalLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class DirectionalLightPropertyGridComponent extends React.Component<IDirectionalLightPropertyGridComponentProps> {
        constructor(props: IDirectionalLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lights/spotLightPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { SpotLight } from "babylonjs/Lights/spotLight";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISpotLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: SpotLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SpotLightPropertyGridComponent extends React.Component<ISpotLightPropertyGridComponentProps> {
        constructor(props: ISpotLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/postProcesses/lensRenderingPipelinePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { LensRenderingPipeline } from "babylonjs/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ILenstRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: LensRenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class LensRenderingPipelinePropertyGridComponent extends React.Component<ILenstRenderingPipelinePropertyGridComponentProps> {
        constructor(props: ILenstRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/vector4LineComponent" {
    import * as React from "react";
    import { Vector4 } from "babylonjs/Maths/math.vector";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    interface IVector4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        step?: number;
        onChange?: (newvalue: Vector4) => void;
        useEuler?: boolean;
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
declare module "babylonjs-inspector/components/actionTabs/lines/color4LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Color4 } from "babylonjs/Maths/math.color";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    export interface IColor4LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onChange?: () => void;
        isLinear?: boolean;
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
        setPropertyValue(newColor: Color4): void;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/gradientStepComponent" {
    import * as React from 'react';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyComponentProps" {
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
    export interface IPropertyComponentProps {
        globalState: GlobalState;
        block: NodeMaterialBlock;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/gradientNodePropertyComponent" {
    import * as React from "react";
    import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
    import { IPropertyComponentProps } from "babylonjs-inspector/components/actionTabs/tabs/propertyComponentProps";
    export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        private _gradientBlock;
        constructor(props: IPropertyComponentProps);
        forceRebuild(): void;
        deleteStep(step: GradientBlockColorStep): void;
        addNewStep(): void;
        checkForReOrder(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/nodeMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
    interface INodeMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: NodeMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class NodeMaterialPropertyGridComponent extends React.Component<INodeMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: INodeMaterialPropertyGridComponentProps);
        edit(): void;
        renderTextures(): JSX.Element | null;
        renderInputBlock(block: InputBlock): JSX.Element | null;
        renderInputValues(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/multiMaterialPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { Material } from 'babylonjs/Materials/material';
    import { MultiMaterial } from 'babylonjs/Materials/multiMaterial';
    interface IMultiMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: MultiMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class MultiMaterialPropertyGridComponent extends React.Component<IMultiMaterialPropertyGridComponentProps> {
        constructor(props: IMultiMaterialPropertyGridComponentProps);
        onMaterialLink(mat: Material): void;
        renderChildMaterial(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/boxEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { BoxParticleEmitter } from 'babylonjs/Particles/EmitterTypes/boxParticleEmitter';
    interface IBoxEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BoxParticleEmitter;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class BoxEmitterGridComponent extends React.Component<IBoxEmitterGridComponentProps> {
        constructor(props: IBoxEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/coneEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { ConeParticleEmitter } from 'babylonjs/Particles/EmitterTypes/coneParticleEmitter';
    interface IConeEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: ConeParticleEmitter;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ConeEmitterGridComponent extends React.Component<IConeEmitterGridComponentProps> {
        constructor(props: IConeEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/cylinderEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { CylinderParticleEmitter } from 'babylonjs/Particles/EmitterTypes/cylinderParticleEmitter';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    interface ICylinderEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: CylinderParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class CylinderEmitterGridComponent extends React.Component<ICylinderEmitterGridComponentProps> {
        constructor(props: ICylinderEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/hemisphericEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { HemisphericParticleEmitter } from 'babylonjs/Particles/EmitterTypes/hemisphericParticleEmitter';
    interface IHemisphericEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: HemisphericParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class HemisphericEmitterGridComponent extends React.Component<IHemisphericEmitterGridComponentProps> {
        constructor(props: IHemisphericEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/pointEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { PointParticleEmitter } from 'babylonjs/Particles/EmitterTypes/pointParticleEmitter';
    interface IPointEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: PointParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class PointEmitterGridComponent extends React.Component<IPointEmitterGridComponentProps> {
        constructor(props: IPointEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/sphereEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { SphereParticleEmitter } from 'babylonjs/Particles/EmitterTypes/sphereParticleEmitter';
    interface ISphereEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: SphereParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SphereEmitterGridComponent extends React.Component<ISphereEmitterGridComponentProps> {
        constructor(props: ISphereEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/meshPickerComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { Observable } from 'babylonjs/Misc/observable';
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { Scene } from 'babylonjs/scene';
    interface IMeshPickerComponentProps {
        globalState: GlobalState;
        target: any;
        property: string;
        scene: Scene;
        label: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class MeshPickerComponent extends React.Component<IMeshPickerComponentProps> {
        constructor(props: IMeshPickerComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/meshEmitterGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { MeshParticleEmitter } from 'babylonjs/Particles/EmitterTypes/meshParticleEmitter';
    import { Scene } from 'babylonjs/scene';
    interface IMeshEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: MeshParticleEmitter;
        scene: Scene;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class MeshEmitterGridComponent extends React.Component<IMeshEmitterGridComponentProps> {
        constructor(props: IMeshEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/factorGradientStepGridComponent" {
    import * as React from 'react';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { FactorGradient } from 'babylonjs/Misc/gradients';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
    interface IFactorGradientStepGridComponent {
        globalState: GlobalState;
        gradient: FactorGradient;
        lockObject: LockObject;
        lineIndex: number;
        onDelete: () => void;
        onUpdateGradient: () => void;
        onCheckForReOrder: () => void;
        host: IParticleSystem;
        codeRecorderPropertyName: string;
    }
    export class FactorGradientStepGridComponent extends React.Component<IFactorGradientStepGridComponent, {
        gradient: number;
        factor1: string;
        factor2?: string;
    }> {
        constructor(props: IFactorGradientStepGridComponent);
        shouldComponentUpdate(nextProps: IFactorGradientStepGridComponent, nextState: {
            gradient: number;
            factor1: string;
            factor2?: string;
        }): boolean;
        updateFactor1(valueString: string): void;
        updateFactor2(valueString: string): void;
        updateGradient(gradient: number): void;
        onPointerUp(): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/colorGradientStepGridComponent" {
    import * as React from 'react';
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { ColorGradient, Color3Gradient } from 'babylonjs/Misc/gradients';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
    interface IColorGradientStepGridComponent {
        globalState: GlobalState;
        gradient: ColorGradient | Color3Gradient;
        lockObject: LockObject;
        lineIndex: number;
        isColor3: boolean;
        onDelete: () => void;
        onUpdateGradient: () => void;
        onCheckForReOrder: () => void;
        host: IParticleSystem;
        codeRecorderPropertyName: string;
    }
    export class ColorGradientStepGridComponent extends React.Component<IColorGradientStepGridComponent, {
        gradient: number;
    }> {
        constructor(props: IColorGradientStepGridComponent);
        updateColor1(color: string): void;
        updateColor2(color: string): void;
        updateGradient(gradient: number): void;
        onPointerUp(): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/linkButtonComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/valueGradientGridComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IValueGradient } from 'babylonjs/Misc/gradients';
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { Nullable } from 'babylonjs/types';
    import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
    export enum GradientGridMode {
        Factor = 0,
        Color3 = 1,
        Color4 = 2
    }
    interface IValueGradientGridComponent {
        globalState: GlobalState;
        label: string;
        gradients: Nullable<Array<IValueGradient>>;
        lockObject: LockObject;
        docLink?: string;
        mode: GradientGridMode;
        host: IParticleSystem;
        codeRecorderPropertyName: string;
        onCreateRequired: () => void;
    }
    export class ValueGradientGridComponent extends React.Component<IValueGradientGridComponent> {
        constructor(props: IValueGradientGridComponent);
        deleteStep(step: IValueGradient): void;
        addNewStep(): void;
        checkForReOrder(): void;
        updateAndSync(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/particleSystems/particleSystemPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
    interface IParticleSystemPropertyGridComponentProps {
        globalState: GlobalState;
        system: IParticleSystem;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class ParticleSystemPropertyGridComponent extends React.Component<IParticleSystemPropertyGridComponentProps> {
        private _snippetUrl;
        constructor(props: IParticleSystemPropertyGridComponentProps);
        renderEmitter(): JSX.Element | null;
        raiseOnPropertyChanged(property: string, newValue: any, previousValue: any): void;
        renderControls(): JSX.Element;
        saveToFile(): void;
        loadFromFile(file: File): void;
        loadFromSnippet(): void;
        saveToSnippet(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/sprites/spriteManagerPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { SpriteManager } from 'babylonjs/Sprites/spriteManager';
    interface ISpriteManagerPropertyGridComponentProps {
        globalState: GlobalState;
        spriteManager: SpriteManager;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class SpriteManagerPropertyGridComponent extends React.Component<ISpriteManagerPropertyGridComponentProps> {
        private _snippetUrl;
        constructor(props: ISpriteManagerPropertyGridComponentProps);
        addNewSprite(): void;
        disposeManager(): void;
        saveToFile(): void;
        loadFromFile(file: File): void;
        loadFromSnippet(): void;
        saveToSnippet(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/sprites/spritePropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { Sprite } from 'babylonjs/Sprites/sprite';
    interface ISpritePropertyGridComponentProps {
        globalState: GlobalState;
        sprite: Sprite;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
        onSelectionChangedObservable?: Observable<any>;
    }
    export class SpritePropertyGridComponent extends React.Component<ISpritePropertyGridComponentProps> {
        private canvasRef;
        private imageData;
        private cachedCellIndex;
        constructor(props: ISpritePropertyGridComponentProps);
        onManagerLink(): void;
        switchPlayStopState(): void;
        disposeSprite(): void;
        componentDidMount(): void;
        componentDidUpdate(): void;
        shouldComponentUpdate(nextProps: ISpritePropertyGridComponentProps): boolean;
        updatePreview(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/targetedAnimationPropertyGridComponent" {
    import * as React from 'react';
    import { Observable } from 'babylonjs/Misc/observable';
    import { TargetedAnimation } from 'babylonjs/Animations/animationGroup';
    import { Scene } from 'babylonjs/scene';
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ITargetedAnimationGridComponentProps {
        globalState: GlobalState;
        targetedAnimation: TargetedAnimation;
        scene: Scene;
        lockObject: LockObject;
        onSelectionChangedObservable?: Observable<any>;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class TargetedAnimationGridComponent extends React.Component<ITargetedAnimationGridComponentProps> {
        private _isCurveEditorOpen;
        private _animationGroup;
        constructor(props: ITargetedAnimationGridComponentProps);
        onOpenAnimationCurveEditor(): void;
        onCloseAnimationCurveEditor(window: Window | null): void;
        playOrPause(): void;
        deleteAnimation(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/cameras/followCameraPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { FollowCamera } from 'babylonjs/Cameras/followCamera';
    interface IFollowCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: FollowCamera;
        lockObject: LockObject;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class FollowCameraPropertyGridComponent extends React.Component<IFollowCameraPropertyGridComponentProps> {
        constructor(props: IFollowCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGridTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    export class PropertyGridTabComponent extends PaneComponent {
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPaneComponentProps);
        timerRefresh(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/headerComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    export interface IHeaderComponentProps {
        title: string;
        handleBack?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        noCommands?: boolean;
        onPopup: () => void;
        onClose: () => void;
        onSelectionChangedObservable?: Observable<any>;
    }
    export class HeaderComponent extends React.Component<IHeaderComponentProps, {
        isBackVisible: boolean;
    }> {
        private _backStack;
        private _onSelectionChangeObserver;
        constructor(props: IHeaderComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        goBack(): void;
        renderLogo(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/messageLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/tools/gltfComponent" {
    import * as React from "react";
    import { Scene } from "babylonjs/scene";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IGLTFComponentProps {
        scene: Scene;
        globalState: GlobalState;
    }
    export class GLTFComponent extends React.Component<IGLTFComponentProps> {
        private _onValidationResultsUpdatedObserver;
        openValidationDetails(): void;
        prepareText(singularForm: string, count: number): string;
        componentDidMount(): void;
        componentWillUnmount(): void;
        renderValidation(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/fileMultipleButtonLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/toolsTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    import { Node } from "babylonjs/node";
    export class ToolsTabComponent extends PaneComponent {
        private _videoRecorder;
        private _screenShotSize;
        private _gifOptions;
        private _useWidthHeight;
        private _isExporting;
        private _gifWorkerBlob;
        private _gifRecorder;
        private _previousRenderingScale;
        private _crunchingGIF;
        constructor(props: IPaneComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        captureScreenshot(): void;
        captureRender(): void;
        recordVideo(): void;
        recordGIFInternal(): void;
        recordGIF(): void;
        importAnimations(event: any): void;
        shouldExport(node: Node): boolean;
        exportGLTF(): void;
        exportBabylon(): void;
        createEnvTexture(): void;
        exportReplay(): void;
        startRecording(): void;
        applyDelta(file: File): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/settingsTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    export class SettingsTabComponent extends PaneComponent {
        constructor(props: IPaneComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/actionTabsComponent" {
    import * as React from "react";
    import { Scene } from "babylonjs/scene";
    import { DebugLayerTab } from "babylonjs/Debug/debugLayer";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IActionTabsComponentProps {
        scene?: Scene;
        noCommands?: boolean;
        noHeader?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        popupMode?: boolean;
        onPopup?: () => void;
        onClose?: () => void;
        globalState?: GlobalState;
        initialTab?: DebugLayerTab;
    }
    export class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
        selectedEntity: any;
        selectedIndex: number;
    }> {
        private _onSelectionChangeObserver;
        private _onTabChangedObserver;
        private _once;
        constructor(props: IActionTabsComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        changeSelectedTab(index: number): void;
        renderContent(): JSX.Element | null;
        onClose(): void;
        onPopup(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/treeItemLabelComponent" {
    import * as React from "react";
    interface ITreeItemLabelComponentProps {
        label: string;
        onClick?: () => void;
        color: string;
    }
    export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps> {
        constructor(props: ITreeItemLabelComponentProps);
        onClick(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/extensionsComponent" {
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
declare module "babylonjs-inspector/components/sceneExplorer/entities/meshTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IMeshTreeItemComponentProps {
        mesh: AbstractMesh;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
    }
    export class MeshTreeItemComponent extends React.Component<IMeshTreeItemComponentProps, {
        isBoundingBoxEnabled: boolean;
        isVisible: boolean;
    }> {
        constructor(props: IMeshTreeItemComponentProps);
        showBoundingBox(): void;
        switchVisibility(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/cameraTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Camera } from "babylonjs/Cameras/camera";
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ICameraTreeItemComponentProps {
        camera: Camera;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
    }
    export class CameraTreeItemComponent extends React.Component<ICameraTreeItemComponentProps, {
        isActive: boolean;
        isGizmoEnabled: boolean;
    }> {
        private _onBeforeRenderObserver;
        constructor(props: ICameraTreeItemComponentProps);
        setActive(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        toggleGizmo(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/lightTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Light } from "babylonjs/Lights/light";
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ILightTreeItemComponentProps {
        light: Light;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
    }
    export class LightTreeItemComponent extends React.Component<ILightTreeItemComponentProps, {
        isEnabled: boolean;
        isGizmoEnabled: boolean;
    }> {
        constructor(props: ILightTreeItemComponentProps);
        switchIsEnabled(): void;
        toggleGizmo(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/materialTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Material } from "babylonjs/Materials/material";
    import * as React from 'react';
    import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
    interface IMaterialTreeItemComponentProps {
        material: Material | NodeMaterial;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class MaterialTreeItemComponent extends React.Component<IMaterialTreeItemComponentProps> {
        constructor(props: IMaterialTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/textureTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Texture } from "babylonjs/Materials/Textures/texture";
    import * as React from 'react';
    interface ITextureTreeItemComponentProps {
        texture: Texture;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class TextureTreeItemComponent extends React.Component<ITextureTreeItemComponentProps> {
        constructor(props: ITextureTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/transformNodeTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import * as React from "react";
    interface ITransformNodeItemComponentProps {
        transformNode: TransformNode;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class TransformNodeItemComponent extends React.Component<ITransformNodeItemComponentProps> {
        constructor(props: ITransformNodeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/gui/controlTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import * as React from 'react';
    interface IControlTreeItemComponentProps {
        control: Control;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, {
        isActive: boolean;
        isVisible: boolean;
    }> {
        constructor(props: IControlTreeItemComponentProps);
        highlight(): void;
        switchVisibility(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/gui/advancedDynamicTextureTreeItemComponent" {
    import { Observable } from "babylonjs/Misc/observable";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { AdvancedDynamicTexture } from 'babylonjs-gui/2D/advancedDynamicTexture';
    import * as React from 'react';
    interface IAdvancedDynamicTextureTreeItemComponentProps {
        texture: AdvancedDynamicTexture;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onSelectionChangedObservable?: Observable<any>;
        onClick: () => void;
    }
    export class AdvancedDynamicTextureTreeItemComponent extends React.Component<IAdvancedDynamicTextureTreeItemComponentProps, {
        isInPickingMode: boolean;
    }> {
        private _onControlPickedObserver;
        constructor(props: IAdvancedDynamicTextureTreeItemComponentProps);
        componentWillUnmount(): void;
        onPickingMode(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/animationGroupTreeItemComponent" {
    import { AnimationGroup } from "babylonjs/Animations/animationGroup";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    interface IAnimationGroupItemComponentProps {
        animationGroup: AnimationGroup;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class AnimationGroupItemComponent extends React.Component<IAnimationGroupItemComponentProps> {
        constructor(props: IAnimationGroupItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/postProcessTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
    import * as React from 'react';
    interface IPostProcessItemComponentProps {
        postProcess: PostProcess;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class PostProcessItemComponent extends React.Component<IPostProcessItemComponentProps> {
        constructor(props: IPostProcessItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/renderingPipelineTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { PostProcessRenderPipeline } from 'babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipeline';
    import * as React from 'react';
    interface IRenderPipelineItemComponenttProps {
        renderPipeline: PostProcessRenderPipeline;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class RenderingPipelineItemComponent extends React.Component<IRenderPipelineItemComponenttProps> {
        constructor(props: IRenderPipelineItemComponenttProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/skeletonTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    import { Skeleton } from 'babylonjs/Bones/skeleton';
    interface ISkeletonTreeItemComponentProps {
        skeleton: Skeleton;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SkeletonTreeItemComponent extends React.Component<ISkeletonTreeItemComponentProps> {
        constructor(props: ISkeletonTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/boneTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    import { Bone } from 'babylonjs/Bones/bone';
    interface IBoneTreeItemComponenttProps {
        bone: Bone;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class BoneTreeItemComponent extends React.Component<IBoneTreeItemComponenttProps> {
        constructor(props: IBoneTreeItemComponenttProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/particleSystemTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from 'react';
    import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
    interface IParticleSystemTreeItemComponentProps {
        system: IParticleSystem;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class ParticleSystemTreeItemComponent extends React.Component<IParticleSystemTreeItemComponentProps> {
        constructor(props: IParticleSystemTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/spriteManagerTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from 'react';
    import { SpriteManager } from 'babylonjs/Sprites/spriteManager';
    interface ISpriteManagerTreeItemComponentProps {
        spriteManager: SpriteManager;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SpriteManagerTreeItemComponent extends React.Component<ISpriteManagerTreeItemComponentProps> {
        constructor(props: ISpriteManagerTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/spriteTreeItemComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from 'react';
    import { Sprite } from 'babylonjs/Sprites/sprite';
    interface ISpriteTreeItemComponentProps {
        sprite: Sprite;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SpriteTreeItemComponent extends React.Component<ISpriteTreeItemComponentProps> {
        constructor(props: ISpriteTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/entities/targetedAnimationTreeItemComponent" {
    import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    interface ITargetedAnimationItemComponentProps {
        targetedAnimation: TargetedAnimation;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class TargetedAnimationItemComponent extends React.Component<ITargetedAnimationItemComponentProps> {
        constructor(props: ITargetedAnimationItemComponentProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/treeItemSpecializedComponent" {
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ITreeItemSpecializedComponentProps {
        label: string;
        entity?: any;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        globalState: GlobalState;
        onClick?: () => void;
    }
    export class TreeItemSpecializedComponent extends React.Component<ITreeItemSpecializedComponentProps> {
        constructor(props: ITreeItemSpecializedComponentProps);
        onClick(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/tools" {
    export class Tools {
        static LookForItem(item: any, selectedEntity: any): boolean;
        private static _RecursiveRemoveHiddenMeshesAndHoistChildren;
        static SortAndFilter(parent: any, items: any[]): any[];
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/treeItemSelectableComponent" {
    import { Nullable } from "babylonjs/types";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    export interface ITreeItemSelectableComponentProps {
        entity: any;
        selectedEntity?: any;
        mustExpand?: boolean;
        offset: number;
        globalState: GlobalState;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        filter: Nullable<string>;
    }
    export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, {
        isExpanded: boolean;
        isSelected: boolean;
    }> {
        private _wasSelected;
        constructor(props: ITreeItemSelectableComponentProps);
        switchExpandedState(): void;
        shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: {
            isExpanded: boolean;
            isSelected: boolean;
        }): boolean;
        scrollIntoView(): void;
        componentDidMount(): void;
        componentDidUpdate(): void;
        onSelect(): void;
        renderChildren(): JSX.Element[] | null;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/treeItemComponent" {
    import * as React from "react";
    import { Nullable } from "babylonjs/types";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    export interface ITreeItemComponentProps {
        items?: Nullable<any[]>;
        label: string;
        offset: number;
        filter: Nullable<string>;
        forceSubitems?: boolean;
        globalState: GlobalState;
        entity?: any;
        selectedEntity: any;
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
declare module "babylonjs-inspector/components/sceneExplorer/entities/sceneTreeItemComponent" {
    import { Observable } from "babylonjs/Misc/observable";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Scene } from "babylonjs/scene";
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISceneTreeItemComponentProps {
        scene: Scene;
        onRefresh: () => void;
        selectedEntity?: any;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onSelectionChangedObservable?: Observable<any>;
        globalState: GlobalState;
    }
    export class SceneTreeItemComponent extends React.Component<ISceneTreeItemComponentProps, {
        isSelected: boolean;
        isInPickingMode: boolean;
        gizmoMode: number;
    }> {
        private _gizmoLayerOnPointerObserver;
        private _onPointerObserver;
        private _onSelectionChangeObserver;
        private _selectedEntity;
        private _posDragEnd;
        private _scaleDragEnd;
        private _rotateDragEnd;
        constructor(props: ISceneTreeItemComponentProps);
        shouldComponentUpdate(nextProps: ISceneTreeItemComponentProps, nextState: {
            isSelected: boolean;
            isInPickingMode: boolean;
        }): boolean;
        componentDidMount(): void;
        componentWillUnmount(): void;
        onSelect(): void;
        onPickingMode(): void;
        setGizmoMode(mode: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/sceneExplorer/sceneExplorerComponent" {
    import * as React from "react";
    import { Nullable } from "babylonjs/types";
    import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
    import { Scene } from "babylonjs/scene";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ISceneExplorerFilterComponentProps {
        onFilter: (filter: string) => void;
    }
    export class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
        constructor(props: ISceneExplorerFilterComponentProps);
        render(): JSX.Element;
    }
    interface ISceneExplorerComponentProps {
        scene: Scene;
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
        scene: Scene;
    }> {
        private _onSelectionChangeObserver;
        private _onSelectionRenamedObserver;
        private _onNewSceneAddedObserver;
        private _onNewSceneObserver;
        private sceneExplorerRef;
        private _once;
        private _hooked;
        private sceneMutationFunc;
        constructor(props: ISceneExplorerComponentProps);
        processMutation(): void;
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
declare module "babylonjs-inspector/components/embedHost/embedHostComponent" {
    import * as React from "react";
    import { Scene } from "babylonjs/scene";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IExplorerExtensibilityGroup, DebugLayerTab } from 'babylonjs/Debug/debugLayer';
    interface IEmbedHostComponentProps {
        scene: Scene;
        globalState: GlobalState;
        popupMode: boolean;
        noClose?: boolean;
        noExpand?: boolean;
        onClose: () => void;
        onPopup: () => void;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        initialTab?: DebugLayerTab;
    }
    export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
        private _once;
        private splitRef;
        private topPartRef;
        private bottomPartRef;
        constructor(props: IEmbedHostComponentProps);
        componentDidMount(): void;
        renderContent(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/inspector" {
    import { IInspectorOptions } from "babylonjs/Debug/debugLayer";
    import { Observable } from "babylonjs/Misc/observable";
    import { Scene } from "babylonjs/scene";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    export class Inspector {
        private static _SceneExplorerHost;
        private static _ActionTabsHost;
        private static _EmbedHost;
        private static _NewCanvasContainer;
        private static _SceneExplorerWindow;
        private static _ActionTabsWindow;
        private static _EmbedHostWindow;
        private static _Scene;
        private static _OpenedPane;
        private static _OnBeforeRenderObserver;
        static OnSelectionChangeObservable: Observable<any>;
        static OnPropertyChangedObservable: Observable<PropertyChangedEvent>;
        private static _GlobalState;
        static MarkLineContainerTitleForHighlighting(title: string): void;
        static MarkMultipleLineContainerTitlesForHighlighting(titles: string[]): void;
        private static _CopyStyles;
        private static _CreateSceneExplorer;
        private static _CreateActionTabs;
        private static _CreateEmbedHost;
        static _CreatePopup(title: string, windowVariableName: string, width?: number, height?: number, lateBinding?: boolean): HTMLDivElement | null;
        static get IsVisible(): boolean;
        static EarlyAttachToLoader(): void;
        static Show(scene: Scene, userOptions: Partial<IInspectorOptions>): void;
        static _SetNewScene(scene: Scene): void;
        static _CreateCanvasContainer(parentControl: HTMLElement): void;
        private static _DestroyCanvasContainer;
        private static _Cleanup;
        private static _RemoveElementFromDOM;
        static Hide(): void;
    }
}
declare module "babylonjs-inspector/index" {
    export * from "babylonjs-inspector/inspector";
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animations/playhead" {
    import * as React from 'react';
    interface IPlayheadProps {
        frame: number;
        offset: number;
        onCurrentFrameChange: (frame: number) => void;
    }
    export class Playhead extends React.Component<IPlayheadProps> {
        private _direction;
        private _active;
        constructor(props: IPlayheadProps);
        dragStart(e: React.TouchEvent<HTMLDivElement>): void;
        dragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        drag(e: React.TouchEvent<HTMLDivElement>): void;
        drag(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        dragEnd(e: React.TouchEvent<HTMLDivElement>): void;
        dragEnd(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        calculateMove(): string;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/legacy/legacy" {
    export * from "babylonjs-inspector/index";
}
declare module "babylonjs-inspector" {
    export * from "babylonjs-inspector/legacy/legacy";
}
/// <reference types="react" />
declare module INSPECTOR {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
        allowNullValue?: boolean;
    }
}
declare module INSPECTOR {
    export class ReplayRecorder {
        private _sceneRecorder;
        private _isRecording;
        get isRecording(): boolean;
        cancel(): void;
        trackScene(scene: BABYLON.Scene): void;
        applyDelta(json: any, scene: BABYLON.Scene): void;
        export(): void;
    }
}
declare module INSPECTOR {
    export class GlobalState {
        onSelectionChangedObservable: BABYLON.Observable<any>;
        onPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        onInspectorClosedObservable: BABYLON.Observable<BABYLON.Scene>;
        onTabChangedObservable: BABYLON.Observable<number>;
        onSelectionRenamedObservable: BABYLON.Observable<void>;
        onPluginActivatedObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync>>;
        onNewSceneObservable: BABYLON.Observable<BABYLON.Scene>;
        sceneImportDefaults: {
            [key: string]: any;
        };
        validationResults: BABYLON.Nullable<BABYLON.GLTF2.IGLTFValidationResults>;
        onValidationResultsUpdatedObservable: BABYLON.Observable<BABYLON.Nullable<BABYLON.GLTF2.IGLTFValidationResults>>;
        onExtensionLoadedObservable: BABYLON.Observable<BABYLON.IGLTFLoaderExtension>;
        glTFLoaderExtensionDefaults: {
            [name: string]: {
                [key: string]: any;
            };
        };
        glTFLoaderDefaults: {
            [key: string]: any;
        };
        glTFLoaderExtensions: {
            [key: string]: BABYLON.IGLTFLoaderExtension;
        };
        blockMutationUpdates: boolean;
        selectedLineContainerTitles: Array<string>;
        selectedLineContainerTitlesNoFocus: Array<string>;
        recorder: ReplayRecorder;
        private _onlyUseEulers;
        get onlyUseEulers(): boolean;
        set onlyUseEulers(value: boolean);
        private _ignoreBackfacesForPicking;
        get ignoreBackfacesForPicking(): boolean;
        set ignoreBackfacesForPicking(value: boolean);
        init(propertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>): void;
        prepareGLTFPlugin(loader: BABYLON.GLTFFileLoader): void;
        lightGizmos: Array<BABYLON.LightGizmo>;
        enableLightGizmo(light: BABYLON.Light, enable?: boolean): void;
        cameraGizmos: Array<BABYLON.CameraGizmo>;
        enableCameraGizmo(camera: BABYLON.Camera, enable?: boolean): void;
    }
}
declare module INSPECTOR {
    export interface IPaneComponentProps {
        title: string;
        scene: BABYLON.Scene;
        selectedEntity?: any;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        globalState: GlobalState;
    }
    export class PaneComponent extends React.Component<IPaneComponentProps, {
        tag: any;
    }> {
        constructor(props: IPaneComponentProps);
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface ITabsComponentProps {
        children: any[];
        selectedIndex: number;
        onSelectedIndexChange: (value: number) => void;
    }
    export class TabsComponent extends React.Component<ITabsComponentProps> {
        constructor(props: ITabsComponentProps);
        onSelect(index: number): void;
        renderLabel(child: PaneComponent, index: number): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface ILineContainerComponentProps {
        globalState?: GlobalState;
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
        componentDidMount(): void;
        renderHeader(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    export interface IBooleanLineComponentProps {
        label: string;
        value: boolean;
    }
    export class BooleanLineComponent extends React.Component<IBooleanLineComponentProps> {
        constructor(props: IBooleanLineComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class StatisticsTabComponent extends PaneComponent {
        private _sceneInstrumentation;
        private _engineInstrumentation;
        private _timerIntervalId;
        constructor(props: IPaneComponentProps);
        componentWillUnmount(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IRenderGridPropertyGridComponentProps {
        globalState: GlobalState;
        scene: BABYLON.Scene;
    }
    export class RenderGridPropertyGridComponent extends React.Component<IRenderGridPropertyGridComponentProps, {
        isEnabled: boolean;
    }> {
        private _gridMesh;
        constructor(props: IRenderGridPropertyGridComponentProps);
        componentDidMount(): void;
        addOrRemoveGrid(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class DebugTabComponent extends PaneComponent {
        private _physicsViewersEnabled;
        constructor(props: IPaneComponentProps);
        switchPhysicsViewers(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    export const Null_Value: number;
    class ListLineOption {
        label: string;
        value: number;
    }
    interface IOptionsLineComponentProps {
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
declare module INSPECTOR {
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
declare module INSPECTOR {
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
declare module INSPECTOR {
    export interface IColorPickerComponentProps {
        value: BABYLON.Color4 | BABYLON.Color3;
        onColorChanged: (newOne: string) => void;
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
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IQuaternionLineComponentProps {
        label: string;
        target: any;
        useEuler?: boolean;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, {
        isExpanded: boolean;
        value: BABYLON.Quaternion;
        eulerValue: BABYLON.Vector3;
    }> {
        private _localChange;
        constructor(props: IQuaternionLineComponentProps);
        shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: {
            isExpanded: boolean;
            value: BABYLON.Quaternion;
            eulerValue: BABYLON.Vector3;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(currentValue: BABYLON.Quaternion, previousValue: BABYLON.Quaternion): void;
        updateQuaternion(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        updateStateW(value: number): void;
        updateQuaternionFromEuler(): void;
        updateStateEulerX(value: number): void;
        updateStateEulerY(value: number): void;
        updateStateEulerZ(value: number): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface ICustomPropertyGridComponentProps {
        globalState: GlobalState;
        target: any;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CustomPropertyGridComponent extends React.Component<ICustomPropertyGridComponentProps, {
        mode: number;
    }> {
        constructor(props: ICustomPropertyGridComponentProps);
        renderInspectable(inspectable: BABYLON.IInspectable): JSX.Element | null;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    export interface IButtonLineComponentProps {
        label: string;
        onClick: () => void;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IAnchorSvgPointProps {
        control: BABYLON.Vector2;
        anchor: BABYLON.Vector2;
        active: boolean;
        type: string;
        index: string;
        selected: boolean;
        selectControlPoint: (id: string) => void;
    }
    export class AnchorSvgPoint extends React.Component<IAnchorSvgPointProps> {
        constructor(props: IAnchorSvgPointProps);
        select(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export interface IKeyframeSvgPoint {
        keyframePoint: BABYLON.Vector2;
        rightControlPoint: BABYLON.Vector2 | null;
        leftControlPoint: BABYLON.Vector2 | null;
        id: string;
        selected: boolean;
        isLeftActive: boolean;
        isRightActive: boolean;
        curveId?: ICurveMetaData;
    }
    export interface ICurveMetaData {
        id: number;
        animationName: string;
        property: string;
    }
    interface IKeyframeSvgPointProps {
        keyframePoint: BABYLON.Vector2;
        leftControlPoint: BABYLON.Vector2 | null;
        rightControlPoint: BABYLON.Vector2 | null;
        id: string;
        selected: boolean;
        selectKeyframe: (id: string, multiselect: boolean) => void;
        selectedControlPoint: (type: string, id: string) => void;
        isLeftActive: boolean;
        isRightActive: boolean;
    }
    export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps> {
        constructor(props: IKeyframeSvgPointProps);
        select(e: React.MouseEvent<SVGImageElement>): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISvgDraggableAreaProps {
        keyframeSvgPoints: IKeyframeSvgPoint[];
        updatePosition: (updatedKeyframe: IKeyframeSvgPoint, id: string) => void;
        scale: number;
        viewBoxScale: number;
        selectKeyframe: (id: string, multiselect: boolean) => void;
        selectedControlPoint: (type: string, id: string) => void;
        deselectKeyframes: () => void;
        removeSelectedKeyframes: (points: IKeyframeSvgPoint[]) => void;
        panningY: (panningY: number) => void;
        panningX: (panningX: number) => void;
        setCurrentFrame: (direction: number) => void;
        positionCanvas?: number;
        repositionCanvas?: boolean;
        canvasPositionEnded: () => void;
        resetActionableKeyframe: () => void;
    }
    export class SvgDraggableArea extends React.Component<ISvgDraggableAreaProps, {
        panX: number;
        panY: number;
    }> {
        private _active;
        private _isCurrentPointControl;
        private _currentPointId;
        private _draggableArea;
        private _panStart;
        private _panStop;
        private _playheadDrag;
        private _playheadSelected;
        private _movedX;
        private _movedY;
        readonly _dragBuffer: number;
        readonly _draggingMultiplier: number;
        constructor(props: ISvgDraggableAreaProps);
        componentDidMount(): void;
        componentWillReceiveProps(newProps: ISvgDraggableAreaProps): void;
        dragStart(e: React.TouchEvent<SVGSVGElement>): void;
        dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        drag(e: React.TouchEvent<SVGSVGElement>): void;
        drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
        dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        getMousePosition(e: React.TouchEvent<SVGSVGElement>): BABYLON.Vector2 | undefined;
        getMousePosition(e: React.MouseEvent<SVGSVGElement, MouseEvent>): BABYLON.Vector2 | undefined;
        panDirection(): void;
        keyDown(e: KeyboardEvent): void;
        keyUp(e: KeyboardEvent): void;
        focus(e: React.MouseEvent<SVGSVGElement>): void;
        isNotControlPointActive(): boolean;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IControlsProps {
        keyframes: BABYLON.IAnimationKey[] | null;
        selected: BABYLON.IAnimationKey | null;
        currentFrame: number;
        onCurrentFrameChange: (frame: number) => void;
        repositionCanvas: (frame: number) => void;
        playPause: (direction: number) => void;
        isPlaying: boolean;
        scrollable: React.RefObject<HTMLDivElement>;
    }
    export class Controls extends React.Component<IControlsProps, {
        selected: BABYLON.IAnimationKey;
        playingType: string;
    }> {
        readonly _sizeOfKeyframe: number;
        constructor(props: IControlsProps);
        playBackwards(): void;
        play(): void;
        pause(): void;
        moveToAnimationStart(): void;
        moveToAnimationEnd(): void;
        nextKeyframe(): void;
        previousKeyframe(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITimelineProps {
        keyframes: BABYLON.IAnimationKey[] | null;
        selected: BABYLON.IAnimationKey | null;
        currentFrame: number;
        onCurrentFrameChange: (frame: number) => void;
        onAnimationLimitChange: (limit: number) => void;
        dragKeyframe: (frame: number, index: number) => void;
        playPause: (direction: number) => void;
        isPlaying: boolean;
        animationLimit: number;
        fps: number;
        repositionCanvas: (frame: number) => void;
    }
    export class Timeline extends React.Component<ITimelineProps, {
        selected: BABYLON.IAnimationKey;
        activeKeyframe: number | null;
        start: number;
        end: number;
        scrollWidth: number | undefined;
        selectionLength: number[];
        limitValue: number;
    }> {
        private _scrollable;
        private _scrollbarHandle;
        private _scrollContainer;
        private _inputAnimationLimit;
        private _direction;
        private _scrolling;
        private _shiftX;
        private _active;
        readonly _marginScrollbar: number;
        constructor(props: ITimelineProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        isEnterKeyUp(event: KeyboardEvent): void;
        onInputBlur(event: React.FocusEvent<HTMLInputElement>): void;
        setControlState(): void;
        calculateScrollWidth(start: number, end: number): number | undefined;
        playBackwards(event: React.MouseEvent<HTMLDivElement>): void;
        play(event: React.MouseEvent<HTMLDivElement>): void;
        pause(event: React.MouseEvent<HTMLDivElement>): void;
        setCurrentFrame(event: React.MouseEvent<HTMLDivElement>): void;
        handleLimitChange(event: React.ChangeEvent<HTMLInputElement>): void;
        dragStart(e: React.TouchEvent<SVGSVGElement>): void;
        dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        drag(e: React.TouchEvent<SVGSVGElement>): void;
        drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        isFrameBeingUsed(frame: number, direction: number): number | false;
        dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
        dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
        scrollDragStart(e: React.TouchEvent<HTMLDivElement>): void;
        scrollDragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        scrollDrag(e: React.TouchEvent<HTMLDivElement>): void;
        scrollDrag(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        scrollDragEnd(e: React.TouchEvent<HTMLDivElement>): void;
        scrollDragEnd(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        moveScrollbar(pageX: number): void;
        resizeScrollbarRight(clientX: number): void;
        resizeScrollbarLeft(clientX: number): void;
        range(start: number, end: number): number[];
        getKeyframe(frame: number): false | BABYLON.IAnimationKey | undefined;
        getCurrentFrame(frame: number): boolean;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPlayheadProps {
        message: string;
        open: boolean;
        close: () => void;
    }
    export class Notification extends React.Component<IPlayheadProps> {
        constructor(props: IPlayheadProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IGraphActionsBarProps {
        addKeyframe: () => void;
        removeKeyframe: () => void;
        handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        flatTangent: () => void;
        brokeTangents: () => void;
        setLerpMode: () => void;
        brokenMode: boolean;
        lerpMode: boolean;
        actionableKeyframe: IActionableKeyFrame;
        title: string;
        close: (event: any) => void;
        enabled: boolean;
        setKeyframeValue: () => void;
    }
    export class GraphActionsBar extends React.Component<IGraphActionsBarProps> {
        private _frameInput;
        private _valueInput;
        constructor(props: IGraphActionsBarProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        isEnterKeyUp(event: KeyboardEvent): void;
        onBlur(event: React.FocusEvent<HTMLInputElement>): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAddAnimationProps {
        isOpen: boolean;
        close: () => void;
        entity: BABYLON.IAnimatable;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        setNotificationMessage: (message: string) => void;
        finishedUpdate: () => void;
        addedNewAnimation: () => void;
        fps: number;
        selectedToUpdate?: BABYLON.Animation | undefined;
    }
    export class AddAnimation extends React.Component<IAddAnimationProps, {
        animationName: string;
        animationTargetProperty: string;
        animationType: number;
        loopMode: number;
        animationTargetPath: string;
        isUpdating: boolean;
    }> {
        constructor(props: IAddAnimationProps);
        setInitialState(editingAnimation?: BABYLON.Animation): {
            animationName: string;
            animationTargetPath: string;
            animationType: number;
            loopMode: number;
            animationTargetProperty: string;
            isUpdating: boolean;
        };
        componentWillReceiveProps(nextProps: IAddAnimationProps): void;
        updateAnimation(): void;
        getTypeAsString(type: number): "Float" | "Quaternion" | "Vector3" | "Vector2" | "Size" | "Color3" | "Color4";
        addAnimation(): void;
        raiseOnPropertyChanged(newValue: BABYLON.Animation[], previousValue: BABYLON.Animation[]): void;
        raiseOnPropertyUpdated(newValue: string | number | undefined, previousValue: string | number, property: string): void;
        handleNameChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handlePathChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>): void;
        handlePropertyChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handleLoopModeChange(event: React.ChangeEvent<HTMLSelectElement>): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationListTreeProps {
        isTargetedAnimation: boolean;
        entity: BABYLON.IAnimatable | BABYLON.TargetedAnimation;
        selected: BABYLON.Animation | null;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        selectAnimation: (selected: BABYLON.Animation, coordinate?: SelectedCoordinate) => void;
        empty: () => void;
        editAnimation: (selected: BABYLON.Animation) => void;
        deselectAnimation: () => void;
    }
    interface Item {
        index: number;
        name: string;
        property: string;
        selected: boolean;
        open: boolean;
    }
    export enum SelectedCoordinate {
        x = 0,
        y = 1,
        z = 2,
        w = 3,
        r = 0,
        g = 1,
        b = 2,
        a = 3,
        width = 0,
        height = 1
    }
    interface ItemCoordinate {
        id: string;
        color: string;
        coordinate: SelectedCoordinate;
    }
    export class AnimationListTree extends React.Component<IAnimationListTreeProps, {
        selectedCoordinate: SelectedCoordinate;
        selectedAnimation: number;
        animationList: Item[] | null;
    }> {
        constructor(props: IAnimationListTreeProps);
        deleteAnimation(): void;
        generateList(): Item[] | null;
        toggleProperty(index: number): void;
        setSelectedCoordinate(animation: BABYLON.Animation, coordinate: SelectedCoordinate, index: number): void;
        coordinateItem(i: number, animation: BABYLON.Animation, coordinate: string, color: string, selectedCoordinate: SelectedCoordinate): JSX.Element;
        typeAnimationItem(animation: BABYLON.Animation, i: number, childrenElements: ItemCoordinate[]): JSX.Element;
        setListItem(animation: BABYLON.Animation, i: number): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface ILoadSnippetProps {
        animations: BABYLON.Animation[];
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        lockObject: LockObject;
        globalState: GlobalState;
        snippetServer: string;
        setSnippetId: (id: string) => void;
        entity: BABYLON.IAnimatable | BABYLON.TargetedAnimation;
        setNotificationMessage: (message: string) => void;
        animationsLoaded: (numberOfAnimations: number) => void;
    }
    export class LoadSnippet extends React.Component<ILoadSnippetProps, {
        snippetId: string;
    }> {
        private _serverAddress;
        constructor(props: ILoadSnippetProps);
        change(value: string): void;
        loadFromFile(file: File): void;
        loadFromSnippet(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISaveSnippetProps {
        animations: BABYLON.Nullable<BABYLON.Animation[]>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        lockObject: LockObject;
        globalState: GlobalState;
        snippetServer: string;
        snippetId: string;
    }
    export interface Snippet {
        url: string;
        id: string;
    }
    interface SelectedAnimation {
        id: string;
        name: string;
        index: number;
        selected: boolean;
    }
    export class SaveSnippet extends React.Component<ISaveSnippetProps, {
        selectedAnimations: SelectedAnimation[];
    }> {
        constructor(props: ISaveSnippetProps);
        handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>): void;
        stringifySelectedAnimations(): string;
        saveToFile(): void;
        saveToSnippet(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IEditorControlsProps {
        isTargetedAnimation: boolean;
        entity: BABYLON.IAnimatable | BABYLON.TargetedAnimation;
        selected: BABYLON.Animation | null;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        setNotificationMessage: (message: string) => void;
        selectAnimation: (selected: BABYLON.Animation, axis?: SelectedCoordinate) => void;
        setFps: (fps: number) => void;
        setIsLooping: () => void;
        globalState: GlobalState;
        snippetServer: string;
        deselectAnimation: () => void;
        fps: number;
    }
    export class EditorControls extends React.Component<IEditorControlsProps, {
        isAnimationTabOpen: boolean;
        isEditTabOpen: boolean;
        isLoadTabOpen: boolean;
        isSaveTabOpen: boolean;
        isLoopActive: boolean;
        animationsCount: number;
        framesPerSecond: number;
        snippetId: string;
        selected: BABYLON.Animation | undefined;
    }> {
        constructor(props: IEditorControlsProps);
        componentWillReceiveProps(newProps: IEditorControlsProps): void;
        animationAdded(): void;
        finishedUpdate(): void;
        recountAnimations(): number;
        changeLoopBehavior(): void;
        handleTabs(tab: number): void;
        handleChangeFps(fps: number): void;
        emptiedList(): void;
        animationsLoaded(numberOfAnimations: number): void;
        editAnimation(selected: BABYLON.Animation): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISwitchButtonProps {
        current: CurveScale;
        action?: (event: CurveScale) => void;
    }
    export class ScaleLabel extends React.Component<ISwitchButtonProps, {
        current: CurveScale;
    }> {
        constructor(props: ISwitchButtonProps);
        renderLabel(scale: CurveScale): "" | "DEG" | "FLT" | "INT" | "RAD";
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationCurveEditorComponentProps {
        close: (event: any) => void;
        playOrPause?: () => void;
        scene: BABYLON.Scene;
        entity: BABYLON.IAnimatable | BABYLON.TargetedAnimation;
        lockObject: LockObject;
        globalState: GlobalState;
    }
    interface ICanvasAxis {
        value: number;
        label: number;
    }
    export enum CurveScale {
        float = 0,
        radians = 1,
        degrees = 2,
        integers = 3,
        default = 4
    }
    export interface IActionableKeyFrame {
        frame?: number | string;
        value?: any;
    }
    interface ICurveData {
        pathData: string;
        pathLength: number;
        domCurve: React.RefObject<SVGPathElement>;
        color: string;
        id: string;
    }
    export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, {
        isOpen: boolean;
        selected: BABYLON.Animation | null;
        svgKeyframes: IKeyframeSvgPoint[] | undefined;
        currentFrame: number;
        currentValue: number;
        frameAxisLength: ICanvasAxis[];
        valueAxisLength: ICanvasAxis[];
        isFlatTangentMode: boolean;
        isTangentMode: boolean;
        isBrokenMode: boolean;
        lerpMode: boolean;
        scale: number;
        playheadOffset: number;
        notification: string;
        currentPoint: SVGPoint | undefined;
        playheadPos: number;
        isPlaying: boolean;
        selectedPathData: ICurveData[] | undefined;
        selectedCoordinate: number;
        animationLimit: number;
        fps: number;
        isLooping: boolean;
        panningY: number;
        panningX: number;
        repositionCanvas: boolean;
        actionableKeyframe: IActionableKeyFrame;
        valueScale: CurveScale;
        canvasLength: number;
    }> {
        private _snippetUrl;
        private _heightScale;
        private _scaleFactor;
        private _currentScale;
        readonly _entityName: string;
        private _svgKeyframes;
        private _isPlaying;
        private _graphCanvas;
        private _editor;
        private _svgCanvas;
        private _isTargetedAnimation;
        private _pixelFrameUnit;
        private _onBeforeRenderObserver;
        private _mainAnimatable;
        constructor(props: IAnimationCurveEditorComponentProps);
        componentDidMount(): void;
        componentDidUpdate(prevProps: IAnimationCurveEditorComponentProps, prevState: any): void;
        onCurrentFrameChangeChangeScene(value: number): void;
        /**
         * Notifications
         * To add notification we set the state and clear to make the notification bar hide.
         */
        clearNotification(): void;
        /**
         * Zoom and Scroll
         * This section handles zoom and scroll
         * of the graph area.
         */
        zoom(e: React.WheelEvent<HTMLDivElement>): void;
        setFrameAxis(currentLength: number): {
            value: number;
            label: number;
        }[];
        setValueLines(type: CurveScale): ({
            value: number;
            label: string;
        } | {
            value: number;
            label: number;
        })[];
        getValueLabel(i: number): number;
        resetPlayheadOffset(): void;
        encodeCurveId(animationName: string, coordinate: number): string;
        decodeCurveId(id: string): {
            order: number;
            coordinate: number;
        };
        getKeyframeValueFromAnimation(id: string): {
            frame: number;
            value: number;
        } | undefined;
        /**
         * Keyframe Manipulation
         * This section handles events from SvgDraggableArea.
         */
        selectKeyframe(id: string, multiselect: boolean): void;
        resetActionableKeyframe(): void;
        selectedControlPoint(type: string, id: string): void;
        deselectKeyframes(): void;
        updateValuePerCoordinate(dataType: number, value: number | BABYLON.Vector2 | BABYLON.Vector3 | BABYLON.Color3 | BABYLON.Color4 | BABYLON.Size | BABYLON.Quaternion, newValue: number, coordinate?: number): number | BABYLON.Vector3 | BABYLON.Quaternion | BABYLON.Color3 | BABYLON.Color4 | BABYLON.Vector2 | BABYLON.Size;
        renderPoints(updatedSvgKeyFrame: IKeyframeSvgPoint, id: string): void;
        updateLeftControlPoint(updatedSvgKeyFrame: IKeyframeSvgPoint, key: BABYLON.IAnimationKey, dataType: number, coordinate: number): void;
        updateRightControlPoint(updatedSvgKeyFrame: IKeyframeSvgPoint, key: BABYLON.IAnimationKey, dataType: number, coordinate: number): void;
        handleFrameChange(event: React.ChangeEvent<HTMLInputElement>): void;
        handleValueChange(event: React.ChangeEvent<HTMLInputElement>): void;
        setKeyframeValue(): void;
        setFlatTangent(): void;
        setTangentMode(): void;
        setBrokenMode(): void;
        setLerpMode(): void;
        addKeyframeClick(): void;
        removeKeyframeClick(): void;
        removeKeyframes(points: IKeyframeSvgPoint[]): void;
        addKeyFrame(event: React.MouseEvent<SVGSVGElement>): void;
        /**
         * Curve Rendering Functions
         * This section handles how to render curves.
         */
        setKeyframePointLinear(point: BABYLON.Vector2, index: number): void;
        flatTangents(keyframes: BABYLON.IAnimationKey[], dataType: number): BABYLON.IAnimationKey[];
        returnZero(dataType: number): 0 | BABYLON.Vector3 | BABYLON.Quaternion | BABYLON.Color3 | BABYLON.Color4 | BABYLON.Vector2 | BABYLON.Size;
        getValueAsArray(valueType: number, value: number | BABYLON.Vector2 | BABYLON.Vector3 | BABYLON.Color3 | BABYLON.Color4 | BABYLON.Size | BABYLON.Quaternion): number[];
        setValueAsType(valueType: number, arrayValue: number[]): number | BABYLON.Vector3 | BABYLON.Quaternion | BABYLON.Color3 | BABYLON.Color4 | BABYLON.Vector2 | BABYLON.Size;
        getPathData(animation: BABYLON.Animation | null): ICurveData[] | undefined;
        getAnimationData(animation: BABYLON.Animation): {
            loopMode: number | undefined;
            name: string;
            blendingSpeed: number;
            targetPropertyPath: string[];
            targetProperty: string;
            framesPerSecond: number;
            highestFrame: number;
            usesTangents: boolean;
            easingType: string | undefined;
            easingMode: number | undefined;
            valueType: number;
        };
        curvePathWithTangents(keyframes: BABYLON.IAnimationKey[], data: string, middle: number, type: number, coordinate: number, animationName: string): string;
        curvePath(keyframes: BABYLON.IAnimationKey[], data: string, middle: number, easingFunction: BABYLON.EasingFunction): string;
        setKeyframePoint(controlPoints: BABYLON.Vector2[], index: number, keyframesCount: number): void;
        interpolateControlPoints(p0: BABYLON.Vector2, p1: BABYLON.Vector2, u: number, p2: BABYLON.Vector2, v: number, p3: BABYLON.Vector2): BABYLON.Vector2[] | undefined;
        deselectAnimation(): void;
        /**
         * Core functions
         * This section handles main Curve Editor Functions.
         */
        selectAnimation(animation: BABYLON.Animation, coordinate?: SelectedCoordinate): void;
        setMainAnimatable(): void;
        isAnimationPlaying(): boolean;
        stopAnimation(): void;
        setIsLooping(): void;
        setFramesPerSecond(fps: number): void;
        analizeAnimationForLerp(animation: BABYLON.Animation | null): boolean;
        /**
         * Timeline
         * This section controls the timeline.
         */
        changeCurrentFrame(frame: number): void;
        setCanvasPosition(frame: number): void;
        setCurrentFrame(direction: number): void;
        changeAnimationLimit(limit: number): void;
        updateFrameInKeyFrame(frame: number, index: number): void;
        playPause(direction: number): void;
        moveFrameTo(e: React.MouseEvent<SVGRectElement, MouseEvent>): void;
        registerObs(): void;
        componentWillUnmount(): void;
        isCurrentFrame(frame: number): boolean;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPopupComponentProps {
        id: string;
        title: string;
        size: {
            width: number;
            height: number;
        };
        onOpen: (window: Window) => void;
        onClose: (window: Window) => void;
    }
    export class PopupComponent extends React.Component<IPopupComponentProps, {
        isComponentMounted: boolean;
        blockedByBrowser: boolean;
    }> {
        private _container;
        private _window;
        private _curveEditorHost;
        constructor(props: IPopupComponentProps);
        componentDidMount(): void;
        openPopup(): void;
        componentWillUnmount(): void;
        getWindow(): Window | null;
        render(): React.ReactPortal | null;
    }
}
declare module INSPECTOR {
    interface IAnimationGridComponentProps {
        globalState: GlobalState;
        animatable: BABYLON.IAnimatable;
        scene: BABYLON.Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class AnimationGridComponent extends React.Component<IAnimationGridComponentProps, {
        currentFrame: number;
    }> {
        private _animations;
        private _ranges;
        private _mainAnimatable;
        private _onBeforeRenderObserver;
        private _isPlaying;
        private timelineRef;
        private _isCurveEditorOpen;
        private _animationControl;
        constructor(props: IAnimationGridComponentProps);
        playOrPause(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        onCurrentFrameChange(value: number): void;
        onChangeFromOrTo(): void;
        onOpenAnimationCurveEditor(): void;
        onCloseAnimationCurveEditor(window: Window | null): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICommonMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.Material;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonMaterialPropertyGridComponent extends React.Component<ICommonMaterialPropertyGridComponentProps> {
        constructor(props: ICommonMaterialPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.Material;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class MaterialPropertyGridComponent extends React.Component<IMaterialPropertyGridComponentProps> {
        constructor(props: IMaterialPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export interface ITextureLinkLineComponentProps {
        label: string;
        texture: BABYLON.Nullable<BABYLON.BaseTexture>;
        material?: BABYLON.Material;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onDebugSelectionChangeObservable?: BABYLON.Observable<TextureLinkLineComponent>;
        propertyName?: string;
        onTextureCreated?: (texture: BABYLON.BaseTexture) => void;
        customDebugAction?: (state: boolean) => void;
        onTextureRemoved?: () => void;
    }
    export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, {
        isDebugSelected: boolean;
    }> {
        private _onDebugSelectionChangeObserver;
        constructor(props: ITextureLinkLineComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        debugTexture(): void;
        onLink(): void;
        updateTexture(file: File): void;
        removeTexture(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface IStandardMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.StandardMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class StandardMaterialPropertyGridComponent extends React.Component<IStandardMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IStandardMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    /** @hidden */
    export var lodPixelShader: {
        name: string;
        shader: string;
    };
}
declare module INSPECTOR {
    /** @hidden */
    export var lodCubePixelShader: {
        name: string;
        shader: string;
    };
}
declare module INSPECTOR {
    export interface TextureChannelsToDisplay {
        R: boolean;
        G: boolean;
        B: boolean;
        A: boolean;
    }
    export class TextureHelper {
        private static _ProcessAsync;
        static GetTextureDataAsync(texture: BABYLON.BaseTexture, width: number, height: number, face: number, channels: TextureChannelsToDisplay, globalState?: GlobalState, lod?: number): Promise<Uint8Array>;
    }
}
declare module INSPECTOR {
    interface ITextureLineComponentProps {
        texture: BABYLON.BaseTexture;
        width: number;
        height: number;
        globalState?: GlobalState;
        hideChannelSelect?: boolean;
    }
    export class TextureLineComponent extends React.Component<ITextureLineComponentProps, {
        channels: TextureChannelsToDisplay;
        face: number;
    }> {
        private canvasRef;
        private static TextureChannelStates;
        constructor(props: ITextureLineComponentProps);
        shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: {
            channels: TextureChannelsToDisplay;
            face: number;
        }): boolean;
        componentDidMount(): void;
        componentDidUpdate(): void;
        updatePreview(): Promise<void>;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export interface ITool extends IToolData {
        instance: IToolType;
    }
    interface IToolBarProps {
        tools: ITool[];
        addTool(url: string): void;
        changeTool(toolIndex: number): void;
        activeToolIndex: number;
        metadata: IMetadata;
        setMetadata(data: any): void;
        pickerOpen: boolean;
        setPickerOpen(open: boolean): void;
        pickerRef: React.RefObject<HTMLDivElement>;
        hasAlpha: boolean;
    }
    interface IToolBarState {
        toolURL: string;
        addOpen: boolean;
    }
    export class ToolBar extends React.Component<IToolBarProps, IToolBarState> {
        constructor(props: IToolBarProps);
        computeRGBAColor(): string;
        shouldComponentUpdate(nextProps: IToolBarProps): boolean;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export interface IChannel {
        visible: boolean;
        editable: boolean;
        name: string;
        id: 'R' | 'G' | 'B' | 'A';
        icon: any;
    }
    interface IChannelsBarProps {
        channels: IChannel[];
        setChannels(channelState: IChannel[]): void;
    }
    export class ChannelsBar extends React.PureComponent<IChannelsBarProps> {
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export const canvasShader: {
        path: {
            vertexSource: string;
            fragmentSource: string;
        };
        options: {
            attributes: string[];
            uniforms: string[];
        };
    };
}
declare module INSPECTOR {
    export interface IPixelData {
        x?: number;
        y?: number;
        r?: number;
        g?: number;
        b?: number;
        a?: number;
    }
    export class TextureCanvasManager {
        private _engine;
        private _scene;
        private _camera;
        private _cameraPos;
        private _scale;
        private _isPanning;
        private _mouseX;
        private _mouseY;
        private _UICanvas;
        private _size;
        /** The canvas we paint onto using the canvas API */
        private _2DCanvas;
        /** The canvas we apply post processes to */
        private _3DCanvas;
        /** The canvas which handles channel filtering */
        private _channelsTexture;
        private _3DEngine;
        private _3DPlane;
        private _3DCanvasTexture;
        private _3DScene;
        private _channels;
        private _face;
        private _mipLevel;
        /** The texture from the original engine that we invoked the editor on */
        private _originalTexture;
        /** This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
        private _target;
        /** The internal texture representation of the original texture */
        private _originalInternalTexture;
        /** Keeps track of whether we have modified the texture */
        private _didEdit;
        private _plane;
        private _planeMaterial;
        /** Tracks which keys are currently pressed */
        private _keyMap;
        private readonly ZOOM_MOUSE_SPEED;
        private readonly ZOOM_KEYBOARD_SPEED;
        private readonly ZOOM_IN_KEY;
        private readonly ZOOM_OUT_KEY;
        private readonly PAN_SPEED;
        private readonly PAN_MOUSE_BUTTON;
        private readonly MIN_SCALE;
        private readonly GRID_SCALE;
        private readonly MAX_SCALE;
        private readonly SELECT_ALL_KEY;
        private readonly SAVE_KEY;
        private readonly RESET_KEY;
        private readonly DESELECT_KEY;
        /** The number of milliseconds between texture updates */
        private readonly PUSH_FREQUENCY;
        private _tool;
        private _setPixelData;
        private _setMipLevel;
        private _window;
        private _metadata;
        private _editing3D;
        private _onUpdate;
        private _setMetadata;
        private _imageData;
        private _canPush;
        private _shouldPush;
        private _paintCanvas;
        constructor(texture: BABYLON.BaseTexture, window: Window, canvasUI: HTMLCanvasElement, canvas2D: HTMLCanvasElement, canvas3D: HTMLCanvasElement, setPixelData: (pixelData: IPixelData) => void, metadata: IMetadata, onUpdate: () => void, setMetadata: (metadata: any) => void, setMipLevel: (level: number) => void);
        updateTexture(): Promise<void>;
        private pushTexture;
        startPainting(): Promise<CanvasRenderingContext2D>;
        updatePainting(): void;
        stopPainting(): void;
        private updateDisplay;
        set channels(channels: IChannel[]);
        paintPixelsOnCanvas(pixelData: Uint8Array, canvas: HTMLCanvasElement): void;
        grabOriginalTexture(): Promise<Uint8Array>;
        getMouseCoordinates(pointerInfo: BABYLON.PointerInfo): BABYLON.Vector2;
        get scene(): BABYLON.Scene;
        get canvas2D(): HTMLCanvasElement;
        get size(): BABYLON.ISize;
        set tool(tool: BABYLON.Nullable<ITool>);
        get tool(): BABYLON.Nullable<ITool>;
        set face(face: number);
        set mipLevel(mipLevel: number);
        /** Returns the 3D scene used for postprocesses */
        get scene3D(): BABYLON.Scene;
        set metadata(metadata: IMetadata);
        private makePlane;
        reset(): void;
        resize(newSize: BABYLON.ISize): Promise<void>;
        setSize(size: BABYLON.ISize): void;
        upload(file: File): void;
        saveTexture(): void;
        dispose(): void;
    }
}
declare module INSPECTOR {
    interface IPropertiesBarProps {
        texture: BABYLON.BaseTexture;
        size: BABYLON.ISize;
        saveTexture(): void;
        pixelData: IPixelData;
        face: number;
        setFace(face: number): void;
        resetTexture(): void;
        resizeTexture(width: number, height: number): void;
        uploadTexture(file: File): void;
        mipLevel: number;
        setMipLevel: (mipLevel: number) => void;
    }
    interface IPropertiesBarState {
        width: number;
        height: number;
    }
    export class PropertiesBar extends React.PureComponent<IPropertiesBarProps, IPropertiesBarState> {
        private _resetButton;
        private _uploadButton;
        private _saveButton;
        private _babylonLogo;
        private _resizeButton;
        private _mipUp;
        private _mipDown;
        private _faces;
        constructor(props: IPropertiesBarProps);
        private pixelData;
        private getNewDimension;
        componentWillUpdate(nextProps: IPropertiesBarProps): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IBottomBarProps {
        texture: BABYLON.BaseTexture;
        mipLevel: number;
    }
    export class BottomBar extends React.PureComponent<IBottomBarProps> {
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITextureCanvasComponentProps {
        canvasUI: React.RefObject<HTMLCanvasElement>;
        canvas2D: React.RefObject<HTMLCanvasElement>;
        canvas3D: React.RefObject<HTMLCanvasElement>;
        texture: BABYLON.BaseTexture;
    }
    export class TextureCanvasComponent extends React.Component<ITextureCanvasComponentProps> {
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export const Paintbrush: IToolData;
}
declare module INSPECTOR {
    export const Eyedropper: IToolData;
}
declare module INSPECTOR {
    export const Floodfill: IToolData;
}
declare module INSPECTOR {
    export const Contrast: IToolData;
}
declare module INSPECTOR {
    export const RectangleSelect: IToolData;
}
declare module INSPECTOR {
    const _default: import("babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/textures/textureEditorComponent").IToolData[];
    export default _default;
}
declare module INSPECTOR {
    interface IToolSettingsProps {
        tool: ITool | undefined;
    }
    export class ToolSettings extends React.Component<IToolSettingsProps> {
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITextureEditorComponentProps {
        texture: BABYLON.BaseTexture;
        url: string;
        window: React.RefObject<PopupComponent>;
        onUpdate: () => void;
    }
    interface ITextureEditorComponentState {
        tools: ITool[];
        activeToolIndex: number;
        metadata: IMetadata;
        channels: IChannel[];
        pixelData: IPixelData;
        face: number;
        mipLevel: number;
        pickerOpen: boolean;
    }
    export interface IToolParameters {
        /** The visible scene in the editor. Useful for adding pointer and keyboard events. */
        scene: BABYLON.Scene;
        /** The 2D canvas which you can sample pixel data from. Tools should not paint directly on this canvas. */
        canvas2D: HTMLCanvasElement;
        /** The 3D scene which tools can add post processes to. */
        scene3D: BABYLON.Scene;
        /** The size of the texture. */
        size: BABYLON.ISize;
        /** Pushes the editor texture back to the original scene. This should be called every time a tool makes any modification to a texture. */
        updateTexture: () => void;
        /** The metadata object which is shared between all tools. Feel free to store any information here. Do not set this directly: instead call setMetadata. */
        metadata: IMetadata;
        /** Call this when you want to mutate the metadata. */
        setMetadata: (data: any) => void;
        /** Returns the texture coordinates under the cursor */
        getMouseCoordinates: (pointerInfo: BABYLON.PointerInfo) => BABYLON.Vector2;
        /** Provides access to the BABYLON namespace */
        BABYLON: any;
        /** Provides a canvas that you can use the canvas API to paint on. */
        startPainting: () => Promise<CanvasRenderingContext2D>;
        /** After you have painted on your canvas, call this method to push the updates back to the texture. */
        updatePainting: () => void;
        /** Call this when you are finished painting. */
        stopPainting: () => void;
    }
    export interface IToolGUIProps {
        instance: IToolType;
    }
    /** An interface representing the definition of a tool */
    export interface IToolData {
        /** Name to display on the toolbar */
        name: string;
        /** A class definition for the tool including setup and cleanup methods */
        type: IToolConstructable;
        /**  An SVG icon encoded in Base64 */
        icon: string;
        /** Whether the tool uses postprocesses */
        is3D?: boolean;
        cursor?: string;
        settingsComponent?: React.ComponentType<IToolGUIProps>;
    }
    export interface IToolType {
        /** Called when the tool is selected. */
        setup: () => void;
        /** Called when the tool is deselected. */
        cleanup: () => void;
        /** Optional. Called when the user resets the texture or uploads a new texture. Tools may want to reset their state when this happens. */
        onReset?: () => void;
    }
    /** For constructable types, TS requires that you define a seperate interface which constructs your actual interface */
    interface IToolConstructable {
        new (getParameters: () => IToolParameters): IToolType;
    }
    export interface IMetadata {
        color: string;
        alpha: number;
        select: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        };
        [key: string]: any;
    }
    global {
        var _TOOL_DATA_: IToolData;
    }
    export class TextureEditorComponent extends React.Component<ITextureEditorComponentProps, ITextureEditorComponentState> {
        private _textureCanvasManager;
        private _UICanvas;
        private _2DCanvas;
        private _3DCanvas;
        private _pickerRef;
        private _timer;
        private static PREVIEW_UPDATE_DELAY_MS;
        constructor(props: ITextureEditorComponentProps);
        componentDidMount(): void;
        componentDidUpdate(): void;
        componentWillUnmount(): void;
        textureDidUpdate(): void;
        loadToolFromURL(url: string): void;
        addTools(tools: IToolData[]): void;
        getToolParameters(): IToolParameters;
        changeTool(index: number): void;
        setMetadata(newMetadata: any): void;
        setPickerOpen(open: boolean): void;
        onPointerDown(evt: React.PointerEvent): void;
        saveTexture(): void;
        resetTexture(): void;
        resizeTexture(width: number, height: number): void;
        uploadTexture(file: File): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITexturePropertyGridComponentProps {
        texture: BABYLON.BaseTexture;
        lockObject: LockObject;
        globalState: GlobalState;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    interface ITexturePropertyGridComponentState {
        isTextureEditorOpen: boolean;
        textureEditing: BABYLON.Nullable<BABYLON.BaseTexture>;
    }
    export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps, ITexturePropertyGridComponentState> {
        private _adtInstrumentation;
        private popoutWindowRef;
        private textureLineRef;
        private _textureInspectorSize;
        constructor(props: ITexturePropertyGridComponentProps);
        componentWillUnmount(): void;
        updateTexture(file: File): void;
        openTextureEditor(): void;
        onOpenTextureEditor(window: Window): void;
        onCloseTextureEditor(callback?: {
            (): void;
        }): void;
        forceRefresh(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IPBRMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.PBRMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class PBRMaterialPropertyGridComponent extends React.Component<IPBRMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IPBRMaterialPropertyGridComponentProps);
        switchAmbientMode(state: boolean): void;
        switchMetallicMode(state: boolean): void;
        switchRoughnessMode(state: boolean): void;
        renderTextures(onDebugSelectionChangeObservable: BABYLON.Observable<TextureLinkLineComponent>): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IFogPropertyGridComponentProps {
        globalState: GlobalState;
        scene: BABYLON.Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class FogPropertyGridComponent extends React.Component<IFogPropertyGridComponentProps, {
        mode: number;
    }> {
        constructor(props: IFogPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IScenePropertyGridComponentProps {
        globalState: GlobalState;
        scene: BABYLON.Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
    }
    export class ScenePropertyGridComponent extends React.Component<IScenePropertyGridComponentProps> {
        private _storedEnvironmentTexture;
        private _renderingModeGroupObservable;
        constructor(props: IScenePropertyGridComponentProps);
        setRenderingModes(point: boolean, wireframe: boolean): void;
        switchIBL(): void;
        updateEnvironmentTexture(file: File): void;
        updateGravity(newValue: BABYLON.Vector3): void;
        updateTimeStep(newValue: number): void;
        normalizeScene(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICommonLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: BABYLON.Light;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonLightPropertyGridComponent extends React.Component<ICommonLightPropertyGridComponentProps> {
        constructor(props: ICommonLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IHemisphericLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: BABYLON.HemisphericLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class HemisphericLightPropertyGridComponent extends React.Component<IHemisphericLightPropertyGridComponentProps> {
        constructor(props: IHemisphericLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICommonShadowLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: BABYLON.IShadowLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonShadowLightPropertyGridComponent extends React.Component<ICommonShadowLightPropertyGridComponentProps> {
        private _internals;
        constructor(props: ICommonShadowLightPropertyGridComponentProps);
        createShadowGenerator(): void;
        disposeShadowGenerator(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPointLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: BABYLON.PointLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class PointLightPropertyGridComponent extends React.Component<IPointLightPropertyGridComponentProps> {
        constructor(props: IPointLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface ICommonCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: BABYLON.Camera;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonCameraPropertyGridComponent extends React.Component<ICommonCameraPropertyGridComponentProps, {
        mode: number;
    }> {
        constructor(props: ICommonCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IFreeCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: BABYLON.FreeCamera;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class FreeCameraPropertyGridComponent extends React.Component<IFreeCameraPropertyGridComponentProps> {
        constructor(props: IFreeCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IArcRotateCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: BABYLON.ArcRotateCamera;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ArcRotateCameraPropertyGridComponent extends React.Component<IArcRotateCameraPropertyGridComponentProps> {
        constructor(props: IArcRotateCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface ICommonPropertyGridComponentProps {
        globalState: GlobalState;
        host: {
            metadata: any;
        };
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonPropertyGridComponent extends React.Component<ICommonPropertyGridComponentProps> {
        constructor(props: ICommonPropertyGridComponentProps);
        renderLevel(jsonObject: any): JSX.Element[];
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface IVariantsPropertyGridComponentProps {
        globalState: GlobalState;
        host: any;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class VariantsPropertyGridComponent extends React.Component<IVariantsPropertyGridComponentProps> {
        constructor(props: IVariantsPropertyGridComponentProps);
        private _getVariantsExtension;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface IMeshPropertyGridComponentProps {
        globalState: GlobalState;
        mesh: BABYLON.Mesh;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class MeshPropertyGridComponent extends React.Component<IMeshPropertyGridComponentProps, {
        displayNormals: boolean;
        displayVertexColors: boolean;
        displayBoneWeights: boolean;
        displayBoneIndex: number;
        displaySkeletonMap: boolean;
    }> {
        constructor(props: IMeshPropertyGridComponentProps);
        renderWireframeOver(): void;
        renderNormalVectors(): void;
        displayNormals(): void;
        displayVertexColors(): void;
        displayBoneWeights(): void;
        displaySkeletonMap(): void;
        onBoneDisplayIndexChange(value: number): void;
        onMaterialLink(): void;
        onSourceMeshLink(): void;
        onSkeletonLink(): void;
        convertPhysicsTypeToString(): string;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITransformNodePropertyGridComponentProps {
        globalState: GlobalState;
        transformNode: BABYLON.TransformNode;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TransformNodePropertyGridComponent extends React.Component<ITransformNodePropertyGridComponentProps> {
        constructor(props: ITransformNodePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IBackgroundMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.BackgroundMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class BackgroundMaterialPropertyGridComponent extends React.Component<IBackgroundMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IBackgroundMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICommonControlPropertyGridComponentProps {
        globalState: GlobalState;
        control: BABYLON.GUI.Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
        constructor(props: ICommonControlPropertyGridComponentProps);
        renderGridInformation(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IControlPropertyGridComponentProps {
        globalState: GlobalState;
        control: BABYLON.GUI.Control;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
        constructor(props: IControlPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITextBlockPropertyGridComponentProps {
        globalState: GlobalState;
        textBlock: BABYLON.GUI.TextBlock;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
        constructor(props: ITextBlockPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IInputTextPropertyGridComponentProps {
        globalState: GlobalState;
        inputText: BABYLON.GUI.InputText;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
        constructor(props: IInputTextPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IColorPickerPropertyGridComponentProps {
        globalState: GlobalState;
        colorPicker: BABYLON.GUI.ColorPicker;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
        constructor(props: IColorPickerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationGroupGridComponentProps {
        globalState: GlobalState;
        animationGroup: BABYLON.AnimationGroup;
        scene: BABYLON.Scene;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class AnimationGroupGridComponent extends React.Component<IAnimationGroupGridComponentProps, {
        playButtonText: string;
        currentFrame: number;
    }> {
        private _onAnimationGroupPlayObserver;
        private _onAnimationGroupPauseObserver;
        private _onBeforeRenderObserver;
        private timelineRef;
        constructor(props: IAnimationGroupGridComponentProps);
        disconnect(animationGroup: BABYLON.AnimationGroup): void;
        connect(animationGroup: BABYLON.AnimationGroup): void;
        updateCurrentFrame(animationGroup: BABYLON.AnimationGroup): void;
        shouldComponentUpdate(nextProps: IAnimationGroupGridComponentProps): boolean;
        componentWillUnmount(): void;
        playOrPause(): void;
        onCurrentFrameChange(value: number): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IImagePropertyGridComponentProps {
        globalState: GlobalState;
        image: BABYLON.GUI.Image;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
        constructor(props: IImagePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISliderPropertyGridComponentProps {
        globalState: GlobalState;
        slider: BABYLON.GUI.Slider;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
        constructor(props: ISliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IImageBasedSliderPropertyGridComponentProps {
        globalState: GlobalState;
        imageBasedSlider: BABYLON.GUI.ImageBasedSlider;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
        constructor(props: IImageBasedSliderPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IRectanglePropertyGridComponentProps {
        globalState: GlobalState;
        rectangle: BABYLON.GUI.Rectangle;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
        constructor(props: IRectanglePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IEllipsePropertyGridComponentProps {
        globalState: GlobalState;
        ellipse: BABYLON.GUI.Ellipse;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
        constructor(props: IEllipsePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICheckboxPropertyGridComponentProps {
        globalState: GlobalState;
        checkbox: BABYLON.GUI.Checkbox;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
        constructor(props: ICheckboxPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IRadioButtonPropertyGridComponentProps {
        globalState: GlobalState;
        radioButton: BABYLON.GUI.RadioButton;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
        constructor(props: IRadioButtonPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ILinePropertyGridComponentProps {
        globalState: GlobalState;
        line: BABYLON.GUI.Line;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
        constructor(props: ILinePropertyGridComponentProps);
        onDashChange(value: string): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IScrollViewerPropertyGridComponentProps {
        globalState: GlobalState;
        scrollViewer: BABYLON.GUI.ScrollViewer;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
        constructor(props: IScrollViewerPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IGridPropertyGridComponentProps {
        globalState: GlobalState;
        grid: BABYLON.GUI.Grid;
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
declare module INSPECTOR {
    interface IPBRMetallicRoughnessMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.PBRMetallicRoughnessMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class PBRMetallicRoughnessMaterialPropertyGridComponent extends React.Component<IPBRMetallicRoughnessMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IPBRMetallicRoughnessMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPBRSpecularGlossinessMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.PBRSpecularGlossinessMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class PBRSpecularGlossinessMaterialPropertyGridComponent extends React.Component<IPBRSpecularGlossinessMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: IPBRSpecularGlossinessMaterialPropertyGridComponentProps);
        renderTextures(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IStackPanelPropertyGridComponentProps {
        globalState: GlobalState;
        stackPanel: BABYLON.GUI.StackPanel;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
        constructor(props: IStackPanelPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICommonPostProcessPropertyGridComponentProps {
        globalState: GlobalState;
        postProcess: BABYLON.PostProcess;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonPostProcessPropertyGridComponent extends React.Component<ICommonPostProcessPropertyGridComponentProps> {
        constructor(props: ICommonPostProcessPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPostProcessPropertyGridComponentProps {
        globalState: GlobalState;
        postProcess: BABYLON.PostProcess;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class PostProcessPropertyGridComponent extends React.Component<IPostProcessPropertyGridComponentProps> {
        constructor(props: IPostProcessPropertyGridComponentProps);
        edit(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICommonRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: BABYLON.PostProcessRenderPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CommonRenderingPipelinePropertyGridComponent extends React.Component<ICommonRenderingPipelinePropertyGridComponentProps> {
        constructor(props: ICommonRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: BABYLON.PostProcessRenderPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class RenderingPipelinePropertyGridComponent extends React.Component<IRenderingPipelinePropertyGridComponentProps> {
        constructor(props: IRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IDefaultRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: BABYLON.DefaultRenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class DefaultRenderingPipelinePropertyGridComponent extends React.Component<IDefaultRenderingPipelinePropertyGridComponentProps> {
        constructor(props: IDefaultRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISSAORenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: BABYLON.SSAORenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SSAORenderingPipelinePropertyGridComponent extends React.Component<ISSAORenderingPipelinePropertyGridComponentProps> {
        constructor(props: ISSAORenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISSAO2RenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: BABYLON.SSAO2RenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SSAO2RenderingPipelinePropertyGridComponent extends React.Component<ISSAO2RenderingPipelinePropertyGridComponentProps> {
        constructor(props: ISSAO2RenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISkeletonPropertyGridComponentProps {
        globalState: GlobalState;
        skeleton: BABYLON.Skeleton;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SkeletonPropertyGridComponent extends React.Component<ISkeletonPropertyGridComponentProps> {
        private _skeletonViewersEnabled;
        private _skeletonViewerDisplayOptions;
        private _skeletonViewers;
        constructor(props: ISkeletonPropertyGridComponentProps);
        switchSkeletonViewers(): void;
        checkSkeletonViewerState(props: ISkeletonPropertyGridComponentProps): void;
        changeDisplayMode(): void;
        changeDisplayOptions(option: string, value: number): void;
        shouldComponentUpdate(nextProps: ISkeletonPropertyGridComponentProps): boolean;
        onOverrideMeshLink(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IBonePropertyGridComponentProps {
        globalState: GlobalState;
        bone: BABYLON.Bone;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class BonePropertyGridComponent extends React.Component<IBonePropertyGridComponentProps> {
        constructor(props: IBonePropertyGridComponentProps);
        onTransformNodeLink(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IDirectionalLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: BABYLON.DirectionalLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class DirectionalLightPropertyGridComponent extends React.Component<IDirectionalLightPropertyGridComponentProps> {
        constructor(props: IDirectionalLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISpotLightPropertyGridComponentProps {
        globalState: GlobalState;
        light: BABYLON.SpotLight;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SpotLightPropertyGridComponent extends React.Component<ISpotLightPropertyGridComponentProps> {
        constructor(props: ISpotLightPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ILenstRenderingPipelinePropertyGridComponentProps {
        globalState: GlobalState;
        renderPipeline: BABYLON.LensRenderingPipeline;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class LensRenderingPipelinePropertyGridComponent extends React.Component<ILenstRenderingPipelinePropertyGridComponentProps> {
        constructor(props: ILenstRenderingPipelinePropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
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
declare module INSPECTOR {
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
declare module INSPECTOR {
    export interface IPropertyComponentProps {
        globalState: GlobalState;
        block: BABYLON.NodeMaterialBlock;
    }
}
declare module INSPECTOR {
    export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
        private _gradientBlock;
        constructor(props: IPropertyComponentProps);
        forceRebuild(): void;
        deleteStep(step: BABYLON.GradientBlockColorStep): void;
        addNewStep(): void;
        checkForReOrder(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface INodeMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.NodeMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class NodeMaterialPropertyGridComponent extends React.Component<INodeMaterialPropertyGridComponentProps> {
        private _onDebugSelectionChangeObservable;
        constructor(props: INodeMaterialPropertyGridComponentProps);
        edit(): void;
        renderTextures(): JSX.Element | null;
        renderInputBlock(block: BABYLON.InputBlock): JSX.Element | null;
        renderInputValues(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMultiMaterialPropertyGridComponentProps {
        globalState: GlobalState;
        material: BABYLON.MultiMaterial;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class MultiMaterialPropertyGridComponent extends React.Component<IMultiMaterialPropertyGridComponentProps> {
        constructor(props: IMultiMaterialPropertyGridComponentProps);
        onMaterialLink(mat: BABYLON.Material): void;
        renderChildMaterial(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IBoxEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.BoxParticleEmitter;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class BoxEmitterGridComponent extends React.Component<IBoxEmitterGridComponentProps> {
        constructor(props: IBoxEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IConeEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.ConeParticleEmitter;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ConeEmitterGridComponent extends React.Component<IConeEmitterGridComponentProps> {
        constructor(props: IConeEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICylinderEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.CylinderParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class CylinderEmitterGridComponent extends React.Component<ICylinderEmitterGridComponentProps> {
        constructor(props: ICylinderEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IHemisphericEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.HemisphericParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class HemisphericEmitterGridComponent extends React.Component<IHemisphericEmitterGridComponentProps> {
        constructor(props: IHemisphericEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPointEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.PointParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class PointEmitterGridComponent extends React.Component<IPointEmitterGridComponentProps> {
        constructor(props: IPointEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISphereEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.SphereParticleEmitter;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SphereEmitterGridComponent extends React.Component<ISphereEmitterGridComponentProps> {
        constructor(props: ISphereEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMeshPickerComponentProps {
        globalState: GlobalState;
        target: any;
        property: string;
        scene: BABYLON.Scene;
        label: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class MeshPickerComponent extends React.Component<IMeshPickerComponentProps> {
        constructor(props: IMeshPickerComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMeshEmitterGridComponentProps {
        globalState: GlobalState;
        emitter: BABYLON.MeshParticleEmitter;
        scene: BABYLON.Scene;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class MeshEmitterGridComponent extends React.Component<IMeshEmitterGridComponentProps> {
        constructor(props: IMeshEmitterGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IFactorGradientStepGridComponent {
        globalState: GlobalState;
        gradient: BABYLON.FactorGradient;
        lockObject: LockObject;
        lineIndex: number;
        onDelete: () => void;
        onUpdateGradient: () => void;
        onCheckForReOrder: () => void;
        host: BABYLON.IParticleSystem;
        codeRecorderPropertyName: string;
    }
    export class FactorGradientStepGridComponent extends React.Component<IFactorGradientStepGridComponent, {
        gradient: number;
        factor1: string;
        factor2?: string;
    }> {
        constructor(props: IFactorGradientStepGridComponent);
        shouldComponentUpdate(nextProps: IFactorGradientStepGridComponent, nextState: {
            gradient: number;
            factor1: string;
            factor2?: string;
        }): boolean;
        updateFactor1(valueString: string): void;
        updateFactor2(valueString: string): void;
        updateGradient(gradient: number): void;
        onPointerUp(): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IColorGradientStepGridComponent {
        globalState: GlobalState;
        gradient: BABYLON.ColorGradient | BABYLON.Color3Gradient;
        lockObject: LockObject;
        lineIndex: number;
        isColor3: boolean;
        onDelete: () => void;
        onUpdateGradient: () => void;
        onCheckForReOrder: () => void;
        host: BABYLON.IParticleSystem;
        codeRecorderPropertyName: string;
    }
    export class ColorGradientStepGridComponent extends React.Component<IColorGradientStepGridComponent, {
        gradient: number;
    }> {
        constructor(props: IColorGradientStepGridComponent);
        updateColor1(color: string): void;
        updateColor2(color: string): void;
        updateGradient(gradient: number): void;
        onPointerUp(): void;
        lock(): void;
        unlock(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    export enum GradientGridMode {
        Factor = 0,
        BABYLON.Color3 = 1,
        BABYLON.Color4 = 2
    }
    interface IValueGradientGridComponent {
        globalState: GlobalState;
        label: string;
        gradients: BABYLON.Nullable<Array<BABYLON.IValueGradient>>;
        lockObject: LockObject;
        docLink?: string;
        mode: GradientGridMode;
        host: BABYLON.IParticleSystem;
        codeRecorderPropertyName: string;
        onCreateRequired: () => void;
    }
    export class ValueGradientGridComponent extends React.Component<IValueGradientGridComponent> {
        constructor(props: IValueGradientGridComponent);
        deleteStep(step: BABYLON.IValueGradient): void;
        addNewStep(): void;
        checkForReOrder(): void;
        updateAndSync(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IParticleSystemPropertyGridComponentProps {
        globalState: GlobalState;
        system: BABYLON.IParticleSystem;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class ParticleSystemPropertyGridComponent extends React.Component<IParticleSystemPropertyGridComponentProps> {
        private _snippetUrl;
        constructor(props: IParticleSystemPropertyGridComponentProps);
        renderEmitter(): JSX.Element | null;
        raiseOnPropertyChanged(property: string, newValue: any, previousValue: any): void;
        renderControls(): JSX.Element;
        saveToFile(): void;
        loadFromFile(file: File): void;
        loadFromSnippet(): void;
        saveToSnippet(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISpriteManagerPropertyGridComponentProps {
        globalState: GlobalState;
        spriteManager: BABYLON.SpriteManager;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SpriteManagerPropertyGridComponent extends React.Component<ISpriteManagerPropertyGridComponentProps> {
        private _snippetUrl;
        constructor(props: ISpriteManagerPropertyGridComponentProps);
        addNewSprite(): void;
        disposeManager(): void;
        saveToFile(): void;
        loadFromFile(file: File): void;
        loadFromSnippet(): void;
        saveToSnippet(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISpritePropertyGridComponentProps {
        globalState: GlobalState;
        sprite: BABYLON.Sprite;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
    }
    export class SpritePropertyGridComponent extends React.Component<ISpritePropertyGridComponentProps> {
        private canvasRef;
        private imageData;
        private cachedCellIndex;
        constructor(props: ISpritePropertyGridComponentProps);
        onManagerLink(): void;
        switchPlayStopState(): void;
        disposeSprite(): void;
        componentDidMount(): void;
        componentDidUpdate(): void;
        shouldComponentUpdate(nextProps: ISpritePropertyGridComponentProps): boolean;
        updatePreview(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITargetedAnimationGridComponentProps {
        globalState: GlobalState;
        targetedAnimation: BABYLON.TargetedAnimation;
        scene: BABYLON.Scene;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TargetedAnimationGridComponent extends React.Component<ITargetedAnimationGridComponentProps> {
        private _isCurveEditorOpen;
        private _animationGroup;
        constructor(props: ITargetedAnimationGridComponentProps);
        onOpenAnimationCurveEditor(): void;
        onCloseAnimationCurveEditor(window: Window | null): void;
        playOrPause(): void;
        deleteAnimation(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IFollowCameraPropertyGridComponentProps {
        globalState: GlobalState;
        camera: BABYLON.FollowCamera;
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class FollowCameraPropertyGridComponent extends React.Component<IFollowCameraPropertyGridComponentProps> {
        constructor(props: IFollowCameraPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class PropertyGridTabComponent extends PaneComponent {
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPaneComponentProps);
        timerRefresh(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    export interface IHeaderComponentProps {
        title: string;
        handleBack?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        noCommands?: boolean;
        onPopup: () => void;
        onClose: () => void;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
    }
    export class HeaderComponent extends React.Component<IHeaderComponentProps, {
        isBackVisible: boolean;
    }> {
        private _backStack;
        private _onSelectionChangeObserver;
        constructor(props: IHeaderComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        goBack(): void;
        renderLogo(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMessageLineComponentProps {
        text: string;
        color?: string;
    }
    export class MessageLineComponent extends React.Component<IMessageLineComponentProps> {
        constructor(props: IMessageLineComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IGLTFComponentProps {
        scene: BABYLON.Scene;
        globalState: GlobalState;
    }
    export class GLTFComponent extends React.Component<IGLTFComponentProps> {
        private _onValidationResultsUpdatedObserver;
        openValidationDetails(): void;
        prepareText(singularForm: string, count: number): string;
        componentDidMount(): void;
        componentWillUnmount(): void;
        renderValidation(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    export class ToolsTabComponent extends PaneComponent {
        private _videoRecorder;
        private _screenShotSize;
        private _gifOptions;
        private _useWidthHeight;
        private _isExporting;
        private _gifWorkerBlob;
        private _gifRecorder;
        private _previousRenderingScale;
        private _crunchingGIF;
        constructor(props: IPaneComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        captureScreenshot(): void;
        captureRender(): void;
        recordVideo(): void;
        recordGIFInternal(): void;
        recordGIF(): void;
        importAnimations(event: any): void;
        shouldExport(node: BABYLON.Node): boolean;
        exportGLTF(): void;
        exportBabylon(): void;
        createEnvTexture(): void;
        exportReplay(): void;
        startRecording(): void;
        applyDelta(file: File): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    export class SettingsTabComponent extends PaneComponent {
        constructor(props: IPaneComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IActionTabsComponentProps {
        scene?: BABYLON.Scene;
        noCommands?: boolean;
        noHeader?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        popupMode?: boolean;
        onPopup?: () => void;
        onClose?: () => void;
        globalState?: GlobalState;
        initialTab?: BABYLON.DebugLayerTab;
    }
    export class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
        selectedEntity: any;
        selectedIndex: number;
    }> {
        private _onSelectionChangeObserver;
        private _onTabChangedObserver;
        private _once;
        constructor(props: IActionTabsComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        changeSelectedTab(index: number): void;
        renderContent(): JSX.Element | null;
        onClose(): void;
        onPopup(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITreeItemLabelComponentProps {
        label: string;
        onClick?: () => void;
        color: string;
    }
    export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps> {
        constructor(props: ITreeItemLabelComponentProps);
        onClick(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IMeshTreeItemComponentProps {
        mesh: BABYLON.AbstractMesh;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
    }
    export class MeshTreeItemComponent extends React.Component<IMeshTreeItemComponentProps, {
        isBoundingBoxEnabled: boolean;
        isVisible: boolean;
    }> {
        constructor(props: IMeshTreeItemComponentProps);
        showBoundingBox(): void;
        switchVisibility(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICameraTreeItemComponentProps {
        camera: BABYLON.Camera;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
    }
    export class CameraTreeItemComponent extends React.Component<ICameraTreeItemComponentProps, {
        isActive: boolean;
        isGizmoEnabled: boolean;
    }> {
        private _onBeforeRenderObserver;
        constructor(props: ICameraTreeItemComponentProps);
        setActive(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        toggleGizmo(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ILightTreeItemComponentProps {
        light: BABYLON.Light;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
        globalState: GlobalState;
    }
    export class LightTreeItemComponent extends React.Component<ILightTreeItemComponentProps, {
        isEnabled: boolean;
        isGizmoEnabled: boolean;
    }> {
        constructor(props: ILightTreeItemComponentProps);
        switchIsEnabled(): void;
        toggleGizmo(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMaterialTreeItemComponentProps {
        material: BABYLON.Material | BABYLON.NodeMaterial;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class MaterialTreeItemComponent extends React.Component<IMaterialTreeItemComponentProps> {
        constructor(props: IMaterialTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITextureTreeItemComponentProps {
        texture: BABYLON.Texture;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class TextureTreeItemComponent extends React.Component<ITextureTreeItemComponentProps> {
        constructor(props: ITextureTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITransformNodeItemComponentProps {
        transformNode: BABYLON.TransformNode;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class TransformNodeItemComponent extends React.Component<ITransformNodeItemComponentProps> {
        constructor(props: ITransformNodeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IControlTreeItemComponentProps {
        control: BABYLON.GUI.Control;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, {
        isActive: boolean;
        isVisible: boolean;
    }> {
        constructor(props: IControlTreeItemComponentProps);
        highlight(): void;
        switchVisibility(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAdvancedDynamicTextureTreeItemComponentProps {
        texture: BABYLON.GUI.AdvancedDynamicTexture;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onClick: () => void;
    }
    export class AdvancedDynamicTextureTreeItemComponent extends React.Component<IAdvancedDynamicTextureTreeItemComponentProps, {
        isInPickingMode: boolean;
    }> {
        private _onControlPickedObserver;
        constructor(props: IAdvancedDynamicTextureTreeItemComponentProps);
        componentWillUnmount(): void;
        onPickingMode(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationGroupItemComponentProps {
        animationGroup: BABYLON.AnimationGroup;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class AnimationGroupItemComponent extends React.Component<IAnimationGroupItemComponentProps> {
        constructor(props: IAnimationGroupItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPostProcessItemComponentProps {
        postProcess: BABYLON.PostProcess;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class PostProcessItemComponent extends React.Component<IPostProcessItemComponentProps> {
        constructor(props: IPostProcessItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IRenderPipelineItemComponenttProps {
        renderPipeline: BABYLON.PostProcessRenderPipeline;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class RenderingPipelineItemComponent extends React.Component<IRenderPipelineItemComponenttProps> {
        constructor(props: IRenderPipelineItemComponenttProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISkeletonTreeItemComponentProps {
        skeleton: BABYLON.Skeleton;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SkeletonTreeItemComponent extends React.Component<ISkeletonTreeItemComponentProps> {
        constructor(props: ISkeletonTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IBoneTreeItemComponenttProps {
        bone: BABYLON.Bone;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class BoneTreeItemComponent extends React.Component<IBoneTreeItemComponenttProps> {
        constructor(props: IBoneTreeItemComponenttProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IParticleSystemTreeItemComponentProps {
        system: BABYLON.IParticleSystem;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class ParticleSystemTreeItemComponent extends React.Component<IParticleSystemTreeItemComponentProps> {
        constructor(props: IParticleSystemTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISpriteManagerTreeItemComponentProps {
        spriteManager: BABYLON.SpriteManager;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SpriteManagerTreeItemComponent extends React.Component<ISpriteManagerTreeItemComponentProps> {
        constructor(props: ISpriteManagerTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISpriteTreeItemComponentProps {
        sprite: BABYLON.Sprite;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SpriteTreeItemComponent extends React.Component<ISpriteTreeItemComponentProps> {
        constructor(props: ISpriteTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITargetedAnimationItemComponentProps {
        targetedAnimation: BABYLON.TargetedAnimation;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class TargetedAnimationItemComponent extends React.Component<ITargetedAnimationItemComponentProps> {
        constructor(props: ITargetedAnimationItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITreeItemSpecializedComponentProps {
        label: string;
        entity?: any;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        globalState: GlobalState;
        onClick?: () => void;
    }
    export class TreeItemSpecializedComponent extends React.Component<ITreeItemSpecializedComponentProps> {
        constructor(props: ITreeItemSpecializedComponentProps);
        onClick(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class Tools {
        static LookForItem(item: any, selectedEntity: any): boolean;
        private static _RecursiveRemoveHiddenMeshesAndHoistChildren;
        static SortAndFilter(parent: any, items: any[]): any[];
    }
}
declare module INSPECTOR {
    export interface ITreeItemSelectableComponentProps {
        entity: any;
        selectedEntity?: any;
        mustExpand?: boolean;
        offset: number;
        globalState: GlobalState;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        filter: BABYLON.Nullable<string>;
    }
    export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, {
        isExpanded: boolean;
        isSelected: boolean;
    }> {
        private _wasSelected;
        constructor(props: ITreeItemSelectableComponentProps);
        switchExpandedState(): void;
        shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: {
            isExpanded: boolean;
            isSelected: boolean;
        }): boolean;
        scrollIntoView(): void;
        componentDidMount(): void;
        componentDidUpdate(): void;
        onSelect(): void;
        renderChildren(): JSX.Element[] | null;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    export interface ITreeItemComponentProps {
        items?: BABYLON.Nullable<any[]>;
        label: string;
        offset: number;
        filter: BABYLON.Nullable<string>;
        forceSubitems?: boolean;
        globalState: GlobalState;
        entity?: any;
        selectedEntity: any;
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
declare module INSPECTOR {
    interface ISceneTreeItemComponentProps {
        scene: BABYLON.Scene;
        onRefresh: () => void;
        selectedEntity?: any;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        globalState: GlobalState;
    }
    export class SceneTreeItemComponent extends React.Component<ISceneTreeItemComponentProps, {
        isSelected: boolean;
        isInPickingMode: boolean;
        gizmoMode: number;
    }> {
        private _gizmoLayerOnPointerObserver;
        private _onPointerObserver;
        private _onSelectionChangeObserver;
        private _selectedEntity;
        private _posDragEnd;
        private _scaleDragEnd;
        private _rotateDragEnd;
        constructor(props: ISceneTreeItemComponentProps);
        shouldComponentUpdate(nextProps: ISceneTreeItemComponentProps, nextState: {
            isSelected: boolean;
            isInPickingMode: boolean;
        }): boolean;
        componentDidMount(): void;
        componentWillUnmount(): void;
        onSelect(): void;
        onPickingMode(): void;
        setGizmoMode(mode: number): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ISceneExplorerFilterComponentProps {
        onFilter: (filter: string) => void;
    }
    export class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
        constructor(props: ISceneExplorerFilterComponentProps);
        render(): JSX.Element;
    }
    interface ISceneExplorerComponentProps {
        scene: BABYLON.Scene;
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
        scene: BABYLON.Scene;
    }> {
        private _onSelectionChangeObserver;
        private _onSelectionRenamedObserver;
        private _onNewSceneAddedObserver;
        private _onNewSceneObserver;
        private sceneExplorerRef;
        private _once;
        private _hooked;
        private sceneMutationFunc;
        constructor(props: ISceneExplorerComponentProps);
        processMutation(): void;
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
declare module INSPECTOR {
    interface IEmbedHostComponentProps {
        scene: BABYLON.Scene;
        globalState: GlobalState;
        popupMode: boolean;
        noClose?: boolean;
        noExpand?: boolean;
        onClose: () => void;
        onPopup: () => void;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        initialTab?: BABYLON.DebugLayerTab;
    }
    export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
        private _once;
        private splitRef;
        private topPartRef;
        private bottomPartRef;
        constructor(props: IEmbedHostComponentProps);
        componentDidMount(): void;
        renderContent(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class Inspector {
        private static _SceneExplorerHost;
        private static _ActionTabsHost;
        private static _EmbedHost;
        private static _NewCanvasContainer;
        private static _SceneExplorerWindow;
        private static _ActionTabsWindow;
        private static _EmbedHostWindow;
        private static _Scene;
        private static _OpenedPane;
        private static _OnBeforeRenderObserver;
        static OnSelectionChangeObservable: BABYLON.Observable<any>;
        static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        private static _GlobalState;
        static MarkLineContainerTitleForHighlighting(title: string): void;
        static MarkMultipleLineContainerTitlesForHighlighting(titles: string[]): void;
        private static _CopyStyles;
        private static _CreateSceneExplorer;
        private static _CreateActionTabs;
        private static _CreateEmbedHost;
        static _CreatePopup(title: string, windowVariableName: string, width?: number, height?: number, lateBinding?: boolean): HTMLDivElement | null;
        static get IsVisible(): boolean;
        static EarlyAttachToLoader(): void;
        static Show(scene: BABYLON.Scene, userOptions: Partial<BABYLON.IInspectorOptions>): void;
        static _SetNewScene(scene: BABYLON.Scene): void;
        static _CreateCanvasContainer(parentControl: HTMLElement): void;
        private static _DestroyCanvasContainer;
        private static _Cleanup;
        private static _RemoveElementFromDOM;
        static Hide(): void;
    }
}
declare module INSPECTOR {
    interface IPlayheadProps {
        frame: number;
        offset: number;
        onCurrentFrameChange: (frame: number) => void;
    }
    export class Playhead extends React.Component<IPlayheadProps> {
        private _direction;
        private _active;
        constructor(props: IPlayheadProps);
        dragStart(e: React.TouchEvent<HTMLDivElement>): void;
        dragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        drag(e: React.TouchEvent<HTMLDivElement>): void;
        drag(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        dragEnd(e: React.TouchEvent<HTMLDivElement>): void;
        dragEnd(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
        calculateMove(): string;
        render(): JSX.Element;
    }
}