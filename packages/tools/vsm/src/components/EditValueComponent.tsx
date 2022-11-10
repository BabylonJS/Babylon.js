import { useState, useEffect } from "react";
import type { FC } from "react";
import { SetPositionAction } from "../actions/actions/SetPositionAction";
import type { Nullable } from "core/types";
import { useSelectedAction } from "./tools/useSelectedAction";

export interface IEditValueComponentProps {}

const style = { width: "40px", backgroundColor: "rgb(87, 87, 87)", border: "unset" };

export const EditValueComponent: FC<IEditValueComponentProps> = (props) => {
    const { selectedAction, setSelectedAction } = useSelectedAction();

    const [text, setText] = useState<Nullable<{ x: string; y: string; z: string }>>(null);

    useEffect(() => {
        if (selectedAction instanceof SetPositionAction) {
            setText({ x: selectedAction.targetPosition.x.toString(), y: selectedAction.targetPosition.y.toString(), z: selectedAction.targetPosition.z.toString() });
        } else {
            setText(null);
        }
    }, [selectedAction]);

    const onSingleValueChanged = (axis: "x" | "y" | "z", event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (text) {
            setText({ ...text, [axis]: value });
            const parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) return;
            if (selectedAction instanceof SetPositionAction) {
                selectedAction.targetPosition[axis] = parsedValue;
                setSelectedAction(selectedAction);
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
