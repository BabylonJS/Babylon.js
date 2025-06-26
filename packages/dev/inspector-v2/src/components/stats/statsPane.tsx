// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";

import { AbstractEngine } from "core/Engines/abstractEngine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { AccordionPane } from "../accordionPane";
import { Pane } from "../pane";

export const StatsPane: typeof AccordionPane<Scene> = (props) => {
    const scene = props.context;
    const engine = scene.getEngine();
    const fps = useObservableState(() => Math.round(engine.getFps()), engine.onBeginFrameObservable);

    return (
        <>
            <Pane>
                <TextPropertyLine key="EngineVersion" label="Version" description="The Babylon.js engine version." value={AbstractEngine.Version} />
                <TextPropertyLine key="FPS" label="FPS:" description="The current framerate" value={fps.toString()} />
            </Pane>
            <AccordionPane {...props} />
        </>
    );
};
