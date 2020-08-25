import * as React from 'react';
import { SketchPicker } from 'react-color';
import { Color4 } from 'babylonjs';

export function ColorPicker() {
    const [color, setColor] = React.useState(new Color4());
    return <SketchPicker color={color.toHexString(false)}  onChange={color => setColor(new Color4(color.rgb.r / 255,color.rgb.g / 255,color.rgb.b / 255,color.rgb.a))}/>;
}