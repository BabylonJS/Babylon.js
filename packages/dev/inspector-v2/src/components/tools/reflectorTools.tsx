import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useState, useCallback, useRef } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { TextInputPropertyLine, NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Reflector } from "core/Misc/reflector";
import { PlugConnectedRegular } from "@fluentui/react-icons";

export const ReflectorTools: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [hostname, setHostname] = useState("localhost");
    const [port, setPort] = useState(1234);
    const reflectorRef = useRef<Reflector | null>(null);

    const connectReflector = useCallback(() => {
        if (reflectorRef.current) {
            reflectorRef.current.close();
        }

        reflectorRef.current = new Reflector(scene, hostname, port);
    }, [scene, hostname, port]);

    return (
        <>
            <TextInputPropertyLine label="Hostname" value={hostname} onChange={(value) => setHostname(value)} />
            <NumberInputPropertyLine label="Port" value={port} onChange={(value) => setPort(value)} forceInt />
            <ButtonLine label="Connect" icon={PlugConnectedRegular} onClick={connectReflector} />
        </>
    );
};
