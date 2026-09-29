import {
    enableMaterialStencil,
    enablePbrLightmap,
    getMaterialFamily,
    getMaterialSource,
    getPbrAlphaCutoff,
    getPbrAnisotropy,
    getPbrClearCoat,
    getPbrEmissiveColor,
    getPbrIridescence,
    getPbrMetallicReflectance,
    getPbrSheen,
    getPbrSubsurface,
    getPbrTransmission,
    getPbrUnlit,
    getShadowOnly,
    getTextureMetadata,
    isMaterialView,
    isPbrGammaAlbedo,
    isPbrSkybox,
    markMaterialUboDirty,
    rebuildMaterial,
    setPbrAlphaCutoff,
    setPbrAnisotropy,
    setPbrClearCoat,
    setPbrDispersion,
    setPbrEmissive,
    setPbrIridescence,
    setPbrLightmap,
    setPbrMetallicReflectance,
    setPbrSheen,
    setPbrSubsurface,
    setPbrTransmission,
    type PbrMaterialProps,
    type RefractionProps,
    type SubSurfaceProps,
    type Texture2D,
} from "@babylonjs/lite";
import { Body1 } from "@fluentui/react-components";
import { type FunctionComponent, useCallback } from "react";

import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine, TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { ComputedProperty, DerivedProperty } from "../../../../../components/properties/boundProperty";
import { usePropertyChangedNotifier } from "../../../../../contexts/propertyContext";
import { useLatestAsyncOperation, type LatestAsyncOperationStates } from "../useLatestAsyncOperation";
import { DirectTextureBinding, type DirectTextureBindingProps } from "./directTextureBinding";
import { type MaterialAdapterProps } from "./materialAdapterTypes";

type Pbr = PbrMaterialProps;
type Tuple2 = readonly [number, number];
type Tuple3 = readonly [number, number, number];
type Tuple4 = readonly [number, number, number, number];
type FieldValue = number | boolean | string | Tuple2 | Tuple3 | Tuple4;
type Plan = Readonly<{ mutation: "A" | "U" | "R"; apply: () => unknown | Promise<unknown>; frameGraphParticipationChanged?: boolean }>;
type Prepare<T extends FieldValue> = (material: Pbr, value: T) => Plan;
type Commit = <T extends FieldValue>(id: string, read: (material: Pbr) => T, value: T, prepare: Prepare<T>, validate?: (value: T) => void) => void;

const Rebuild = (apply: Plan["apply"], frameGraphParticipationChanged = false): Plan => ({ mutation: "R", apply, frameGraphParticipationChanged });
const Uniform = (apply: Plan["apply"]): Plan => ({ mutation: "U", apply });

function Require<T>(value: T | null | undefined, name: string): T {
    if (value == null) {
        throw new Error(`${name} is no longer configured.`);
    }
    return value;
}

function ValidateNumber(value: number, id: string, min?: number, max?: number, integer = false): void {
    if (typeof value !== "number" || !Number.isFinite(value) || (integer && !Number.isInteger(value))) {
        throw new TypeError(`Property "${id}" requires a finite${integer ? " integer" : ""} number.`);
    }
    if (min !== undefined && value < min) {
        throw new RangeError(`Property "${id}" must be at least ${min}.`);
    }
    if (max !== undefined && value > max) {
        throw new RangeError(`Property "${id}" must be at most ${max}.`);
    }
}

function CopyTuple<T extends Tuple2 | Tuple3 | Tuple4>(value: T, length: number, id: string): T {
    if (!Array.isArray(value) || value.length !== length || value.some((component) => typeof component !== "number" || !Number.isFinite(component))) {
        throw new TypeError(`Property "${id}" requires a ${length}-component finite tuple.`);
    }
    return [...value] as unknown as T;
}

function SameValue(a: FieldValue, b: FieldValue): boolean {
    return Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((value, index) => Object.is(value, b[index])) : Object.is(a, b);
}

const TextureSlots = [
    { id: "pbr.baseColor", label: "Base Color Texture", section: "textures", read: (m: Pbr) => m.baseColorTexture },
    { id: "pbr.normal", label: "Normal Texture", section: "textures", read: (m: Pbr) => m.normalTexture },
    { id: "pbr.orm", label: "ORM Texture", section: "textures", read: (m: Pbr) => m.ormTexture },
    { id: "pbr.occlusion", label: "Occlusion Texture", section: "textures", read: (m: Pbr) => m.occlusionTexture },
    { id: "pbr.emissive", label: "Emissive Texture", section: "textures", read: (m: Pbr) => m.emissiveTexture },
    { id: "pbr.specGloss", label: "Specular-Glossiness Texture", section: "textures", read: (m: Pbr) => m.specGlossTexture },
    { id: "pbr.lightmap", label: "Lightmap Texture", section: "lightmap", read: (m: Pbr) => m.lightmapTexture, canClear: false, visible: (m: Pbr) => !!m.lightmapTexture },
    {
        id: "pbr.metallicReflectance",
        label: "Metallic Reflectance Texture",
        section: "metallic-reflectance",
        read: (m: Pbr) => getPbrMetallicReflectance(m)?.texture,
        canClear: false,
        visible: (m: Pbr) => !!getPbrMetallicReflectance(m),
    },
    {
        id: "pbr.reflectance",
        label: "Reflectance Texture",
        section: "metallic-reflectance",
        read: (m: Pbr) => getPbrMetallicReflectance(m)?.reflectanceTexture,
        canClear: false,
        visible: (m: Pbr) => !!getPbrMetallicReflectance(m),
    },
    { id: "pbr.clearCoat", label: "Clear Coat Texture", section: "clear-coat", read: (m: Pbr) => getPbrClearCoat(m)?.texture, visible: (m: Pbr) => !!getPbrClearCoat(m) },
    {
        id: "pbr.clearCoatRoughness",
        label: "Clear Coat Roughness Texture",
        section: "clear-coat",
        read: (m: Pbr) => getPbrClearCoat(m)?.roughnessTexture,
        visible: (m: Pbr) => !!getPbrClearCoat(m),
    },
    {
        id: "pbr.clearCoatBump",
        label: "Clear Coat Bump Texture",
        section: "clear-coat",
        read: (m: Pbr) => getPbrClearCoat(m)?.bumpTexture,
        visible: (m: Pbr) => !!getPbrClearCoat(m),
    },
    { id: "pbr.sheen", label: "Sheen Color Texture", section: "sheen", read: (m: Pbr) => getPbrSheen(m)?.texture, visible: (m: Pbr) => !!getPbrSheen(m) },
    { id: "pbr.sheenRoughness", label: "Sheen Roughness Texture", section: "sheen", read: (m: Pbr) => getPbrSheen(m)?.roughnessTexture, visible: (m: Pbr) => !!getPbrSheen(m) },
    { id: "pbr.iridescence", label: "Iridescence Texture", section: "iridescence", read: (m: Pbr) => getPbrIridescence(m)?.texture, visible: (m: Pbr) => !!getPbrIridescence(m) },
    {
        id: "pbr.iridescenceThickness",
        label: "Iridescence Thickness Texture",
        section: "iridescence",
        read: (m: Pbr) => getPbrIridescence(m)?.thicknessTexture,
        visible: (m: Pbr) => !!getPbrIridescence(m),
    },
    { id: "pbr.anisotropy", label: "Anisotropy Texture", section: "anisotropy", read: (m: Pbr) => getPbrAnisotropy(m)?.texture, visible: (m: Pbr) => !!getPbrAnisotropy(m) },
    {
        id: "pbr.translucencyColor",
        label: "Translucency Color Texture",
        section: "subsurface-translucency",
        read: (m: Pbr) => getPbrSubsurface(m)?.translucency?.colorTexture,
        visible: (m: Pbr) => !!getPbrSubsurface(m)?.translucency,
    },
    {
        id: "pbr.translucencyIntensity",
        label: "Translucency Intensity Texture",
        section: "subsurface-translucency",
        read: (m: Pbr) => getPbrSubsurface(m)?.translucency?.intensityTexture,
        visible: (m: Pbr) => !!getPbrSubsurface(m)?.translucency,
    },
    {
        id: "pbr.thickness",
        label: "Thickness Texture",
        section: "subsurface-thickness",
        read: (m: Pbr) => getPbrSubsurface(m)?.thickness?.texture,
        visible: (m: Pbr) => !!getPbrSubsurface(m)?.thickness,
    },
    {
        id: "pbr.transmission",
        label: "Transmission Texture",
        section: "transmission",
        read: (m: Pbr) => getPbrTransmission(m)?.texture,
        visible: (m: Pbr) => !!getPbrTransmission(m),
    },
] as const;

type TextureSlotId = (typeof TextureSlots)[number]["id"];

function MatchesTexture2d(texture: object): boolean {
    return getTextureMetadata(texture)?.kind === "2d";
}

async function SetPbrTexture(material: Pbr, id: TextureSlotId, texture: object | null): Promise<void> {
    if (texture && !MatchesTexture2d(texture)) {
        throw new TypeError(`Texture binding "${id}" requires a Texture2D value.`);
    }
    const value = (texture ?? undefined) as Texture2D | undefined;
    switch (id) {
        case "pbr.baseColor":
            material.baseColorTexture = value;
            return;
        case "pbr.normal":
            material.normalTexture = value;
            return;
        case "pbr.orm":
            material.ormTexture = value;
            return;
        case "pbr.occlusion":
            material.occlusionTexture = value;
            return;
        case "pbr.emissive":
            material.emissiveTexture = value;
            return;
        case "pbr.specGloss":
            material.specGlossTexture = value;
            return;
        case "pbr.lightmap": {
            const lightmap = Require(value, "PBR lightmap texture");
            Require(material.lightmapTexture, "PBR lightmap");
            const options = {
                level: material.lightmapLevel ?? 1,
                coordIndex: material.lightmapCoordIndex ?? 1,
                useAsShadowmap: material.useLightmapAsShadowmap ?? false,
                gamma: material.gammaLightmap ?? false,
            };
            await enablePbrLightmap();
            setPbrLightmap(material, lightmap, options);
            return;
        }
        case "pbr.metallicReflectance":
            await MetallicPlan(material, { texture: Require(value, "PBR metallic reflectance texture") }).apply();
            return;
        case "pbr.reflectance":
            await MetallicPlan(material, { reflectanceTexture: Require(value, "PBR reflectance texture") }).apply();
            return;
        case "pbr.clearCoat":
            await ClearCoatPlan(material, { texture: value }).apply();
            return;
        case "pbr.clearCoatRoughness":
            await ClearCoatPlan(material, { roughnessTexture: value }).apply();
            return;
        case "pbr.clearCoatBump":
            await ClearCoatPlan(material, { bumpTexture: value }).apply();
            return;
        case "pbr.sheen":
            await SheenPlan(material, { texture: value }).apply();
            return;
        case "pbr.sheenRoughness":
            await SheenPlan(material, { roughnessTexture: value }).apply();
            return;
        case "pbr.iridescence":
            await IridescencePlan(material, { texture: value }).apply();
            return;
        case "pbr.iridescenceThickness":
            await IridescencePlan(material, { thicknessTexture: value }).apply();
            return;
        case "pbr.anisotropy":
            await AnisotropyPlan(material, { texture: value }).apply();
            return;
        case "pbr.translucencyColor":
            await SubsurfacePlan(material, "translucency", { colorTexture: value }).apply();
            return;
        case "pbr.translucencyIntensity":
            await SubsurfacePlan(material, "translucency", { intensityTexture: value }).apply();
            return;
        case "pbr.thickness":
            await SubsurfacePlan(material, "thickness", { texture: value }).apply();
            return;
        case "pbr.transmission":
            await TransmissionPlan(material, { texture: value }).apply();
            return;
    }
}

const StencilCompareOptions = [
    { value: "never", label: "Never" },
    { value: "less", label: "Less" },
    { value: "equal", label: "Equal" },
    { value: "less-equal", label: "Less or Equal" },
    { value: "greater", label: "Greater" },
    { value: "not-equal", label: "Not Equal" },
    { value: "greater-equal", label: "Greater or Equal" },
    { value: "always", label: "Always" },
];
const StencilOperationOptions = [
    { value: "keep", label: "Keep" },
    { value: "zero", label: "Zero" },
    { value: "replace", label: "Replace" },
    { value: "invert", label: "Invert" },
    { value: "increment-clamp", label: "Increment Clamp" },
    { value: "decrement-clamp", label: "Decrement Clamp" },
    { value: "increment-wrap", label: "Increment Wrap" },
    { value: "decrement-wrap", label: "Decrement Wrap" },
];
const CoordinatesOptions = [
    { value: 0, label: "UV1" },
    { value: 1, label: "UV2" },
];

type RowProps = Readonly<{
    target: Pbr;
    commit: Commit;
    operations: LatestAsyncOperationStates;
}>;

const PbrRows: FunctionComponent<RowProps & { section: MaterialAdapterProps["section"] }> = (props) => {
    const { target, commit, operations, section } = props;
    const row = (id: string, label: string, control: React.ReactNode) => {
        const operation = operations[id];
        return (
            <div key={id} aria-busy={operation?.pending}>
                {control}
                {operation?.pending ? <Body1 role="status">{`Applying ${label}…`}</Body1> : undefined}
                {operation?.error ? <Body1 role="alert">{operation.error}</Body1> : undefined}
            </div>
        );
    };
    const common = (id: string, label: string) => ({
        label,
        uniqueId: id,
        disabled: operations[id]?.pending,
        description: operations[id]?.error ? `Error: ${operations[id].error}` : undefined,
    });
    const number = (id: string, label: string, read: (material: Pbr) => number, prepare: Prepare<number>, min?: number, max?: number, integer = false) =>
        row(
            id,
            label,
            <DerivedProperty
                component={NumberInputPropertyLine}
                target={target}
                getValue={read}
                setValue={(_, value) => commit(id, read, value, prepare, (next) => ValidateNumber(next, id, min, max, integer))}
                {...common(id, label)}
                min={min}
                max={max}
                step={integer ? 1 : undefined}
            />
        );
    const toggle = (id: string, label: string, read: (material: Pbr) => boolean, prepare: Prepare<boolean>) =>
        row(
            id,
            label,
            <DerivedProperty
                component={SwitchPropertyLine}
                target={target}
                getValue={read}
                setValue={(_, value) =>
                    commit(id, read, value, prepare, (next) => {
                        if (typeof next !== "boolean") {
                            throw new TypeError(`Property "${id}" requires a boolean.`);
                        }
                    })
                }
                {...common(id, label)}
            />
        );
    const color3 = (id: string, label: string, read: (material: Pbr) => Tuple3, prepare: Prepare<Tuple3>) =>
        row(
            id,
            label,
            <DerivedProperty
                component={Color3PropertyLine}
                target={target}
                getValue={read}
                setValue={(_, value) => commit(id, read, ("r" in value ? [value.r, value.g, value.b] : value) as Tuple3, prepare, (next) => CopyTuple(next, 3, id))}
                {...common(id, label)}
                isLinearMode
            />
        );
    const color4 = (id: string, label: string, read: (material: Pbr) => Tuple4, prepare: Prepare<Tuple4>) =>
        row(
            id,
            label,
            <DerivedProperty
                component={Color4PropertyLine}
                target={target}
                getValue={read}
                setValue={(_, value) => commit(id, read, ("r" in value ? [value.r, value.g, value.b, value.a] : value) as Tuple4, prepare, (next) => CopyTuple(next, 4, id))}
                {...common(id, label)}
                isLinearMode
            />
        );
    const vector2 = (id: string, label: string, read: (material: Pbr) => Tuple2, prepare: Prepare<Tuple2>) =>
        row(
            id,
            label,
            <DerivedProperty
                component={Vector2PropertyLine}
                target={target}
                getValue={read}
                setValue={(_, value) => commit(id, read, ("x" in value ? [value.x, value.y] : value) as Tuple2, prepare, (next) => CopyTuple(next, 2, id))}
                {...common(id, label)}
            />
        );
    const choice = (id: string, label: string, read: (material: Pbr) => number, prepare: Prepare<number>) =>
        row(
            id,
            label,
            <DerivedProperty
                component={NumberDropdownPropertyLine}
                target={target}
                getValue={read}
                setValue={(_, value) =>
                    commit(id, read, value, prepare, (next) => {
                        if (!CoordinatesOptions.some((option) => option.value === next)) {
                            throw new RangeError(`Property "${id}" does not accept enum value "${next}".`);
                        }
                    })
                }
                {...common(id, label)}
                options={CoordinatesOptions}
            />
        );
    const stencil = (id: string, label: string, key: "compare" | "passOp" | "failOp" | "depthFailOp", options: typeof StencilCompareOptions) =>
        target.stencil
            ? row(
                  id,
                  label,
                  <DerivedProperty
                      component={StringDropdownPropertyLine}
                      target={target}
                      getValue={(material) => material.stencil?.[key] ?? (key === "compare" ? "always" : "keep")}
                      setValue={(_, value) =>
                          commit(
                              id,
                              (material) => material.stencil?.[key] ?? (key === "compare" ? "always" : "keep"),
                              value,
                              (material, next) => {
                                  const current = Require(material.stencil, "PBR stencil");
                                  return Rebuild(() => {
                                      enableMaterialStencil();
                                      material.stencil = { ...current, [key]: next };
                                  });
                              },
                              (next) => {
                                  if (!options.some((option) => option.value === next)) {
                                      throw new RangeError(`Property "${id}" does not accept enum value "${next}".`);
                                  }
                              }
                          )
                      }
                      {...common(id, label)}
                      options={options}
                  />
              )
            : row(id, label, <ComputedProperty component={TextPropertyLine} target={target} getValue={() => "Not configured"} label={label} uniqueId={id} />);
    const stencilMask = (id: string, label: string, key: "readMask" | "writeMask") =>
        target.stencil
            ? number(
                  id,
                  label,
                  (material) => material.stencil?.[key] ?? 0xff,
                  (material, value) => {
                      const current = Require(material.stencil, "PBR stencil");
                      return Rebuild(() => {
                          enableMaterialStencil();
                          material.stencil = { ...current, [key]: value };
                      });
                  },
                  0,
                  0xffffffff,
                  true
              )
            : row(id, label, <ComputedProperty component={TextPropertyLine} target={target} getValue={() => "Not configured"} label={label} uniqueId={id} />);
    const readOnly = (id: string, label: string, read: (material: Pbr) => FieldValue, reason: string) =>
        row(
            id,
            label,
            <ComputedProperty
                component={TextPropertyLine}
                target={target}
                getValue={(material) => {
                    const value = read(material);
                    return Array.isArray(value) ? `[${value.join(", ")}]` : String(value);
                }}
                label={label}
                uniqueId={id}
                description={`${reason} is a one-way public mode and has no reversible setter.`}
            />
        );

    switch (section) {
        case "general":
            return (
                <>
                    {row(
                        "material.name",
                        "Name",
                        <DerivedProperty
                            component={TextInputPropertyLine}
                            target={target}
                            getValue={(m) => m.name ?? ""}
                            setValue={(_, value) =>
                                commit(
                                    "material.name",
                                    (m) => m.name ?? "",
                                    value,
                                    (m, next) => ({ mutation: "A", apply: () => (m.name = next) }),
                                    (next) => {
                                        if (typeof next !== "string") {
                                            throw new TypeError('Property "material.name" requires a string.');
                                        }
                                    }
                                )
                            }
                            {...common("material.name", "Name")}
                        />
                    )}
                    {toggle(
                        "pbr.doubleSided",
                        "Double Sided",
                        (m) => m.doubleSided ?? false,
                        (m, v) => Rebuild(() => (m.doubleSided = v))
                    )}
                    {toggle(
                        "pbr.alphaBlend",
                        "Alpha Blend",
                        (m) => m.alphaBlend ?? false,
                        (m, v) => Rebuild(() => (m.alphaBlend = v))
                    )}
                    {toggle(
                        "pbr.enableSpecularAA",
                        "Specular Anti-Aliasing",
                        (m) => m.enableSpecularAA ?? false,
                        (m, v) => Rebuild(() => (m.enableSpecularAA = v))
                    )}
                </>
            );
        case "transparency":
            return (
                <>
                    {number(
                        "pbr.alpha",
                        "Alpha",
                        (m) => m.alpha ?? 1,
                        (m, v) => {
                            const cutoff = getPbrAlphaCutoff(m) ?? 0;
                            return ((m.alpha ?? 1) < 1 && cutoff <= 0) === (v < 1 && cutoff <= 0) ? Uniform(() => (m.alpha = v)) : Rebuild(() => (m.alpha = v));
                        },
                        0,
                        1
                    )}
                    {getPbrAlphaCutoff(target) === undefined
                        ? row(
                              "pbr.alphaCutOff",
                              "Alpha Cutoff",
                              <ComputedProperty component={TextPropertyLine} target={target} getValue={() => "Not configured"} label="Alpha Cutoff" uniqueId="pbr.alphaCutOff" />
                          )
                        : number(
                              "pbr.alphaCutOff",
                              "Alpha Cutoff",
                              (m) => getPbrAlphaCutoff(m) ?? 0,
                              (m, v) => ((getPbrAlphaCutoff(m) ?? 0) > 0 === v > 0 ? Uniform(() => setPbrAlphaCutoff(m, v)) : Rebuild(() => setPbrAlphaCutoff(m, v)))
                          )}
                </>
            );
        case "lighting-colors":
            return (
                <>
                    {target.baseColorFactor
                        ? color4(
                              "pbr.baseColorFactor",
                              "Base Color Factor",
                              (m) => m.baseColorFactor ?? [1, 1, 1, 1],
                              (m, v) => (m.baseColorFactor === undefined ? Rebuild(() => (m.baseColorFactor = [...v])) : Uniform(() => (m.baseColorFactor = [...v])))
                          )
                        : row(
                              "pbr.baseColorFactor",
                              "Base Color Factor",
                              <ComputedProperty
                                  component={TextPropertyLine}
                                  target={target}
                                  getValue={() => "Not configured"}
                                  label="Base Color Factor"
                                  uniqueId="pbr.baseColorFactor"
                              />
                          )}
                    {getPbrEmissiveColor(target)
                        ? color3(
                              "pbr.emissiveColor",
                              "Emissive Color",
                              (m) => getPbrEmissiveColor(m) ?? [0, 0, 0],
                              (m, v) => (getPbrEmissiveColor(m) === undefined ? Rebuild(() => setPbrEmissive(m, [...v])) : Uniform(() => setPbrEmissive(m, [...v])))
                          )
                        : row(
                              "pbr.emissiveColor",
                              "Emissive Color",
                              <ComputedProperty
                                  component={TextPropertyLine}
                                  target={target}
                                  getValue={() => "Not configured"}
                                  label="Emissive Color"
                                  uniqueId="pbr.emissiveColor"
                              />
                          )}
                    {number(
                        "pbr.environmentIntensity",
                        "Environment Intensity",
                        (m) => m.environmentIntensity ?? 1,
                        (m, v) => Uniform(() => (m.environmentIntensity = v))
                    )}
                    {number(
                        "pbr.directIntensity",
                        "Direct Intensity",
                        (m) => m.directIntensity ?? 1,
                        (m, v) => Uniform(() => (m.directIntensity = v))
                    )}
                    {number(
                        "pbr.reflectance",
                        "Reflectance",
                        (m) => m.reflectance ?? 0.04,
                        (m, v) => Uniform(() => (m.reflectance = v))
                    )}
                    {number(
                        "pbr.metallicFactor",
                        "Metallic Factor",
                        (m) => m.metallicFactor ?? 1,
                        (m, v) => Uniform(() => (m.metallicFactor = v))
                    )}
                    {number(
                        "pbr.roughnessFactor",
                        "Roughness Factor",
                        (m) => m.roughnessFactor ?? 1,
                        (m, v) => Uniform(() => (m.roughnessFactor = v))
                    )}
                    {number(
                        "pbr.normalTextureScale",
                        "Normal Texture Scale",
                        (m) => m.normalTextureScale ?? 1,
                        (m, v) => Uniform(() => (m.normalTextureScale = v))
                    )}
                    {toggle(
                        "pbr.usePhysicalLightFalloff",
                        "Use Physical Light Falloff",
                        (m) => m.usePhysicalLightFalloff ?? true,
                        (m, v) => Uniform(() => (m.usePhysicalLightFalloff = v))
                    )}
                </>
            );
        case "occlusion":
            return (
                <>
                    {number(
                        "pbr.occlusionStrength",
                        "Occlusion Strength",
                        (m) => m.occlusionStrength ?? 1,
                        (m, v) => Uniform(() => (m.occlusionStrength = v)),
                        0,
                        1
                    )}
                    {row(
                        "pbr.occlusionTexCoord",
                        "Occlusion Coordinates",
                        <ComputedProperty
                            component={TextPropertyLine}
                            target={target}
                            getValue={(m) => String(m.occlusionTexCoord ?? 0)}
                            label="Occlusion Coordinates"
                            uniqueId="pbr.occlusionTexCoord"
                            description="Changing the occlusion UV set requires a public setter that maintains the UV2 claim."
                        />
                    )}
                </>
            );
        case "lightmap":
            if (!target.lightmapTexture) {
                return null;
            }
            return (
                <>
                    {number(
                        "pbr.lightmapLevel",
                        "Level",
                        (m) => m.lightmapLevel ?? 1,
                        (m, v) => LightmapPlan(m, { level: v })
                    )}
                    {choice(
                        "pbr.lightmapCoordIndex",
                        "Coordinates",
                        (m) => m.lightmapCoordIndex ?? 1,
                        (m, v) => LightmapPlan(m, { coordIndex: v as 0 | 1 })
                    )}
                    {toggle(
                        "pbr.useLightmapAsShadowmap",
                        "Use as Shadowmap",
                        (m) => m.useLightmapAsShadowmap ?? false,
                        (m, v) => LightmapPlan(m, { useAsShadowmap: v })
                    )}
                    {toggle(
                        "pbr.gammaLightmap",
                        "Gamma Decode",
                        (m) => m.gammaLightmap ?? false,
                        (m, v) => LightmapPlan(m, { gamma: v })
                    )}
                </>
            );
        case "metallic-reflectance":
            if (!getPbrMetallicReflectance(target)) {
                return null;
            }
            return (
                <>
                    {color3(
                        "pbr.metallicReflectanceColor",
                        "Metallic Reflectance Color",
                        (m) => getPbrMetallicReflectance(m)?.color ?? [1, 1, 1],
                        (m, v) => MetallicPlan(m, { color: [...v] })
                    )}
                    {number(
                        "pbr.metallicF0Factor",
                        "Metallic F0 Factor",
                        (m) => getPbrMetallicReflectance(m)?.f0Factor ?? 1,
                        (m, v) => MetallicPlan(m, { f0Factor: v })
                    )}
                    {number(
                        "pbr.specularWeight",
                        "Specular Weight",
                        (m) => getPbrMetallicReflectance(m)?.specularWeight ?? getPbrMetallicReflectance(m)?.f0Factor ?? 1,
                        (m, v) => MetallicPlan(m, { specularWeight: v })
                    )}
                    {toggle(
                        "pbr.useOnlyMetallicFromTexture",
                        "Use Only Metallic From Texture",
                        (m) => getPbrMetallicReflectance(m)?.useOnlyMetallicFromTexture ?? false,
                        (m, v) => MetallicPlan(m, { useOnlyMetallicFromTexture: v })
                    )}
                </>
            );
        case "clear-coat":
            if (!getPbrClearCoat(target)) {
                return null;
            }
            return (
                <>
                    {toggle(
                        "pbr.clearCoat.enabled",
                        "Enabled",
                        (m) => getPbrClearCoat(m)?.isEnabled ?? false,
                        (m, v) => ClearCoatPlan(m, { isEnabled: v })
                    )}
                    {number(
                        "pbr.clearCoat.intensity",
                        "Intensity",
                        (m) => getPbrClearCoat(m)?.intensity ?? 1,
                        (m, v) => ClearCoatPlan(m, { intensity: v }),
                        0,
                        1
                    )}
                    {number(
                        "pbr.clearCoat.roughness",
                        "Roughness",
                        (m) => getPbrClearCoat(m)?.roughness ?? 0,
                        (m, v) => ClearCoatPlan(m, { roughness: v }),
                        0,
                        1
                    )}
                    {number(
                        "pbr.clearCoat.indexOfRefraction",
                        "Index of Refraction",
                        (m) => getPbrClearCoat(m)?.indexOfRefraction ?? 1.5,
                        (m, v) => ClearCoatPlan(m, { indexOfRefraction: v })
                    )}
                    {toggle(
                        "pbr.clearCoat.useF0Remap",
                        "F0 Remap",
                        (m) => getPbrClearCoat(m)?.useF0Remap ?? true,
                        (m, v) => ClearCoatPlan(m, { useF0Remap: v })
                    )}
                    {number(
                        "pbr.clearCoat.bumpTextureScale",
                        "Bump Texture Scale",
                        (m) => getPbrClearCoat(m)?.bumpTextureScale ?? 1,
                        (m, v) => ClearCoatPlan(m, { bumpTextureScale: v })
                    )}
                </>
            );
        case "sheen":
            if (!getPbrSheen(target)) {
                return null;
            }
            return (
                <>
                    {toggle(
                        "pbr.sheen.enabled",
                        "Enabled",
                        (m) => getPbrSheen(m)?.isEnabled ?? false,
                        (m, v) => SheenPlan(m, { isEnabled: v })
                    )}
                    {color3(
                        "pbr.sheen.color",
                        "Color",
                        (m) => getPbrSheen(m)?.color ?? [1, 1, 1],
                        (m, v) => SheenPlan(m, { color: [...v] })
                    )}
                    {number(
                        "pbr.sheen.roughness",
                        "Roughness",
                        (m) => getPbrSheen(m)?.roughness ?? 0,
                        (m, v) => SheenPlan(m, { roughness: v }),
                        0,
                        1
                    )}
                    {number(
                        "pbr.sheen.intensity",
                        "Intensity",
                        (m) => getPbrSheen(m)?.intensity ?? 1,
                        (m, v) => SheenPlan(m, { intensity: v }),
                        0,
                        1
                    )}
                    {toggle(
                        "pbr.sheen.albedoScaling",
                        "Albedo Scaling",
                        (m) => getPbrSheen(m)?.albedoScaling ?? false,
                        (m, v) => SheenPlan(m, { albedoScaling: v })
                    )}
                </>
            );
        case "iridescence":
            if (!getPbrIridescence(target)) {
                return null;
            }
            return (
                <>
                    {toggle(
                        "pbr.iridescence.enabled",
                        "Enabled",
                        (m) => getPbrIridescence(m)?.isEnabled ?? false,
                        (m, v) => IridescencePlan(m, { isEnabled: v })
                    )}
                    {number(
                        "pbr.iridescence.intensity",
                        "Intensity",
                        (m) => getPbrIridescence(m)?.intensity ?? 1,
                        (m, v) => IridescencePlan(m, { intensity: v }),
                        0,
                        1
                    )}
                    {number(
                        "pbr.iridescence.indexOfRefraction",
                        "Index of Refraction",
                        (m) => getPbrIridescence(m)?.indexOfRefraction ?? 1.3,
                        (m, v) => IridescencePlan(m, { indexOfRefraction: v })
                    )}
                    {number(
                        "pbr.iridescence.minimumThickness",
                        "Minimum Thickness",
                        (m) => getPbrIridescence(m)?.minimumThickness ?? 100,
                        (m, v) => IridescencePlan(m, { minimumThickness: v })
                    )}
                    {number(
                        "pbr.iridescence.maximumThickness",
                        "Maximum Thickness",
                        (m) => getPbrIridescence(m)?.maximumThickness ?? 400,
                        (m, v) => IridescencePlan(m, { maximumThickness: v })
                    )}
                </>
            );
        case "anisotropy":
            if (!getPbrAnisotropy(target)) {
                return null;
            }
            return (
                <>
                    {toggle(
                        "pbr.anisotropy.enabled",
                        "Enabled",
                        (m) => getPbrAnisotropy(m)?.isEnabled ?? false,
                        (m, v) => AnisotropyPlan(m, { isEnabled: v })
                    )}
                    {number(
                        "pbr.anisotropy.intensity",
                        "Intensity",
                        (m) => getPbrAnisotropy(m)?.intensity ?? 1,
                        (m, v) => AnisotropyPlan(m, { intensity: v }),
                        0,
                        1
                    )}
                    {vector2(
                        "pbr.anisotropy.direction",
                        "Direction",
                        (m) => getPbrAnisotropy(m)?.direction ?? [1, 0],
                        (m, v) => AnisotropyPlan(m, { direction: [...v] })
                    )}
                </>
            );
        case "subsurface-translucency":
            if (!getPbrSubsurface(target)?.translucency) {
                return null;
            }
            return (
                <>
                    {number(
                        "pbr.translucency.intensity",
                        "Intensity",
                        (m) => getPbrSubsurface(m)?.translucency?.intensity ?? 1,
                        (m, v) => SubsurfacePlan(m, "translucency", { intensity: v }),
                        0,
                        1
                    )}
                    {color3(
                        "pbr.translucency.color",
                        "Color",
                        (m) => getPbrSubsurface(m)?.translucency?.color ?? [1, 1, 1],
                        (m, v) => SubsurfacePlan(m, "translucency", { color: [...v] })
                    )}
                    {color3(
                        "pbr.translucency.diffusionDistance",
                        "Diffusion Distance",
                        (m) => getPbrSubsurface(m)?.translucency?.diffusionDistance ?? [1, 1, 1],
                        (m, v) => SubsurfacePlan(m, "translucency", { diffusionDistance: [...v] })
                    )}
                </>
            );
        case "subsurface-thickness":
            if (!getPbrSubsurface(target)?.thickness) {
                return null;
            }
            return (
                <>
                    {number(
                        "pbr.thickness.min",
                        "Minimum",
                        (m) => getPbrSubsurface(m)?.thickness?.min ?? 0,
                        (m, v) => SubsurfacePlan(m, "thickness", { min: v })
                    )}
                    {number(
                        "pbr.thickness.max",
                        "Maximum",
                        (m) => getPbrSubsurface(m)?.thickness?.max ?? 1,
                        (m, v) => SubsurfacePlan(m, "thickness", { max: v })
                    )}
                    {toggle(
                        "pbr.thickness.useGlTFChannel",
                        "Use glTF Channel",
                        (m) => getPbrSubsurface(m)?.thickness?.useGlTFChannel ?? false,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        (m, v) => SubsurfacePlan(m, "thickness", { useGlTFChannel: v })
                    )}
                </>
            );
        case "subsurface-tint":
            if (!getPbrSubsurface(target)?.tint) {
                return null;
            }
            return (
                <>
                    {color3(
                        "pbr.tint.color",
                        "Color",
                        (m) => getPbrSubsurface(m)?.tint?.color ?? [1, 1, 1],
                        (m, v) => SubsurfacePlan(m, "tint", { color: [...v] })
                    )}
                    {number(
                        "pbr.tint.atDistance",
                        "Distance",
                        (m) => getPbrSubsurface(m)?.tint?.atDistance ?? 1,
                        (m, v) => SubsurfacePlan(m, "tint", { atDistance: v })
                    )}
                </>
            );
        case "transmission":
            if (!getPbrTransmission(target)) {
                return null;
            }
            return (
                <>
                    {number(
                        "pbr.transmission.intensity",
                        "Intensity",
                        (m) => getPbrTransmission(m)?.intensity ?? 0,
                        (m, v) => TransmissionPlan(m, { intensity: v }),
                        0,
                        1
                    )}
                    {number(
                        "pbr.transmission.indexOfRefraction",
                        "Index of Refraction",
                        (m) => getPbrTransmission(m)?.indexOfRefraction ?? 1.5,
                        (m, v) => TransmissionPlan(m, { indexOfRefraction: v })
                    )}
                    {toggle(
                        "pbr.transmission.useThicknessAsDepth",
                        "Use Thickness as Depth",
                        (m) => getPbrTransmission(m)?.useThicknessAsDepth ?? false,
                        (m, v) => TransmissionPlan(m, { useThicknessAsDepth: v })
                    )}
                    {getPbrTransmission(target)?.dispersion !== undefined
                        ? number(
                              "pbr.transmission.dispersion",
                              "Dispersion",
                              (m) => getPbrTransmission(m)?.dispersion ?? 0,
                              (m, v) => {
                                  Require(getPbrTransmission(m)?.dispersion, "PBR dispersion");
                                  return Rebuild(() => setPbrDispersion(m, v));
                              }
                          )
                        : null}
                </>
            );
        case "special-modes": {
            const unlit = getPbrUnlit(target);
            const shadowOnly = getShadowOnly(target);
            return (
                <>
                    {unlit ? readOnly("pbr.mode.unlit", "Unlit", () => true, "Unlit") : null}
                    {unlit ? readOnly("pbr.mode.unlitColor", "Unlit Color", (m) => getPbrUnlit(m) ?? [0, 0, 0], "Unlit tint") : null}
                    {isPbrGammaAlbedo(target) ? readOnly("pbr.mode.gammaAlbedo", "Gamma Albedo", () => true, "Gamma albedo") : null}
                    {isPbrSkybox(target) ? readOnly("pbr.mode.skybox", "Skybox", () => true, "Skybox") : null}
                    {shadowOnly ? readOnly("pbr.mode.shadowOnly", "Shadow Only", () => true, "Shadow-only") : null}
                    {shadowOnly ? readOnly("pbr.mode.shadowOnlyColor", "Shadow Color", (m) => getShadowOnly(m)?.color ?? [0, 0, 0], "Shadow-only color") : null}
                    {shadowOnly ? readOnly("pbr.mode.shadowOnlyOpacity", "Shadow Opacity", (m) => getShadowOnly(m)?.opacity ?? 0, "Shadow-only opacity") : null}
                    {shadowOnly ? readOnly("pbr.mode.shadowOnlyFalloff", "Shadow Falloff", (m) => getShadowOnly(m)?.falloff ?? 0, "Shadow-only falloff") : null}
                </>
            );
        }
        case "stencil":
            return (
                <>
                    {stencil("pbr.stencil.compare", "Stencil Compare", "compare", StencilCompareOptions)}
                    {stencil("pbr.stencil.passOp", "Stencil Pass Operation", "passOp", StencilOperationOptions)}
                    {stencil("pbr.stencil.failOp", "Stencil Fail Operation", "failOp", StencilOperationOptions)}
                    {stencil("pbr.stencil.depthFailOp", "Stencil Depth Fail Operation", "depthFailOp", StencilOperationOptions)}
                    {stencilMask("pbr.stencil.readMask", "Stencil Read Mask", "readMask")}
                    {stencilMask("pbr.stencil.writeMask", "Stencil Write Mask", "writeMask")}
                </>
            );
        default:
            return null;
    }
};

function LightmapPlan(material: Pbr, patch: { level?: number; coordIndex?: 0 | 1; useAsShadowmap?: boolean; gamma?: boolean }): Plan {
    const texture = Require(material.lightmapTexture, "PBR lightmap");
    const options = {
        level: material.lightmapLevel ?? 1,
        coordIndex: material.lightmapCoordIndex ?? 1,
        useAsShadowmap: material.useLightmapAsShadowmap ?? false,
        gamma: material.gammaLightmap ?? false,
        ...patch,
    };
    return Rebuild(async () => {
        await enablePbrLightmap();
        setPbrLightmap(material, texture as Texture2D, options);
    });
}

function MetallicPlan(material: Pbr, patch: Partial<NonNullable<ReturnType<typeof getPbrMetallicReflectance>>>): Plan {
    const current = Require(getPbrMetallicReflectance(material), "PBR metallic reflectance");
    return Rebuild(() =>
        setPbrMetallicReflectance(material, {
            color: [...(current.color ?? [1, 1, 1])],
            texture: current.texture,
            reflectanceTexture: current.reflectanceTexture,
            f0Factor: current.f0Factor ?? 1,
            specularWeight: current.specularWeight ?? current.f0Factor ?? 1,
            useOnlyMetallicFromTexture: current.useOnlyMetallicFromTexture ?? false,
            ...patch,
        })
    );
}

function ClearCoatPlan(material: Pbr, patch: Partial<NonNullable<ReturnType<typeof getPbrClearCoat>>>): Plan {
    const current = Require(getPbrClearCoat(material), "PBR clear coat");
    return Rebuild(() =>
        setPbrClearCoat(material, {
            isEnabled: current.isEnabled ?? false,
            intensity: current.intensity ?? 1,
            roughness: current.roughness ?? 0,
            indexOfRefraction: current.indexOfRefraction ?? 1.5,
            texture: current.texture,
            roughnessTexture: current.roughnessTexture,
            bumpTexture: current.bumpTexture,
            bumpTextureScale: current.bumpTextureScale ?? 1,
            useF0Remap: current.useF0Remap ?? true,
            ...patch,
        })
    );
}

function SheenPlan(material: Pbr, patch: Partial<NonNullable<ReturnType<typeof getPbrSheen>>>): Plan {
    const current = Require(getPbrSheen(material), "PBR sheen");
    return Rebuild(() =>
        setPbrSheen(material, {
            isEnabled: current.isEnabled ?? false,
            color: [...(current.color ?? [1, 1, 1])],
            roughness: current.roughness ?? 0,
            intensity: current.intensity ?? 1,
            texture: current.texture,
            roughnessTexture: current.roughnessTexture,
            albedoScaling: current.albedoScaling ?? false,
            ...patch,
        })
    );
}

function IridescencePlan(material: Pbr, patch: Partial<NonNullable<ReturnType<typeof getPbrIridescence>>>): Plan {
    const current = Require(getPbrIridescence(material), "PBR iridescence");
    return Rebuild(() =>
        setPbrIridescence(material, {
            isEnabled: current.isEnabled ?? false,
            intensity: current.intensity ?? 1,
            indexOfRefraction: current.indexOfRefraction ?? 1.3,
            minimumThickness: current.minimumThickness ?? 100,
            maximumThickness: current.maximumThickness ?? 400,
            texture: current.texture,
            thicknessTexture: current.thicknessTexture,
            ...patch,
        })
    );
}

function AnisotropyPlan(material: Pbr, patch: Partial<NonNullable<ReturnType<typeof getPbrAnisotropy>>>): Plan {
    const current = Require(getPbrAnisotropy(material), "PBR anisotropy");
    return Rebuild(() =>
        setPbrAnisotropy(material, {
            isEnabled: current.isEnabled ?? false,
            intensity: current.intensity ?? 1,
            direction: [...(current.direction ?? [1, 0])],
            texture: current.texture,
            ...patch,
        })
    );
}

function SubsurfacePlan<K extends "translucency" | "thickness" | "tint">(material: Pbr, key: K, patch: Partial<NonNullable<SubSurfaceProps[K]>>): Plan {
    const current = Require(getPbrSubsurface(material), "PBR subsurface");
    Require(current[key], `PBR ${key}`);
    const subsurface = {
        translucency: current.translucency
            ? {
                  intensity: current.translucency.intensity ?? 1,
                  color: [...(current.translucency.color ?? [1, 1, 1])],
                  colorTexture: current.translucency.colorTexture,
                  intensityTexture: current.translucency.intensityTexture,
                  diffusionDistance: [...(current.translucency.diffusionDistance ?? [1, 1, 1])],
              }
            : undefined,
        scattering: current.scattering ? { ...current.scattering } : undefined,
        thickness: current.thickness
            ? {
                  texture: current.thickness.texture,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  useGlTFChannel: current.thickness.useGlTFChannel ?? false,
                  min: current.thickness.min ?? 0,
                  max: current.thickness.max ?? 1,
              }
            : undefined,
        tint: current.tint ? { color: [...(current.tint.color ?? [1, 1, 1])], atDistance: current.tint.atDistance } : undefined,
        refraction: current.refraction ? { ...current.refraction } : undefined,
    };
    Object.assign(subsurface[key]!, patch);
    return Rebuild(() => setPbrSubsurface(material, subsurface as SubSurfaceProps));
}

function TransmissionPlan(material: Pbr, patch: Partial<RefractionProps>): Plan {
    const current = Require(getPbrTransmission(material), "PBR transmission");
    const next = {
        intensity: current.intensity ?? 0,
        texture: current.texture,
        indexOfRefraction: current.indexOfRefraction ?? 1.5,
        useThicknessAsDepth: current.useThicknessAsDepth ?? false,
        dispersion: current.dispersion,
        ...patch,
    };
    const active = (current.intensity ?? 0) > 0;
    return Rebuild(() => setPbrTransmission(material, next), active !== next.intensity > 0);
}

/**
 * Renders PBR property rows and texture bindings directly from Lite.
 * @param props The selected PBR material, section, and instance services.
 * @returns The PBR property rows for the requested section.
 */
export const PbrMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    const { material, section, resourceIndexService, selectionService } = props;
    const getSource = () => {
        try {
            return getMaterialSource(material);
        } catch {
            return undefined;
        }
    };
    const source = getSource();
    const getRecord = useCallback(() => (source && !resourceIndexService.isDisposed ? resourceIndexService.getMaterialRecord(source) : undefined), [source, resourceIndexService]);
    const record = useObservableState(getRecord, resourceIndexService.onChanged);
    const isDisposed = useCallback(() => resourceIndexService.isDisposed, [resourceIndexService]);
    const [operations, runLatestOperation] = useLatestAsyncOperation(
        material,
        [resourceIndexService.onChanged, resourceIndexService.onDisposed, selectionService.onSelectedEntityChanged],
        isDisposed
    );
    const notifyPropertyChanged = usePropertyChangedNotifier();
    const target = material as Pbr;
    const commit: Commit = (id, read, value, prepare, validate) => {
        runLatestOperation({
            id,
            operationAsync: async () => {
                validate?.(value);
                const current = getRecord();
                if (!current || current.family !== "pbr" || !source) {
                    throw new Error("This material is no longer available in an inspected scene.");
                }
                const scenes = [...current.scenes];
                if (
                    !scenes.length ||
                    scenes.some((scene) => !Array.isArray(scene.meshes) || !scene.meshes.some((mesh) => mesh?.material && getMaterialSource(mesh.material) === source))
                ) {
                    throw new Error("Material is not reachable from every scene in the mutation scope.");
                }
                const oldValue = read(target);
                const plan = prepare(target, value);
                if (SameValue(oldValue, value)) {
                    return { changed: false, oldValue };
                }
                await plan.apply();
                if (plan.mutation === "U") {
                    markMaterialUboDirty(target);
                } else if (plan.mutation === "R") {
                    await Promise.all(
                        scenes.map(async (scene) => {
                            await rebuildMaterial(scene, target, { rebuildViews: true, rebuildFrameGraph: plan.frameGraphParticipationChanged === true });
                        })
                    );
                }
                return { changed: true, oldValue };
            },
            onSuccess: ({ changed, oldValue }) => {
                if (changed && source) {
                    notifyPropertyChanged(source, id, oldValue, value);
                }
                resourceIndexService.refresh();
            },
            getErrorMessage: (error) => (error instanceof Error ? error.message : "The material change failed."),
        });
    };
    const commitTexture: DirectTextureBindingProps["commit"] = (change) => {
        const { id, oldValue, newValue, apply, invalidate, rebuildFrameGraph } = change;
        runLatestOperation({
            id,
            operationAsync: async () => {
                const current = getRecord();
                if (!current || current.family !== "pbr" || !source) {
                    throw new Error("This material is no longer available in an inspected scene.");
                }
                const scenes = [...current.scenes];
                if (
                    !scenes.length ||
                    scenes.some((scene) => !Array.isArray(scene.meshes) || !scene.meshes.some((mesh) => mesh?.material && getMaterialSource(mesh.material) === source))
                ) {
                    throw new Error("Material is not reachable from every scene in the mutation scope.");
                }
                if (SameValue(oldValue as FieldValue, newValue as FieldValue)) {
                    return false;
                }
                await apply();
                if (invalidate === "ubo") {
                    markMaterialUboDirty(target);
                } else if (invalidate === "rebuild") {
                    await Promise.all(
                        scenes.map(async (scene) => {
                            await rebuildMaterial(scene, target, { rebuildViews: true, rebuildFrameGraph: rebuildFrameGraph === true });
                        })
                    );
                }
                return true;
            },
            onSuccess: (changed) => {
                if (changed && source) {
                    notifyPropertyChanged(source, id, oldValue, newValue);
                }
                resourceIndexService.refresh();
            },
            getErrorMessage: (error) => (error instanceof Error ? error.message : "The material texture change failed."),
        });
    };

    if (!record || !source) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }
    if (record.family !== "pbr" || getMaterialFamily(source) !== "pbr") {
        return <TextPropertyLine label="Error" value={`The material family changed from pbr to ${record.family ?? "unknown"}.`} />;
    }

    return (
        <>
            {section === "general" ? (
                <>
                    <TextPropertyLine label="Family" value="pbr" />
                    <TextPropertyLine label="Selection" value={isMaterialView(material) ? "MaterialView" : "Material"} />
                    {isMaterialView(material) ? (
                        <TextPropertyLine label="Source" value={typeof target.name === "string" && target.name ? target.name : record.displayName} />
                    ) : undefined}
                </>
            ) : undefined}
            <PbrRows target={target} section={section} operations={operations} commit={commit} />
            {TextureSlots.filter((slot) => slot.section === section && (!("visible" in slot) || slot.visible(target))).map((slot) => {
                const value = slot.read(target);
                return (
                    <DirectTextureBinding
                        key={slot.id}
                        id={slot.id}
                        label={slot.label}
                        source={source}
                        record={record}
                        resourceIndexService={resourceIndexService}
                        selectionService={selectionService}
                        operations={operations}
                        commit={commitTexture}
                        value={value}
                        acceptedKinds={["2d"]}
                        canClear={!("canClear" in slot) || slot.canClear}
                        invalidate="rebuild"
                        apply={async (texture) => {
                            if ((slot.read(target) ?? null) !== (value ?? null)) {
                                throw new Error(`Texture binding "${slot.id}" is stale.`);
                            }
                            await SetPbrTexture(target, slot.id, texture);
                        }}
                    />
                );
            })}
        </>
    );
};
