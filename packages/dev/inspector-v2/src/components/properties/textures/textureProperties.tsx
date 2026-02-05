import type { Texture } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import type { FunctionComponent } from "react";

import { Constants } from "core/Engines/constants";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { NumberInputPropertyLine, TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const TexturePreviewProperties: FunctionComponent<{ texture: Texture }> = (props) => {
    const { texture } = props;

    const rawUrl = useProperty(texture, "url");
    const displayUrl = !rawUrl || rawUrl.substring(0, 4) === "data" || rawUrl.substring(0, 4) === "blob" ? "" : rawUrl;

    return (
        <>
            <TextInputPropertyLine
                label="URL"
                value={displayUrl}
                onChange={(value) => {
                    texture.updateURL(value);
                }}
            />
        </>
    );
};

export const TextureGeneralProperties: FunctionComponent<{ texture: Texture }> = (props) => {
    const { texture } = props;

    return (
        <>
            <BooleanBadgePropertyLine label="Invert Y" description="If true, the texture is stored as inverted on Y" value={texture.invertY} />
        </>
    );
};

export const TextureTransformProperties: FunctionComponent<{ texture: Texture; settings: ISettingsContext }> = (props) => {
    const { texture, settings } = props;

    const [toDisplayAngle, fromDisplayAngle] = useAngleConverters(settings);
    const wrapU = useProperty(texture, "wrapU");
    const wrapV = useProperty(texture, "wrapV");

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="U offset" target={texture} propertyKey="uOffset" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="V offset" target={texture} propertyKey="vOffset" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="U scale" target={texture} propertyKey="uScale" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="V scale" target={texture} propertyKey="vScale" step={0.01} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="U angle"
                target={texture}
                propertyKey="uAng"
                min={0}
                max={toDisplayAngle(Math.PI * 2)}
                step={0.01}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="V angle"
                target={texture}
                propertyKey="vAng"
                min={0}
                max={toDisplayAngle(Math.PI * 2)}
                step={0.01}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="W angle"
                target={texture}
                propertyKey="wAng"
                min={0}
                max={toDisplayAngle(Math.PI * 2)}
                step={0.01}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            <SwitchPropertyLine
                label="Clamp U"
                value={wrapU === Constants.TEXTURE_CLAMP_ADDRESSMODE}
                onChange={(value) => (texture.wrapU = value ? Constants.TEXTURE_CLAMP_ADDRESSMODE : Constants.TEXTURE_WRAP_ADDRESSMODE)}
            />
            <SwitchPropertyLine
                label="Clamp V"
                value={wrapV === Constants.TEXTURE_CLAMP_ADDRESSMODE}
                onChange={(value) => (texture.wrapV = value ? Constants.TEXTURE_CLAMP_ADDRESSMODE : Constants.TEXTURE_WRAP_ADDRESSMODE)}
            />
        </>
    );
};
