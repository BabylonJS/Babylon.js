//import type { Nullable } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { Slider, makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { ShellService } from "./shellService";

import { ArrowExpandRegular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { Mesh } from "core/Meshes/mesh";
import { MeshExploder } from "core/Misc/meshExploder";
import { SceneContext } from "./sceneContext";
import { useObservableState } from "../hooks/observableHooks";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
    },
    slider: {
        ...shorthands.margin(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    },
});

const explodeMax = 3;
const explodeMultiplier = 100 / explodeMax;

export const serviceDefinition: ServiceDefinition<[], [ShellService, SceneContext]> = {
    friendlyName: "Explode a Model",
    tags: ["scene"],
    consumes: [ShellService, SceneContext],
    factory: (shellService, sceneContext) => {
        const registration = shellService.addToLeftPane({
            key: "Exploder",
            title: "Exploder",
            icon: ArrowExpandRegular,
            content: () => {
                const classes = useStyles();

                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                const [exploder, setExploder] = useState<MeshExploder>();
                const [explode, setExplode] = useState(0);

                useEffect(() => {
                    if (scene) {
                        const meshes = scene.meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh);
                        setExploder(new MeshExploder(meshes));
                    } else {
                        setExploder(undefined);
                    }
                }, [scene]);

                useEffect(() => {
                    exploder?.explode(explode);
                }, [explode, exploder]);

                return (
                    <div className={classes.container}>
                        <Slider
                            className={classes.slider}
                            value={explode * explodeMultiplier}
                            max={100}
                            disabled={!scene}
                            onChange={(event, data) => setExplode(data.value / explodeMultiplier)}
                        />
                    </div>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};

export default {
    serviceDefinitions: [serviceDefinition] as const,
} as const;
