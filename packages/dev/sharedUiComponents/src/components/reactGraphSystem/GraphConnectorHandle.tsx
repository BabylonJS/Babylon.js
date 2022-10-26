import type { FC } from "react";
import { useDrag } from "react-dnd";
import style from "./GraphConnectorHandle.modules.scss";

export interface IGraphConnectorHandlerProps {
    parentId: string;
    parentX: number;
    parentY: number;
}

export const GraphConnectorHandler: FC<IGraphConnectorHandlerProps> = (props) => {
    const { parentId, parentX, parentY } = props;
    const [, dragRef] = useDrag(
        () => ({
            type: "connector",
            item: { parentId, parentX, parentY },
        }),
        []
    );
    return <div ref={dragRef} className={style.handle} />;
};
