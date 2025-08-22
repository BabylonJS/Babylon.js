import { GizmoManager } from "core/Gizmos";
import { StandardMaterial } from "core/Materials";
import { Color3 } from "core/Maths";
import type { AbstractMesh } from "core/Meshes";
import { Attractor } from "core/Particles";
import type { ParticleSystem } from "core/Particles";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { useCallback, useEffect, useState, type FunctionComponent } from "react";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { List } from "shared-ui-components/fluent/primitives/list";
import type { ListItem } from "shared-ui-components/fluent/primitives/list";
import { useResource } from "../../../hooks/resourceHooks";
import { AttractorComponent } from "./attractor";
type AttractorListProps = {
    scene: Scene;
    attractors: Array<Attractor>;
    system: ParticleSystem;
};

// For each Attractor, create a listItem consisting of the attractor and its debugging impostor mesh
function AttractorsToListItems(attractors: Nullable<Array<Attractor>>) {
    return (
        attractors?.map((attractor, index) => {
            return {
                id: index,
                data: attractor,
                sortBy: 0,
            };
        }) ?? []
    );
}

const CreateGizmoManager = (scene: Scene) => {
    const gizmoManager = new GizmoManager(scene);
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

export const AttractorList: FunctionComponent<AttractorListProps> = (props) => {
    const { scene, system } = props;
    const [items, setItems] = useState<Array<ListItem<Attractor>>>([]);

    // All impostors share a scale and material/color (for now!)
    const [impostorScale, setImpostorScale] = useState(1);
    const [impostorColor, setImpostorColor] = useState(() => Color3.White());
    const impostorMaterial = useResource(useCallback(() => CreateSharedMaterial(scene, impostorColor), [scene]));

    // All impostors share a gizmoManager. controlledImpostor state ensures re-render of children so that their gizmoEnabled toggle is accurate
    const gizmoManager = useResource(useCallback(() => CreateGizmoManager(scene), [scene]));
    const [controlledImpostor, setControlledImpostor] = useState<Nullable<AbstractMesh>>(null);

    // If attractors change, recreate the items to re-render attractor components
    useEffect(() => {
        setItems(AttractorsToListItems(props.attractors));
    }, [props.attractors]);

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

    return (
        <>
            {items.length > 0 && (
                <>
                    <Color3PropertyLine label="Attractor debug color" value={impostorColor} onChange={setImpostorColor} />
                    <SyncedSliderPropertyLine label="Attractor debug size" value={impostorScale} onChange={setImpostorScale} min={0} max={10} step={0.1} />
                </>
            )}
            <List
                addButtonLabel={`Add new attractor`}
                items={items}
                onDelete={(item, _index) => system.removeAttractor(item.data)}
                onAdd={(item) => system.addAttractor(item?.data ?? new Attractor())}
                renderItem={(item) => {
                    return (
                        <AttractorComponent
                            attractor={item.data}
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
