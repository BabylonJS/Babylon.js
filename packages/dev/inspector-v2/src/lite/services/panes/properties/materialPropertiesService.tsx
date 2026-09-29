import { getMaterialFamily, getMaterialSource, isMaterialView, type Material } from "@babylonjs/lite";
import { createElement, type FunctionComponent, useCallback } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type MaterialAdapterProps } from "./materials/materialAdapterTypes";
import { type ISceneResourceIndexService, SceneResourceIndexServiceIdentity } from "../scene/sceneResourceIndexService";

type SupportedMaterialFamily = "standard" | "pbr" | "shader" | "node";
type MaterialSection = MaterialAdapterProps["section"];

type FamilyConfiguration = Readonly<{
    component: FunctionComponent<MaterialAdapterProps>;
    sections: readonly MaterialSection[];
}>;

const StandardMaterialAdapter = MakeLazyComponent(async () => (await import("./materials/standardMaterialProperties")).StandardMaterialAdapter, {
    spinnerLabel: "Loading Standard material properties",
});
const PbrMaterialAdapter = MakeLazyComponent(async () => (await import("./materials/pbrMaterialProperties")).PbrMaterialAdapter, {
    spinnerLabel: "Loading PBR material properties",
});
const ShaderMaterialAdapter = MakeLazyComponent(async () => (await import("./materials/shaderMaterialProperties")).ShaderMaterialAdapter, {
    spinnerLabel: "Loading Shader material properties",
});
const NodeMaterialAdapter = MakeLazyComponent(async () => (await import("./materials/nodeMaterialProperties")).NodeMaterialAdapter, {
    spinnerLabel: "Loading Node material properties",
});

const FamilyConfigurations: Readonly<Record<SupportedMaterialFamily, FamilyConfiguration>> = {
    standard: {
        component: StandardMaterialAdapter,
        sections: ["general", "transparency", "lighting-colors", "textures", "texture-settings", "transform", "stencil"],
    },
    pbr: {
        component: PbrMaterialAdapter,
        sections: [
            "general",
            "transparency",
            "lighting-colors",
            "textures",
            "occlusion",
            "lightmap",
            "metallic-reflectance",
            "clear-coat",
            "sheen",
            "iridescence",
            "anisotropy",
            "subsurface-translucency",
            "subsurface-thickness",
            "subsurface-tint",
            "transmission",
            "special-modes",
            "transform",
            "stencil",
        ],
    },
    shader: {
        component: ShaderMaterialAdapter,
        sections: ["general", "inputs", "textures", "configuration"],
    },
    node: {
        component: NodeMaterialAdapter,
        sections: ["general", "inputs"],
    },
};

function GetSectionLabel(section: MaterialSection): string {
    return section
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ")
        .replace("Lighting Colors", "Lighting & Colors")
        .replace("Subsurface ", "Subsurface / ");
}

type MaterialIdentity = Readonly<{ source: Material; family: string | undefined; displayName: string; isView: boolean }>;

function TryDescribeMaterial(entity: unknown, resourceIndexService: ISceneResourceIndexService): MaterialIdentity | undefined {
    if (typeof entity !== "object" || entity === null) {
        return undefined;
    }
    try {
        const material = entity as Material;
        const source = getMaterialSource(material);
        if (typeof source !== "object" || source === null || !resourceIndexService.getMaterialRecord(source)) {
            return undefined;
        }
        const family = getMaterialFamily(source);
        const name = (material as { name?: unknown }).name;
        const displayName = typeof name === "string" && name.length > 0 ? name : family ? `${family[0].toUpperCase()}${family.slice(1)} Material` : "Material";
        return { source, family, displayName, isView: isMaterialView(material) };
    } catch {
        return undefined;
    }
}

function IsSupportedFamily(family: string | undefined): family is SupportedMaterialFamily {
    return family === "standard" || family === "pbr" || family === "shader" || family === "node";
}

const UnknownMaterialProperties: FunctionComponent<{ material: Material; resourceIndexService: ISceneResourceIndexService }> = (props) => {
    const { material, resourceIndexService } = props;
    const getMaterialIdentity = useCallback(() => {
        const identity = TryDescribeMaterial(material, resourceIndexService);
        const record = identity && resourceIndexService.getMaterialRecord(identity.source);
        return record && identity ? identity : undefined;
    }, [material, resourceIndexService]);
    const identity = useObservableState(getMaterialIdentity, resourceIndexService.onChanged);

    if (!identity) {
        return <TextPropertyLine label="Error" value="This material is unavailable." />;
    }

    return (
        <>
            <TextPropertyLine label="Name" value={identity.displayName} />
            <TextPropertyLine label="Family" value={identity.family ?? "Unknown"} />
            <TextPropertyLine label="Selection" value={identity.isView ? "MaterialView" : "Material"} />
            {identity.isView ? <TextPropertyLine label="Source" value={identity.displayName} /> : undefined}
        </>
    );
};

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISceneResourceIndexService, ISelectionService]> = {
    friendlyName: "Babylon Lite Material Properties",
    consumes: [PropertiesServiceIdentity, SceneResourceIndexServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, resourceIndexService, selectionService) => {
        const registrations = Object.entries(FamilyConfigurations).map(([family, configuration]) =>
            propertiesService.addSectionContent<Material>({
                key: `Babylon Lite ${family} Material Properties`,
                predicate: (entity: unknown): entity is Material => TryDescribeMaterial(entity, resourceIndexService)?.family === family,
                content: configuration.sections.map((section) => {
                    const component = configuration.component;
                    const sectionContent: FunctionComponent<{ context: Material }> = (props) => {
                        const { context } = props;
                        return createElement(component, { material: context, section, resourceIndexService, selectionService });
                    };
                    return {
                        section: GetSectionLabel(section),
                        component: sectionContent,
                    };
                }),
            })
        );
        registrations.push(
            propertiesService.addSectionContent<Material>({
                key: "Babylon Lite Unknown Material Properties",
                predicate: (entity: unknown): entity is Material => {
                    const identity = TryDescribeMaterial(entity, resourceIndexService);
                    return identity !== undefined && !IsSupportedFamily(identity.family);
                },
                content: [
                    {
                        section: "General",
                        component: ({ context }) => <UnknownMaterialProperties material={context} resourceIndexService={resourceIndexService} />,
                    },
                ],
            })
        );

        return {
            dispose: () => registrations.forEach((registration) => registration.dispose()),
        };
    },
};
