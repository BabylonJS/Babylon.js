import type { FunctionComponent } from "react";

import type { TargetedAnimation } from "core/index";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import type { ISelectionService } from "../../../services/selectionService";

export const TargetedAnimationGeneralProperties: FunctionComponent<{ targetedAnimation: TargetedAnimation; selectionService: ISelectionService }> = (props) => {
    const { selectionService } = props;

    return (
        <>
            <LinkPropertyLine
                label="Target"
                description={`The entity animated by this animation.`}
                value={props.targetedAnimation.target.name}
                onLink={() => (selectionService.selectedEntity = props.targetedAnimation.target)}
            />
        </>
    );
};
