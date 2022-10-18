import type { FC } from "react";
import { useState } from "react";
import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
import { FlexibleGridLayout } from "shared-ui-components/components/layout/FlexibleGridLayout";
import style from "./workbench.modules.scss";
import { initialLayout } from "./initialLayout";

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
                <FlexibleGridLayout layoutDefinition={initialLayout} />
            </div>
        </div>
    );
};
