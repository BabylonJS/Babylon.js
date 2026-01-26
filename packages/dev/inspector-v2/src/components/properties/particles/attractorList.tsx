import type { FunctionComponent } from "react";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useState } from "react";

import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { ListItem } from "shared-ui-components/fluent/primitives/list";

import { GizmoManager } from "core/Gizmos/gizmoManager";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3 } from "core/Maths/math.color";
import { Attractor } from "core/Particles/attractor";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { List } from "shared-ui-components/fluent/primitives/list";
import { useResource } from "../../../hooks/resourceHooks";
import { AttractorComponent } from "./attractor";
import type { IAttractorData, IAttractorSource } from "./attractorAdapter";

const useStyles = makeStyles({
    subsection: {
        marginTop: tokens.spacingVerticalM,
    },
});

type AttractorListProps = {
    scene: Scene;
    attractorSource: IAttractorSource;
};

// For each IAttractorData, create a listItem
function AttractorsToListItems(attractors: IAttractorData[]) {
    return attractors.map((attractor, index) => {
        return {
            id: index,
            data: attractor,
            sortBy: 0,
        };
    });
}

const CreateGizmoManager = (scene: Scene) => {
    const gizmoManager = new GizmoManager(
        scene,
        1,
        UtilityLayerRenderer._CreateDefaultUtilityLayerFromScene(scene),
        UtilityLayerRenderer._CreateDefaultKeepUtilityLayerFromScene(scene)
    );
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.attachableMeshes = [];
    return gizmoManager;
};
const CreateSharedMaterial = (scene: Scene, impostorColor: Color3) => {
    const material = new StandardMaterial("Attractor impostor material", scene);
    material.diffuseColor = impostorColor;
    material.reservedDataStore = { hidden: true }; // Ensure scene explorer doesn't show the material
    return material;
};

/**
 * Component that displays a list of attractors with debug visualization and editing controls.
 * Supports both CPU particle systems (editable) and Node particle systems (read-only).
 * @param props The component props containing the scene and attractor source.
 * @returns The rendered AttractorList component.
 */
export const AttractorList: FunctionComponent<AttractorListProps> = (props) => {
    const { scene, attractorSource } = props;
    const [items, setItems] = useState<Array<ListItem<IAttractorData>>>([]);

    // All impostors share a scale and material/color (for now!)
    const [impostorScale, setImpostorScale] = useState(1);
    const [impostorColor, setImpostorColor] = useState(() => Color3.White());
    const impostorMaterial = useResource(useCallback(() => CreateSharedMaterial(scene, impostorColor), [scene]));

    // All impostors share a gizmoManager. controlledImpostor state ensures re-render of children so that their gizmoEnabled toggle is accurate
    const gizmoManager = useResource(useCallback(() => CreateGizmoManager(scene), [scene]));
    const [controlledImpostor, setControlledImpostor] = useState<Nullable<AbstractMesh>>(null);

    // If attractors change, recreate the items to re-render attractor components
    useEffect(() => {
        setItems(AttractorsToListItems(attractorSource.attractors));
    }, [attractorSource.attractors]);

    // If color changes, update shared material to ensure children reflect new color
    useEffect(() => {
        impostorMaterial.diffuseColor = impostorColor;
    }, [impostorColor]);

    const onControlImpostor = (impostor?: AbstractMesh) => {
        // If an impostor is passed, attach the gizmo to the current impostor, otherwise it will detach (i.e. set to null)
        const attached = impostor ?? null;
        gizmoManager.attachToMesh(attached);
        setControlledImpostor(attached);
    };

    const classes = useStyles();

    return (
        <>
            {items.length > 0 && (
                <>
                    <Color3PropertyLine label="Attractor Debug Color" value={impostorColor} onChange={setImpostorColor} />
                    <SyncedSliderPropertyLine label="Attractor Debug Size" value={impostorScale} onChange={setImpostorScale} min={0} max={10} step={0.1} />
                    <Subtitle2 className={classes.subsection}>Attractors list</Subtitle2>
                </>
            )}
            <List
                addButtonLabel={`Add New Attractor`}
                items={items}
                onDelete={
                    attractorSource.removeAttractor
                        ? (item, _index) => {
                              // Only CPU attractors (Attractor instances) can be removed
                              if (item.data.source instanceof Attractor) {
                                  attractorSource.removeAttractor!(item.data.source);
                              }
                          }
                        : undefined
                }
                onAdd={
                    attractorSource.addAttractor
                        ? (item) => {
                              // Only CPU attractors can be added
                              if (!item || item.data.source instanceof Attractor) {
                                  attractorSource.addAttractor!(item?.data.source instanceof Attractor ? item.data.source : new Attractor());
                              }
                          }
                        : undefined
                }
                renderItem={(item) => {
                    return (
                        <AttractorComponent
                            attractorData={item.data}
                            id={item.id}
                            scene={scene}
                            impostorColor={impostorColor}
                            impostorScale={impostorScale}
                            impostorMaterial={impostorMaterial}
                            isControlled={(impostor: AbstractMesh) => impostor === controlledImpostor}
                            onControl={onControlImpostor}
                        />
                    );
                }}
            />
        </>
    );
};
