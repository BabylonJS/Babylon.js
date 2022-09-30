import type { FC } from "react";
import { useState } from "react";
import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
import { FlexibleGridLayout } from "shared-ui-components/components/layout/FlexibleGridLayout";
import { TestComponent } from "./testComponent";
import style from "./workbench.modules.scss";

export type WorkbenchProps = {};

// eslint-disable-next-line @typescript-eslint/naming-convention
const INITIAL_WORKBENCH_COLOR = "#AAAAAA";

export const Workbench: FC<WorkbenchProps> = () => {
    const [workAreaColor, setWorkAreaColor] = useState(INITIAL_WORKBENCH_COLOR);
    return (
        <div className={style.workbenchContainer}>
            <CommandBarComponent
                artboardColor={workAreaColor}
                artboardColorPickerColor={INITIAL_WORKBENCH_COLOR}
                onArtboardColorChanged={(newColor) => setWorkAreaColor(newColor)}
            />
            <div className={style.workArea} style={{ backgroundColor: workAreaColor }}>
                <FlexibleGridLayout
                    layoutDefinition={{
                        columns: [
                            {
                                width: "25%",
                                rows: [
                                    { height: "50%", component: <TestComponent name="c1" color="#ff00ff" /> },
                                    { height: "50%", component: <TestComponent name="c2" color="#ffff00" /> },
                                ],
                            },
                            { width: "75%", rows: [{ height: "100%", component: <TestComponent name="c3" color="#0000ff" /> }] },
                        ],
                    }}
                />
            </div>
        </div>
    );
};
