import type { FC } from "react";
import { useContext } from "react";
import { SelectionContext } from "./SelectionContext";
import { stateValuesProvider } from "../workbench";

export interface IEditValueComponentProps {}

const style = { width: "40px", backgroundColor: "rgb(87, 87, 87)", border: "unset" };

export const EditValueComponent: FC<IEditValueComponentProps> = (props) => {
    const { selectedNode } = useContext(SelectionContext);
    const { stateValues, setStateValues } = useContext(stateValuesProvider);

    const selectedStateValue = selectedNode ? stateValues[selectedNode.name] : null;

    const onSingleValueChanged = (axis: "x" | "y" | "z") => (event: React.ChangeEvent<HTMLInputElement>) => {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!selectedStateValue) return;
            const value = event.target.value;
            const newValue = selectedStateValue.clone();
            newValue[axis] = parseFloat(value);

            stateValues[selectedNode!.name] = newValue;
            setStateValues({ ...stateValues });
        };
    };

    return selectedStateValue ? (
        <div style={{ display: "flex" }}>
            <input style={style} value={selectedStateValue.x} onChange={onSingleValueChanged("x")}></input>
            <input style={style} value={selectedStateValue.y} onChange={onSingleValueChanged("y")}></input>
            <input style={style} value={selectedStateValue.z} onChange={onSingleValueChanged("z")}></input>
        </div>
    ) : null;
};
