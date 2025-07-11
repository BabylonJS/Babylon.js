import { useContext } from "react";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { DraggableLine } from "shared-ui-components/fluent/primitives/draggable";

export type DraggableLineProps = {
    format: string;
    data: string;
    tooltip: string;
};

export const DraggableLineComponent: React.FunctionComponent<DraggableLineProps> = (props) => {
    const useFluent = useContext(ToolContext);
    if (useFluent) {
        // When updating the callsites to use fluent directly this label will be clearer since the string replace occurs where the Block_Foo lives
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
