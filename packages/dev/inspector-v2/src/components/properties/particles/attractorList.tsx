// import { makeStyles } from "@fluentui/react-components";
import { FontAsset } from "addons/msdfText/fontAsset";
import { GizmoManager } from "core/Gizmos";
import { StandardMaterial } from "core/Materials";
import { Color3 } from "core/Maths";
import type { AbstractMesh } from "core/Meshes";
import { Attractor } from "core/Particles";
import type { ParticleSystem } from "core/Particles";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { List } from "shared-ui-components/fluent/primitives/list";
import type { ListItem } from "shared-ui-components/fluent/primitives/list";
import { useResource } from "../../../hooks/resourceHooks";
import { AttractorComponent } from "./attractor";
type AttractorListProps = {
    scene: Scene;
    gizmoManager: GizmoManager;
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

function useFontAsset(jsonUrl: string, imageUrl: string) {
    const fontAssetRef = useRef<FontAsset>();
    const loadingRef = useRef<Promise<FontAsset>>();

    const getFontAsset = useCallback(async (): Promise<FontAsset> => {
        if (fontAssetRef.current) {
            return fontAssetRef.current;
        }

        if (loadingRef.current) {
            return await loadingRef.current;
        }

        loadingRef.current = (async () => {
            const definition = await (await fetch(jsonUrl)).text();
            const asset = new FontAsset(definition, imageUrl);
            fontAssetRef.current = asset;
            loadingRef.current = undefined;
            return asset;
        })();

        return await loadingRef.current;
    }, [jsonUrl, imageUrl]);

    // Cleanup
    useEffect(() => {
        return () => {
            fontAssetRef.current?.dispose();
        };
    }, []);

    return getFontAsset;
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
    // material.reservedDataStore = { hidden: true }; // Ensure scene explorer doesn't show the material
    return material;
};

export const AttractorList: FunctionComponent<AttractorListProps> = (props) => {
    const { scene, system } = props;
    const [items, setItems] = useState<Array<ListItem<Attractor>>>([]);

    // All impostors share a scale/color... for now!
    const [impostorScale, setImpostorScale] = useState(1);
    const [impostorColor, setImpostorColor] = useState<Color3>(() => Color3.White());
    const [controlledImpostor, setControlledImpostor] = useState<Nullable<AbstractMesh>>(null);
    const getFontAsset = useFontAsset("https://assets.babylonjs.com/fonts/roboto-regular.json", "https://assets.babylonjs.com/fonts/roboto-regular.png");

    const gizmoManager = useResource(() => CreateGizmoManager(scene));
    const impostorMaterial = useResource(() => CreateSharedMaterial(scene, impostorColor));

    // If attractors change, recreate the items to re-render attractor components
    useEffect(() => {
        setItems(AttractorsToListItems(props.attractors));
    }, [props.attractors]);

    // If color changes, make sure
    useEffect(() => {
        impostorMaterial.diffuseColor = impostorColor;
    }, [impostorColor]);

    const onControlImpostor = (impostor?: AbstractMesh) => {
        // If an impostor is passed, attach the gizmo to the current impostor, otherwise it will detach (i.e. set to null)
        const attach = impostor ?? null;
        gizmoManager.attachToMesh(attach);
        setControlledImpostor(attach);
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
                            // maybe instead pass the impostor directly controlledImpostor
                            onControl={onControlImpostor}
                        />
                    );
                }}
            />
        </>
    );
};
