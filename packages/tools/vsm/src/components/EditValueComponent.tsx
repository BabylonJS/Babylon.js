import { useContext, useState, useEffect } from "react";
import type { FC } from "react";
import { SelectionContext } from "./SelectionContext";
import { SetPositionAction } from "../actions/actions/SetPositionAction";
import type { Nullable } from "core/types";

export interface IEditValueComponentProps {}

const style = { width: "40px", backgroundColor: "rgb(87, 87, 87)", border: "unset" };

export const EditValueComponent: FC<IEditValueComponentProps> = (props) => {
    const { selectedNode } = useContext(SelectionContext);

    const [text, setText] = useState<Nullable<{ x: string; y: string; z: string }>>(null);

    useEffect(() => {
        if (selectedNode) {
            const selectedStateAction = selectedNode?.content?.data?.state?.stateEnterAction;

            const selectedStateValue = selectedStateAction && selectedStateAction instanceof SetPositionAction && selectedStateAction.targetPosition;
            if (selectedStateValue) {
                setText({ x: selectedStateValue.x.toString(), y: selectedStateValue.y.toString(), z: selectedStateValue.z.toString() });
            } else {
                setText(null);
            }
        }
    }, [selectedNode]);

    const onSingleValueChanged = (axis: "x" | "y" | "z", event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (text) {
            setText({ ...text, [axis]: value });
            const parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) return;
            const selectedStateAction = selectedNode?.content?.data?.state?.stateEnterAction;
            const selectedStateValue = selectedStateAction && selectedStateAction instanceof SetPositionAction && selectedStateAction.targetPosition;
            if (selectedStateValue) {
                selectedStateValue[axis] = parsedValue;
            }
        }
    };

    return text ? (
        <div style={{ display: "flex", gap: "2px" }}>
            <input style={style} value={text.x} onChange={(event) => onSingleValueChanged("x", event)}></input>
            <input style={style} value={text.y} onChange={(event) => onSingleValueChanged("y", event)}></input>
            <input style={style} value={text.z} onChange={(event) => onSingleValueChanged("z", event)}></input>
        </div>
    ) : null;
};
