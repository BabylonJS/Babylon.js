import type { FunctionComponent } from "react";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

export const CommonGeneralProperties: FunctionComponent<{ context: CommonEntity }> = ({ context: commonEntity }) => {
    return (
        <>
            {commonEntity.id !== undefined && (
                <PropertyLine key="EntityId" label="ID" description="The id of the node.">
                    {commonEntity.id}
                </PropertyLine>
            )}
            {commonEntity.name !== undefined && (
                <PropertyLine key="EntityName" label="Name" description="The name of the node.">
                    {commonEntity.name}
                </PropertyLine>
            )}
            {commonEntity.uniqueId !== undefined && (
                <PropertyLine key="EntityUniqueId" label="Unique ID" description="The unique id of the node.">
                    {commonEntity.uniqueId}
                </PropertyLine>
            )}
            {commonEntity.getClassName !== undefined && (
                <PropertyLine key="EntityClassName" label="Class" description="The class of the node.">
                    {commonEntity.getClassName()}
                </PropertyLine>
            )}
        </>
    );
};
