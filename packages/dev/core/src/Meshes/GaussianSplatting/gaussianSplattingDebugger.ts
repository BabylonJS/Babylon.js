import { type Nullable } from "../../types";
import { type Observer } from "../../Misc/observable";
import { type Node } from "../../node";
import { type Vector3 } from "../../Maths/math.vector";
import { GaussianSplattingMaterial } from "../../Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingDebugMaterialPlugin, type IGaussianSplattingDebugOptions } from "../../Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin";
import { type GaussianSplattingMeshBase } from "./gaussianSplattingMeshBase";

/**
 * Manages debug rendering options across a set of Gaussian splat meshes.
 * Create one instance, add meshes via addMesh(), then set options to apply
 * them to every registered mesh simultaneously.
 *
 * All options default to their "off" states so there is no rendering cost
 * until a feature is explicitly enabled.
 *
 * @example
 * ```ts
 * const gsDebugger = new GaussianSplattingDebugger();
 * gsDebugger.addMesh(mesh1);
 * gsDebugger.addMesh(mesh2);
 * gsDebugger.clippingBox = { min: new Vector3(-2, -2, -2), max: new Vector3(2, 2, 2) };
 * gsDebugger.shOrder1 = false;
 * ```
 */
export class GaussianSplattingDebugger {
    private _plugins: GaussianSplattingDebugMaterialPlugin[] = [];
    private _meshes: GaussianSplattingMeshBase[] = [];
    private _disposeObservers: Observer<Node>[] = [];

    // Cached option state so newly added meshes inherit current settings
    private _clippingBox: Nullable<{ min: Vector3; max: Vector3 }> = null;
    private _opacityCulling: Nullable<{ min: number; max: number }> = null;
    private _sizeCulling: Nullable<{ min: number; max: number }> = null;
    private _opacityScale: number = 1.0;
    private _opacitySaturate: boolean = false;
    private _shDc: boolean = true;
    private _shOrder1: boolean = true;
    private _shOrder2: boolean = true;
    private _shOrder3: boolean = true;
    private _shOrder4: boolean = true;

    /**
     * Adds a mesh to the debugger, attaching a debug plugin to its material.
     * The mesh must already have a GaussianSplattingMaterial assigned (i.e., data
     * must have been loaded at least once). Current option values are applied immediately.
     * The mesh is automatically unregistered if it is disposed.
     * @param mesh The mesh to register.
     */
    public addMesh(mesh: GaussianSplattingMeshBase): void {
        if (this._meshes.indexOf(mesh) !== -1) {
            return;
        }
        const mat = mesh.material;
        if (!(mat instanceof GaussianSplattingMaterial)) {
            throw new Error("GaussianSplattingDebugger.addMesh: mesh must have a GaussianSplattingMaterial.");
        }
        const plugin = new GaussianSplattingDebugMaterialPlugin(mat);
        plugin.partCount = (mesh as unknown as { partCount?: number }).partCount ?? 0;
        this._applyAllTo(plugin);
        this._meshes.push(mesh);
        this._plugins.push(plugin);
        this._disposeObservers.push(mesh.onDisposeObservable.add(() => this.removeMesh(mesh))!);
    }

    /**
     * Removes a mesh and disposes its debug plugin.
     * @param mesh The mesh to unregister.
     */
    public removeMesh(mesh: GaussianSplattingMeshBase): void {
        const idx = this._meshes.indexOf(mesh);
        if (idx === -1) {
            return;
        }
        mesh.onDisposeObservable.remove(this._disposeObservers[idx]);
        this._plugins[idx].dispose();
        this._meshes.splice(idx, 1);
        this._plugins.splice(idx, 1);
        this._disposeObservers.splice(idx, 1);
    }

    /** Disposes all debug plugins and clears the mesh list. */
    public dispose(): void {
        for (let i = 0; i < this._meshes.length; i++) {
            this._meshes[i].onDisposeObservable.remove(this._disposeObservers[i]);
            this._plugins[i].dispose();
        }
        this._meshes.length = 0;
        this._plugins.length = 0;
        this._disposeObservers.length = 0;
    }

    /**
     * Returns the min/max size range of splats in a mesh.
     * Convenience wrapper for GaussianSplattingMeshBase.splatSizeRange.
     * @param mesh The mesh to query.
     * @returns the splat size range, or null if not yet computed.
     */
    public static GetSplatSizeRange(mesh: GaussianSplattingMeshBase): Nullable<{ min: number; max: number }> {
        return mesh.splatSizeRange;
    }

    // ----- Option setters (broadcast to all plugins) -----

    private _applyAllTo(plugin: GaussianSplattingDebugMaterialPlugin): void {
        plugin.clippingBox = this._clippingBox;
        plugin.opacityCulling = this._opacityCulling;
        plugin.sizeCulling = this._sizeCulling;
        plugin.opacityScale = this._opacityScale;
        plugin.opacitySaturate = this._opacitySaturate;
        plugin.shDc = this._shDc;
        plugin.shOrder1 = this._shOrder1;
        plugin.shOrder2 = this._shOrder2;
        plugin.shOrder3 = this._shOrder3;
        plugin.shOrder4 = this._shOrder4;
    }

    /**
     * World-space axis-aligned clipping box. Splats outside are not rendered.
     * Set to null to disable.
     */
    public get clippingBox(): Nullable<{ min: Vector3; max: Vector3 }> {
        return this._clippingBox;
    }
    public set clippingBox(value: Nullable<{ min: Vector3; max: Vector3 }>) {
        this._clippingBox = value;
        for (const p of this._plugins) {
            p.clippingBox = value;
        }
    }

    /**
     * Opacity culling range [0..1]. Splats outside this range are not rendered.
     * Set to null to disable.
     */
    public get opacityCulling(): Nullable<{ min: number; max: number }> {
        return this._opacityCulling;
    }
    public set opacityCulling(value: Nullable<{ min: number; max: number }>) {
        this._opacityCulling = value;
        for (const p of this._plugins) {
            p.opacityCulling = value;
        }
    }

    /**
     * Size culling range. Size is pow(|det(Σ)|, 1/6) of the 3D covariance matrix,
     * equal to the geometric mean of the principal radii. Splats outside this range are not rendered.
     * Use GaussianSplattingDebugger.GetSplatSizeRange(mesh) to find an asset's range.
     * Set to null to disable.
     */
    public get sizeCulling(): Nullable<{ min: number; max: number }> {
        return this._sizeCulling;
    }
    public set sizeCulling(value: Nullable<{ min: number; max: number }>) {
        this._sizeCulling = value;
        for (const p of this._plugins) {
            p.sizeCulling = value;
        }
    }

    /** Scalar multiplier applied to every splat's opacity. 1.0 = no change. */
    public get opacityScale(): number {
        return this._opacityScale;
    }
    public set opacityScale(value: number) {
        this._opacityScale = value;
        for (const p of this._plugins) {
            p.opacityScale = value;
        }
    }

    /**
     * When true, replaces the Gaussian spatial falloff with a flat uniform opacity,
     * showing each splat as a solid disk.
     */
    public get opacitySaturate(): boolean {
        return this._opacitySaturate;
    }
    public set opacitySaturate(value: boolean) {
        this._opacitySaturate = value;
        for (const p of this._plugins) {
            p.opacitySaturate = value;
        }
    }

    /** Include the DC (base) color from colorsTexture. Default: true. */
    public get shDc(): boolean {
        return this._shDc;
    }
    public set shDc(value: boolean) {
        this._shDc = value;
        for (const p of this._plugins) {
            p.shDc = value;
        }
    }

    /** Include SH band 1 contribution. Default: true. */
    public get shOrder1(): boolean {
        return this._shOrder1;
    }
    public set shOrder1(value: boolean) {
        this._shOrder1 = value;
        for (const p of this._plugins) {
            p.shOrder1 = value;
        }
    }

    /** Include SH band 2 contribution. Default: true. */
    public get shOrder2(): boolean {
        return this._shOrder2;
    }
    public set shOrder2(value: boolean) {
        this._shOrder2 = value;
        for (const p of this._plugins) {
            p.shOrder2 = value;
        }
    }

    /** Include SH band 3 contribution. Default: true. */
    public get shOrder3(): boolean {
        return this._shOrder3;
    }
    public set shOrder3(value: boolean) {
        this._shOrder3 = value;
        for (const p of this._plugins) {
            p.shOrder3 = value;
        }
    }

    /** Include SH band 4 contribution. Default: true. */
    public get shOrder4(): boolean {
        return this._shOrder4;
    }
    public set shOrder4(value: boolean) {
        this._shOrder4 = value;
        for (const p of this._plugins) {
            p.shOrder4 = value;
        }
    }

    // ----- Per-part API (compound meshes only) -----

    /**
     * Sets per-part debug overrides for a specific part of a compound mesh.
     * The mesh must already be registered via addMesh(). Logs an error if the mesh
     * is not compound (partCount is 0).
     * @param mesh The compound mesh.
     * @param partIndex The zero-based part index.
     * @param options Partial set of debug options to override for this part.
     */
    public setPartOptions(mesh: GaussianSplattingMeshBase, partIndex: number, options: Partial<IGaussianSplattingDebugOptions>): void {
        const idx = this._meshes.indexOf(mesh);
        if (idx < 0) {
            return;
        }
        this._plugins[idx].setPartOptions(partIndex, options);
    }

    /**
     * Clears all per-part debug overrides for a specific part, falling back to global settings.
     * @param mesh The compound mesh.
     * @param partIndex The zero-based part index.
     */
    public clearPartOptions(mesh: GaussianSplattingMeshBase, partIndex: number): void {
        const idx = this._meshes.indexOf(mesh);
        if (idx < 0) {
            return;
        }
        this._plugins[idx].clearPartOptions(partIndex);
    }
}
