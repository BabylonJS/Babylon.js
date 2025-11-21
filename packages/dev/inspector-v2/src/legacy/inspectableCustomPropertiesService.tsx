import type { IInspectable as InspectableProperty } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IPropertiesService } from "../services/panes/properties/propertiesService";

import { InspectableType } from "core/Misc/iInspectable";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { QuaternionPropertyLine, Vector2PropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { BoundProperty } from "../components/properties/boundProperty";
import { PropertiesServiceIdentity } from "../services/panes/properties/propertiesService";

type InspectableObject = {
    inspectableCustomProperties: InspectableProperty[];
};

function IsInspectableObject(entity: unknown): entity is InspectableObject {
    return !!(entity as InspectableObject).inspectableCustomProperties;
}

export const LegacyInspectableObjectPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Additional Nodes",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const propertiesSectionRegistration = propertiesService.addSection({
            identity: "Custom",
            order: Number.MAX_SAFE_INTEGER,
        });

        const propertiesContentRegistration = propertiesService.addSectionContent({
            key: "Additional Nodes Properties",
            predicate: (entity: unknown) => IsInspectableObject(entity),
            content: [
                {
                    section: "Custom",
                    component: ({ context }) => {
                        return (
                            <>
                                {(context.inspectableCustomProperties ?? []).map((prop): JSX.Element => {
                                    const commonProps = {
                                        target: context as Record<string, any>,
                                        propertyKey: prop.propertyName,
                                        label: prop.label,
                                        ignoreNullable: true,
                                        defaultValue: undefined,
                                    } as const;

                                    switch (prop.type) {
                                        case InspectableType.Checkbox:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={SwitchPropertyLine} />;
                                        case InspectableType.Slider:
                                            return (
                                                <BoundProperty
                                                    key={prop.propertyName}
                                                    {...commonProps}
                                                    min={prop.min}
                                                    max={prop.max}
                                                    step={prop.step}
                                                    component={SyncedSliderPropertyLine}
                                                />
                                            );
                                        case InspectableType.Vector3:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={Vector3PropertyLine} />;
                                        case InspectableType.Quaternion:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={QuaternionPropertyLine} />;
                                        case InspectableType.Color3:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={Color3PropertyLine} />;
                                        case InspectableType.String:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={TextInputPropertyLine} />;
                                        case InspectableType.Button:
                                            return <ButtonLine key={prop.propertyName} label={prop.label} onClick={() => prop.callback?.()} />;
                                        case InspectableType.Options:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={DropdownPropertyLine} options={prop.options ?? []} />;
                                        case InspectableType.Tab:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={TextPropertyLine} />;
                                        case InspectableType.FileButton:
                                            return (
                                                <FileUploadLine
                                                    key={prop.propertyName}
                                                    label={prop.label}
                                                    accept={prop.accept ?? ""}
                                                    onClick={(files) => {
                                                        if (files.length > 0 && prop.fileCallback) {
                                                            prop.fileCallback(files[0]);
                                                        }
                                                    }}
                                                />
                                            );
                                        case InspectableType.Vector2:
                                            return <BoundProperty key={prop.propertyName} {...commonProps} component={Vector2PropertyLine} />;
                                    }
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
