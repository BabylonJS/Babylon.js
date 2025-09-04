import type { Bone } from "core/index";

import type { FunctionComponent } from "react";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";
import type { ISelectionService } from "../../../services/selectionService";

export const BoneGeneralProperties: FunctionComponent<{ bone: Bone; selectionService: ISelectionService }> = (props) => {
    const { bone } = props;

    return (
        <>
            <LinkToEntityPropertyLine
                key="Linked Transform Node"
                label="Linked Node"
                description="The transform node linked to this bone."
                entity={bone.getTransformNode()}
                selectionService={props.selectionService}
            />
        </>
    );
};
