// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";

import { makeStyles, tokens } from "@fluentui/react-components";

import { AbstractEngine } from "core/Engines/abstractEngine";

import { AccordionPane } from "../accordionPane";
import { useObservableState } from "../../hooks/observableHooks";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    fixedStatsDiv: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} 0 ${tokens.spacingHorizontalM}`,
    },
});

export const StatsPane: typeof AccordionPane<Scene> = (props) => {
    const classes = useStyles();

    const scene = props.context;
    const engine = scene.getEngine();
    const fps = useObservableState(() => Math.round(engine.getFps()), engine.onBeginFrameObservable);

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div className={classes.fixedStatsDiv}>Version: {AbstractEngine.Version}</div>
            <div className={classes.fixedStatsDiv}>FPS: {fps}</div>
            <AccordionPane {...props} />
        </>
    );
};
