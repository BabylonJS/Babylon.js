import type { PostProcess } from "core/PostProcesses/postProcess";

import type { FunctionComponent } from "react";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { BoundProperty } from "../boundProperty";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";

/**
 * The properties component for a post process.
 * @param props - The properties component props containing the post process.
 * @returns JSX.Element
 */
export const PostProcessProperties: FunctionComponent<{ postProcess: PostProcess }> = (props) => {
    const { postProcess } = props;
    return (
        <>
            <StringifiedPropertyLine label="Width" description="The width of the post process" value={postProcess.width} units="px" />
            <StringifiedPropertyLine label="Height" description="The height of the post process" value={postProcess.height} units="px" />
            <BoundProperty component={CheckboxPropertyLine} label="Auto Clear" target={postProcess} propertyKey="autoClear" />
            {postProcess.clearColor && <BoundProperty component={Color4PropertyLine} label="Clear Color" target={postProcess} propertyKey="clearColor" />}
            <BoundProperty component={CheckboxPropertyLine} label="Pixel Perfect" target={postProcess} propertyKey="enablePixelPerfectMode" />
            <BoundProperty component={CheckboxPropertyLine} label="Fullscreen Viewport" target={postProcess} propertyKey="forceFullscreenViewport" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Samples" target={postProcess} propertyKey="samples" min={1} max={8} step={1} />
        </>
    );
};
