// eslint-disable-next-line import/no-internal-modules
import type { Bone } from "core/index";

import type { FunctionComponent } from "react";

import { LinkPropertyLine } from "../../../../sharedUiComponents/src/fluent/hoc/linkPropertyLine";

export const BoneGeneralProperties: FunctionComponent<{ bone: Bone; setSelectedEntity: (entity: unknown) => void }> = (props) => {
    const { bone, setSelectedEntity } = props;

    const linkedNode = bone.getTransformNode();

    return (
        <>
            {linkedNode && (
                <LinkPropertyLine
                    key="Linked Transform Node"
                    label="Linked node"
                    description={`The transform node linked to this bone.`}
                    value={linkedNode.name}
                    onLink={() => setSelectedEntity(linkedNode)}
                />
            )}
        </>
    );
};
