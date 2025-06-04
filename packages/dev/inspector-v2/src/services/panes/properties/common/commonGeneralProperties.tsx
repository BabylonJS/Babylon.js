import type { FunctionComponent } from "react";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

export const CommonGeneralProperties: FunctionComponent<{ entity: CommonEntity }> = ({ entity: commonEntity }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            {commonEntity.id !== undefined && <div key="EntityId">ID: {commonEntity.id}</div>}
            {commonEntity.name !== undefined && <div key="EntityName">Name: {commonEntity.name}</div>}
            {commonEntity.uniqueId !== undefined && <div key="EntityUniqueId">Unique ID: {commonEntity.uniqueId}</div>}
            {commonEntity.getClassName !== undefined && <div key="EntityClassName">Class: {commonEntity.getClassName()}</div>}
        </>
    );
};
