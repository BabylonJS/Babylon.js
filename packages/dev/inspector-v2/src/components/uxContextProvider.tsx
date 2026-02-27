import type { ContextType, FunctionComponent, PropsWithChildren } from "react";

import { useMemo } from "react";

import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { useSetting } from "../hooks/settingsHooks";
import { CompactModeSettingDescriptor, DisableCopySettingDescriptor } from "../services/globalSettings";

export const UXContextProvider: FunctionComponent<PropsWithChildren> = (props) => {
    const [compactMode] = useSetting(CompactModeSettingDescriptor);
    const [disableCopy] = useSetting(DisableCopySettingDescriptor);

    const toolsContext = useMemo(() => {
        return {
            toolName: "",
            size: compactMode ? "small" : "medium",
            disableCopy,
            useFluent: true,
        } satisfies ContextType<typeof ToolContext>;
    }, [compactMode, disableCopy]);

    return <ToolContext.Provider value={toolsContext}>{props.children}</ToolContext.Provider>;
};
