import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { PostProcess } from "core/PostProcesses/postProcess";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { CommonPostProcessPropertyGridComponent } from "./commonPostProcessPropertyGridComponent";
import type { GlobalState } from "../../../../globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";

interface IPostProcessPropertyGridComponentProps {
    globalState: GlobalState;
    postProcess: PostProcess;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
                <CommonPostProcessPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    postProcess={postProcess}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                {postProcess.nodeMaterialSource && (
                    <LineContainerComponent title="CONFIGURATION" selection={this.props.globalState}>
                        <ButtonLineComponent label="Node Material Editor" onClick={() => this.edit()} />
                    </LineContainerComponent>
                )}
            </div>
        );
    }
}
