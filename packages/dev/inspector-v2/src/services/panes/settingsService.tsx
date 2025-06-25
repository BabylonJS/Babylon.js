import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { SettingsRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";
import { SettingsContextIdentity, type ISettingsContext } from "../settingsContext";
import { Observable } from "core/Misc/observable";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { DataStorage } from "core/Misc/dataStorage";
import { Pane } from "../../components/pane";

export const SettingsServiceDefinition: ServiceDefinition<[ISettingsContext], [IShellService]> = {
    friendlyName: "Settings",
    consumes: [ShellServiceIdentity],
    produces: [SettingsContextIdentity],
    factory: (shellService) => {
        let useDegrees = DataStorage.ReadBoolean("settings_useDegrees", false);
        let ignoreBackfacesForPicking = DataStorage.ReadBoolean("settings_ignoreBackfacesForPicking", false);
        const settings = {
            get useDegrees() {
                return useDegrees;
            },
            set useDegrees(value: boolean) {
                if (useDegrees === value) {
                    return; // No change, no need to notify
                }
                useDegrees = value;

                DataStorage.WriteBoolean("settings_useDegrees", useDegrees);

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

                DataStorage.WriteBoolean("settings_ignoreBackfacesForPicking", ignoreBackfacesForPicking);
                this.settingsChangedObservable.notifyObservers(this);
            },
            settingsChangedObservable: new Observable<ISettingsContext>(),
            dispose: () => {},
        };

        const registration = shellService.addSidePane({
            key: "Settings",
            title: "Settings",
            icon: SettingsRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                return (
                    <Pane>
                        <SwitchPropertyLine
                            label="Use Degrees"
                            description="Using degrees instead of radians."
                            value={settings.useDegrees}
                            onChange={(checked) => {
                                settings.useDegrees = checked;
                            }}
                        />
                        <SwitchPropertyLine
                            label="Ignore backfaces for picking"
                            description="Ignore backfaces when picking."
                            value={settings.ignoreBackfacesForPicking}
                            onChange={(checked) => {
                                settings.ignoreBackfacesForPicking = checked;
                            }}
                        />
                    </Pane>
                );
            },
        });

        settings.dispose = () => registration.dispose();

        return settings;
    },
};
