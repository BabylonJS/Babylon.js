import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { createContext, FC } from "react";
import { useState, useEffect } from "react";
import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
import { FlexibleGridLayout } from "shared-ui-components/components/layout/FlexibleGridLayout";
import { SceneContext } from "./SceneContext";
import style from "./workbench.modules.scss";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { SelectionContext } from "./components/SelectionContext";
import { initialLayout } from "./initialLayout";
import { Vector3 } from "core/Maths/math";

export type WorkbenchProps = {};

// eslint-disable-next-line @typescript-eslint/naming-convention
const INITIAL_WORKBENCH_COLOR = "#AAAAAA";

export const stateValuesProvider = createContext<{ stateValues: Record<string, Vector3>; setStateValues: (v: Record<string, Vector3>) => void }>({
    stateValues: {},
    setStateValues: () => {},
});

export const Workbench: FC<WorkbenchProps> = () => {
    const [workAreaColor, setWorkAreaColor] = useState(INITIAL_WORKBENCH_COLOR);
    const [scene, setScene] = useState<Nullable<Scene>>(null);
    const [selectedNode, setSelectedNode] = useState<Nullable<GraphNode>>(null);
    const [stateValues, setStateValues] = useState<Record<string, Vector3>>({});

    useEffect(() => {
        const stateValues = {
            "Sphere Origin": new Vector3(0, 0, 0),
            "Sphere Destination": new Vector3(1, 1, 1),
        };
        setStateValues(stateValues);
    }, []);

    useEffect(() => {
        if (scene) {
            // Get node
            const node = scene.getMeshByName("sphere");
            if (node) {
                let currentState = "Sphere Origin";

                scene.onPointerPick = (pickedPoint, pickInfo) => {
                    if (pickInfo.pickedMesh !== node) return;

                    // Change state
                    if (currentState === "Sphere Origin") {
                        currentState = "Sphere Destination";
                    } else {
                        currentState = "Sphere Origin";
                    }
                    node.position = stateValues[currentState];

                    // Execute action
                };
            }
        }
    }, [scene]);

    return (
        <SceneContext.Provider value={{ scene, setScene }}>
            <SelectionContext.Provider value={{ selectedNode, setSelectedNode }}>
                <stateValuesProvider.Provider value={{ stateValues, setStateValues }}>
                    <div className={style.workbenchContainer}>
                        <CommandBarComponent
                            artboardColor={workAreaColor}
                            artboardColorPickerColor={INITIAL_WORKBENCH_COLOR}
                            onArtboardColorChanged={(newColor) => setWorkAreaColor(newColor)}
                        />
                        <div className={style.workArea} style={{ backgroundColor: workAreaColor }}>
                            <FlexibleGridLayout layoutDefinition={initialLayout} />
                        </div>
                    </div>
                </stateValuesProvider.Provider>
            </SelectionContext.Provider>
        </SceneContext.Provider>
    );
};
