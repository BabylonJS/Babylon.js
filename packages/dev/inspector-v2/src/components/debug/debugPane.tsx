import type { AbstractMesh, Mesh, Scene } from "core/index";

import { FontAsset } from "addons/msdfText/fontAsset";
import { TextRenderer } from "addons/msdfText/textRenderer";
import { PhysicsViewer } from "core/Debug/physicsViewer";
import { Texture } from "core/Materials/Textures/texture";
import { MaterialFlags } from "core/Materials/materialFlags";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3 } from "core/Maths/math.color";
import { Matrix } from "core/Maths/math.vector";
import { CreateGround } from "core/Meshes/Builders/groundBuilder";
import { Tools } from "core/Misc/tools";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { GridMaterial } from "materials/grid/gridMaterial";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { ExtensibleAccordion } from "../extensibleAccordion";
import { BoundProperty } from "../properties/boundProperty";

export const HelpersDebugSectionIdentity = Symbol("Helpers");
export const TextureChannelsDebugSectionIdentity = Symbol("Texture Channels");
export const FeaturesDebugSectionIdentity = Symbol("Features");

const SwitchGrid = function (renderScene: Scene) {
    const scene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;

    if (!renderScene.reservedDataStore.gridMesh) {
        const extend = renderScene.getWorldExtends();
        const width = (extend.max.x - extend.min.x) * 5.0;
        const depth = (extend.max.z - extend.min.z) * 5.0;

        renderScene.reservedDataStore.gridMesh = CreateGround("grid", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
        const gridMesh = renderScene.reservedDataStore.gridMesh as AbstractMesh;
        if (!gridMesh.reservedDataStore) {
            gridMesh.reservedDataStore = {};
        }
        gridMesh.scaling.x = Math.max(width, depth);
        gridMesh.scaling.z = gridMesh.scaling.x;
        gridMesh.reservedDataStore.isInspectorGrid = true;
        gridMesh.isPickable = false;

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

        gridMesh.material = groundMaterial;
        return;
    }
    const gridMesh = renderScene.reservedDataStore.gridMesh as AbstractMesh;
    gridMesh.dispose(true, true);
    renderScene.reservedDataStore.gridMesh = null;
};

const SwitchPhysicsViewers = function (scene: Scene) {
    if (!scene.reservedDataStore.physicsViewer) {
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
    }
};

const SwitchNameViewerAsync = async function (scene: Scene) {
    if (!scene.reservedDataStore.textRenderersHook) {
        scene.reservedDataStore.textRenderers = [];
        if (!scene.reservedDataStore.fontAsset) {
            const sdfFontDefinition = await (await fetch("https://assets.babylonjs.com/fonts/roboto-regular.json")).text();
            // eslint-disable-next-line require-atomic-updates
            scene.reservedDataStore.fontAsset = new FontAsset(sdfFontDefinition, "https://assets.babylonjs.com/fonts/roboto-regular.png");
        }

        const textRendererPromises = scene.meshes.map(async (mesh) => {
            const textRenderer = await TextRenderer.CreateTextRendererAsync(scene.reservedDataStore.fontAsset!, scene.getEngine());

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

export const DebugPane: typeof ExtensibleAccordion<Scene> = (props) => {
    const scene = props.context;

    if (!scene.reservedDataStore) {
        scene.reservedDataStore = {};
    }

    // Making sure we clean up when the scene is disposed
    scene.onDisposeObservable.addOnce(() => {
        if (scene.reservedDataStore.physicsViewer) {
            SwitchPhysicsViewers(scene);
        }

        if (scene.reservedDataStore.textRenderersHook) {
            void SwitchNameViewerAsync(scene);
            scene.reservedDataStore.fontAsset?.dispose();
        }

        if (scene.reservedDataStore.gridMesh) {
            SwitchGrid(scene);
        }
    });

    return (
        <ExtensibleAccordion {...props}>
            <AccordionSection title="Helpers">
                <SwitchPropertyLine label="Grid" description="Display a ground grid." value={!!scene.reservedDataStore.gridMesh} onChange={() => SwitchGrid(scene)} />
                <SwitchPropertyLine
                    label="Physics"
                    description="Display physic debug info."
                    value={!!scene.reservedDataStore.physicsViewer}
                    onChange={() => SwitchPhysicsViewers(scene)}
                />
                <SwitchPropertyLine
                    label="Names"
                    description="Display mesh names."
                    value={!!scene.reservedDataStore.textRenderersHook}
                    onChange={() => void SwitchNameViewerAsync(scene)}
                />
            </AccordionSection>
            <AccordionSection title="Texture Channels">
                <BoundProperty component={SwitchPropertyLine} key="Diffuse" label="Diffuse" target={StandardMaterial} propertyKey="DiffuseTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Ambient" label="Ambient" target={StandardMaterial} propertyKey="AmbientTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Specular" label="Specular" target={StandardMaterial} propertyKey="SpecularTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Emissive" label="Emissive" target={StandardMaterial} propertyKey="EmissiveTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Bump" label="Bump" target={StandardMaterial} propertyKey="BumpTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Opacity" label="Opacity" target={StandardMaterial} propertyKey="OpacityTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Reflection" label="Reflection" target={StandardMaterial} propertyKey="ReflectionTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="ColorGrading" label="Color Grading" target={StandardMaterial} propertyKey="ColorGradingTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Lightmap" label="Lightmap" target={StandardMaterial} propertyKey="LightmapTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Fresnel" label="Fresnel" target={StandardMaterial} propertyKey="FresnelEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Detail" label="Detail" target={MaterialFlags} propertyKey="DetailTextureEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Decal" label="Decal" target={MaterialFlags} propertyKey="DecalMapEnabled" />
            </AccordionSection>
            <AccordionSection title="Features">
                <BoundProperty component={SwitchPropertyLine} key="Animations" label="Animations" target={scene} propertyKey="animationsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Physics" label="Physics" target={scene} propertyKey="physicsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Collisions" label="Collisions" target={scene} propertyKey="collisionsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Fog" label="Fog" target={scene} propertyKey="fogEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Lens flares" label="Lens Flares" target={scene} propertyKey="lensFlaresEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Lights" label="Lights" target={scene} propertyKey="lightsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Particles" label="Particles" target={scene} propertyKey="particlesEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Post-processes" label="Post-processes" target={scene} propertyKey="postProcessesEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Probes" label="Probes" target={scene} propertyKey="probesEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Textures" label="Textures" target={scene} propertyKey="texturesEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Procedural textures" label="Procedural Textures" target={scene} propertyKey="proceduralTexturesEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Render targets" label="Render Targets" target={scene} propertyKey="renderTargetsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Shadows" label="Shadows" target={scene} propertyKey="shadowsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Skeletons" label="Skeletons" target={scene} propertyKey="skeletonsEnabled" />
                <BoundProperty component={SwitchPropertyLine} key="Sprites" label="Sprites" target={scene} propertyKey="spritesEnabled" />
            </AccordionSection>
        </ExtensibleAccordion>
    );
};
