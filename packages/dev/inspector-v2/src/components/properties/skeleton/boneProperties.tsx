import type { Bone } from "core/index";

import type { FunctionComponent } from "react";
import { LinkToNodePropertyLine } from "../linkToNodePropertyLine";
import type { ISelectionService } from "../../../services/selectionService";

export const BoneGeneralProperties: FunctionComponent<{ bone: Bone; selectionService: ISelectionService }> = (props) => {
    const { bone } = props;

    return (
        <>
            <LinkToNodePropertyLine
                key="Linked Transform Node"
                label="Linked node"
                description={`The transform node linked to this bone.`}
                node={bone.getTransformNode()}
                selectionService={props.selectionService}
            />
        </>
    );
};
