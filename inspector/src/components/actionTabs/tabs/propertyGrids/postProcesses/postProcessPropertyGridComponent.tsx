import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PostProcess } from "babylonjs/PostProcesses/postProcess";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { CommonPostProcessPropertyGridComponent } from './commonPostProcessPropertyGridComponent';
import { GlobalState } from '../../../../globalState';
import { LineContainerComponent } from '../../../lineContainerComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';

interface IPostProcessPropertyGridComponentProps {
    globalState: GlobalState;
    postProcess: PostProcess,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class PostProcessPropertyGridComponent extends React.Component<IPostProcessPropertyGridComponentProps> {
    constructor(props: IPostProcessPropertyGridComponentProps) {
        super(props);
    }

    edit() {        
        const postProcess = this.props.postProcess;
        postProcess.nodeMaterialSource!.edit();
    }

    render() {
        const postProcess = this.props.postProcess;

        return (
            <div className="pane">
                <CommonPostProcessPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} postProcess={postProcess} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                {
                    postProcess.nodeMaterialSource &&
                    <LineContainerComponent globalState={this.props.globalState} title="CONFIGURATION">
                        <ButtonLineComponent label="Node Material Editor" onClick={() => this.edit()} />
                    </LineContainerComponent>                
                }
            </div>
        );
    }
}