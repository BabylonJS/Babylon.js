import type { IInspectable } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IPropertiesService } from "../services/panes/properties/propertiesService";

import { InspectableType } from "core/Misc/iInspectable";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "../components/properties/boundProperty";
import { PropertiesServiceIdentity } from "../services/panes/properties/propertiesService";

interface IInspectableCustomProperties {
    inspectableCustomProperties: IInspectable[];
}

function IsInspectableCustomProperties(entity: unknown): entity is IInspectableCustomProperties {
    return (entity as IInspectableCustomProperties).inspectableCustomProperties !== undefined;
}

export const InspectableCustomPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Additional Nodes",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const propertiesSectionRegistration = propertiesService.addSection({
            identity: "Custom",
            order: Number.MAX_SAFE_INTEGER,
        });

        const propertiesContentRegistration = propertiesService.addSectionContent({
            key: "Additional Nodes Properties",
            predicate: (entity: unknown): entity is IInspectableCustomProperties => IsInspectableCustomProperties(entity),
            content: [
                {
                    section: "Custom",
                    component: ({ context }) => {
                        return (
                            <>
                                {(context.inspectableCustomProperties ?? []).map((prop) => {
                                    switch (prop.type) {
                                        case InspectableType.Checkbox:
                                            return (
                                                <BoundProperty
                                                    key={prop.propertyName}
                                                    target={context as Record<string, any>}
                                                    propertyKey={prop.propertyName}
                                                    label={prop.label}
                                                    ignoreNullable={true}
                                                    defaultValue={undefined}
                                                    component={SwitchPropertyLine}
                                                />
                                            );
                                    }
                                    return null;
                                })}
                            </>
                        );
                    },
                },
            ],
        });

        return {
            dispose: () => {
                propertiesSectionRegistration.dispose();
                propertiesContentRegistration.dispose();
            },
        };
    },
};
