import type { ContextType, FunctionComponent, PropsWithChildren } from "react";

import { useMemo } from "react";

import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { useCompactMode } from "../hooks/settingsHooks";

export const CompactModeContextProvider: FunctionComponent<PropsWithChildren> = (props) => {
    const [compactMode] = useCompactMode();

    const toolsContext = useMemo(() => {
        return {
            toolName: "",
            size: compactMode ? "small" : "medium",
            disableCopy: false,
            useFluent: true,
        } satisfies ContextType<typeof ToolContext>;
    }, [compactMode]);

    return <ToolContext.Provider value={toolsContext}>{props.children}</ToolContext.Provider>;
};
