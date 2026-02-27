import type { IDisposable, Scene } from "core/index";
import type { DynamicAccordionSection, DynamicAccordionSectionContent } from "../../components/extensibleAccordion";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../sceneContext";
import type { IShellService } from "../shellService";

import { SettingsRegular } from "@fluentui/react-icons";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { ExtensibleAccordion } from "../../components/extensibleAccordion";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { useSetting } from "../../hooks/settingsHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { CompactModeSettingDescriptor, DisableCopySettingDescriptor, UseDegreesSettingDescriptor, UseEulerSettingDescriptor } from "../globalSettings";
import { SceneContextIdentity } from "../sceneContext";
import { ShellServiceIdentity } from "../shellService";

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
    addSectionContent(content: DynamicAccordionSectionContent<Scene>): IDisposable;
}

export const SettingsServiceDefinition: ServiceDefinition<[ISettingsService], [IShellService, ISceneContext]> = {
    friendlyName: "Settings",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    produces: [SettingsServiceIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<DynamicAccordionSectionContent<Scene>>();

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
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                const [compactMode, setCompactMode] = useSetting(CompactModeSettingDescriptor);
                const [useDegrees, setUseDegrees] = useSetting(UseDegreesSettingDescriptor);
                const [useEuler, setUseEuler] = useSetting(UseEulerSettingDescriptor);
                const [disableCopy, setDisableCopy] = useSetting(DisableCopySettingDescriptor);

                return (
                    <>
                        {scene && (
                            <ExtensibleAccordion sections={sections} sectionContent={sectionContent} context={scene}>
                                <AccordionSection title="UI">
                                    <SwitchPropertyLine
                                        label="Compact Mode"
                                        description="Use a more compact UI with less spacing."
                                        value={compactMode}
                                        onChange={(checked) => {
                                            setCompactMode(checked);
                                        }}
                                    />
                                    <SwitchPropertyLine
                                        label="Use Degrees"
                                        description="Using degrees instead of radians."
                                        value={useDegrees}
                                        onChange={(checked) => {
                                            setUseDegrees(checked);
                                        }}
                                    />
                                    <SwitchPropertyLine
                                        label="Only Show Euler Angles"
                                        description="Only show Euler angles in rotation properties, rather than quaternions."
                                        value={useEuler}
                                        onChange={(checked) => {
                                            setUseEuler(checked);
                                        }}
                                    />
                                    <SwitchPropertyLine
                                        label="Disable Copy Button"
                                        description="Disables the copy to clipboard button on property lines. You can still Ctrl+Click on the label to copy."
                                        value={disableCopy}
                                        onChange={(checked) => {
                                            setDisableCopy(checked);
                                        }}
                                    />
                                </AccordionSection>
                            </ExtensibleAccordion>
                        )}
                    </>
                );
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
