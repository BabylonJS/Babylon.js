import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
import style from "./workbench.modules.scss";

export type WorkbenchProps = {};

export const Workbench: React.FC<WorkbenchProps> = () => {
    return (
        <div className={style.workbenchContainer}>
            <CommandBarComponent />
            <div className={style.workArea}></div>
        </div>
    );
};
