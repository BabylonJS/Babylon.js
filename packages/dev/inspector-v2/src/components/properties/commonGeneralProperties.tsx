import type { FunctionComponent } from "react";

import type { IDisposable } from "core/index";

import { useMemo } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";
import { GetPropertyDescriptor, IsPropertyReadonly } from "../../instrumentation/propertyInstrumentation";
import { BoundProperty } from "./boundProperty";
import { DeleteRegular } from "@fluentui/react-icons";

function IsEntityWithProperty<ObjectT, PropertyT extends keyof ObjectT>(entity: ObjectT, property: PropertyT): entity is ObjectT & Required<Pick<ObjectT, PropertyT>> {
    return !!entity && typeof entity === "object" && property in entity && entity[property] !== undefined;
}

type CommonEntity = {
    readonly id?: number;
    readonly uniqueId?: number;
    name?: string;
    getClassName?: () => string;
};

export function IsCommonEntity(entity: unknown): entity is CommonEntity {
    return (
        IsEntityWithProperty(entity as CommonEntity, "id") ||
        IsEntityWithProperty(entity as CommonEntity, "uniqueId") ||
        IsEntityWithProperty(entity as CommonEntity, "name") ||
        IsEntityWithProperty(entity as CommonEntity, "getClassName")
    );
}

export const CommonGeneralProperties: FunctionComponent<{ commonEntity: CommonEntity }> = (props) => {
    const { commonEntity } = props;

    const name = useProperty(commonEntity, "name");
    const namePropertyDescriptor = useMemo(() => GetPropertyDescriptor(commonEntity, "name")?.[1], [commonEntity]);
    const isNameReadonly = !namePropertyDescriptor || IsPropertyReadonly(namePropertyDescriptor);

    const className = commonEntity.getClassName?.();

    return (
        <>
            {IsEntityWithProperty(commonEntity, "id") && <StringifiedPropertyLine key="EntityId" label="ID" description="The id of the node." value={commonEntity.id} />}
            {IsEntityWithProperty(commonEntity, "name") &&
                (isNameReadonly ? (
                    <TextPropertyLine key="EntityName" label="Name" description="The name of the node." value={name ?? ""} />
                ) : (
                    <BoundProperty key="EntityName" component={TextInputPropertyLine} label="Name" description="The name of the node." target={commonEntity} propertyKey="name" />
                ))}
            {IsEntityWithProperty(commonEntity, "uniqueId") && (
                <StringifiedPropertyLine key="EntityUniqueId" label="Unique ID" description="The unique id of the node." value={commonEntity.uniqueId} />
            )}
            {className !== undefined && <TextPropertyLine key="EntityClassName" label="Class" description="The class of the node." value={className} />}
        </>
    );
};

export const DisposableGeneralProperties: FunctionComponent<{ disposableEntity: IDisposable }> = (props) => {
    const { disposableEntity } = props;

    return (
        <>
            <ButtonLine label="Dispose" icon={DeleteRegular} onClick={() => disposableEntity.dispose()} />
        </>
    );
};
