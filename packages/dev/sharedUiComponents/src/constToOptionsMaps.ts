import { ParticleSystem } from "core/Particles";

export const blendModeOptions = [
    { label: "Combine (Standard)", value: ParticleSystem.BLENDMODE_STANDARD },
    { label: "One one", value: ParticleSystem.BLENDMODE_ONEONE },
    { label: "Add", value: ParticleSystem.BLENDMODE_ADD },
    { label: "Subtract", value: ParticleSystem.BLENDMODE_SUBTRACT },
    { label: "Multiply", value: ParticleSystem.BLENDMODE_MULTIPLY },
    { label: "Maximized", value: ParticleSystem.BLENDMODE_MAXIMIZED },
    { label: "Pre-multiplied", value: ParticleSystem.BLENDMODE_PREMULTIPLIED },
    { label: "Pre-multiplied Porter Duff", value: ParticleSystem.BLENDMODE_PREMULTIPLIED_PORTERDUFF },
    { label: "Screen mode", value: ParticleSystem.BLENDMODE_SCREENMODE },
    { label: "OneOne OneOne", value: ParticleSystem.BLENDMODE_ONEONE_ONEONE },
    { label: "Alpha to color", value: ParticleSystem.BLENDMODE_ALPHATOCOLOR },
    { label: "Reverse one minus", value: ParticleSystem.BLENDMODE_REVERSEONEMINUS },
    { label: "Source+Dest * (1 - SourceAlpha)", value: ParticleSystem.BLENDMODE_SRC_DSTONEMINUSSRCALPHA },
    { label: "OneOne OneZero", value: ParticleSystem.BLENDMODE_ONEONE_ONEZERO },
    { label: "Exclusion", value: ParticleSystem.BLENDMODE_EXCLUSION },
    { label: "Layer accumulate", value: ParticleSystem.BLENDMODE_LAYER_ACCUMULATE },
];
