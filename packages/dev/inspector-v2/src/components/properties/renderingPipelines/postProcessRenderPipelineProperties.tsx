import type { FunctionComponent } from "react";

import type { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";

export const PostProcessRenderPipelineSamplesProperties: FunctionComponent<{ pipeline: PostProcessRenderPipeline }> = (props) => {
    const { pipeline } = props;

    const hasSamples = "samples" in pipeline;

    if (!hasSamples) {
        return null;
    }

    return (
        <BoundProperty
            component={SyncedSliderPropertyLine}
            label="Samples"
            description="MSAA sample count"
            target={pipeline as PostProcessRenderPipeline & { samples: number }}
            propertyKey="samples"
            min={1}
            step={1}
        />
    );
};
