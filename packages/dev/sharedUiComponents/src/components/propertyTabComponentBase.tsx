import { useContext } from "react";
import type { FunctionComponent, PropsWithChildren } from "react";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";
import { Pane } from "../fluent/hoc/pane";
import { Accordion } from "../fluent/primitives/accordion";

/**
 * A wrapper component for the property tab that provides a consistent layout and styling.
 * It uses a Pane and an Accordion to organize the content, so its direct children
 * must have 'title' props to be compatible with the Accordion structure.
 * @param props The props to pass to the component.
 * @returns The rendered component.
 */
export const PropertyTabComponentBase: FunctionComponent<PropsWithChildren> = (props) => {
    const context = useContext(ToolContext);

    if (context.useFluent) {
        return (
            <Pane title={context.toolName}>
                <Accordion>{props.children}</Accordion>
            </Pane>
        );
    }

    return (
        <div id="propertyTab">
            <div id="header">
                <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                <div id="title">{context.toolName}</div>
            </div>
            <div>{props.children}</div>
        </div>
    );
};
