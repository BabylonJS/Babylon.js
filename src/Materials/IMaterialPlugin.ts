import { SmartArray } from "../Misc/smartArray";
import { Nullable } from "../types";

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;
declare type SubMesh = import("../Meshes/subMesh").SubMesh;
declare type IAnimatable = import("../Animations/animatable.interface").IAnimatable;
declare type UniformBuffer = import("./uniformBuffer").UniformBuffer;
declare type Effect = import("./effect").Effect;
declare type EffectFallbacks = import("./effectFallbacks").EffectFallbacks;
declare type MaterialDefines = import("./materialDefines").MaterialDefines;
declare type RenderTargetTexture = import("./Textures/renderTargetTexture").RenderTargetTexture;
declare type BaseTexture = import("./Textures/baseTexture").BaseTexture;

export interface IMaterialPlugin {
    priority: number;

    initialize?(scene: Scene, dirtyCallbacks: { [code: number]: () => void }): void;

    getClassName(): string;
    isReadyForSubMesh?(defines: MaterialDefines, scene: Scene, engine: Engine): boolean;
    bindForSubMesh?(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void;
    dispose?(forceDisposeTextures?: boolean): void;
    // todo: add copyTo, serialize, parse

    getCustomCode?(shaderType: string): Nullable<{ [pointName: string]: string }>;

    collectDefineNames?(names: string[]): void;
    prepareDefines?(defines: MaterialDefines, scene: Scene): void;
    hardBindForSubMesh?(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void;
    unbind?(activeEffect: Effect): boolean;
    fillRenderTargetTextures?(renderTargets: SmartArray<RenderTargetTexture>): void;
    hasTexture?(texture: BaseTexture): boolean;
    hasRenderTargetTextures?(): boolean;
    getActiveTextures?(activeTextures: BaseTexture[]): void;
    getAnimatables?(animatables: IAnimatable[]): void;

    addFallbacks?(defines: MaterialDefines, fallbacks: EffectFallbacks, currentRank: number): number;
    addUniforms?(uniforms: string[]): void;
    addSamplers?(samplers: string[]): void;
    prepareUniformBuffer?(uniformBuffer: UniformBuffer): void;

    disableAlphaBlending?: boolean;
}
