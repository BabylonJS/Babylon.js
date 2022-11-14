import type { Vector3 } from "core/Maths/math.vector";
import type { FC } from "react";

export interface ISetPositionBlockProps {
    targetPosition: Vector3;
}

export const SetPositionBlock: FC<ISetPositionBlockProps> = (props) => {
    const { targetPosition } = props;

    return (
        <div>
            <div>{targetPosition.x + " " + targetPosition.y + " " + targetPosition.z}</div>
        </div>
    );
};
