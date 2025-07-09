import type { FunctionComponent } from "react";

import { useMemo } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";
import { GetPropertyDescriptor, IsPropertyReadonly } from "../../instrumentation/propertyInstrumentation";

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

    const className = commonEntity.constructor?.name || commonEntity.getClassName?.();

    return (
        <>
            {commonEntity.id !== undefined && <TextPropertyLine key="EntityId" label="ID" description="The id of the node." value={commonEntity.id.toString()} />}
            {name !== undefined &&
                (isNameReadonly ? (
                    <TextPropertyLine key="EntityName" label="Name" description="The name of the node." value={name} />
                ) : (
                    <TextInputPropertyLine key="EntityName" label="Name" description="The name of the node." value={name} onChange={(newName) => (commonEntity.name = newName)} />
                ))}
            {commonEntity.uniqueId !== undefined && (
                <TextPropertyLine key="EntityUniqueId" label="Unique ID" description="The unique id of the node." value={commonEntity.uniqueId.toString()} />
            )}
            {className !== undefined && <TextPropertyLine key="EntityClassName" label="Class" description="The class of the node." value={className} />}
        </>
    );
};
