// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";

import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IShellService } from "../../shellService";

import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, makeStyles, Subtitle1, tokens } from "@fluentui/react-components";
import { DocumentTextRegular } from "@fluentui/react-icons";
import { useMemo, useState, type ComponentType } from "react";

import { Observable } from "core/Misc/observable";
import { useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { ShellServiceIdentity } from "../../shellService";

export type PropertiesServiceSection = {
    identity: symbol;
    order: number;
    predicate: (entity: unknown) => boolean;
    collapseByDefault?: boolean;
};

export type PropertiesServicePropertiesProvider<EntityT> = {
    order: number;
    predicate: (entity: unknown, section: symbol) => entity is EntityT;
    component: ComponentType<{ entity: EntityT }>;
};

export const PropertiesServiceIdentity = Symbol("PropertiesService");
export interface IPropertiesService extends IService<typeof PropertiesServiceIdentity> {
    addSection: (section: PropertiesServiceSection) => IDisposable;
    addPropertiesProvider: <EntityT>(provider: PropertiesServicePropertiesProvider<EntityT>) => IDisposable;
    boundEntity: Nullable<unknown>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
    accordion: {
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM,
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
        overflow: "hidden",
    },
});

export const PropertiesServiceDefinition: ServiceDefinition<[IPropertiesService], [IShellService]> = {
    friendlyName: "Properties Editor",
    produces: [PropertiesServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const sectionsCollection = new ObservableCollection<PropertiesServiceSection>();
        const propertiesProvidersCollection = new ObservableCollection<PropertiesServicePropertiesProvider<unknown>>();

        let boundEntityState: Nullable<unknown> = null;
        const boundEntityObservable = new Observable<Nullable<unknown>>();

        const registration = shellService.addToRightPane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            suppressTeachingMoment: true,
            content: () => {
                const classes = useStyles();

                const sections = useOrderedObservableCollection(sectionsCollection);
                const propertiesProviders = useOrderedObservableCollection(propertiesProvidersCollection);
                const boundEntity = useObservableState(() => boundEntityState, boundEntityObservable);
                const [version, setVersion] = useState(0);

                const visibleSections = useMemo(() => {
                    // When any of this state changes, we should re-render the Accordion so the defaultOpenItems are re-evaluated.
                    setVersion((prev) => prev + 1);

                    if (!boundEntity) {
                        return [];
                    }

                    const applicableSections = sections.filter((section) => section.predicate(boundEntity));
                    return applicableSections.map((section) => {
                        const propertiesProvidersForSection = propertiesProviders.filter((provider) => provider.predicate(boundEntity, section.identity));
                        return {
                            identity: section.identity,
                            collapseByDefault: section.collapseByDefault ?? false,
                            components: propertiesProvidersForSection.map((provider) => provider.component),
                        };
                    });
                }, [sections, propertiesProviders, boundEntity]);

                return (
                    <div className={classes.rootDiv}>
                        {visibleSections.length > 0 ? (
                            <Accordion
                                key={version}
                                className={classes.accordion}
                                collapsible
                                multiple
                                defaultOpenItems={visibleSections.filter((section) => !section.collapseByDefault).map((section) => section.identity.description)}
                            >
                                {visibleSections.map((section) => {
                                    return (
                                        <AccordionItem key={section.identity.description} value={section.identity.description}>
                                            <AccordionHeader expandIconPosition="end">
                                                <Subtitle1>{section.identity.description}</Subtitle1>
                                            </AccordionHeader>
                                            <AccordionPanel>
                                                <div className={classes.panelDiv}>
                                                    {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                                                    {section.components.map((Component) => {
                                                        return <Component entity={boundEntity} />;
                                                    })}
                                                </div>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        ) : boundEntity ? (
                            `Can't show properties for this entity type (${boundEntity.toString()})`
                        ) : (
                            "No entity selected"
                        )}
                    </div>
                );
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addPropertiesProvider: (provider) => propertiesProvidersCollection.add(provider as PropertiesServicePropertiesProvider<unknown>),
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
        } satisfies IPropertiesService & IDisposable;
    },
};
