module BABYLON {
    
    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT). 
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image; 
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    export class ColorCurves {
        
        private _dirty = true;
        
        private _tempColor = new Color4(0, 0, 0, 0);
        
        private _globalCurve = new Color4(0, 0, 0, 0);
        private _highlightsCurve = new Color4(0, 0, 0, 0);
        private _midtonesCurve = new Color4(0, 0, 0, 0);
        private _shadowsCurve = new Color4(0, 0, 0, 0);
        
        private _positiveCurve = new Color4(0, 0, 0, 0);
        private _negativeCurve = new Color4(0, 0, 0, 0);
        
        @serialize()
        private _globalHue = 30;
        
        @serialize()
        private _globalDensity = 0;
        
        @serialize()
        private _globalSaturation = 0;
        
        @serialize()
        private _globalExposure = 0;
        
        /**
         * Gets the global Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public get GlobalHue(): number {
            return this._globalHue;
        }
        /**
         * Sets the global Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public set GlobalHue(value: number) {
            this._globalHue = value;
            this._dirty = true;
        }
        /**
         * Gets the global Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public get GlobalDensity(): number {
            return this._globalDensity;
        }
        /**
         * Sets the global Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public set GlobalDensity(value: number) {
            this._globalDensity = value;
            this._dirty = true;
        }
        /**
         * Gets the global Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public get GlobalSaturation(): number {
            return this._globalSaturation;
        }
        /**
         * Sets the global Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public set GlobalSaturation(value: number) {
            this._globalSaturation = value;
            this._dirty = true;
        }
        
        @serialize()
        private _highlightsHue = 30;
        
        @serialize()
        private _highlightsDensity = 0;
        
        @serialize()
        private _highlightsSaturation = 0;
        
        @serialize()
        private _highlightsExposure = 0;
        
        /**
         * Gets the highlights Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public get HighlightsHue(): number {
            return this._highlightsHue;
        }
        /**
         * Sets the highlights Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public set HighlightsHue(value: number) {
            this._highlightsHue = value;
            this._dirty = true;
        }
        /**
         * Gets the highlights Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public get HighlightsDensity(): number {
            return this._highlightsDensity;
        }
        /**
         * Sets the highlights Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public set HighlightsDensity(value: number) {
            this._highlightsDensity = value;
            this._dirty = true;
        }
        /**
         * Gets the highlights Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public get HighlightsSaturation(): number {
            return this._highlightsSaturation;
        }
        /**
         * Sets the highlights Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public set HighlightsSaturation(value: number) {
            this._highlightsSaturation = value;
            this._dirty = true;
        }
        /**
         * Gets the highlights Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        public get HighlightsExposure(): number {
            return this._highlightsExposure;
        }
        /**
         * Sets the highlights Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        public set HighlightsExposure(value: number) {
            this._highlightsExposure = value;
            this._dirty = true;
        }
        
        @serialize()
        private _midtonesHue = 30;
        
        @serialize()
        private _midtonesDensity = 0;
        
        @serialize()
        private _midtonesSaturation = 0;
        
        @serialize()
        private _midtonesExposure = 0;
        
        /**
         * Gets the midtones Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public get MidtonesHue(): number {
            return this._midtonesHue;
        }
        /**
         * Sets the midtones Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public set MidtonesHue(value: number) {
            this._midtonesHue = value;
            this._dirty = true;
        }
        /**
         * Gets the midtones Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public get MidtonesDensity(): number {
            return this._midtonesDensity;
        }
        /**
         * Sets the midtones Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public set MidtonesDensity(value: number) {
            this._midtonesDensity = value;
            this._dirty = true;
        }
        /**
         * Gets the midtones Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public get MidtonesSaturation(): number {
            return this._midtonesSaturation;
        }
        /**
         * Sets the midtones Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public set MidtonesSaturation(value: number) {
            this._midtonesSaturation = value;
            this._dirty = true;
        }
        /**
         * Gets the midtones Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        public get MidtonesExposure(): number {
            return this._midtonesExposure;
        }
        /**
         * Sets the midtones Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        public set MidtonesExposure(value: number) {
            this._midtonesExposure = value;
            this._dirty = true;
        }
        
        private _shadowsHue = 30;
        private _shadowsDensity = 0;
        private _shadowsSaturation = 0;
        private _shadowsExposure = 0;
        
        /**
         * Gets the shadows Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public get ShadowsHue(): number {
            return this._shadowsHue;
        }
        /**
         * Sets the shadows Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        public set ShadowsHue(value: number) {
            this._shadowsHue = value;
            this._dirty = true;
        }
        /**
         * Gets the shadows Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public get ShadowsDensity(): number {
            return this._shadowsDensity;
        }
        /**
         * Sets the shadows Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect. 
         * Values less than zero provide a filter of opposite hue.
         */
        public set ShadowsDensity(value: number) {
            this._shadowsDensity = value;
            this._dirty = true;
        }
        /**
         * Gets the shadows Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public get ShadowsSaturation(): number {
            return this._shadowsSaturation;
        }
        /**
         * Sets the shadows Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        public set ShadowsSaturation(value: number) {
            this._shadowsSaturation = value;
            this._dirty = true;
        }
        /**
         * Gets the shadows Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        public get ShadowsExposure(): number {
            return this._shadowsExposure;
        }
        /**
         * Sets the shadows Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        public set ShadowsExposure(value: number) {
            this._shadowsExposure = value;
            this._dirty = true;
        }
        
        /**
         * Binds the color curves to the shader.
         * @param colorCurves The color curve to bind
         * @param effect The effect to bind to
         */
        public static Bind(colorCurves: ColorCurves, effect: Effect) : void {
            if (colorCurves._dirty) {
                colorCurves._dirty = false;
                            
                // Fill in global info.
                colorCurves.getColorGradingDataToRef(
                    colorCurves._globalHue,
                    colorCurves._globalDensity,
                    colorCurves._globalSaturation,
                    colorCurves._globalExposure,
                    colorCurves._globalCurve);

                // Compute highlights info.
                colorCurves.getColorGradingDataToRef(
                    colorCurves._highlightsHue,
                    colorCurves._highlightsDensity,
                    colorCurves._highlightsSaturation,
                    colorCurves._highlightsExposure,
                    colorCurves._tempColor);
                colorCurves._tempColor.multiplyToRef(colorCurves._globalCurve, colorCurves._highlightsCurve);

                // Compute midtones info.
                colorCurves.getColorGradingDataToRef(
                    colorCurves._midtonesHue,
                    colorCurves._midtonesDensity,
                    colorCurves._midtonesSaturation,
                    colorCurves._midtonesExposure,
                    colorCurves._tempColor);
                colorCurves._tempColor.multiplyToRef(colorCurves._globalCurve, colorCurves._midtonesCurve);
                
                // Compute shadows info.
                colorCurves.getColorGradingDataToRef(
                    colorCurves._shadowsHue,
                    colorCurves._shadowsDensity,
                    colorCurves._shadowsSaturation,
                    colorCurves._shadowsExposure,
                    colorCurves._tempColor);
                colorCurves._tempColor.multiplyToRef(colorCurves._globalCurve, colorCurves._shadowsCurve);
                
                // Compute deltas (neutral is midtones).
                colorCurves._highlightsCurve.subtractToRef(colorCurves._midtonesCurve, colorCurves._positiveCurve);
                colorCurves._midtonesCurve.subtractToRef(colorCurves._shadowsCurve, colorCurves._negativeCurve);            
            }
            
            effect.setFloat4("vCameraColorCurvePositive", 
                colorCurves._positiveCurve.r,
                colorCurves._positiveCurve.g,
                colorCurves._positiveCurve.b,
                colorCurves._positiveCurve.a);
            effect.setFloat4("vCameraColorCurveNeutral", 
                colorCurves._midtonesCurve.r,
                colorCurves._midtonesCurve.g,
                colorCurves._midtonesCurve.b,
                colorCurves._midtonesCurve.a);
            effect.setFloat4("vCameraColorCurveNegative", 
                colorCurves._negativeCurve.r,
                colorCurves._negativeCurve.g,
                colorCurves._negativeCurve.b,
                colorCurves._negativeCurve.a);
        }
        
        /**
         * Prepare the list of uniforms associated with the ColorCurves effects.
         * @param uniformsList The list of uniforms used in the effect
         */
        public static PrepareUniforms(uniformsList: string[]): void {
            uniformsList.push(
                "vCameraColorCurveNeutral", 
                "vCameraColorCurvePositive", 
                "vCameraColorCurveNegative"
            );
        }
        
        /**
         * Returns color grading data based on a hue, density, saturation and exposure value.
         * @param filterHue The hue of the color filter.
         * @param filterDensity The density of the color filter.
         * @param saturation The saturation.
         * @param exposure The exposure.
         * @param result The result data container.
         */
        private getColorGradingDataToRef(hue: number, density: number, saturation: number, exposure: number, result: Color4) : void {
            if (hue == null) {
                return;
            }

            hue = ColorCurves.clamp(hue, 0, 360);
            density = ColorCurves.clamp(density, -100, 100);
            saturation = ColorCurves.clamp(saturation, -100, 100);
            exposure = ColorCurves.clamp(exposure, -100, 100);
                
            // Remap the slider/config filter density with non-linear mapping and also scale by half
            // so that the maximum filter density is only 50% control. This provides fine control 
            // for small values and reasonable range.
            density = ColorCurves.applyColorGradingSliderNonlinear(density);
            density *= 0.5;

            exposure = ColorCurves.applyColorGradingSliderNonlinear(exposure);

            if (density < 0) {
                density *= -1;
                hue = (hue + 180) % 360;
            }
            
            ColorCurves.fromHSBToRef(hue, density, 50 + 0.25 * exposure, result);            
            result.scaleToRef(2, result);
            result.a = 1 + 0.01 * saturation;
        }
        
        /**
         * Takes an input slider value and returns an adjusted value that provides extra control near the centre.
         * @param value The input slider value in range [-100,100].
         * @returns Adjusted value.
         */
        private static applyColorGradingSliderNonlinear(value: number): number {
            value /= 100;

            var x: number = Math.abs(value);
            x = Math.pow(x, 2);

            if (value < 0) {
                x *= -1;
            }

            x *= 100;

            return x;
        }
        
        /**
         * Returns an RGBA Color4 based on Hue, Saturation and Brightness (also referred to as value, HSV).
         * @param hue The hue (H) input.
         * @param saturation The saturation (S) input.
         * @param brightness The brightness (B) input.
         * @result An RGBA color represented as Vector4.
         */
        private static fromHSBToRef(hue: number, saturation: number, brightness: number, result: Color4): void {
            var h: number = ColorCurves.clamp(hue, 0, 360);
            var s: number = ColorCurves.clamp(saturation / 100, 0, 1);
            var v: number = ColorCurves.clamp(brightness / 100, 0, 1);

            if (s === 0) {
                result.r = v;
                result.g = v;
                result.b = v;
            } else {
                // sector 0 to 5
                h /= 60;
                var i = Math.floor(h);

                // fractional part of h
                var f = h - i;
                var p = v * (1 - s);
                var q = v * (1 - s * f);
                var t = v * (1 - s * (1 - f));

                switch (i) {
                    case 0:
                        result.r = v;
                        result.g = t;
                        result.b = p;
                        break;
                    case 1:
                        result.r = q;
                        result.g = v;
                        result.b = p;
                        break;
                    case 2:
                        result.r = p;
                        result.g = v;
                        result.b = t;
                        break;
                    case 3:
                        result.r = p;
                        result.g = q;
                        result.b = v;
                        break;
                    case 4:
                        result.r = t;
                        result.g = p;
                        result.b = v;
                        break;
                    default:       // case 5:
                        result.r = v;
                        result.g = p;
                        result.b = q;
                        break;
                }
            }

            result.a = 1;
        }
        
        /**
         * Returns a value clamped between min and max
         * @param value The value to clamp
         * @param min The minimum of value
         * @param max The maximum of value
         * @returns The clamped value.
         */
        private static clamp(value, min, max): number {
            return Math.min(Math.max(value, min), max);
        }

        /**
         * Clones the current color curve instance.
         * @return The cloned curves
         */
        public clone(): ColorCurves {
            return SerializationHelper.Clone(() => new ColorCurves(), this);
        }

        /**
         * Serializes the current color curve instance to a json representation.
         * @return a JSON representation
         */
        public serialize(): any {
            return SerializationHelper.Serialize(this);
        }

        /**
         * Parses the color curve from a json representation.
         * @param source the JSON source to parse
         * @return The parsed curves
         */      
        public static Parse(source: any) : ColorCurves {
            return SerializationHelper.Parse(() => new ColorCurves(), source, null, null);
        }
    }
} 