import type { Scene } from "core/scene";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Light } from "core/Lights/light";
import type { Camera } from "core/Cameras/camera";
import type { Material } from "core/Materials/material";
import type { TransformNode } from "core/Meshes/transformNode";
import type { AnimationGroup } from "core/Animations/animationGroup";
import type { Skeleton } from "core/Bones/skeleton";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import { Observable } from "core/Misc/observable";

/**
 * Represents a single scene object entry that can be referenced by flow graph blocks.
 */
export interface ISceneContextEntry {
    /** Display name for the entry */
    name: string;
    /** Unique identifier */
    uniqueId: number;
    /** The underlying scene object */
    object: unknown;
    /** Category of the object (e.g. "Mesh", "Light", "Camera") */
    category: SceneContextCategory;
}

/**
 * Categories for scene context entries — matches FlowGraphAssetType but extends beyond it.
 */
export enum SceneContextCategory {
    Mesh = "Mesh",
    Light = "Light",
    Camera = "Camera",
    Material = "Material",
    TransformNode = "TransformNode",
    AnimationGroup = "AnimationGroup",
    Skeleton = "Skeleton",
    ParticleSystem = "ParticleSystem",
}

/**
 * Holds references to all objects in a loaded scene so they can be used as
 * asset references in flow graph blocks. This is the "scene-context variable"
 * that bridges a loaded Playground scene with the flow graph editor.
 *
 * When a Playground snippet is loaded, a new Scene is created and this class
 * catalogues every meaningful object in it. The entries are exposed both as
 * typed accessors and as a flat list for UI enumeration.
 */
export class SceneContext {
    /** Flat list of all catalogued entries */
    public readonly entries: ISceneContextEntry[] = [];

    /** Observable raised when the context is rebuilt (e.g. new snippet loaded) */
    public readonly onContextRefreshed = new Observable<SceneContext>();

    /** The scene this context was built from */
    public readonly scene: Scene;

    /** The engine the preview scene runs on */
    public get engine() {
        return this.scene.getEngine();
    }

    // Typed convenience accessors
    /** Gets all meshes in the scene context */
    public get meshes(): AbstractMesh[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.Mesh).map((e) => e.object as AbstractMesh);
    }
    /** Gets all lights in the scene context */
    public get lights(): Light[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.Light).map((e) => e.object as Light);
    }
    /** Gets all cameras in the scene context */
    public get cameras(): Camera[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.Camera).map((e) => e.object as Camera);
    }
    /** Gets all materials in the scene context */
    public get materials(): Material[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.Material).map((e) => e.object as Material);
    }
    /** Gets all transform nodes in the scene context */
    public get transformNodes(): TransformNode[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.TransformNode).map((e) => e.object as TransformNode);
    }
    /** Gets all animation groups in the scene context */
    public get animationGroups(): AnimationGroup[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.AnimationGroup).map((e) => e.object as AnimationGroup);
    }
    /** Gets all skeletons in the scene context */
    public get skeletons(): Skeleton[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.Skeleton).map((e) => e.object as Skeleton);
    }
    /** Gets all particle systems in the scene context */
    public get particleSystems(): IParticleSystem[] {
        return this.entries.filter((e) => e.category === SceneContextCategory.ParticleSystem).map((e) => e.object as IParticleSystem);
    }

    /**
     * Creates a new SceneContext.
     * @param scene - the scene to catalogue
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this._catalogScene();
    }

    /**
     * Rebuild the catalogue by scanning the scene for all objects.
     */
    public refresh(): void {
        this.entries.length = 0;
        this._catalogScene();
        this.onContextRefreshed.notifyObservers(this);
    }

    /**
     * Get all entries of a specific category.
     * @param category - the category to filter by
     * @returns entries matching the given category
     */
    public getByCategory(category: SceneContextCategory): ISceneContextEntry[] {
        return this.entries.filter((e) => e.category === category);
    }

    /**
     * Find an entry by name and category.
     * @param name - the name to search for
     * @param category - the category to search in
     * @returns the matching entry, or undefined if not found
     */
    public findEntry(name: string, category: SceneContextCategory): ISceneContextEntry | undefined {
        return this.entries.find((e) => e.name === name && e.category === category);
    }

    /**
     * Dispose the context and scene.
     */
    public dispose(): void {
        this.onContextRefreshed.clear();
        this.entries.length = 0;
    }

    private _catalogScene(): void {
        const scene = this.scene;

        for (const mesh of scene.meshes) {
            this.entries.push({ name: mesh.name, uniqueId: mesh.uniqueId, object: mesh, category: SceneContextCategory.Mesh });
        }

        for (const light of scene.lights) {
            this.entries.push({ name: light.name, uniqueId: light.uniqueId, object: light, category: SceneContextCategory.Light });
        }

        for (const camera of scene.cameras) {
            this.entries.push({ name: camera.name, uniqueId: camera.uniqueId, object: camera, category: SceneContextCategory.Camera });
        }

        for (const material of scene.materials) {
            this.entries.push({ name: material.name, uniqueId: material.uniqueId, object: material, category: SceneContextCategory.Material });
        }

        for (const tn of scene.transformNodes) {
            this.entries.push({ name: tn.name, uniqueId: tn.uniqueId, object: tn, category: SceneContextCategory.TransformNode });
        }

        for (const ag of scene.animationGroups) {
            this.entries.push({ name: ag.name, uniqueId: ag.uniqueId, object: ag, category: SceneContextCategory.AnimationGroup });
        }

        for (const skeleton of scene.skeletons) {
            this.entries.push({ name: skeleton.name, uniqueId: skeleton.uniqueId, object: skeleton, category: SceneContextCategory.Skeleton });
        }

        for (const ps of scene.particleSystems) {
            this.entries.push({ name: ps.name, uniqueId: (ps as any).uniqueId ?? 0, object: ps, category: SceneContextCategory.ParticleSystem });
        }
    }
}
