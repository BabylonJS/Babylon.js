import { PropertyLine } from "./propertyLine";
import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { NumberInputPropertyLineProps } from "./inputPropertyLine";
import { TextInput } from "../../primitives/textInput";

// The below conversion functions are taken from old HexLineComponent and can likely be simplified
const ConvertToHexString = (valueString: string): string => {
    while (valueString.length < 10) {
        valueString += "0";
    }
    return valueString;
};

const MaskValidatorFn = (valueString: string) => {
    if (valueString.substring(0, 2) != "0x") {
        if (valueString.substring(0, 1) != "0") {
            valueString = "0x" + valueString;
        } else {
            valueString = "0x" + valueString.substr(1);
        }
    }

    const valueSubstr = valueString.substr(2);
    if (valueSubstr != "" && /^[0-9A-Fa-f]+$/g.test(valueSubstr) == false) {
        return false;
    }

    if (valueString.length > 10) {
        return false;
    }

    return true;
};

const GetHexValFromNumber = (val: number): string => {
    let valueAsHex = val.toString(16);
    let hex0String = "";
    for (let i = 0; i < 8 - valueAsHex.length; i++) {
        // padding the '0's
        hex0String += "0";
    }
    valueAsHex = "0x" + hex0String + valueAsHex.toUpperCase();
    return valueAsHex;
};

/**
 * Takes a number representing a Hex value and converts it to a hex string then wraps the TextInput in a PropertyLine
 * @param props - PropertyLineProps
 * @returns property-line wrapped textbox that converts to/from hex number representation
 */
export const HexPropertyLine: FunctionComponent<NumberInputPropertyLineProps> = (props) => {
    HexPropertyLine.displayName = "HexPropertyLine";
    const [hexVal, setHexVal] = useState(GetHexValFromNumber(props.value));

    const onStrValChange = (val: string) => {
        setHexVal(val);
        const valueStringAsHex = ConvertToHexString(val);
        props.onChange(parseInt(valueStringAsHex));
    };

    useEffect(() => {
        setHexVal(GetHexValFromNumber(props.value));
    }, [props.value]);

    return (
        <PropertyLine {...props}>
            <TextInput {...props} validator={MaskValidatorFn} value={hexVal} onChange={onStrValChange} />
        </PropertyLine>
    );
};
