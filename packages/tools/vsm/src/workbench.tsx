import type { FC } from "react";
import { useState } from "react";
import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
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
            <div className={style.workArea} style={{ backgroundColor: workAreaColor }}></div>
        </div>
    );
};
