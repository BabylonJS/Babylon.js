import type { PropsWithChildren, FunctionComponent } from "react";
import { createContext } from "react";
import type { Theme } from "@fluentui/react-components";
import { FluentProvider, webDarkTheme } from "@fluentui/react-components";

export type UiSize = "small" | "medium";
export type ToolHostProps = {
    /**
     * Will ensure all of the controls within the tool are of the same scale
     */
    size?: UiSize;

    /**
     * Allows host to pass in a theme
     */
    customTheme?: Theme;

    /**
     * Can be set to true to disable the copy button in the tool's property lines. Default is false (copy enabled)
     */
    disableCopy?: boolean;

    /**
     * Name of the tool displayed in the UX
     */
    toolName: string;
};

export const ToolContext = createContext({ useFluent: false as boolean, disableCopy: false as boolean, toolName: "" as string, size: undefined as UiSize | undefined } as const);

/**
 * For tools which are ready to move over the fluent, wrap the root of the tool (or the panel which you want fluentized) with this component
 * Today we will only enable fluent if the URL has the `newUX` query parameter is truthy
 * @param props
 * @returns
 */
export const FluentToolWrapper: FunctionComponent<PropsWithChildren<ToolHostProps>> = (props) => {
    const url = new URL(window.location.href);
    const useFluent = url.searchParams.has("newUX") || url.hash.includes("newUX");
    const contextValue = {
        useFluent,
        disableCopy: !!props.disableCopy,
        toolName: props.toolName,
        size: props.size,
    };
    return useFluent ? (
        <FluentProvider theme={props.customTheme || webDarkTheme}>
            <ToolContext.Provider value={contextValue}>{props.children}</ToolContext.Provider>
        </FluentProvider>
    ) : (
        <ToolContext.Provider value={contextValue}>{props.children}</ToolContext.Provider>
    );
};
