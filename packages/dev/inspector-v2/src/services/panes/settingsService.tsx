import type { IDisposable, Scene } from "core/index";
import type { DynamicAccordionSection, DynamicAccordionSectionContent } from "../../components/extensibleAccordion";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../sceneContext";
import type { ISettingsContext } from "../settingsContext";
import type { IShellService } from "../shellService";

import { SettingsRegular } from "@fluentui/react-icons";

import { DataStorage } from "core/Misc/dataStorage";
import { Observable } from "core/Misc/observable";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { ExtensibleAccordion } from "../../components/extensibleAccordion";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { useCompactMode, useSidePaneDockOverrides, useDisableCopy } from "../../hooks/settingsHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { SceneContextIdentity } from "../sceneContext";
import { SettingsContextIdentity } from "../settingsContext";
import { ShellServiceIdentity } from "../shellService";

export const SettingsServiceIdentity = Symbol("SettingsService");

/**
 * Allows new sections or content to be added to the Settings pane.
 */
export interface ISettingsService extends IService<typeof SettingsServiceIdentity> {
    /**
     * Adds a new section.
     * @param section A description of the section to add.
     */
    addSection(section: DynamicAccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent(content: DynamicAccordionSectionContent<Scene>): IDisposable;
}

export const SettingsServiceDefinition: ServiceDefinition<[ISettingsContext, ISettingsService], [IShellService, ISceneContext]> = {
    friendlyName: "Settings",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    produces: [SettingsContextIdentity, SettingsServiceIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<DynamicAccordionSectionContent<Scene>>();

        let useDegrees = DataStorage.ReadBoolean("Babylon/Settings/UseDegrees", false);
        let useEuler = DataStorage.ReadBoolean("Babylon/Settings/UseEuler", false);
        let ignoreBackfacesForPicking = DataStorage.ReadBoolean("Babylon/Settings/IgnoreBackfacesForPicking", false);
        let showPropertiesOnEntitySelection = DataStorage.ReadBoolean("Babylon/Settings/ShowPropertiesOnEntitySelection", true);

        const settings = {
            get useDegrees() {
                return useDegrees;
            },
            set useDegrees(value: boolean) {
                if (useDegrees === value) {
                    return; // No change, no need to notify
                }
                useDegrees = value;

                DataStorage.WriteBoolean("Babylon/Settings/UseDegrees", useDegrees);

                this.settingsChangedObservable.notifyObservers(this);
            },
            get ignoreBackfacesForPicking() {
                return ignoreBackfacesForPicking;
            },
            set ignoreBackfacesForPicking(value: boolean) {
                if (ignoreBackfacesForPicking === value) {
                    return; // No change, no need to notify
                }
                ignoreBackfacesForPicking = value;

                DataStorage.WriteBoolean("Babylon/Settings/IgnoreBackfacesForPicking", ignoreBackfacesForPicking);
                this.settingsChangedObservable.notifyObservers(this);
            },
            get useEuler() {
                return useEuler;
            },
            set useEuler(value: boolean) {
                if (useEuler === value) {
                    return; // No change, no need to notify
                }
                useEuler = value;

                DataStorage.WriteBoolean("Babylon/Settings/UseEuler", useEuler);
                this.settingsChangedObservable.notifyObservers(this);
            },
            get showPropertiesOnEntitySelection() {
                return showPropertiesOnEntitySelection;
            },
            set showPropertiesOnEntitySelection(value: boolean) {
                if (showPropertiesOnEntitySelection === value) {
                    return; // No change, no need to notify
                }
                showPropertiesOnEntitySelection = value;

                DataStorage.WriteBoolean("Babylon/Settings/ShowPropertiesOnEntitySelection", showPropertiesOnEntitySelection);
                this.settingsChangedObservable.notifyObservers(this);
            },
            settingsChangedObservable: new Observable<ISettingsContext>(),
            addSection: (section: DynamicAccordionSection) => sectionsCollection.add(section),
            addSectionContent: (content: DynamicAccordionSectionContent<Scene>) => sectionContentCollection.add(content),
            dispose: () => {},
        };

        const registration = shellService.addSidePane({
            key: "Settings",
            title: "Settings",
            icon: SettingsRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 500,
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                const [compactMode, setCompactMode] = useCompactMode();
                const [disableCopy, setDisableCopy] = useDisableCopy();
                const [, , resetSidePaneLayout] = useSidePaneDockOverrides();

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
                                        value={settings.useDegrees}
                                        onChange={(checked) => {
                                            settings.useDegrees = checked;
                                        }}
                                    />
                                    <SwitchPropertyLine
                                        label="Only Show Euler Angles"
                                        description="Only show Euler angles in rotation properties, rather than quaternions."
                                        value={settings.useEuler}
                                        onChange={(checked) => {
                                            settings.useEuler = checked;
                                        }}
                                    />
                                    <SwitchPropertyLine
                                        label="Ignore Backfaces for Picking"
                                        description="Ignore backfaces when picking."
                                        value={settings.ignoreBackfacesForPicking}
                                        onChange={(checked) => {
                                            settings.ignoreBackfacesForPicking = checked;
                                        }}
                                    />
                                    <SwitchPropertyLine
                                        label="Show Properties on Selection"
                                        description="Shows the Properties pane when an entity is selected."
                                        value={settings.showPropertiesOnEntitySelection}
                                        onChange={(checked) => {
                                            settings.showPropertiesOnEntitySelection = checked;
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
                                    <ButtonLine label="Reset Layout" onClick={resetSidePaneLayout} />
                                </AccordionSection>
                            </ExtensibleAccordion>
                        )}
                    </>
                );
            },
        });

        settings.dispose = () => registration.dispose();

        return settings;
    },
};
