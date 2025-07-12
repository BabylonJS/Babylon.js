import { useContext } from "react";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";
import { DraggableLine } from "../fluent/primitives/draggable";
import type { DraggableLineProps } from "../fluent/primitives/draggable";

export const DraggableLineComponent: React.FunctionComponent<DraggableLineProps> = (props) => {
    const useFluent = useContext(ToolContext);
    if (useFluent) {
        // When updating the callsites to use fluent directly this label will be clearer since the string replace occurs where the Block_Foo lives where the Block name is
        return <DraggableLine {...props} label={props.data.replace("Block", "")} />;
    }
    return (
        <div
            className="draggableLine"
            title={props.tooltip}
            draggable={true}
            onDragStart={(event) => {
                event.dataTransfer.setData(props.format, props.data);
            }}
        >
            {props.data.replace("Block", "")}
        </div>
    );
};
