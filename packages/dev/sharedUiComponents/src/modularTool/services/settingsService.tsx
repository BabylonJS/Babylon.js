import { type IDisposable } from "core/index";
import { type DynamicAccordionSection, type DynamicAccordionSectionContent, ExtensibleAccordion } from "../components/extensibleAccordion";
import { type IService, type ServiceDefinition } from "../modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "./shellService";

import { SettingsRegular } from "@fluentui/react-icons";

import { useObservableCollection, useOrderedObservableCollection } from "../hooks/observableHooks";
import { ObservableCollection } from "../misc/observableCollection";

/**
 * The unique identity symbol for the settings service.
 */
export const SettingsServiceIdentity = Symbol("SettingsService");

/**
 * Allows new sections or content to be added to the Settings pane.
 */
export interface ISettingsService extends IService<typeof SettingsServiceIdentity> {
    /**
     * Adds a new section to the settings pane.
     * @param section A description of the section to add.
     */
    addSection(section: DynamicAccordionSection): IDisposable;

    /**
     * Adds content to one or more sections in the settings pane.
     * @param content A description of the content to add.
     */
    addSectionContent(content: DynamicAccordionSectionContent<unknown>): IDisposable;
}

export const SettingsServiceDefinition: ServiceDefinition<[ISettingsService], [IShellService]> = {
    friendlyName: "Settings",
    consumes: [ShellServiceIdentity],
    produces: [SettingsServiceIdentity],
    factory: (shellService) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<DynamicAccordionSectionContent<unknown>>();

        const registration = shellService.addSidePane({
            key: "Settings",
            title: "Settings",
            icon: SettingsRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 500,
            teachingMoment: false,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);

                return <ExtensibleAccordion sections={sections} sectionContent={sectionContent} context={true} />;
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content),
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
