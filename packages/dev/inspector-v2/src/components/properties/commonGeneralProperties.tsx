import type { FunctionComponent } from "react";

import type { IDisposable } from "core/index";

import { useMemo } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";
import { GetPropertyDescriptor, IsPropertyReadonly } from "../../instrumentation/propertyInstrumentation";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

type CommonEntity = {
    readonly id?: number;
    readonly uniqueId?: number;
    name?: string;
    getClassName?: () => string;
};

export const CommonGeneralProperties: FunctionComponent<{ commonEntity: CommonEntity }> = (props) => {
    const { commonEntity } = props;

    const name = useProperty(commonEntity, "name");
    const namePropertyDescriptor = useMemo(() => GetPropertyDescriptor(commonEntity, "name")?.[1], [commonEntity]);
    const isNameReadonly = !namePropertyDescriptor || IsPropertyReadonly(namePropertyDescriptor);

    const className = commonEntity.getClassName?.();

    return (
        <>
            {commonEntity.id !== undefined && <StringifiedPropertyLine key="EntityId" label="ID" description="The id of the node." value={commonEntity.id} />}
            {name !== undefined &&
                (isNameReadonly ? (
                    <TextPropertyLine key="EntityName" label="Name" description="The name of the node." value={name} />
                ) : (
                    <TextInputPropertyLine key="EntityName" label="Name" description="The name of the node." value={name} onChange={(newName) => (commonEntity.name = newName)} />
                ))}
            {commonEntity.uniqueId !== undefined && (
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
            <ButtonLine label="Dispose" onClick={() => disposableEntity.dispose()} />
        </>
    );
};
