import { ArrowMoveFilled, EyeFilled, EyeOffFilled } from "@fluentui/react-icons";
import { FontAsset } from "addons/msdfText/fontAsset";
import { TextRenderer } from "addons/msdfText/textRenderer";
import { GizmoManager } from "core/Gizmos";
import { StandardMaterial } from "core/Materials";
import { Color3, Color4, Matrix } from "core/Maths";
import type { AbstractMesh } from "core/Meshes";
import { CreateSphere } from "core/Meshes";
import type { Observer } from "core/Misc";
import { Attractor } from "core/Particles";
import type { ParticleSystem } from "core/Particles";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { useRef, useState, type FunctionComponent } from "react";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { List } from "shared-ui-components/fluent/primitives/list";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";

type AttractorProps = {
    attractor: Attractor;
    controlled: boolean;
    onView: (attractor: Attractor) => void;
    onControl: (attractor: Attractor) => void;
    isControlled: (attractor: Attractor) => void;
};

export const AttractorComponent: FunctionComponent<AttractorProps> = (props) => {
    const { attractor, controlled } = props;
    // TODO add state for controlled logic, fix toggle button to match what actiontoggle uses

    return (
        <div>
            <SyncedSliderInput value={attractor.strength} onChange={(value) => (attractor.strength = value)} min={-10} max={10} step={0.1} />
            <ToggleButton title="Show / hide particle attractor." enabledIcon={EyeFilled} disabledIcon={EyeOffFilled} value={controlled} onChange={() => props.onView(attractor)} />
            <ToggleButton title="Control particle attractor" enabledIcon={ArrowMoveFilled} value={controlled} onChange={() => props.onControl(attractor)} />
        </div>
    );
};

// // TODO combine with GradientListProps
// type SimpleListProps<T extends Attractor> = {
//     label: string;
//     value: Nullable<Array<T>>;
//     add: (step?: T) => void;
//     remove: (step: T, index: number) => void;
//     onChange: (step: T) => void;
// };

// Convert gradients to LineList items and sort by gradient value
function AttractorsToListItems(attractors: Nullable<Array<Attractor>>) {
    return (
        attractors?.map((attractor, index) => ({
            id: index,
            data: attractor,
            sortBy: 0, // attractor.strength, // do we want the attractors sorted by strength?
        })) ?? []
    );
}
type AttractorListProps = {
    scene: Scene;
    gizmoManager: GizmoManager;
    attractors: Array<Attractor>;
    system: ParticleSystem;
};

type AttractorDebugProperties = {
    impostor: AbstractMesh;
    label?: TextRenderer;
    material: StandardMaterial;
};
export const AttractorList: FunctionComponent<AttractorListProps> = (props) => {
    const items = AttractorsToListItems(props.attractors);
    const { scene, system } = props; // TODO pass in gizmo?
    const [impostorScale, setImpostorScale] = useState(1);
    const [impostorColor, setImpostorColor] = useState<Color3>(Color3.White());
    const gizmoManagerRef = useRef<GizmoManager>();
    // TODO fix label
    const fontAssetRef = useRef<FontAsset>();
    const impostorMaterialRef = useRef<StandardMaterial>();
    const sceneOnAfterRenderObserver = useRef<Observer<Scene>>();
    const attractorDebugPropertyMap = useRef<Map<Attractor, AttractorDebugProperties>>(new Map());

    const isControlled = (attractor: Attractor) => {
        return gizmoManagerRef.current?.attachedMesh ? gizmoManagerRef.current?.attachedMesh === attractorDebugPropertyMap.current.get(attractor)?.impostor : false;
    };

    const addImpostor = (attractor: Attractor, index: number): AbstractMesh => {
        let impostor = attractorDebugPropertyMap.current.get(attractor)?.impostor;
        if (!impostor) {
            // Create impostor
            impostor = CreateSphere("Attractor impostor #" + index, { diameter: 1 }, props.scene);
            impostor.reservedDataStore = { hidden: true };
            impostor.scaling.setAll(impostorScale);
            impostor.position.copyFrom(attractor.position);

            // Create material
            if (!impostorMaterialRef.current) {
                impostorMaterialRef.current = new StandardMaterial("Attractor impostor material", scene);
                impostorMaterialRef.current.emissiveColor = impostorColor;
                impostorMaterialRef.current.disableLighting = true;
            }

            // Add attractor to debugMap with its debugProperties
            const debugProperties = {
                impostor,
                material: impostorMaterialRef.current,
            };
            attractorDebugPropertyMap.current.set(attractor, debugProperties);

            // Add label async to debugProperties map once available
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            addLabelAsync(impostor, index);

            // With each tick, update the attractor's position to match that of the impostor
            // and ensure material/label are up to date
            if (!sceneOnAfterRenderObserver.current) {
                sceneOnAfterRenderObserver.current = scene.onAfterRenderObservable.add(() => {
                    attractorDebugPropertyMap.current.forEach((properties, attractor) => {
                        attractor.position.copyFrom(properties.impostor.position);
                        properties.impostor.material = properties.material;
                        // How do we want to handle async here?
                        properties.label && (properties.label.color = Color4.FromColor3(impostorColor, 1.0));
                        properties.label && properties.label.render(scene.getViewMatrix(), scene.getProjectionMatrix());
                    });
                });
            }
        }
        return impostor;
    };

    const onControlAttractorChange = (attractor: Attractor, index: number) => {
        // If attractor doesn't yet have an impostor mapping, add one
        // If we're controlling it means we should already have a mapping, right? can clean this up tomorrow
        const impostor = addImpostor(attractor, index);

        // If component doesn't yet have a gizmo manager, create one
        // Ask david why not just create this when creating particle inspector section? same with the observable and text renderer
        if (!gizmoManagerRef.current) {
            const gizmoManager = new GizmoManager(props.scene);
            gizmoManager.positionGizmoEnabled = true;
            gizmoManager.attachableMeshes = [];
            gizmoManagerRef.current = gizmoManager;
        }

        // If gizmo not already attached to this impostor, attach it. otherwise detach it
        gizmoManagerRef.current.attachedMesh === impostor ? gizmoManagerRef.current.attachToMesh(null) : gizmoManagerRef.current.attachToMesh(impostor);
    };

    const addLabelAsync = async (impostor: AbstractMesh, index: number) => {
        const engine = scene.getEngine();

        // Load font if not already loaded
        if (!fontAssetRef.current) {
            const sdfFontDefinition = await (await fetch("https://assets.babylonjs.com/fonts/roboto-regular.json")).text();
            !fontAssetRef.current && (fontAssetRef.current = new FontAsset(sdfFontDefinition, "https://assets.babylonjs.com/fonts/roboto-regular.png"));
        }

        const textRenderer = await TextRenderer.CreateTextRendererAsync(fontAssetRef.current, engine);
        textRenderer.addParagraph("#" + index, {}, Matrix.Scaling(0.5, 0.5, 0.5).multiply(Matrix.Translation(0, 1, 0)));
        textRenderer.isBillboard = true;
        textRenderer.color = Color4.FromColor3(impostorColor, 1.0);
        textRenderer.parent = impostor;

        return textRenderer;
    };

    // TODO Decide where is source of truth state for control and view
    const onViewAttractorChange = (attractor: Attractor, index: number) => {
        // If attractor already has an imposter, cleanup. Otherwise, add imposter to make it visible
        const debugProperties = attractorDebugPropertyMap.current.get(attractor);
        if (debugProperties) {
            isControlled(attractor) && gizmoManagerRef.current?.attachToMesh(null);
            debugProperties.impostor.dispose();
            debugProperties.label?.dispose();
            debugProperties.material.dispose(); // only dispose if no one else needs it?
            attractorDebugPropertyMap.current.delete(attractor);
            // Ensure proper cleanup, do i really need to reset the material each time?
        } else {
            addImpostor(attractor, index);
        }
        // force update
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
                    const attractor = item.data;
                    return (
                        <AttractorComponent
                            attractor={attractor}
                            controlled={isControlled(attractor)}
                            onView={(attractor) => onViewAttractorChange(attractor, item.id)}
                            onControl={(attractor) => onControlAttractorChange(attractor, item.id)}
                            isControlled={isControlled}
                        />
                    );
                }}
            />
        </>
    );
};
