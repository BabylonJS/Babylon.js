import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { IShellService } from "./shellService";

import { Badge, makeStyles, tokens } from "@fluentui/react-components";
import { useCallback } from "react";

import { useObservableState } from "../hooks/observableHooks";
import { usePollingObservable } from "../hooks/pollingHooks";
import { DefaultToolbarItemOrder } from "./defaultToolbarMetadata";
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
            order: DefaultToolbarItemOrder.FrameRate,
            teachingMoment: false,
            component: () => {
                const classes = useStyles();

                const scene = useObservableState(
                    useCallback(() => sceneContext.currentScene, [sceneContext.currentScene]),
                    sceneContext.currentSceneObservable
                );
                const engine = scene?.getEngine();
                const pollingObservable = usePollingObservable(250);
                const fps = useObservableState(
                    useCallback(() => (engine ? Math.round(engine.getFps()) : null), [engine]),
                    pollingObservable
                );

                return fps != null ? <Badge appearance="outline" className={classes.badge}>{`${fps} fps`}</Badge> : null;
            },
        });
    },
};
