import { type Material } from "@babylonjs/lite";
import { createElement, type FunctionComponent, useCallback } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { CreateMaterialDescriptorWithFamily } from "./descriptors/materialDescriptor";
import { type IMaterialDescriptor, type MaterialDescriptorSection } from "./descriptors/descriptorTypes";
import { type LiteMaterialAdapterProps } from "./materialAdapters/materialAdapterCore";
import { type ILiteSceneResourceIndexService, LiteSceneResourceIndexServiceIdentity } from "../scene/sceneResourceIndexService";

type SupportedMaterialFamily = "standard" | "pbr" | "shader" | "node";

type FamilyConfiguration = Readonly<{
    component: FunctionComponent<LiteMaterialAdapterProps>;
    sections: readonly MaterialDescriptorSection[];
}>;

const StandardMaterialAdapter = MakeLazyComponent(async () => (await import("./materialAdapters/standardMaterialAdapter")).StandardMaterialAdapter, {
    spinnerLabel: "Loading Standard material properties",
});
const PbrMaterialAdapter = MakeLazyComponent(async () => (await import("./materialAdapters/pbrMaterialAdapter")).PbrMaterialAdapter, {
    spinnerLabel: "Loading PBR material properties",
});
const ShaderMaterialAdapter = MakeLazyComponent(async () => (await import("./materialAdapters/shaderMaterialAdapter")).ShaderMaterialAdapter, {
    spinnerLabel: "Loading Shader material properties",
});
const NodeMaterialAdapter = MakeLazyComponent(async () => (await import("./materialAdapters/nodeMaterialAdapter")).NodeMaterialAdapter, {
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

function GetSectionLabel(section: MaterialDescriptorSection): string {
    return section
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ")
        .replace("Lighting Colors", "Lighting & Colors")
        .replace("Subsurface ", "Subsurface / ");
}

function TryDescribeMaterial(entity: unknown, resourceIndexService: ILiteSceneResourceIndexService): IMaterialDescriptor | undefined {
    if (typeof entity !== "object" || entity === null) {
        return undefined;
    }
    try {
        const descriptorSnapshot = CreateMaterialDescriptorWithFamily(entity as Material);
        return typeof descriptorSnapshot === "object" &&
            descriptorSnapshot !== null &&
            typeof descriptorSnapshot.source === "object" &&
            descriptorSnapshot.source !== null &&
            Array.isArray(descriptorSnapshot.properties) &&
            resourceIndexService.index.getMaterialRecord(descriptorSnapshot.source)
            ? descriptorSnapshot
            : undefined;
    } catch {
        return undefined;
    }
}

function IsSupportedFamily(family: string | undefined): family is SupportedMaterialFamily {
    return family === "standard" || family === "pbr" || family === "shader" || family === "node";
}

const UnknownMaterialProperties: FunctionComponent<{ material: Material; resourceIndexService: ILiteSceneResourceIndexService }> = (props) => {
    const { material, resourceIndexService } = props;
    const getDescriptor = useCallback(() => {
        const selectedDescriptor = TryDescribeMaterial(material, resourceIndexService);
        const record = selectedDescriptor && resourceIndexService.index.getMaterialRecord(selectedDescriptor.source);
        return record && selectedDescriptor ? selectedDescriptor : undefined;
    }, [material, resourceIndexService]);
    const descriptorSnapshot = useObservableState(getDescriptor, resourceIndexService.onChanged);

    if (!descriptorSnapshot) {
        return <TextPropertyLine label="Error" value="This material is unavailable." />;
    }

    return (
        <>
            <TextPropertyLine label="Name" value={descriptorSnapshot.displayName} />
            <TextPropertyLine label="Family" value={descriptorSnapshot.family ?? "Unknown"} />
            <TextPropertyLine label="Selection" value={descriptorSnapshot.isView ? "MaterialView" : "Material"} />
            {descriptorSnapshot.isView ? <TextPropertyLine label="Source" value={descriptorSnapshot.displayName} /> : undefined}
        </>
    );
};

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ILiteSceneResourceIndexService, ISelectionService]> = {
    friendlyName: "Babylon Lite Material Properties",
    consumes: [PropertiesServiceIdentity, LiteSceneResourceIndexServiceIdentity, SelectionServiceIdentity],
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
                    const descriptorSnapshot = TryDescribeMaterial(entity, resourceIndexService);
                    return descriptorSnapshot !== undefined && !IsSupportedFamily(descriptorSnapshot.family);
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
