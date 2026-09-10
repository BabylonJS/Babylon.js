import {
    getRenderingContextKind,
    getRenderingContexts,
    type ArcRotateCamera,
    type Camera,
    type DirectionalLight,
    type EngineContext,
    type FreeCamera,
    type HemisphericLight,
    type LightBase,
    type Mesh,
    type ObservableQuat,
    type ObservableVec3,
    type PointLight,
    type Quat,
    type SceneContext,
    type SceneNode,
    type ShadowGenerator,
    type SpotLight,
    type Vec3,
} from "@babylonjs/lite";

export function GetSceneContexts(engine: EngineContext): readonly SceneContext[] {
    return engine.surfaces.flatMap((surface) => getRenderingContexts(surface).filter((context): context is SceneContext => getRenderingContextKind(context) === "scene"));
}

export function IsSceneNode(entity: unknown): entity is SceneNode {
    return (
        typeof entity === "object" &&
        entity !== null &&
        "name" in entity &&
        "children" in entity &&
        "position" in entity &&
        "rotationQuaternion" in entity &&
        "scaling" in entity &&
        "parent" in entity
    );
}

export function IsMesh(entity: unknown): entity is Mesh {
    return IsSceneNode(entity) && "material" in entity && "receiveShadows" in entity;
}

export function IsCamera(entity: unknown): entity is Camera {
    return typeof entity === "object" && entity !== null && "fov" in entity && "nearPlane" in entity && "farPlane" in entity && "children" in entity && "worldMatrix" in entity;
}

export function IsArcRotateCamera(entity: unknown): entity is ArcRotateCamera {
    return IsCamera(entity) && "alpha" in entity && "beta" in entity && "radius" in entity && "target" in entity;
}

export function IsFreeCamera(entity: unknown): entity is FreeCamera {
    return IsCamera(entity) && "position" in entity && "target" in entity && "speed" in entity;
}

export function IsLight(entity: unknown): entity is LightBase {
    return typeof entity === "object" && entity !== null && "lightType" in entity && "children" in entity && "parent" in entity && "worldMatrix" in entity;
}

export function IsDirectionalLight(entity: unknown): entity is DirectionalLight {
    return IsLight(entity) && entity.lightType === "directional";
}

export function IsPointLight(entity: unknown): entity is PointLight {
    return IsLight(entity) && entity.lightType === "point";
}

export function IsSpotLight(entity: unknown): entity is SpotLight {
    return IsLight(entity) && entity.lightType === "spot";
}

export function IsHemisphericLight(entity: unknown): entity is HemisphericLight {
    return IsLight(entity) && entity.lightType === "hemispheric";
}

export function GetSceneNodes(scene: SceneContext): readonly SceneNode[] {
    const nodes = new Set<SceneNode>();
    const addNode = (node: SceneNode) => {
        if (nodes.has(node)) {
            return;
        }

        nodes.add(node);
        for (const child of node.children) {
            addNode(child);
        }
    };

    for (const mesh of scene.meshes) {
        let root: SceneNode = mesh;
        while (IsSceneNode(root.parent)) {
            root = root.parent;
        }
        addNode(root);
    }

    return [...nodes];
}

export function GetSceneNodeRoots(scene: SceneContext): readonly SceneNode[] {
    const nodes = GetSceneNodes(scene);
    const nodeSet = new Set(nodes);
    return nodes.filter((node) => !IsSceneNode(node.parent) || !nodeSet.has(node.parent));
}

export function IsSceneNodeDescendantOf(node: SceneNode, ancestor: SceneNode): boolean {
    let parent = node.parent;
    while (IsSceneNode(parent)) {
        if (parent === ancestor) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
}

export function SetVector3Value(target: Vec3, value: Vec3 | readonly [number, number, number]): void {
    const x = "x" in value ? value.x : value[0];
    const y = "x" in value ? value.y : value[1];
    const z = "x" in value ? value.z : value[2];
    const observableTarget = target as Partial<ObservableVec3>;

    if (typeof observableTarget.set === "function") {
        observableTarget.set(x, y, z);
    } else {
        target.x = x;
        target.y = y;
        target.z = z;
    }
}

export function SetQuaternionValue(target: Quat, value: Quat | readonly [number, number, number, number]): void {
    const x = "x" in value ? value.x : value[0];
    const y = "x" in value ? value.y : value[1];
    const z = "x" in value ? value.z : value[2];
    const w = "x" in value ? value.w : value[3];
    const observableTarget = target as Partial<ObservableQuat>;

    if (typeof observableTarget.set === "function") {
        observableTarget.set(x, y, z, w);
    } else {
        target.x = x;
        target.y = y;
        target.z = z;
        target.w = w;
    }
}

export function GetLightDisplayName(light: LightBase, index: number): string {
    const typeName = `${light.lightType.charAt(0).toUpperCase()}${light.lightType.slice(1)}`;
    return `${typeName} Light ${index + 1}`;
}

export function GetShadowGeneratorDisplayName(scene: SceneContext, shadowGenerator: ShadowGenerator): string {
    const lightIndex = scene.lights.findIndex((light) => light.shadowGenerator === shadowGenerator);
    return lightIndex === -1 ? `Shadow Generator ${scene.shadowGenerators.indexOf(shadowGenerator) + 1}` : `${GetLightDisplayName(scene.lights[lightIndex], lightIndex)} Shadows`;
}
