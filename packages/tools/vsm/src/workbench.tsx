import { CommandBarComponent } from "shared-ui-components/components/bars/CommandBarComponent";
export type WorkbenchProps = {};

export const Workbench: React.FC<WorkbenchProps> = () => {
    return (
        <div>
            <CommandBarComponent />
        </div>
    );
};
