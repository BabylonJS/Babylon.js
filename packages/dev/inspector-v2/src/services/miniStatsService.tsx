import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { IShellService } from "./shellService";

import { Badge, makeStyles, tokens } from "@fluentui/react-components";

import { useObservableState } from "../hooks/observableHooks";
import { SceneContextIdentity } from "./sceneContext";
import { ShellServiceIdentity } from "./shellService";

const useStyles = makeStyles({
    badge: {
        margin: tokens.spacingHorizontalXXS,
        fontFamily: "monospace",
    },
});

export const MiniStatsServiceDefinition: ServiceDefinition<[], [ISceneContext, IShellService]> = {
    friendlyName: "Mini Stats",
    consumes: [SceneContextIdentity, ShellServiceIdentity],
    factory: (sceneContext, shellService) => {
        shellService.addToolbarItem({
            key: "Mini Stats",
            verticalLocation: "bottom",
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            component: () => {
                const classes = useStyles();

                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const engine = scene?.getEngine();
                const fps = useObservableState(() => (engine ? Math.round(engine.getFps()) : null), engine?.onBeginFrameObservable);

                return fps != null ? <Badge appearance="outline" className={classes.badge}>{`${fps} fps`}</Badge> : null;
            },
        });
    },
};
