import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";

interface IFrameGraphPropertyGridComponentProps {
    globalState: GlobalState;
    frameGraph: FrameGraph;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class FrameGraphPropertyGridComponent extends React.Component<IFrameGraphPropertyGridComponentProps> {
    constructor(props: IFrameGraphPropertyGridComponentProps) {
        super(props);
    }

    override render() {
        const frameGraph = this.props.frameGraph;
        const tasks = frameGraph.tasks;

        return (
            <>
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={frameGraph}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Optimize texture allocation"
                        target={frameGraph}
                        propertyName="optimizeTextureAllocation"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {frameGraph.scene.frameGraph !== frameGraph && (
                        <ButtonLineComponent label="Set as scene's frame graph" onClick={() => (frameGraph.scene.frameGraph = frameGraph)} />
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="TASKS" selection={this.props.globalState}>
                    {tasks.length > 0 &&
                        tasks.map((task, i) => {
                            return <TextLineComponent ignoreValue={true} label={i + 1 + ". " + task.name} key={"task" + i} />;
                        })}
                </LineContainerComponent>
            </>
        );
    }
}
