import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonCameraPropertyGridComponent } from "./commonCameraPropertyGridComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import type { FollowCamera } from "core/Cameras/followCamera";

interface IFollowCameraPropertyGridComponentProps {
    globalState: GlobalState;
    camera: FollowCamera;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class FollowCameraPropertyGridComponent extends React.Component<IFollowCameraPropertyGridComponentProps> {
    constructor(props: IFollowCameraPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const camera = this.props.camera;

        return (
            <div className="pane">
                <CommonCameraPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    camera={camera}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="TRANSFORMS" selection={this.props.globalState}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Radius"
                        target={camera}
                        propertyName="radius"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Rotation offset"
                        target={camera}
                        propertyName="rotationOffset"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Height offset"
                        target={camera}
                        propertyName="heightOffset"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Camera acceleration"
                        target={camera}
                        propertyName="cameraAcceleration"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="LIMITS" closed={true} selection={this.props.globalState}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Lower radius limit"
                        target={camera}
                        propertyName="lowerRadiusLimit"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Upper radius limit"
                        target={camera}
                        propertyName="upperRadiusLimit"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Lower rotation offset limit"
                        target={camera}
                        propertyName="lowerRotationOffsetLimit"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Upper rotation offset limit"
                        target={camera}
                        propertyName="upperRotationOffsetLimit"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Lower height offset limit"
                        target={camera}
                        propertyName="lowerHeightOffsetLimit"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Upper height offset limit"
                        target={camera}
                        propertyName="upperHeightOffsetLimit"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max camera speed"
                        target={camera}
                        propertyName="maxCameraSpeed"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
