import { FluentProvider, webDarkTheme, type Theme } from "@fluentui/react-components";
import { createContext, type FunctionComponent } from "react";

export type ToolHostProps = {
    /**
     * The children to render inside the FluentToolWrapper.
     */
    children: React.ReactNode;
    /**
     * Allows host to pass in a theme
     */
    customTheme?: Theme;
};

export const ToolContext = createContext({ useFluent: false as boolean } as const);

/**
 * For tools which are ready to move over the fluent, wrap the root of the tool (or the panel which you want fluentized) with this component
 * Today we will only enable fluent if the URL has the `newUX` query parameter is truthy
 * @param props
 * @returns
 */
export const FluentToolWrapper: FunctionComponent<ToolHostProps> = (props) => {
    const url = new URL(window.location.href);
    const enableFluent = url.searchParams.get("newUX") || url.hash.includes("newUX");

    return enableFluent ? (
        <FluentProvider theme={props.customTheme || webDarkTheme}>
            <ToolContext.Provider value={{ useFluent: true }}>{props.children}</ToolContext.Provider>
        </FluentProvider>
    ) : (
        props.children
    );
};
