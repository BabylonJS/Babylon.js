import { useContext } from "react";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";
import { DraggableLine } from "../fluent/primitives/draggable";

export type DraggableLineWithButtonProps = {
    format: string;
    data: string;
    tooltip: string;
    iconImage: any;
    onIconClick: (value: string) => void;
    iconTitle: string;
    lenSuffixToRemove?: number;
};

export const DraggableLineWithButtonComponent: React.FunctionComponent<DraggableLineWithButtonProps> = (props) => {
    const { useFluent } = useContext(ToolContext);
    if (useFluent) {
        // When updating the callsites to use fluent directly this label will be clearer since the string replace occurs where the data string lives
        return <DraggableLine {...props} label={props.data.substring(0, props.data.length - (props.lenSuffixToRemove ?? 6))} onDelete={() => props.onIconClick(props.data)} />;
    }
    return (
        <div
            className="draggableLine withButton"
            title={props.tooltip}
            draggable={true}
            onDragStart={(event) => {
                event.dataTransfer.setData(props.format, props.data);
            }}
        >
            {props.data.substring(0, props.data.length - (props.lenSuffixToRemove ?? 6))}
            <div
                className="icon"
                onClick={() => {
                    props.onIconClick(props.data);
                }}
                title={props.iconTitle}
            >
                <img className="img" title={props.iconTitle} src={props.iconImage} />
            </div>
        </div>
    );
};
