import { useContext, useState, useEffect } from "react";
import type { FC } from "react";
import { SelectionContext } from "./SelectionContext";
import { stateValuesProvider } from "../workbench";

export interface IEditValueComponentProps {}

const style = { width: "40px", backgroundColor: "rgb(87, 87, 87)", border: "unset" };

export const EditValueComponent: FC<IEditValueComponentProps> = (props) => {
    const { selectedNode } = useContext(SelectionContext);
    const { stateValues, setStateValues } = useContext(stateValuesProvider);

    const [text, setText] = useState({ x: "", y: "", z: "" });

    const selectedStateValue = selectedNode ? stateValues[selectedNode.name] : null;

    useEffect(() => {
        if (selectedStateValue) {
            setText({ x: selectedStateValue.x.toString(), y: selectedStateValue.y.toString(), z: selectedStateValue.z.toString() });
        }
    }, [selectedStateValue]);

    const onSingleValueChanged = (axis: "x" | "y" | "z", event: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedStateValue) return;
        const value = event.target.value;
        setText({ ...text, [axis]: value });
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) return;
        const newValue = selectedStateValue.clone();
        newValue[axis] = parsedValue;

        stateValues[selectedNode!.name] = newValue;
        setStateValues({ ...stateValues });
    };

    return selectedStateValue ? (
        <div style={{ display: "flex", gap: "2px" }}>
            <input style={style} value={text.x} onChange={(event) => onSingleValueChanged("x", event)}></input>
            <input style={style} value={text.y} onChange={(event) => onSingleValueChanged("y", event)}></input>
            <input style={style} value={text.z} onChange={(event) => onSingleValueChanged("z", event)}></input>
        </div>
    ) : null;
};
