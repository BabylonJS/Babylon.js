/// <reference types="react" />
declare module "babylonjs-inspector/components/propertyChangedEvent" {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}
declare module "babylonjs-inspector/components/replayRecorder" {
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    export class ReplayRecorder {
        private _recordedCodeLines;
        private _previousObject;
        private _previousProperty;
        reset(): void;
        record(event: PropertyChangedEvent): void;
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
    import { LightGizmo } from "babylonjs/Gizmos/lightGizmo";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { ReplayRecorder } from "babylonjs-inspector/components/replayRecorder";
    export class GlobalState {
        onSelectionChangedObservable: Observable<any>;
        onPropertyChangedObservable: Observable<PropertyChangedEvent>;
        onInspectorClosedObservable: Observable<Scene>;
        onTabChangedObservable: Observable<number>;
        onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;
        validationResults: IGLTFValidationResults;
        onValidationResultsUpdatedObservable: Observable<IGLTFValidationResults>;
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        glTFLoaderExtensionDefaults: {
            [name: string]: {
                [key: string]: any;
            };
        };
        glTFLoaderDefaults: {
            [key: string]: any;
        };
        blockMutationUpdates: boolean;
        selectedLineContainerTitle: string;
        recorder: ReplayRecorder;
        init(propertyChangedObservable: Observable<PropertyChangedEvent>): void;
        prepareGLTFPlugin(loader: GLTFFileLoader): void;
        lightGizmos: Array<LightGizmo>;
        enableLightGizmo(light: Light, enable?: boolean): void;
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
declare module "babylonjs-inspector/components/actionTabs/lineContainerComponent" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ILineContainerComponentProps {
        globalState: GlobalState;
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
        isHighlighted: boolean;
    }> {
        private static _InMemoryStorage;
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
        componentWillMount(): void;
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
        componentWillMount(): void;
        addOrRemoveGrid(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/debugTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    export class DebugTabComponent extends PaneComponent {
        private _physicsViewersEnabled;
        constructor(props: IPaneComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
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
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/optionsLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
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
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, {
        value: number;
    }> {
        private _localChange;
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
declare module "babylonjs-inspector/components/actionTabs/lines/color3LineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Color3 } from "babylonjs/Maths/math";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
declare module "babylonjs-inspector/components/actionTabs/lines/vector3LineComponent" {
    import * as React from "react";
    import { Vector3 } from "babylonjs/Maths/math";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
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
declare module "babylonjs-inspector/components/actionTabs/lines/quaternionLineComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Quaternion } from "babylonjs/Maths/math";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    interface IQuaternionLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    }
    export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, {
        isExpanded: boolean;
        value: Quaternion;
    }> {
        private _localChange;
        constructor(props: IQuaternionLineComponentProps);
        shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: {
            isExpanded: boolean;
            value: Quaternion;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(currentValue: Quaternion, previousValue: Quaternion): void;
        updateQuaternion(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        updateStateW(value: number): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/customPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IInspectable } from 'babylonjs/Misc/iInspectable';
    interface ICustomPropertyGridComponentProps {
        globalState: GlobalState;
        target: any;
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
        onDebugSelectionChangeObservable?: Observable<BaseTexture>;
    }
    export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, {
        isDebugSelected: boolean;
    }> {
        private _onDebugSelectionChangeObserver;
        constructor(props: ITextureLinkLineComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        debugTexture(): void;
        onLink(): void;
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
        renderTextures(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/textureLineComponent" {
    import * as React from "react";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface ITextureLineComponentProps {
        texture: BaseTexture;
        width: number;
        height: number;
        globalState: GlobalState;
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
declare module "babylonjs-inspector/components/actionTabs/lines/fileButtonLineComponent" {
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/materials/texturePropertyGridComponent" {
    import * as React from "react";
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
    export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps> {
        private _adtInstrumentation;
        constructor(props: ITexturePropertyGridComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        updateTexture(file: File): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/lines/vector2LineComponent" {
    import * as React from "react";
    import { Vector2 } from "babylonjs/Maths/math";
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
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
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
        renderTextures(onDebugSelectionChangeObservable: Observable<BaseTexture>): JSX.Element | null;
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
        componentWillMount(): void;
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
    import { Vector3 } from "babylonjs/Maths/math";
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
        constructor(props: ICommonShadowLightPropertyGridComponentProps);
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
    }> {
        constructor(props: IMeshPropertyGridComponentProps);
        renderWireframeOver(): void;
        renderNormalVectors(): void;
        displayNormals(): void;
        onMaterialLink(): void;
        onSourceMeshLink(): void;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animationGroupPropertyGridComponent" {
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
        constructor(props: IAnimationGroupGridComponentProps);
        disconnect(animationGroup: AnimationGroup): void;
        connect(animationGroup: AnimationGroup): void;
        updateCurrentFrame(animationGroup: AnimationGroup): void;
        shouldComponentUpdate(nextProps: IAnimationGroupGridComponentProps): boolean;
        componentWillMount(): void;
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
        renderTextures(): JSX.Element | null;
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
        renderTextures(): JSX.Element | null;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/animationPropertyGridComponent" {
    import * as React from "react";
    import { Observable } from "babylonjs/Misc/observable";
    import { Scene } from "babylonjs/scene";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    import { LockObject } from "babylonjs-inspector/components/actionTabs/tabs/propertyGrids/lockObject";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    import { IAnimatable } from 'babylonjs/Misc/tools';
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
        private _animationControl;
        private _runningAnimatable;
        private _onBeforeRenderObserver;
        private _isPlaying;
        constructor(props: IAnimationGridComponentProps);
        playOrPause(): void;
        componentWillMount(): void;
        componentWillUnmount(): void;
        onCurrentFrameChange(value: number): void;
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
        private _skeletonViewers;
        constructor(props: ISkeletonPropertyGridComponentProps);
        switchSkeletonViewers(): void;
        checkSkeletonViewerState(props: ISkeletonPropertyGridComponentProps): void;
        componentWillMount(): void;
        shouldComponentUpdate(nextProps: ISkeletonPropertyGridComponentProps): boolean;
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
declare module "babylonjs-inspector/components/actionTabs/tabs/propertyGridTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    export class PropertyGridTabComponent extends PaneComponent {
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPaneComponentProps);
        timerRefresh(): void;
        componentWillMount(): void;
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
        componentWillMount(): void;
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
        constructor(props: IGLTFComponentProps);
        openValidationDetails(): void;
        prepareText(singularForm: string, count: number): string;
        renderValidation(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module "babylonjs-inspector/components/actionTabs/tabs/toolsTabComponent" {
    import { PaneComponent, IPaneComponentProps } from "babylonjs-inspector/components/actionTabs/paneComponent";
    import { Node } from "babylonjs/node";
    export class ToolsTabComponent extends PaneComponent {
        private _videoRecorder;
        constructor(props: IPaneComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        captureScreenshot(): void;
        recordVideo(): void;
        shouldExport(node: Node): boolean;
        exportGLTF(): void;
        exportBabylon(): void;
        createEnvTexture(): void;
        resetReplay(): void;
        exportReplay(): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-inspector/components/actionTabs/actionTabsComponent" {
    import * as React from "react";
    import { Scene } from "babylonjs/scene";
    import { GlobalState } from "babylonjs-inspector/components/globalState";
    interface IActionTabsComponentProps {
        scene: Scene;
        noCommands?: boolean;
        noHeader?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        popupMode?: boolean;
        onPopup?: () => void;
        onClose?: () => void;
        globalState: GlobalState;
    }
    export class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
        selectedEntity: any;
        selectedIndex: number;
    }> {
        private _onSelectionChangeObserver;
        private _onTabChangedObserver;
        private _once;
        constructor(props: IActionTabsComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        changeSelectedTab(index: number): void;
        renderContent(): JSX.Element;
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
    interface IMeshTreeItemComponentProps {
        mesh: AbstractMesh;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
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
    interface ICameraTreeItemComponentProps {
        camera: Camera;
        extensibilityGroups?: IExplorerExtensibilityGroup[];
        onClick: () => void;
    }
    export class CameraTreeItemComponent extends React.Component<ICameraTreeItemComponentProps, {
        isActive: boolean;
    }> {
        private _onActiveCameraObserver;
        constructor(props: ICameraTreeItemComponentProps);
        setActive(): void;
        componentWillMount(): void;
        componentWillUnmount(): void;
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
    interface IMaterialTreeItemComponentProps {
        material: Material;
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
        constructor(props: ISceneTreeItemComponentProps);
        shouldComponentUpdate(nextProps: ISceneTreeItemComponentProps, nextState: {
            isSelected: boolean;
            isInPickingMode: boolean;
        }): boolean;
        componentWillMount(): void;
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
        private _onNewSceneAddedObserver;
        private _once;
        private _hooked;
        private sceneMutationFunc;
        constructor(props: ISceneExplorerComponentProps);
        processMutation(): void;
        componentWillMount(): void;
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
    interface IEmbedHostComponentProps {
        scene: Scene;
        globalState: GlobalState;
        popupMode: boolean;
        noClose?: boolean;
        noExpand?: boolean;
        onClose: () => void;
        onPopup: () => void;
    }
    export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
        private _once;
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
        private static _CopyStyles;
        private static _CreateSceneExplorer;
        private static _CreateActionTabs;
        private static _CreateEmbedHost;
        private static _CreatePopup;
        static readonly IsVisible: boolean;
        static EarlyAttachToLoader(): void;
        static Show(scene: Scene, userOptions: Partial<IInspectorOptions>): void;
        private static _CreateCanvasContainer;
        private static _DestroyCanvasContainer;
        private static _Cleanup;
        private static _RemoveElementFromDOM;
        static Hide(): void;
    }
}
declare module "babylonjs-inspector/index" {
    export * from "babylonjs-inspector/inspector";
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
    }
}
declare module INSPECTOR {
    export class ReplayRecorder {
        private _recordedCodeLines;
        private _previousObject;
        private _previousProperty;
        reset(): void;
        record(event: PropertyChangedEvent): void;
        export(): void;
    }
}
declare module INSPECTOR {
    export class GlobalState {
        onSelectionChangedObservable: BABYLON.Observable<any>;
        onPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        onInspectorClosedObservable: BABYLON.Observable<BABYLON.Scene>;
        onTabChangedObservable: BABYLON.Observable<number>;
        onPluginActivatedObserver: BABYLON.Nullable<BABYLON.Observer<BABYLON.ISceneLoaderPlugin | BABYLON.ISceneLoaderPluginAsync>>;
        validationResults: BABYLON.GLTF2.IGLTFValidationResults;
        onValidationResultsUpdatedObservable: BABYLON.Observable<BABYLON.GLTF2.IGLTFValidationResults>;
        onExtensionLoadedObservable: BABYLON.Observable<BABYLON.IGLTFLoaderExtension>;
        glTFLoaderExtensionDefaults: {
            [name: string]: {
                [key: string]: any;
            };
        };
        glTFLoaderDefaults: {
            [key: string]: any;
        };
        blockMutationUpdates: boolean;
        selectedLineContainerTitle: string;
        recorder: ReplayRecorder;
        init(propertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>): void;
        prepareGLTFPlugin(loader: BABYLON.GLTFFileLoader): void;
        lightGizmos: Array<BABYLON.LightGizmo>;
        enableLightGizmo(light: BABYLON.Light, enable?: boolean): void;
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
declare module INSPECTOR {
    interface ILineContainerComponentProps {
        globalState: GlobalState;
        title: string;
        children: any[] | any;
        closed?: boolean;
    }
    export class LineContainerComponent extends React.Component<ILineContainerComponentProps, {
        isExpanded: boolean;
        isHighlighted: boolean;
    }> {
        private static _InMemoryStorage;
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
        componentWillMount(): void;
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
        componentWillMount(): void;
        addOrRemoveGrid(): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class DebugTabComponent extends PaneComponent {
        private _physicsViewersEnabled;
        constructor(props: IPaneComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
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
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
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
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, {
        value: number;
    }> {
        private _localChange;
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
declare module INSPECTOR {
    export interface IColor3LineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
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
declare module INSPECTOR {
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
declare module INSPECTOR {
    interface IQuaternionLineComponentProps {
        label: string;
        target: any;
        propertyName: string;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, {
        isExpanded: boolean;
        value: BABYLON.Quaternion;
    }> {
        private _localChange;
        constructor(props: IQuaternionLineComponentProps);
        shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: {
            isExpanded: boolean;
            value: BABYLON.Quaternion;
        }): boolean;
        switchExpandState(): void;
        raiseOnPropertyChanged(currentValue: BABYLON.Quaternion, previousValue: BABYLON.Quaternion): void;
        updateQuaternion(): void;
        updateStateX(value: number): void;
        updateStateY(value: number): void;
        updateStateZ(value: number): void;
        updateStateW(value: number): void;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ICustomPropertyGridComponentProps {
        globalState: GlobalState;
        target: any;
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
        onDebugSelectionChangeObservable?: BABYLON.Observable<BABYLON.BaseTexture>;
    }
    export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, {
        isDebugSelected: boolean;
    }> {
        private _onDebugSelectionChangeObserver;
        constructor(props: ITextureLinkLineComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        debugTexture(): void;
        onLink(): void;
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
        renderTextures(): JSX.Element | null;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    interface ITextureLineComponentProps {
        texture: BABYLON.BaseTexture;
        width: number;
        height: number;
        globalState: GlobalState;
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
declare module INSPECTOR {
    interface ITexturePropertyGridComponentProps {
        texture: BABYLON.BaseTexture;
        lockObject: LockObject;
        globalState: GlobalState;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class TexturePropertyGridComponent extends React.Component<ITexturePropertyGridComponentProps> {
        private _adtInstrumentation;
        constructor(props: ITexturePropertyGridComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        updateTexture(file: File): void;
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
        renderTextures(onDebugSelectionChangeObservable: BABYLON.Observable<BABYLON.BaseTexture>): JSX.Element | null;
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
        componentWillMount(): void;
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
        constructor(props: ICommonShadowLightPropertyGridComponentProps);
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
    interface IMeshPropertyGridComponentProps {
        globalState: GlobalState;
        mesh: BABYLON.Mesh;
        lockObject: LockObject;
        onSelectionChangedObservable?: BABYLON.Observable<any>;
        onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    }
    export class MeshPropertyGridComponent extends React.Component<IMeshPropertyGridComponentProps, {
        displayNormals: boolean;
    }> {
        constructor(props: IMeshPropertyGridComponentProps);
        renderWireframeOver(): void;
        renderNormalVectors(): void;
        displayNormals(): void;
        onMaterialLink(): void;
        onSourceMeshLink(): void;
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
        constructor(props: IAnimationGroupGridComponentProps);
        disconnect(animationGroup: BABYLON.AnimationGroup): void;
        connect(animationGroup: BABYLON.AnimationGroup): void;
        updateCurrentFrame(animationGroup: BABYLON.AnimationGroup): void;
        shouldComponentUpdate(nextProps: IAnimationGroupGridComponentProps): boolean;
        componentWillMount(): void;
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
        renderTextures(): JSX.Element | null;
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
        renderTextures(): JSX.Element | null;
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
        private _animationControl;
        private _runningAnimatable;
        private _onBeforeRenderObserver;
        private _isPlaying;
        constructor(props: IAnimationGridComponentProps);
        playOrPause(): void;
        componentWillMount(): void;
        componentWillUnmount(): void;
        onCurrentFrameChange(value: number): void;
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
        private _skeletonViewers;
        constructor(props: ISkeletonPropertyGridComponentProps);
        switchSkeletonViewers(): void;
        checkSkeletonViewerState(props: ISkeletonPropertyGridComponentProps): void;
        componentWillMount(): void;
        shouldComponentUpdate(nextProps: ISkeletonPropertyGridComponentProps): boolean;
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
    export class PropertyGridTabComponent extends PaneComponent {
        private _timerIntervalId;
        private _lockObject;
        constructor(props: IPaneComponentProps);
        timerRefresh(): void;
        componentWillMount(): void;
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
        componentWillMount(): void;
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
        constructor(props: IGLTFComponentProps);
        openValidationDetails(): void;
        prepareText(singularForm: string, count: number): string;
        renderValidation(): JSX.Element;
        render(): JSX.Element;
    }
}
declare module INSPECTOR {
    export class ToolsTabComponent extends PaneComponent {
        private _videoRecorder;
        constructor(props: IPaneComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        captureScreenshot(): void;
        recordVideo(): void;
        shouldExport(node: BABYLON.Node): boolean;
        exportGLTF(): void;
        exportBabylon(): void;
        createEnvTexture(): void;
        resetReplay(): void;
        exportReplay(): void;
        render(): JSX.Element | null;
    }
}
declare module INSPECTOR {
    interface IActionTabsComponentProps {
        scene: BABYLON.Scene;
        noCommands?: boolean;
        noHeader?: boolean;
        noExpand?: boolean;
        noClose?: boolean;
        popupMode?: boolean;
        onPopup?: () => void;
        onClose?: () => void;
        globalState: GlobalState;
    }
    export class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
        selectedEntity: any;
        selectedIndex: number;
    }> {
        private _onSelectionChangeObserver;
        private _onTabChangedObserver;
        private _once;
        constructor(props: IActionTabsComponentProps);
        componentWillMount(): void;
        componentWillUnmount(): void;
        changeSelectedTab(index: number): void;
        renderContent(): JSX.Element;
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
    }
    export class CameraTreeItemComponent extends React.Component<ICameraTreeItemComponentProps, {
        isActive: boolean;
    }> {
        private _onActiveCameraObserver;
        constructor(props: ICameraTreeItemComponentProps);
        setActive(): void;
        componentWillMount(): void;
        componentWillUnmount(): void;
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
        material: BABYLON.Material;
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
        constructor(props: ISceneTreeItemComponentProps);
        shouldComponentUpdate(nextProps: ISceneTreeItemComponentProps, nextState: {
            isSelected: boolean;
            isInPickingMode: boolean;
        }): boolean;
        componentWillMount(): void;
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
        private _onNewSceneAddedObserver;
        private _once;
        private _hooked;
        private sceneMutationFunc;
        constructor(props: ISceneExplorerComponentProps);
        processMutation(): void;
        componentWillMount(): void;
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
    }
    export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
        private _once;
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
        private static _CopyStyles;
        private static _CreateSceneExplorer;
        private static _CreateActionTabs;
        private static _CreateEmbedHost;
        private static _CreatePopup;
        static readonly IsVisible: boolean;
        static EarlyAttachToLoader(): void;
        static Show(scene: BABYLON.Scene, userOptions: Partial<BABYLON.IInspectorOptions>): void;
        private static _CreateCanvasContainer;
        private static _DestroyCanvasContainer;
        private static _Cleanup;
        private static _RemoveElementFromDOM;
        static Hide(): void;
    }
}