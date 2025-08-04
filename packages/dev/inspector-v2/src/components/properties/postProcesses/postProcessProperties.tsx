import type { PostProcess } from "core/PostProcesses/postProcess";

import type { FunctionComponent } from "react";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

/**
 * The properties component for a post process.
 * @param props - The properties component props containing the post process.
 * @returns JSX.Element
 */
export const PostProcessProperties: FunctionComponent<{ postProcess: PostProcess }> = (props) => {
    const { postProcess } = props;
    return (
        <>
            <StringifiedPropertyLine key="width" label="Width:" description="The width of the post process" value={postProcess.width} units="px" />
            <StringifiedPropertyLine key="height" label="Height:" description="The height of the post process" value={postProcess.height} units="px" />
            <BoundProperty component={CheckboxPropertyLine} label="Auto Clear:" target={postProcess} propertyKey="autoClear" />
        </>
    );
};
