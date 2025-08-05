import type { Scene } from "core/index";

import { AbstractEngine } from "core/Engines/abstractEngine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { ExtensibleAccordion } from "../extensibleAccordion";
import { Pane } from "../pane";

export const StatsPane: typeof ExtensibleAccordion<Scene> = (props) => {
    const scene = props.context;
    const engine = scene.getEngine();
    const fps = useObservableState(() => Math.round(engine.getFps()), engine.onBeginFrameObservable);

    return (
        <>
            <Pane>
                <TextPropertyLine key="EngineVersion" label="Version" description="The Babylon.js engine version." value={AbstractEngine.Version} />
                <StringifiedPropertyLine key="FPS" label="FPS:" description="The current framerate" value={fps} />
            </Pane>
            <ExtensibleAccordion {...props} />
        </>
    );
};
