import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import type { GlobalState } from "../../../../globalState";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";

interface ICommonRenderingPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: PostProcessRenderPipeline;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonRenderingPipelinePropertyGridComponent extends React.Component<ICommonRenderingPipelinePropertyGridComponentProps> {
    constructor(props: ICommonRenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;
        const renderPipelineAsAny = renderPipeline as any;

        return (
            <div>
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Name" value={renderPipeline.name} />
                    <TextLineComponent label="Class" value={renderPipeline.getClassName()} />
                    {renderPipelineAsAny.samples !== undefined && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Samples"
                            minimum={1}
                            maximum={64}
                            step={1}
                            decimalCount={0}
                            target={renderPipeline}
                            propertyName="samples"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                </LineContainerComponent>
            </div>
        );
    }
}
