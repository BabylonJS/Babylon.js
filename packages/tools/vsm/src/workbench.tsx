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
                                id: "column1",
                                width: "25%",
                                rows: [
                                    { id: "row1", height: "30%", tabs: [{ id: "c1", component: <TestComponent name="c1" /> }] },
                                    {
                                        id: "row2",
                                        height: "20%",
                                        selectedTab: "c3",
                                        tabs: [
                                            { id: "c2", component: <TestComponent name="c2" /> },
                                            { id: "c3", component: <TestComponent name="c3" /> },
                                            { id: "c4", component: <TestComponent name="c4" /> },
                                        ],
                                    },
                                    { id: "row3", height: "50%", tabs: [{ id: "c5", component: <TestComponent name="c5" /> }] },
                                ],
                            },
                            {
                                id: "column2",
                                width: "50%",
                                rows: [
                                    { id: "row4", height: "70%", tabs: [{ id: "c6", component: <TestComponent name="c6" /> }] },
                                    { id: "row5", height: "30%", tabs: [{ id: "c7", component: <TestComponent name="c7" /> }] },
                                ],
                            },
                            {
                                id: "column3",
                                width: "25%",
                                rows: [
                                    { id: "row6", height: "50%", tabs: [{ id: "c8", component: <TestComponent name="c8" /> }] },
                                    { id: "row7", height: "50%", tabs: [{ id: "c9", component: <TestComponent name="c9" /> }] },
                                ],
                            },
                        ],
                    }}
                />
            </div>
        </div>
    );
};
