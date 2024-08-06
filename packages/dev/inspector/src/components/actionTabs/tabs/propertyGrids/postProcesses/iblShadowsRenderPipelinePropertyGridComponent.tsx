import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { CommonRenderingPipelinePropertyGridComponent } from "./commonRenderingPipelinePropertyGridComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { IblShadowsRenderPipeline } from "core/Rendering/IBLShadows/iblShadowsRenderPipeline";
import type { GlobalState } from "../../../../globalState";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";

interface IIblShadowsRenderPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: IblShadowsRenderPipeline;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class IblShadowsRenderPipelinePropertyGridComponent extends React.Component<IIblShadowsRenderPipelinePropertyGridComponentProps> {
    constructor(props: IIblShadowsRenderPipelinePropertyGridComponentProps) {
        super(props);
    }

    override render() {
        const renderPipeline = this.props.renderPipeline;

        return (
            <>
                <CommonRenderingPipelinePropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    renderPipeline={renderPipeline}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="Voxel Shadows" selection={this.props.globalState}>
                    <ButtonLineComponent
                        label="Revoxelize"
                        onClick={() => {
                            this.props.renderPipeline.updateSceneBounds();
                        }}
                    />
                    <ButtonLineComponent
                        label="Link IBL"
                        onClick={() => {
                            if (this.props.renderPipeline.scene.environmentTexture) {
                                this.props.renderPipeline.setIblTexture(this.props.renderPipeline.scene.environmentTexture);
                            }
                        }}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Opacity"
                        minimum={0}
                        maximum={1}
                        step={0.05}
                        target={renderPipeline}
                        propertyName="shadowOpacity"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Samples"
                        minimum={0}
                        maximum={8}
                        step={1}
                        target={renderPipeline}
                        propertyName="sampleDirections"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Resolution"
                        minimum={4}
                        maximum={8}
                        step={1}
                        target={renderPipeline}
                        propertyName="resolutionExp"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Remenance"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="shadowRemenance"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="Screenspace Shadows" selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Opacity"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="ssShadowOpacity"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Samples"
                        minimum={0}
                        maximum={16}
                        step={1}
                        target={renderPipeline}
                        propertyName="ssShadowSamples"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Stride"
                        minimum={0}
                        maximum={16}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="ssShadowStride"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Max Distance"
                        minimum={0.01}
                        maximum={0.2}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="ssShadowMaxDist"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Thickness"
                        minimum={0.005}
                        maximum={0.02}
                        step={0.001}
                        target={renderPipeline}
                        propertyName="ssShadowThickness"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="Debug" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Allow Debug"
                        propertyName="allowDebugPasses"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        target={renderPipeline}
                    />
                    <CheckBoxLineComponent
                        label="Voxel Grid"
                        propertyName="voxelDebugEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        target={renderPipeline}
                    />
                    <CheckBoxLineComponent
                        label="Importance Sample"
                        propertyName="importanceSamplingDebugEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        target={renderPipeline}
                    />
                    <CheckBoxLineComponent
                        label="Voxel Tracing"
                        propertyName="voxelTracingDebugEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        target={renderPipeline}
                    />
                    <CheckBoxLineComponent
                        label="Accumulation"
                        propertyName="accumulationPassDebugEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        target={renderPipeline}
                    />
                </LineContainerComponent>
            </>
        );
    }
}
