// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";
import type { Service, ServiceDefinition } from "../../modularity/serviceDefinition";
import { useMemo, type ComponentType } from "react";

import { DocumentTextRegular } from "@fluentui/react-icons";
import { Observable } from "core/Misc/observable";
import { ShellService } from "../shellService";
import { ObservableCollection } from "../../misc/observableCollection";
import { useObservableCollection, useObservableState } from "../../hooks/observableHooks";
import { makeStyles } from "@fluentui/react-components";

export const PropertiesService = Symbol("PropertiesService");
export interface PropertiesService extends Service<typeof PropertiesService> {
    addEntityType<T>(predicate: (entity: unknown) => entity is T, component: ComponentType<{ entity: T }>): IDisposable;
    boundEntity: Nullable<unknown>;
}

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
});

export const PropertiesServiceDefinition: ServiceDefinition<[PropertiesService], [ShellService]> = {
    friendlyName: "Properties Editor",
    tags: ["diagnostics"],
    produces: [PropertiesService],
    consumes: [ShellService],
    factory: (shellService) => {
        const entityTypesCollection = new ObservableCollection<{ predicate: (entity: unknown) => boolean; component: ComponentType<{ entity: unknown }> }>();
        let boundEntityState: Nullable<unknown> = null;
        const boundEntityObservable = new Observable<Nullable<unknown>>();

        const registration = shellService.addToRightPane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            suppressTeachingMoment: true,
            content: () => {
                const classes = useStyles();

                const entityTypes = useObservableCollection(entityTypesCollection);
                const boundEntity = useObservableState(() => boundEntityState, boundEntityObservable);

                // eslint-disable-next-line @typescript-eslint/naming-convention
                const EntityComponent = useMemo(() => entityTypes.find((type) => type.predicate(boundEntity))?.component, [entityTypes, boundEntity]);

                return (
                    <div className={classes.rootDiv}>
                        {EntityComponent ? (
                            <EntityComponent entity={boundEntity} />
                        ) : boundEntity ? (
                            `No component found for this entity type (${boundEntity.toString()})`
                        ) : (
                            "No entity selected"
                        )}
                    </div>
                );
            },
        });

        return {
            addEntityType: (predicate, component) => entityTypesCollection.add({ predicate, component: component as ComponentType<{ entity: unknown }> }),
            get boundEntity() {
                return boundEntityState;
            },
            set boundEntity(entity) {
                if (boundEntityState !== entity) {
                    boundEntityState = entity;
                    boundEntityObservable.notifyObservers(entity);
                }
            },
            dispose: () => registration.dispose(),
        } satisfies PropertiesService & IDisposable;
    },
};
