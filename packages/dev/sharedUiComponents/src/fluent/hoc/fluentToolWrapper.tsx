import type { PropsWithChildren, FunctionComponent, ComponentType } from "react";

import type { Theme } from "@fluentui/react-components";
import { FluentProvider, useFluent, webDarkTheme } from "@fluentui/react-components";

export type ToolHostProps = {
    /**
     * Allows host to pass in a theme
     */
    customTheme?: Theme;
};

/**
 * For tools which are ready to move over the fluent, wrap the root of the tool (or the panel which you want fluentized) with this component
 * Today we will only enable fluent if the URL has the `newUX` query parameter is truthy
 * @param props
 * @returns
 */
export const FluentToolWrapper: FunctionComponent<PropsWithChildren<ToolHostProps>> = (props) => {
    const url = new URL(window.location.href);
    const enableFluent = url.searchParams.get("newUX") || url.hash.includes("newUX");

    return enableFluent ? <FluentProvider theme={props.customTheme || webDarkTheme}>{props.children}</FluentProvider> : props.children;
};

/**
 * A higher-order component that conditionally renders a Fluent component or an original component based on the Fluent context.
 * This is useful for switching to fluent in class-based components that can't use hooks directly.
 * @param fluent - rendered if useFluent() is true
 * @param original - rendered if useFluent() is false
 * @returns A component that renders either the Fluent component or the original component based on the Fluent context.
 */
export const ConditionallyUseFluent: FunctionComponent<{ fluent: ComponentType; original: ComponentType }> = (fluent, original) => {
    const fluentEnabled = useFluent();
    return fluentEnabled ? fluent : original;
};
