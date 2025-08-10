import type { FunctionComponent } from "react";

import type { TargetedAnimation } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

export const TargetedAnimationGeneralProperties: FunctionComponent<{ targetedAnimation: TargetedAnimation; selectionService: ISelectionService }> = (props) => {
    const { selectionService } = props;

    return (
        <>
            <LinkToEntityPropertyLine
                label="Target"
                description="The entity animated by this animation."
                entity={props.targetedAnimation.target}
                selectionService={selectionService}
            />
        </>
    );
};
