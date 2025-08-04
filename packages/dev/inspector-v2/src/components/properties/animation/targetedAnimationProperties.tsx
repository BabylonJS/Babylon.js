import type { FunctionComponent } from "react";

import type { TargetedAnimation } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";
import { LinkToNodePropertyLine } from "../linkToNodePropertyLine";

export const TargetedAnimationGeneralProperties: FunctionComponent<{ targetedAnimation: TargetedAnimation; selectionService: ISelectionService }> = (props) => {
    const { selectionService } = props;

    return (
        <>
            <LinkToNodePropertyLine
                label="Target"
                description={`The entity animated by this animation.`}
                node={props.targetedAnimation.target}
                selectionService={selectionService}
            />
        </>
    );
};
