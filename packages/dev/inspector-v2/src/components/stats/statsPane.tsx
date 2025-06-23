// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { AccordionPane } from "../accordionPane";
import { makeStyles, tokens } from "@fluentui/react-components";
import { useObservableState } from "../../hooks/observableHooks";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    statsDiv: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
});

export const StatsPane: typeof AccordionPane<Scene> = (props) => {
    const scene = props.context;
    const classes = useStyles();
    const engine = scene.getEngine();
    const fps = useObservableState(() => Math.round(engine.getFps()), engine.onBeginFrameObservable);

    return (
        <div className={classes.statsDiv}>
            <TextPropertyLine key="EngineVersion" label="Version" description="The Babylon.js engine version." value={AbstractEngine.Version} />
            <TextPropertyLine key="FPS" label="FPS:" description="The current framerate" value={fps.toString()} />
            <AccordionPane {...props} />
        </div>
    );
};
