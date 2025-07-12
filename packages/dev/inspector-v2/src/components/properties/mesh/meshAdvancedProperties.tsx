import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

import { BoundProperty } from "../boundProperty";

export const MeshAdvancedProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            {mesh.useBones && (
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Compute Bones Using Shaders"
                    description="Whether to compute bones using shaders."
                    target={mesh}
                    propertyKey={"computeBonesUsingShaders"}
                />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" description="Whether to check for collisions." target={mesh} propertyKey={"checkCollisions"} />
        </>
    );
};
