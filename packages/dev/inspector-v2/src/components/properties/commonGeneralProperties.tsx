import type { FunctionComponent } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

export const CommonGeneralProperties: FunctionComponent<{ commonEntity: CommonEntity }> = (props) => {
    const { commonEntity } = props;

    return (
        <>
            {commonEntity.id !== undefined && <TextPropertyLine key="EntityId" label="ID" description="The id of the node." value={commonEntity.id.toString()} />}
            {commonEntity.name !== undefined && <TextPropertyLine key="EntityName" label="Name" description="The name of the node." value={commonEntity.name} />}
            {commonEntity.uniqueId !== undefined && (
                <TextPropertyLine key="EntityUniqueId" label="Unique ID" description="The unique id of the node." value={commonEntity.uniqueId.toString()} />
            )}
            {commonEntity.getClassName !== undefined && (
                <TextPropertyLine key="EntityClassName" label="Class" description="The class of the node." value={commonEntity.getClassName()} />
            )}
        </>
    );
};
