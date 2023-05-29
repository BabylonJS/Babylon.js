import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { useState, useEffect } from "react";
import type { FC } from "react";
import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
import { FlexibleGridLayout } from "shared-ui-components/components/layout/FlexibleGridLayout";
import { SceneContext } from "./context/SceneContext";
import style from "./workbench.modules.scss";
import { StateSelectionContext } from "./context/StateSelectionContext";
import { initialLayout } from "./initialLayout";
import { StateMachine } from "./stateMachine/StateMachine";
import type { IStateMachineWrapper } from "./context/StateMachineContext";
import { StateMachineContext } from "./context/StateMachineContext";
import { CommandButtonComponent } from "shared-ui-components/components/bars/CommandButtonComponent";
import type { State } from "./stateMachine/State";

import playIcon from "./components/imgs/playIcon.svg";
import pauseIcon from "./components/imgs/pauseIcon.svg";
import type { IActionSelectionContextWrapper } from "./context/ActionSelectionContext";
import { ActionSelectionContext } from "./context/ActionSelectionContext";

export type WorkbenchProps = {};

// eslint-disable-next-line @typescript-eslint/naming-convention
const INITIAL_WORKBENCH_COLOR = "#AAAAAA";

export const Workbench: FC<WorkbenchProps> = () => {
    const [workAreaColor, setWorkAreaColor] = useState(INITIAL_WORKBENCH_COLOR);
    const [scene, setScene] = useState<Nullable<Scene>>(null);
    const [selectedState, setSelectedState] = useState<Nullable<State>>(null);
    const [stateMachineWrapper, setStateMachineWrapper] = useState<Nullable<IStateMachineWrapper>>(null);
    const [selectedActionWrapper, setSelectedActionWrapper] = useState<IActionSelectionContextWrapper>({ action: null, lastUpdate: Date.now() });

    const startStateMachine = () => {
        if (stateMachineWrapper) {
            stateMachineWrapper.stateMachine.start();
        }
    };

    const pauseStateMachine = () => {
        if (stateMachineWrapper) {
            stateMachineWrapper.stateMachine.pause();
        }
    };

    useEffect(() => {
        if (scene) {
            const node = scene.getMeshByName("sphere");
            if (node) {
                const stateMachine = new StateMachine(scene, node);

                setStateMachineWrapper({ stateMachine, lastUpdate: Date.now() });
            }
        }
    }, [scene]);

    return (
        <SceneContext.Provider value={{ scene, setScene }}>
            <StateMachineContext.Provider value={{ stateMachineWrapper, setStateMachineWrapper }}>
                <StateSelectionContext.Provider value={{ selectedState: selectedState, setSelectedState: setSelectedState }}>
                    <ActionSelectionContext.Provider value={{ selectedActionWrapper, setSelectedActionWrapper }}>
                        <div className={style.workbenchContainer}>
                            <CommandBarComponent
                                artboardColor={workAreaColor}
                                artboardColorPickerColor={INITIAL_WORKBENCH_COLOR}
                                onArtboardColorChanged={(newColor) => setWorkAreaColor(newColor)}
                            >
                                <CommandButtonComponent tooltip="Start State Machine" icon={playIcon} onClick={startStateMachine} isActive={true}></CommandButtonComponent>
                                <CommandButtonComponent tooltip="Pause State Machine" icon={pauseIcon} onClick={pauseStateMachine} isActive={true}></CommandButtonComponent>
                            </CommandBarComponent>
                            <div className={style.workArea} style={{ backgroundColor: workAreaColor }}>
                                <FlexibleGridLayout layoutDefinition={initialLayout} />
                            </div>
                        </div>
                    </ActionSelectionContext.Provider>
                </StateSelectionContext.Provider>
            </StateMachineContext.Provider>
        </SceneContext.Provider>
    );
};
