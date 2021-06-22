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
        onExtensionLoadedObservable: BABYLON.Observable<import("babylonjs-loaders/glTF/index").IGLTFLoaderExtension>;
        glTFLoaderExtensionDefaults: {
            [name: string]: {
                [key: string]: any;
            };
        };
        glTFLoaderDefaults: {
            [key: string]: any;
        };
        glTFLoaderExtensions: {
            [key: string]: import("babylonjs-loaders/glTF/index").IGLTFLoaderExtension;
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
        prepareGLTFPlugin(loader: import("babylonjs-loaders/glTF/index").GLTFFileLoader): void;
        resetGLTFValidationResults(): void;
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
        icon?: string;
    }
    export class TextLineComponent extends React.Component<ITextLineComponentProps> {
        constructor(props: ITextLineComponentProps);
        onLink(): void;
        renderContent(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export interface ISelectedLineContainer {
        selectedLineContainerTitles: Array<string>;
        selectedLineContainerTitlesNoFocus: Array<string>;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IValueLineComponentProps {
        label: string;
        value: number;
        color?: string;
        fractionDigits?: number;
        units?: string;
        icon?: string;
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
        icon?: string;
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
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
        allowNullValue?: boolean;
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
        disabled?: boolean;
        icon?: string;
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
        icon?: string;
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
    interface INumericInputComponentProps {
        label: string;
        value: number;
        step?: number;
        onChange: (value: number) => void;
        precision?: number;
        icon?: string;
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
declare module INSPECTOR {
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
declare module INSPECTOR {
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
    export class BABYLON.GUI.ColorPicker extends React.Component<IColorPickerProps, IColorPickerState> {
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
declare module INSPECTOR {
    export interface IColorPickerComponentProps {
        value: BABYLON.Color4 | BABYLON.Color3;
        linearHint?: boolean;
        onColorChanged: (newOne: string) => void;
        icon?: string;
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
declare module INSPECTOR {
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
        isLinear?: boolean;
        icon?: string;
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
        icon?: string;
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
        _checkRoundCircle(a: number, b: number): boolean;
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
        icon?: string;
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
        icon?: string;
    }
    export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
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
        onOpen?: (window: Window) => void;
        onClose: (window: Window) => void;
        onResize?: () => void;
        onKeyUp?: (evt: KeyboardEvent) => void;
    }
    export class PopupComponent extends React.Component<IPopupComponentProps, {
        isComponentMounted: boolean;
        blockedByBrowser: boolean;
    }> {
        private _container;
        private _window;
        private _host;
        constructor(props: IPopupComponentProps);
        componentDidMount(): void;
        openPopup(): void;
        componentWillUnmount(): void;
        getWindow(): Window | null;
        render(): React.ReactPortal | null;
    }
}
declare module INSPECTOR {
    export interface KeyEntry {
        frame: number;
        value: number;
        inTangent?: number;
        outTangent?: number;
        lockedTangent: boolean;
    }
    export class Curve {
        static readonly SampleRate: number;
        keys: KeyEntry[];
        animation: BABYLON.Animation;
        color: string;
        onDataUpdatedObservable: BABYLON.Observable<void>;
        property?: string;
        tangentBuilder?: () => any;
        setDefaultInTangent?: (keyId: number) => any;
        setDefaultOutTangent?: (keyId: number) => any;
        static readonly TangentLength: number;
        constructor(color: string, animation: BABYLON.Animation, property?: string, tangentBuilder?: () => any, setDefaultInTangent?: (keyId: number) => any, setDefaultOutTangent?: (keyId: number) => any);
        gePathData(convertX: (x: number) => number, convertY: (y: number) => number): string;
        updateLockedTangentMode(keyIndex: number, enabled: boolean): void;
        getInControlPoint(keyIndex: number): number;
        getOutControlPoint(keyIndex: number): number;
        evaluateOutTangent(keyIndex: number): number;
        evaluateInTangent(keyIndex: number): number;
        storeDefaultInTangent(keyIndex: number): void;
        storeDefaultOutTangent(keyIndex: number): void;
        updateInTangentFromControlPoint(keyId: number, slope: number): void;
        updateOutTangentFromControlPoint(keyId: number, slope: number): void;
        updateKeyFrame(keyId: number, frame: number): void;
        updateKeyValue(keyId: number, value: number): void;
    }
}
declare module INSPECTOR {
    interface IKeyPointComponentProps {
        x: number;
        y: number;
        getPreviousX: () => BABYLON.Nullable<number>;
        getNextX: () => BABYLON.Nullable<number>;
        invertX: (x: number) => number;
        invertY: (y: number) => number;
        convertX: (x: number) => number;
        convertY: (y: number) => number;
        nextX?: number;
        scale: number;
        keyId: number;
        curve: Curve;
        context: Context;
        channel: string;
        onFrameValueChanged: (value: number) => void;
        onKeyValueChanged: (value: number) => void;
    }
    interface IKeyPointComponentState {
        selectedState: SelectionState;
        tangentSelectedIndex: number;
        x: number;
        y: number;
    }
    export enum SelectionState {
        None = 0,
        Selected = 1,
        Siblings = 2
    }
    export class KeyPointComponent extends React.Component<IKeyPointComponentProps, IKeyPointComponentState> {
        private _onActiveKeyPointChangedObserver;
        private _onActiveKeyFrameChangedObserver;
        private _onFrameManuallyEnteredObserver;
        private _onValueManuallyEnteredObserver;
        private _onMainKeyPointSetObserver;
        private _onMainKeyPointMovedObserver;
        private _onSelectionRectangleMovedObserver;
        private _onFlattenTangentRequiredObserver;
        private _onLinearTangentRequiredObserver;
        private _onBreakTangentRequiredObserver;
        private _onUnifyTangentRequiredObserver;
        private _pointerIsDown;
        private _sourcePointerX;
        private _sourcePointerY;
        private _offsetXToMain;
        private _offsetYToMain;
        private _svgHost;
        private _keyPointSVG;
        private _controlMode;
        private _storedLengthIn;
        private _storedLengthOut;
        private _inVec;
        private _outVec;
        constructor(props: IKeyPointComponentProps);
        componentWillUnmount(): void;
        shouldComponentUpdate(newProps: IKeyPointComponentProps, newState: IKeyPointComponentState): boolean;
        private _breakTangent;
        private _unifyTangent;
        private _flattenTangent;
        private _linearTangent;
        private _select;
        private _onPointerDown;
        private _extractSlope;
        private _processTangentMove;
        private _onPointerMove;
        private _onPointerUp;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    export class Context {
        title: string;
        animations: BABYLON.Nullable<BABYLON.Animation[] | BABYLON.TargetedAnimation[]>;
        scene: BABYLON.Scene;
        target: BABYLON.Nullable<BABYLON.IAnimatable>;
        activeAnimation: BABYLON.Nullable<BABYLON.Animation>;
        activeColor: BABYLON.Nullable<string>;
        activeKeyPoints: BABYLON.Nullable<KeyPointComponent[]>;
        mainKeyPoint: BABYLON.Nullable<KeyPointComponent>;
        snippetId: string;
        useTargetAnimations: boolean;
        activeFrame: number;
        fromKey: number;
        toKey: number;
        forwardAnimation: boolean;
        isPlaying: boolean;
        referenceMinFrame: number;
        referenceMaxFrame: number;
        onActiveAnimationChanged: BABYLON.Observable<void>;
        onActiveKeyPointChanged: BABYLON.Observable<void>;
        onHostWindowResized: BABYLON.Observable<void>;
        onActiveKeyFrameChanged: BABYLON.Observable<number>;
        onFrameSet: BABYLON.Observable<number>;
        onFrameManuallyEntered: BABYLON.Observable<number>;
        onMainKeyPointSet: BABYLON.Observable<void>;
        onMainKeyPointMoved: BABYLON.Observable<void>;
        onValueSet: BABYLON.Observable<number>;
        onValueManuallyEntered: BABYLON.Observable<number>;
        onFrameRequired: BABYLON.Observable<void>;
        onNewKeyPointRequired: BABYLON.Observable<void>;
        onFlattenTangentRequired: BABYLON.Observable<void>;
        onLinearTangentRequired: BABYLON.Observable<void>;
        onBreakTangentRequired: BABYLON.Observable<void>;
        onUnifyTangentRequired: BABYLON.Observable<void>;
        onDeleteAnimation: BABYLON.Observable<BABYLON.Animation>;
        onGraphMoved: BABYLON.Observable<number>;
        onGraphScaled: BABYLON.Observable<number>;
        onRangeUpdated: BABYLON.Observable<void>;
        onMoveToFrameRequired: BABYLON.Observable<number>;
        onAnimationStateChanged: BABYLON.Observable<void>;
        onDeleteKeyActiveKeyPoints: BABYLON.Observable<void>;
        onSelectionRectangleMoved: BABYLON.Observable<DOMRect>;
        onAnimationsLoaded: BABYLON.Observable<void>;
        onEditAnimationRequired: BABYLON.Observable<BABYLON.Animation>;
        onEditAnimationUIClosed: BABYLON.Observable<void>;
        prepare(): void;
        play(forward: boolean): void;
        stop(): void;
        moveToFrame(frame: number): void;
    }
}
declare module INSPECTOR {
    interface IControlButtonComponentProps {
        globalState: GlobalState;
        context: Context;
        icon: string;
        hoverIcon: string;
        id?: string;
        className?: string;
        onClick: () => void;
        tooltip?: string;
    }
    interface IControlButtonComponentState {
    }
    export class ControlButtonComponent extends React.Component<IControlButtonComponentProps, IControlButtonComponentState> {
        constructor(props: IControlButtonComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IMediaPlayerComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IMediaPlayerComponentState {
    }
    export class MediaPlayerComponent extends React.Component<IMediaPlayerComponentProps, IMediaPlayerComponentState> {
        private _isMounted;
        constructor(props: IMediaPlayerComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        private _onFirstKey;
        private _onPrevKey;
        private _onRewind;
        private _onForward;
        private _onNextKey;
        private _onEndKey;
        private _onStop;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IRangeSelectorComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IRangeSelectorComponentState {
    }
    export class RangeSelectorComponent extends React.Component<IRangeSelectorComponentProps, IRangeSelectorComponentState> {
        private _rangeHost;
        private _rangeScrollbarHost;
        private _viewWidth;
        private _pointerIsDown;
        private _minFrame;
        private _maxFrame;
        private _leftHandleIsActive;
        private _bothHandleIsActive;
        private _currentOffset;
        private _currentFrom;
        private _currentTo;
        constructor(props: IRangeSelectorComponentProps);
        private _computeSizes;
        private _onPointerDown;
        private _onPointerMove;
        private _updateLimits;
        private _onPointerUp;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IBottomBarComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IBottomBarComponentState {
    }
    export class BottomBarComponent extends React.Component<IBottomBarComponentProps, IBottomBarComponentState> {
        private _onAnimationsLoadedObserver;
        private _onActiveAnimationChangedObserver;
        constructor(props: IBottomBarComponentProps);
        private _renderMaxFrame;
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IActionButtonComponentProps {
        globalState: GlobalState;
        context: Context;
        icon: string;
        id?: string;
        className?: string;
        isActive?: boolean;
        onClick: () => void;
        tooltip?: string;
    }
    interface IActionButtonComponentState {
    }
    export class ActionButtonComponent extends React.Component<IActionButtonComponentProps, IActionButtonComponentState> {
        constructor(props: IActionButtonComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITextInputComponentProps {
        globalState: GlobalState;
        context: Context;
        id?: string;
        className?: string;
        tooltip?: string;
        value: string;
        isNumber?: boolean;
        complement?: string;
        onValueAsNumberChanged?: (value: number) => void;
    }
    interface ITextInputComponentState {
        value: string;
        isFocused: boolean;
    }
    export class TextInputComponent extends React.Component<ITextInputComponentProps, ITextInputComponentState> {
        private _lastKnownGoodValue;
        constructor(props: ITextInputComponentProps);
        private _onChange;
        private _onBlur;
        private _onFocus;
        shouldComponentUpdate(newProps: ITextInputComponentProps, newState: ITextInputComponentState): boolean;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITopBarComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface ITopBarComponentState {
        keyFrameValue: string;
        keyValue: string;
        editControlsVisible: boolean;
    }
    export class TopBarComponent extends React.Component<ITopBarComponentProps, ITopBarComponentState> {
        private _onFrameSetObserver;
        private _onValueSetObserver;
        private _onActiveAnimationChangedObserver;
        private onActiveKeyPointChanged;
        constructor(props: ITopBarComponentProps);
        componentWillUnmount(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IFrameBarComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IFrameBarComponentState {
    }
    export class FrameBarComponent extends React.Component<IFrameBarComponentProps, IFrameBarComponentState> {
        private readonly _GraphAbsoluteWidth;
        private _svgHost;
        private _viewWidth;
        private _viewScale;
        private _offsetX;
        private _currentAnimation;
        private _onActiveAnimationChangedObserver;
        constructor(props: IFrameBarComponentProps);
        componentWillUnmount(): void;
        private _computeSizes;
        private _buildFrames;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICurveComponentProps {
        curve: Curve;
        convertX: (x: number) => number;
        convertY: (x: number) => number;
        context: Context;
    }
    interface ICurveComponentState {
        isSelected: boolean;
    }
    export class CurveComponent extends React.Component<ICurveComponentProps, ICurveComponentState> {
        private _onDataUpdatedObserver;
        private _onActiveAnimationChangedObserver;
        constructor(props: ICurveComponentProps);
        componentWillUnmount(): void;
        componentDidUpdate(): boolean;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface IGraphComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IGraphComponentState {
    }
    export class GraphComponent extends React.Component<IGraphComponentProps, IGraphComponentState> {
        private readonly _MinScale;
        private readonly _MaxScale;
        private readonly _GraphAbsoluteWidth;
        private readonly _GraphAbsoluteHeight;
        private _viewWidth;
        private _viewCurveWidth;
        private _viewHeight;
        private _viewScale;
        private _offsetX;
        private _offsetY;
        private _inSelectionMode;
        private _graphOffsetX;
        private _minValue;
        private _maxValue;
        private _minFrame;
        private _maxFrame;
        private _svgHost;
        private _svgHost2;
        private _selectionRectangle;
        private _curves;
        private _pointerIsDown;
        private _sourcePointerX;
        private _sourcePointerY;
        private _selectionStartX;
        private _selectionStartY;
        private _currentAnimation;
        private _onActiveAnimationChangedObserver;
        constructor(props: IGraphComponentProps);
        componentWillUnmount(): void;
        private _computeSizes;
        private _setDefaultInTangent;
        private _setDefaultOutTangent;
        private _evaluateKeys;
        private _extractValuesFromKeys;
        private _convertX;
        private _invertX;
        private _convertY;
        private _invertY;
        private _buildYAxis;
        private _frame;
        private _dropKeyFrames;
        private _onPointerDown;
        private _onPointerMove;
        private _onPointerUp;
        private _onWheel;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IPlayHeadComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IPlayHeadComponentState {
    }
    export class PlayHeadComponent extends React.Component<IPlayHeadComponentProps, IPlayHeadComponentState> {
        private readonly _GraphAbsoluteWidth;
        private _playHead;
        private _playHeadCircle;
        private _onBeforeRenderObserver;
        private _onActiveAnimationChangedObserver;
        private _viewScale;
        private _offsetX;
        private _pointerIsDown;
        constructor(props: IPlayHeadComponentProps);
        private _moveHead;
        private _frameToPixel;
        private _pixelToFrame;
        componentWillUnmount(): void;
        private _onPointerDown;
        private _onPointerMove;
        private _onPointerUp;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface IRangeFrameBarComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IRangeFrameBarComponentState {
    }
    export class RangeFrameBarComponent extends React.Component<IRangeFrameBarComponentProps, IRangeFrameBarComponentState> {
        private _svgHost;
        private _viewWidth;
        private _offsetX;
        private _isMounted;
        private _currentAnimation;
        private _onActiveAnimationChangedObserver;
        constructor(props: IRangeFrameBarComponentProps);
        componentDidMount(): void;
        componentWillUnmount(): void;
        private _computeSizes;
        private _dropKeyFrames;
        private _buildFrames;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICanvasComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface ICanvasComponentState {
    }
    export class CanvasComponent extends React.Component<ICanvasComponentProps, ICanvasComponentState> {
        constructor(props: ICanvasComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationSubEntryComponentProps {
        globalState: GlobalState;
        context: Context;
        animation: BABYLON.Animation;
        color: string;
        subName: string;
    }
    interface IAnimationSubEntryComponentState {
        isSelected: boolean;
    }
    export class AnimationSubEntryComponent extends React.Component<IAnimationSubEntryComponentProps, IAnimationSubEntryComponentState> {
        private _onActiveAnimationChangedObserver;
        private _onActiveKeyPointChangedObserver;
        constructor(props: IAnimationSubEntryComponentProps);
        componentWillUnmount(): void;
        private _activate;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationEntryComponentProps {
        globalState: GlobalState;
        context: Context;
        animation: BABYLON.Animation;
    }
    interface IAnimationEntryComponentState {
        isExpanded: boolean;
        isSelected: boolean;
    }
    export class AnimationEntryComponent extends React.Component<IAnimationEntryComponentProps, IAnimationEntryComponentState> {
        private _onActiveAnimationChangedObserver;
        private _onActiveKeyPointChangedObserver;
        private _unmount;
        constructor(props: IAnimationEntryComponentProps);
        private _onGear;
        private _onDelete;
        componentWillUnmount(): void;
        private _activate;
        private _expandOrCollapse;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationListComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IAnimationListComponentState {
        isVisible: boolean;
    }
    export class AnimationListComponent extends React.Component<IAnimationListComponentProps, IAnimationListComponentState> {
        private _onEditAnimationRequiredObserver;
        private _onEditAnimationUIClosedObserver;
        constructor(props: IAnimationListComponentProps);
        componentWillUnmount(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface ISaveAnimationComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface ISaveAnimationComponentState {
    }
    export class SaveAnimationComponent extends React.Component<ISaveAnimationComponentProps, ISaveAnimationComponentState> {
        private _selectedAnimations;
        private _root;
        constructor(props: ISaveAnimationComponentProps);
        private _getJson;
        saveToSnippetServer(): void;
        saveToFile(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ILoadAnimationComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface ILoadAnimationComponentState {
    }
    export class LoadAnimationComponent extends React.Component<ILoadAnimationComponentProps, ILoadAnimationComponentState> {
        private _root;
        private _textInput;
        constructor(props: ILoadAnimationComponentProps);
        loadFromFile(evt: React.ChangeEvent<HTMLInputElement>): void;
        loadFromSnippetServer(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAddAnimationComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IAddAnimationComponentState {
    }
    export class AddAnimationComponent extends React.Component<IAddAnimationComponentProps, IAddAnimationComponentState> {
        private _root;
        private _displayName;
        private _property;
        private _typeElement;
        private _loopModeElement;
        constructor(props: IAddAnimationComponentProps);
        createNew(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IEditAnimationComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IEditAnimationComponentState {
        isVisible: boolean;
        animation: BABYLON.Nullable<BABYLON.Animation>;
    }
    export class EditAnimationComponent extends React.Component<IEditAnimationComponentProps, IEditAnimationComponentState> {
        private _root;
        private _displayName;
        private _property;
        private _loopModeElement;
        private _onEditAnimationRequiredObserver;
        constructor(props: IEditAnimationComponentProps);
        componentWillUnmount(): void;
        close(): void;
        validate(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface ISideBarComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface ISideBarComponentState {
        mode: Mode;
    }
    enum Mode {
        Edit = 0,
        Add = 1,
        Load = 2,
        Save = 3
    }
    export class SideBarComponent extends React.Component<ISideBarComponentProps, ISideBarComponentState> {
        constructor(props: ISideBarComponentProps);
        private _onAddAnimation;
        private _onLoadAnimation;
        private _onSaveAnimation;
        private _onEditAnimation;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IAnimationCurveEditorComponentProps {
        globalState: GlobalState;
        context: Context;
    }
    interface IAnimationCurveEditorComponentState {
        isOpen: boolean;
    }
    export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, IAnimationCurveEditorComponentState> {
        constructor(props: IAnimationCurveEditorComponentProps);
        onCloseAnimationCurveEditor(window: Window | null): void;
        shouldComponentUpdate(newProps: IAnimationCurveEditorComponentProps, newState: IAnimationCurveEditorComponentState): boolean;
        private _onKeyUp;
        render(): JSX.Element;
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
        private _animationCurveEditorContext;
        private _animationControl;
        constructor(props: IAnimationGridComponentProps);
        playOrPause(): void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        onCurrentFrameChange(value: number): void;
        onChangeFromOrTo(): void;
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
        icon?: string;
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
    interface IFileButtonLineComponentProps {
        label: string;
        onClick: (file: File) => void;
        accept: string;
        icon?: string;
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
        computeRGBAColor(): BABYLON.Color4;
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
        /** Tracks which mouse buttons are currently pressed */
        private _buttonsPressed;
        private readonly ZOOM_MOUSE_SPEED;
        private readonly ZOOM_KEYBOARD_SPEED;
        private readonly ZOOM_IN_KEY;
        private readonly ZOOM_OUT_KEY;
        private readonly PAN_SPEED;
        private readonly PAN_KEY;
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
        toolInteractionEnabled(): boolean;
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
        /** Returns whether the tool should be allowed to interact */
        interactionEnabled: () => boolean;
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
        icon?: string;
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
        icon?: string;
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
        private _animationCurveEditorContext;
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
        displayFrustum(): void;
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
        icon?: string;
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
    interface IGradientStepComponentProps {
        globalState: GlobalState;
        step: BABYLON.GradientBlockColorStep;
        lineIndex: number;
        onDelete: () => void;
        onUpdateStep: () => void;
        onCheckForReOrder: () => void;
        onCopy?: () => void;
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
        copyStep(step: BABYLON.GradientBlockColorStep): void;
        addNewStep(): void;
        checkForReOrder(): void;
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
        icon?: string;
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
        private _animationGroup;
        private _animationCurveEditorContext;
        constructor(props: ITargetedAnimationGridComponentProps);
        playOrPause: () => void;
        deleteAnimation: () => void;
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
    interface ISoundPropertyGridComponentProps {
        globalState: GlobalState;
        sound: BABYLON.Sound;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class SoundPropertyGridComponent extends React.Component<ISoundPropertyGridComponentProps> {
        constructor(props: ISoundPropertyGridComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ILayerPropertyGridComponentProps {
        globalState: GlobalState;
        layer: BABYLON.EffectLayer;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        lockObject: LockObject;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class LayerPropertyGridComponent extends React.Component<ILayerPropertyGridComponentProps> {
        constructor(props: ILayerPropertyGridComponentProps);
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
        icon?: string;
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
        private _lockObject;
        private _videoRecorder;
        private _screenShotSize;
        private _gifOptions;
        private _useWidthHeight;
        private _isExporting;
        private _gifWorkerBlob;
        private _gifRecorder;
        private _previousRenderingScale;
        private _crunchingGIF;
        private _reflectorHostname;
        private _reflectorPort;
        private _reflector;
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
        connectReflector(): void;
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
    interface ISoundTreeItemComponentProps {
        sound: BABYLON.Sound;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class SoundTreeItemComponent extends React.Component<ISoundTreeItemComponentProps> {
        constructor(props: ISoundTreeItemComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface IEffectLayerItemComponenttProps {
        layer: BABYLON.EffectLayer;
        extensibilityGroups?: BABYLON.IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class EffectLayerItemComponent extends React.Component<IEffectLayerItemComponenttProps> {
        constructor(props: IEffectLayerItemComponenttProps);
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
    interface IPushButtonComponentProps {
        globalState: GlobalState;
        context: Context;
        icon: string;
        id?: string;
        className?: string;
        isPushed?: boolean;
        onClick: (state: boolean) => void;
        tooltip?: string;
    }
    interface IPushButtonComponentState {
        isPushed: boolean;
    }
    export class PushButtonComponent extends React.Component<IPushButtonComponentProps, IPushButtonComponentState> {
        constructor(props: IPushButtonComponentProps);
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export const Contrast: IToolData;
}
declare module INSPECTOR {
    export interface IButtonLineComponentProps {
        data: string;
        tooltip: string;
    }
    export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
        constructor(props: IButtonLineComponentProps);
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
    export class Popup {
        static CreatePopup(title: string, windowVariableName: string, width?: number, height?: number): HTMLDivElement | null;
        private static _CopyStyles;
    }
}