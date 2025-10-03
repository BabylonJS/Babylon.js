import type { Scene } from "core/index";

import { makeStyles, tokens } from "@fluentui/react-components";

import { AbstractEngine } from "core/Engines/abstractEngine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { ExtensibleAccordion } from "../extensibleAccordion";
import { SidePaneContainer } from "../pane";

const useStyles = makeStyles({
    pinnedStatsPane: {
        flex: "0 1 auto",
        paddingBottom: tokens.spacingHorizontalM,
    },
});

export const StatsPane: typeof ExtensibleAccordion<Scene> = (props) => {
    const classes = useStyles();

    const scene = props.context;
    const engine = scene.getEngine();
    const fps = useObservableState(() => Math.round(engine.getFps()), engine.onBeginFrameObservable);

    return (
        <>
            <SidePaneContainer className={classes.pinnedStatsPane}>
                <TextPropertyLine key="EngineVersion" label="Version" description="The Babylon.js engine version." value={AbstractEngine.Version} />
                <StringifiedPropertyLine key="FPS" label="FPS:" description="The current framerate" value={fps} />
            </SidePaneContainer>
            <ExtensibleAccordion {...props} />
        </>
    );
};
