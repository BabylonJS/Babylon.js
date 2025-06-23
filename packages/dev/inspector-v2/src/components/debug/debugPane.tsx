// eslint-disable-next-line import/no-internal-modules
import { AccordionPane } from "../accordionPane";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { FontAsset } from "addons/msdfText/fontAsset";
import type { Nullable } from "core/types";
import { TextRenderer } from "addons/msdfText/textRenderer";
import { Matrix } from "core/Maths/math.vector";
import "core/Physics/physicsEngineComponent";
import "core/Physics/v1/physicsEngineComponent";
import "core/Physics/v2/physicsEngineComponent";
import { PhysicsViewer } from "core/Debug/physicsViewer";
import type { Mesh } from "core/Meshes/mesh";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { CreateGround } from "core/Meshes/Builders/groundBuilder";
import { GridMaterial } from "materials/grid/gridMaterial";
import { Tools } from "core/Misc/tools";
import { Color3 } from "core/Maths/math.color";
import { Texture } from "core/Materials/Textures/texture";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { useObservableState } from "../../hooks/observableHooks";
import type { Scene } from "core/scene";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import type { ComponentType } from "react";
import type { BaseComponentProps } from "shared-ui-components/fluent/hoc/propertyLine";
import { MaterialFlags } from "core/Materials/materialFlags";

let _FontAsset: Nullable<FontAsset> = null;
let _NamesViewerEnabled = false;
let _PhysicsViewersEnabled = false;
let _GridMesh: Nullable<AbstractMesh> = null;

export type BoundPropertyProps<T, P extends object> = Omit<P, "value" | "onChange"> & {
    component: ComponentType<P & BaseComponentProps<T>>;
    target: any;
    propertyKey: PropertyKey;
};

export function BoundPropertyLine<T, P extends object>(props: BoundPropertyProps<T, P>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { target, propertyKey, component: Component, ...rest } = props;
    const value = useObservableState(() => target[propertyKey], useInterceptObservable("property", target, propertyKey));

    return <Component {...(rest as P)} value={value} onChange={(val: T) => (target[propertyKey] = val)} />;
}

const SwitchGrid = function (renderScene: Scene) {
    const scene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;

    if (!_GridMesh) {
        const extend = renderScene.getWorldExtends();
        const width = (extend.max.x - extend.min.x) * 5.0;
        const depth = (extend.max.z - extend.min.z) * 5.0;

        _GridMesh = CreateGround("grid", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        if (!_GridMesh.reservedDataStore) {
            _GridMesh.reservedDataStore = {};
        }
        _GridMesh.scaling.x = Math.max(width, depth);
        _GridMesh.scaling.z = _GridMesh.scaling.x;
        _GridMesh.reservedDataStore.isInspectorGrid = true;
        _GridMesh.isPickable = false;

        const groundMaterial = new GridMaterial("GridMaterial", scene);
        groundMaterial.majorUnitFrequency = 10;
        groundMaterial.minorUnitVisibility = 0.3;
        groundMaterial.gridRatio = 0.01;
        groundMaterial.backFaceCulling = false;
        groundMaterial.mainColor = new Color3(1, 1, 1);
        groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
        groundMaterial.opacity = 0.8;
        groundMaterial.zOffset = 1.0;
        const textureUrl = Tools.GetAssetUrl("https://assets.babylonjs.com/core/environments/backgroundGround.png");
        groundMaterial.opacityTexture = new Texture(textureUrl, scene);

        _GridMesh.material = groundMaterial;
        return;
    }

    _GridMesh.dispose(true, true);
    _GridMesh = null;
};

const SwitchPhysicsViewers = function (scene: Scene) {
    _PhysicsViewersEnabled = !_PhysicsViewersEnabled;

    if (_PhysicsViewersEnabled) {
        const physicsViewer = new PhysicsViewer(scene);
        scene.reservedDataStore.physicsViewer = physicsViewer;

        for (const mesh of scene.meshes) {
            if (mesh.physicsImpostor) {
                const debugMesh = physicsViewer.showImpostor(mesh.physicsImpostor, mesh as Mesh);

                if (debugMesh) {
                    debugMesh.reservedDataStore = { hidden: true };
                    debugMesh.material!.reservedDataStore = { hidden: true };
                }
            } else if (mesh.physicsBody) {
                const debugMesh = physicsViewer.showBody(mesh.physicsBody);

                if (debugMesh) {
                    debugMesh.reservedDataStore = { hidden: true };
                    debugMesh.material!.reservedDataStore = { hidden: true };
                }
            }
        }

        for (const transformNode of scene.transformNodes) {
            if (transformNode.physicsBody) {
                const debugMesh = physicsViewer.showBody(transformNode.physicsBody);

                if (debugMesh) {
                    debugMesh.reservedDataStore = { hidden: true };
                    debugMesh.material!.reservedDataStore = { hidden: true };
                }
            }
        }
    } else {
        scene.reservedDataStore.physicsViewer.dispose();
        scene.reservedDataStore.physicsViewer = null;
        _FontAsset?.dispose();
        _FontAsset = null;
    }
};

const SwitchNameViewerAsync = async function (scene: Scene) {
    _NamesViewerEnabled = !_NamesViewerEnabled;

    if (_NamesViewerEnabled) {
        scene.reservedDataStore.textRenderers = [];
        if (!_FontAsset) {
            const sdfFontDefinition = await (await fetch("https://assets.babylonjs.com/fonts/roboto-regular.json")).text();
            // eslint-disable-next-line require-atomic-updates
            _FontAsset = new FontAsset(sdfFontDefinition, "https://assets.babylonjs.com/fonts/roboto-regular.png");
        }

        const textRendererPromises = scene.meshes.map(async (mesh) => {
            const textRenderer = await TextRenderer.CreateTextRendererAsync(_FontAsset!, scene.getEngine());

            textRenderer.addParagraph(mesh.name);
            textRenderer.isBillboard = true;
            textRenderer.isBillboardScreenProjected = true;
            textRenderer.parent = mesh;
            textRenderer.ignoreDepthBuffer = true;
            textRenderer.transformMatrix = Matrix.Scaling(0.02, 0.02, 0.02);

            scene.reservedDataStore.textRenderers.push(textRenderer);
        });

        await Promise.all(textRendererPromises);

        scene.reservedDataStore.textRenderersHook = scene.onAfterRenderObservable.add(() => {
            for (const textRenderer of scene.reservedDataStore.textRenderers) {
                if (!textRenderer.parent.isVisible || !textRenderer.parent.isEnabled()) {
                    continue;
                }
                textRenderer.render(scene.getViewMatrix(), scene.getProjectionMatrix());
            }
        });
    } else {
        scene.onAfterRenderObservable.remove(scene.reservedDataStore.textRenderersHook);
        for (const textRenderer of scene.reservedDataStore.textRenderers) {
            textRenderer.dispose();
        }
        scene.reservedDataStore.textRenderersHook = null;
        scene.reservedDataStore.textRenderers = null;
    }
};

export const DebugPane: typeof AccordionPane<Scene> = (props) => {
    const scene = props.context;

    if (!scene.reservedDataStore) {
        scene.reservedDataStore = {};
    }

    // Making sure we clean up when the scene is disposed
    scene.onDisposeObservable.addOnce(() => {
        if (_PhysicsViewersEnabled) {
            SwitchPhysicsViewers(scene);
        }

        if (_NamesViewerEnabled) {
            void SwitchNameViewerAsync(scene);
        }

        if (_GridMesh) {
            SwitchGrid(scene);
        }
    });

    return (
        <div style={{ overflowY: "auto", overflowX: "hidden" }}>
            <SwitchPropertyLine label="Grid" description="Display a ground grid." value={_GridMesh !== null} onChange={() => SwitchGrid(scene)} />
            <SwitchPropertyLine label="Physics" description="Display physic debug info." value={_PhysicsViewersEnabled} onChange={() => SwitchPhysicsViewers(scene)} />
            <SwitchPropertyLine label="Names" description="Display mesh names." value={_NamesViewerEnabled} onChange={() => void SwitchNameViewerAsync(scene)} />

            <BoundPropertyLine component={SwitchPropertyLine} key="Diffuse" label="Diffuse" target={StandardMaterial} propertyKey="DiffuseTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Ambient" label="Ambient" target={StandardMaterial} propertyKey="AmbientTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Specular" label="Specular" target={StandardMaterial} propertyKey="SpecularTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Emissive" label="Emissive" target={StandardMaterial} propertyKey="EmissiveTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Bump" label="Bump" target={StandardMaterial} propertyKey="BumpTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Opacity" label="Opacity" target={StandardMaterial} propertyKey="OpacityTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Reflection" label="Reflection" target={StandardMaterial} propertyKey="ReflectionTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="ColorGrading" label="Color Grading" target={StandardMaterial} propertyKey="ColorGradingTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Lightmap" label="Lightmap" target={StandardMaterial} propertyKey="LightmapTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Fresnel" label="Fresnel" target={StandardMaterial} propertyKey="FresnelEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Detail" label="Detail" target={MaterialFlags} propertyKey="DetailTextureEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Decal" label="Decal" target={MaterialFlags} propertyKey="DecalMapEnabled" />

            <BoundPropertyLine component={SwitchPropertyLine} key="Animations" label="Animations" target={scene} propertyKey="animationsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Physics" label="Physics" target={scene} propertyKey="physicsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Collisions" label="Collisions" target={scene} propertyKey="collisionsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Fog" label="Fog" target={scene} propertyKey="fogEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Lens flares" label="Lens flares" target={scene} propertyKey="lensFlaresEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Lights" label="Lights" target={scene} propertyKey="lightsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Particles" label="Particles" target={scene} propertyKey="particlesEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Post-processes" label="Post-processes" target={scene} propertyKey="postProcessesEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Probes" label="Probes" target={scene} propertyKey="probesEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Textures" label="Textures" target={scene} propertyKey="texturesEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Procedural textures" label="Procedural textures" target={scene} propertyKey="proceduralTexturesEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Render targets" label="Render targets" target={scene} propertyKey="renderTargetsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Shadows" label="Shadows" target={scene} propertyKey="shadowsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Skeletons" label="Skeletons" target={scene} propertyKey="skeletonsEnabled" />
            <BoundPropertyLine component={SwitchPropertyLine} key="Sprites" label="Sprites" target={scene} propertyKey="spritesEnabled" />
            <AccordionPane {...props} />
        </div>
    );
};
