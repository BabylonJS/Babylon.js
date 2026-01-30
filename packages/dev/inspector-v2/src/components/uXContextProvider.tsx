import type { ContextType, FunctionComponent, PropsWithChildren } from "react";

import { useMemo } from "react";

import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { useCompactMode, useDisableCopy } from "../hooks/settingsHooks";

export const UXContextProvider: FunctionComponent<PropsWithChildren> = (props) => {
    const [compactMode] = useCompactMode();
    const [disableCopy] = useDisableCopy();

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
