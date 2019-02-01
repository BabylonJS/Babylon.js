import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PostProcess } from "babylonjs/PostProcesses/postProcess";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { CommonPostProcessPropertyGridComponent } from './commonPostProcessPropertyGridComponent';

interface IPostProcessPropertyGridComponentProps {
    postProcess: PostProcess,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class PostProcessPropertyGridComponent extends React.Component<IPostProcessPropertyGridComponentProps> {
    constructor(props: IPostProcessPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const postProcess = this.props.postProcess;

        return (
            <div className="pane">
                <CommonPostProcessPropertyGridComponent lockObject={this.props.lockObject} postProcess={postProcess} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}