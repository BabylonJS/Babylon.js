import type { FC } from "react";
import { useContext } from "react";
import { SelectionContext } from "./SelectionContext";

export const StateBehaviorViewComponent: FC = () => {
    const { selectedNode } = useContext(SelectionContext);

    return <div>Selected node's name is {selectedNode?.name}</div>;
};
