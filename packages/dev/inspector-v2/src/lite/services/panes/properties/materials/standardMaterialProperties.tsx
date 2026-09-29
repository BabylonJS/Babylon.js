import {
    enableMaterialStencil,
    enableStandardUvOffset,
    getStandardAmbientTexture,
    getStandardBumpTexture,
    getStandardEmissiveTexture,
    getStandardLightmapTexture,
    getStandardOpacityTexture,
    getStandardReflectionCubeTexture,
    getStandardReflectionTexture,
    getStandardSpecularTexture,
    setStandardAmbientTexture,
    setStandardBumpTexture,
    setStandardEmissiveTexture,
    setStandardLightmapTexture,
    setStandardOpacityTexture,
    setStandardReflectionCubeTexture,
    setStandardReflectionTexture,
    setStandardSpecularTexture,
    type CubeTexture,
    type StandardMaterialProps,
    type StencilState,
    type Texture2D,
} from "@babylonjs/lite";
import { Body1 } from "@fluentui/react-components";
import { type FunctionComponent, type ReactNode } from "react";

import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine, TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Color3PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

import { ComputedProperty, DerivedProperty } from "../../../../../components/properties/boundProperty";
import { DirectTextureBinding } from "./directTextureBinding";
import { type MaterialAdapterProps } from "./materialAdapterTypes";
import { useDirectMaterialOperations } from "./useDirectMaterialOperations";

const UvOptions = [
    { value: 0, label: "UV1" },
    { value: 1, label: "UV2" },
];
const ReflectionOptions = [
    { value: 1, label: "Spherical" },
    { value: 2, label: "Planar" },
];
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

type StandardMaterial = StandardMaterialProps;
type DirectOperations = ReturnType<typeof useDirectMaterialOperations>;

const StandardTextureSlots = [
    { id: "standard.diffuse", label: "Diffuse Texture", kind: "2d", get: (material: StandardMaterial) => material.diffuseTexture },
    { id: "standard.emissive", label: "Emissive Texture", kind: "2d", get: getStandardEmissiveTexture },
    { id: "standard.bump", label: "Bump Texture", kind: "2d", get: getStandardBumpTexture },
    { id: "standard.specular", label: "Specular Texture", kind: "2d", get: getStandardSpecularTexture },
    { id: "standard.ambient", label: "Ambient Texture", kind: "2d", get: getStandardAmbientTexture },
    { id: "standard.lightmap", label: "Lightmap Texture", kind: "2d", get: getStandardLightmapTexture },
    { id: "standard.opacity", label: "Opacity Texture", kind: "2d", get: getStandardOpacityTexture },
    { id: "standard.reflection2d", label: "Reflection Texture", kind: "2d", get: getStandardReflectionTexture },
    { id: "standard.reflectionCube", label: "Reflection Cube Texture", kind: "cube", get: getStandardReflectionCubeTexture },
] as const;

function SetStandardTexture(material: StandardMaterial, id: (typeof StandardTextureSlots)[number]["id"], texture: object | null): void {
    if (id === "standard.reflectionCube") {
        setStandardReflectionCubeTexture(material, texture as CubeTexture | null);
        return;
    }
    const value = texture as Texture2D | null;
    switch (id) {
        case "standard.diffuse":
            material.diffuseTexture = value;
            return;
        case "standard.emissive":
            setStandardEmissiveTexture(material, value);
            return;
        case "standard.bump":
            setStandardBumpTexture(material, value);
            return;
        case "standard.specular":
            setStandardSpecularTexture(material, value);
            return;
        case "standard.ambient":
            setStandardAmbientTexture(material, value);
            return;
        case "standard.lightmap":
            setStandardLightmapTexture(material, value);
            return;
        case "standard.opacity":
            setStandardOpacityTexture(material, value);
            return;
        case "standard.reflection2d":
            setStandardReflectionTexture(material, value);
            return;
    }
}

const FieldStatus: FunctionComponent<{ label: string; state: DirectOperations["operations"][string]; children: ReactNode }> = (props) => {
    const { label, state, children } = props;
    return (
        <div aria-busy={state?.pending ?? false}>
            {children}
            {state?.pending ? <Body1 role="status">{`Applying ${label}…`}</Body1> : undefined}
            {state?.error ? <Body1 role="alert">{state.error}</Body1> : undefined}
        </div>
    );
};

/**
 * Lazily loaded Standard material section properties.
 * @param props The selected material section and instance services.
 * @returns Standard material property content.
 */
export const StandardMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    const { material, section, resourceIndexService, selectionService } = props;
    const { source, record, operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const standard = material as StandardMaterial;

    if (!record) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }

    if (section === "textures") {
        return (
            <>
                {StandardTextureSlots.map((slot) => (
                    <DirectTextureBinding
                        key={slot.id}
                        id={slot.id}
                        label={slot.label}
                        source={source}
                        record={record}
                        resourceIndexService={resourceIndexService}
                        selectionService={selectionService}
                        operations={operations}
                        commit={commit}
                        value={slot.get(standard)}
                        acceptedKinds={[slot.kind]}
                        invalidate="rebuild"
                        apply={(texture) => SetStandardTexture(standard, slot.id, texture)}
                    />
                ))}
            </>
        );
    }

    if (section === "general") {
        return (
            <>
                <TextPropertyLine label="Family" value="standard" />
                <TextPropertyLine label="Selection" value={source === material ? "Material" : "MaterialView"} />
                {source !== material ? <TextPropertyLine label="Source" value={material.name || "Standard Material"} /> : undefined}
                <FieldStatus label="Name" state={operations["material.name"]}>
                    <DerivedProperty
                        component={TextInputPropertyLine}
                        target={standard}
                        getValue={(target) => target.name ?? ""}
                        setValue={(target, value) =>
                            commit({
                                id: "material.name",
                                oldValue: target.name ?? "",
                                newValue: value,
                                apply: () => {
                                    target.name = value;
                                },
                                invalidate: "owned",
                            })
                        }
                        label="Name"
                        uniqueId="material.name"
                        disabled={operations["material.name"]?.pending}
                        description={operations["material.name"]?.error}
                    />
                </FieldStatus>
                {(
                    [
                        ["standard.backFaceCulling", "Back Face Culling", "backFaceCulling"],
                        ["standard.disableLighting", "Disable Lighting", "disableLighting"],
                    ] as const
                ).map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={SwitchPropertyLine}
                            target={standard}
                            getValue={(target) => target[key]}
                            setValue={(target, value) =>
                                commit({
                                    id,
                                    oldValue: target[key],
                                    newValue: value,
                                    apply: () => {
                                        target[key] = value;
                                    },
                                    invalidate: "rebuild",
                                })
                            }
                            label={label}
                            uniqueId={id}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
            </>
        );
    }

    if (section === "transparency") {
        return (
            <>
                <FieldStatus label="Alpha" state={operations["standard.alpha"]}>
                    <DerivedProperty
                        component={NumberInputPropertyLine}
                        target={standard}
                        getValue={(target) => target.alpha}
                        setValue={(target, value) =>
                            commit({
                                id: "standard.alpha",
                                oldValue: target.alpha,
                                newValue: value,
                                apply: () => {
                                    target.alpha = value;
                                },
                                invalidate: target.alpha < 1 === value < 1 ? "ubo" : "rebuild",
                            })
                        }
                        label="Alpha"
                        uniqueId="standard.alpha"
                        disabled={operations["standard.alpha"]?.pending}
                        description={operations["standard.alpha"]?.error}
                    />
                </FieldStatus>
                <FieldStatus label="Alpha Cutoff" state={operations["standard.alphaCutOff"]}>
                    <DerivedProperty
                        component={NumberInputPropertyLine}
                        target={standard}
                        getValue={(target) => target.alphaCutOff}
                        setValue={(target, value) =>
                            commit({
                                id: "standard.alphaCutOff",
                                oldValue: target.alphaCutOff,
                                newValue: value,
                                apply: () => {
                                    target.alphaCutOff = value;
                                },
                                invalidate: "ubo",
                            })
                        }
                        label="Alpha Cutoff"
                        uniqueId="standard.alphaCutOff"
                        disabled={operations["standard.alphaCutOff"]?.pending}
                        description={operations["standard.alphaCutOff"]?.error}
                    />
                </FieldStatus>
            </>
        );
    }

    if (section === "lighting-colors") {
        return (
            <>
                {(
                    [
                        ["standard.diffuseColor", "Diffuse Color", "diffuseColor"],
                        ["standard.specularColor", "Specular Color", "specularColor"],
                        ["standard.emissiveColor", "Emissive Color", "emissiveColor"],
                        ["standard.ambientColor", "Ambient Color", "ambientColor"],
                    ] as const
                ).map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={Color3PropertyLine}
                            target={standard}
                            getValue={(target) => target[key]}
                            setValue={(target, next) => {
                                const value: [number, number, number] = "r" in next ? [next.r, next.g, next.b] : [...next];
                                commit({
                                    id,
                                    oldValue: [...target[key]],
                                    newValue: value,
                                    apply: () => {
                                        target[key] = value;
                                    },
                                    invalidate: "ubo",
                                });
                            }}
                            label={label}
                            uniqueId={id}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                            isLinearMode
                        />
                    </FieldStatus>
                ))}
                <FieldStatus label="Specular Power" state={operations["standard.specularPower"]}>
                    <DerivedProperty
                        component={NumberInputPropertyLine}
                        target={standard}
                        getValue={(target) => target.specularPower}
                        setValue={(target, value) =>
                            commit({
                                id: "standard.specularPower",
                                oldValue: target.specularPower,
                                newValue: value,
                                apply: () => {
                                    target.specularPower = value;
                                },
                                invalidate: "ubo",
                            })
                        }
                        label="Specular Power"
                        uniqueId="standard.specularPower"
                        min={0}
                        disabled={operations["standard.specularPower"]?.pending}
                        description={operations["standard.specularPower"]?.error}
                    />
                </FieldStatus>
            </>
        );
    }

    if (section === "texture-settings") {
        return (
            <>
                {(
                    [
                        ["standard.diffuseCoordIndex", "Diffuse Coordinates", "diffuseCoordIndex"],
                        ["standard.specularCoordIndex", "Specular Coordinates", "specularCoordIndex"],
                        ["standard.ambientCoordIndex", "Ambient Coordinates", "ambientCoordIndex"],
                        ["standard.lightmapCoordIndex", "Lightmap Coordinates", "lightmapCoordIndex"],
                    ] as const
                ).map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={NumberDropdownPropertyLine}
                            target={standard}
                            getValue={(target) => target[key]}
                            setValue={(target, value) =>
                                commit({
                                    id,
                                    oldValue: target[key],
                                    newValue: value,
                                    apply: () => {
                                        target[key] = value as 0 | 1;
                                    },
                                    invalidate: "rebuild",
                                })
                            }
                            label={label}
                            uniqueId={id}
                            options={UvOptions}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
                {(
                    [
                        ["standard.bumpLevel", "Bump Level", "bumpLevel"],
                        ["standard.ambientTexLevel", "Ambient Texture Level", "ambientTexLevel"],
                        ["standard.lightmapLevel", "Lightmap Level", "lightmapLevel"],
                        ["standard.opacityLevel", "Opacity Level", "opacityLevel"],
                        ["standard.reflectionLevel", "Reflection Level", "reflectionLevel"],
                    ] as const
                ).map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={NumberInputPropertyLine}
                            target={standard}
                            getValue={(target) => target[key]}
                            setValue={(target, value) =>
                                commit({
                                    id,
                                    oldValue: target[key],
                                    newValue: value,
                                    apply: () => {
                                        target[key] = value;
                                    },
                                    invalidate: "ubo",
                                })
                            }
                            label={label}
                            uniqueId={id}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
                <FieldStatus label="Reflection Coordinates" state={operations["standard.reflectionCoordMode"]}>
                    <DerivedProperty
                        component={NumberDropdownPropertyLine}
                        target={standard}
                        getValue={(target) => target.reflectionCoordMode}
                        setValue={(target, value) =>
                            commit({
                                id: "standard.reflectionCoordMode",
                                oldValue: target.reflectionCoordMode,
                                newValue: value,
                                apply: () => {
                                    target.reflectionCoordMode = value as 1 | 2;
                                },
                                invalidate: "ubo",
                            })
                        }
                        label="Reflection Coordinates"
                        uniqueId="standard.reflectionCoordMode"
                        options={ReflectionOptions}
                        disabled={operations["standard.reflectionCoordMode"]?.pending}
                        description={operations["standard.reflectionCoordMode"]?.error}
                    />
                </FieldStatus>
                {(
                    [
                        ["standard.useLightmapAsShadowmap", "Use Lightmap as Shadowmap", "useLightmapAsShadowmap"],
                        ["standard.opacityFromRGB", "Opacity from RGB", "opacityFromRGB"],
                    ] as const
                ).map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={SwitchPropertyLine}
                            target={standard}
                            getValue={(target) => target[key]}
                            setValue={(target, value) =>
                                commit({
                                    id,
                                    oldValue: target[key],
                                    newValue: value,
                                    apply: () => {
                                        target[key] = value;
                                    },
                                    invalidate: "rebuild",
                                })
                            }
                            label={label}
                            uniqueId={id}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
            </>
        );
    }

    if (section === "transform") {
        return (
            <>
                {(
                    [
                        ["standard.uvScale", "UV Scale", "uvScale"],
                        ["standard.uvOffset", "UV Offset", "uvOffset"],
                    ] as const
                ).map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={Vector2PropertyLine}
                            target={standard}
                            getValue={(target) => target[key] ?? ([0, 0] as const)}
                            setValue={(target, next) => {
                                const value: [number, number] = "x" in next ? [next.x, next.y] : [...next];
                                commit({
                                    id,
                                    oldValue: [...(target[key] ?? [0, 0])],
                                    newValue: value,
                                    apply: () => {
                                        if (key === "uvOffset") {
                                            enableStandardUvOffset();
                                        }
                                        target[key] = value;
                                    },
                                    invalidate: "rebuild",
                                });
                            }}
                            label={label}
                            uniqueId={id}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
            </>
        );
    }

    if (section === "stencil") {
        const stencilFields = [
            ["standard.stencil.compare", "Stencil Compare", "compare", StencilCompareOptions],
            ["standard.stencil.passOp", "Stencil Pass Operation", "passOp", StencilOperationOptions],
            ["standard.stencil.failOp", "Stencil Fail Operation", "failOp", StencilOperationOptions],
            ["standard.stencil.depthFailOp", "Stencil Depth Fail Operation", "depthFailOp", StencilOperationOptions],
        ] as const;
        const maskFields = [
            ["standard.stencil.readMask", "Stencil Read Mask", "readMask"],
            ["standard.stencil.writeMask", "Stencil Write Mask", "writeMask"],
        ] as const;
        if (!standard.stencil) {
            return (
                <>
                    {[...stencilFields, ...maskFields].map(([id, label]) => (
                        <ComputedProperty key={id} component={TextPropertyLine} target={standard} getValue={() => "Not configured"} label={label} uniqueId={id} />
                    ))}
                </>
            );
        }
        const updateStencil = (id: string, key: keyof StencilState, value: StencilState[keyof StencilState]) => {
            const current = standard.stencil;
            commit({
                id,
                oldValue: current?.[key],
                newValue: value,
                apply: () => {
                    enableMaterialStencil();
                    standard.stencil = { ...current, [key]: value };
                },
                invalidate: "rebuild",
            });
        };
        return (
            <>
                {stencilFields.map(([id, label, key, options]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={StringDropdownPropertyLine}
                            target={standard}
                            getValue={(target) => target.stencil?.[key] ?? (key === "compare" ? "always" : "keep")}
                            setValue={(_target, value) => updateStencil(id, key, value as StencilState[typeof key])}
                            label={label}
                            uniqueId={id}
                            options={options}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
                {maskFields.map(([id, label, key]) => (
                    <FieldStatus key={id} label={label} state={operations[id]}>
                        <DerivedProperty
                            component={NumberInputPropertyLine}
                            target={standard}
                            getValue={(target) => target.stencil?.[key] ?? 0xff}
                            setValue={(_target, value) => updateStencil(id, key, value)}
                            label={label}
                            uniqueId={id}
                            min={0}
                            max={0xffffffff}
                            step={1}
                            disabled={operations[id]?.pending}
                            description={operations[id]?.error}
                        />
                    </FieldStatus>
                ))}
            </>
        );
    }

    return null;
};
