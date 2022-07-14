import * as React from "react";
import { Camera } from "core/Cameras/camera";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CustomPropertyGridComponent } from "../customPropertyGridComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { AnimationGridComponent } from "../animations/animationPropertyGridComponent";
import { HexLineComponent } from "shared-ui-components/lines/hexLineComponent";
import { ParentPropertyGridComponent } from "../parentPropertyGridComponent";

interface ICommonCameraPropertyGridComponentProps {
    globalState: GlobalState;
    camera: Camera;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonCameraPropertyGridComponent extends React.Component<ICommonCameraPropertyGridComponentProps, { mode: number }> {
    constructor(props: ICommonCameraPropertyGridComponentProps) {
        super(props);

        this.state = { mode: this.props.camera.mode };
    }

    render() {
        const camera = this.props.camera;

        const modeOptions = [
            { label: "Perspective", value: Camera.PERSPECTIVE_CAMERA },
            { label: "Orthographic", value: Camera.ORTHOGRAPHIC_CAMERA },
        ];

        return (
            <div>
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    target={camera}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={camera.id} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={camera}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={camera.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={camera.getClassName()} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Near plane"
                        target={camera}
                        propertyName="minZ"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <ParentPropertyGridComponent globalState={this.props.globalState} node={camera} lockObject={this.props.lockObject} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Far plane"
                        target={camera}
                        propertyName="maxZ"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Inertia"
                        target={camera}
                        propertyName="inertia"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <HexLineComponent
                        isInteger
                        lockObject={this.props.lockObject}
                        label="Layer mask"
                        target={camera}
                        propertyName="layerMask"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLineComponent
                        label="Mode"
                        options={modeOptions}
                        target={camera}
                        propertyName="mode"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => this.setState({ mode: value as number })}
                    />
                    {camera.mode === Camera.PERSPECTIVE_CAMERA && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Field of view"
                            target={camera}
                            useEuler={this.props.globalState.onlyUseEulers}
                            propertyName="fov"
                            minimum={0.1}
                            maximum={Math.PI}
                            step={0.1}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {camera.mode === Camera.ORTHOGRAPHIC_CAMERA && (
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Left"
                            target={camera}
                            propertyName="orthoLeft"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {camera.mode === Camera.ORTHOGRAPHIC_CAMERA && (
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Top"
                            target={camera}
                            propertyName="orthoTop"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {camera.mode === Camera.ORTHOGRAPHIC_CAMERA && (
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Right"
                            target={camera}
                            propertyName="orthoRight"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {camera.mode === Camera.ORTHOGRAPHIC_CAMERA && (
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Bottom"
                            target={camera}
                            propertyName="orthoBottom"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <ButtonLineComponent
                        label="Dispose"
                        onClick={() => {
                            camera.dispose();
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                        }}
                    />
                </LineContainerComponent>
                <AnimationGridComponent globalState={this.props.globalState} animatable={camera} scene={camera.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}
