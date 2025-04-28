import { Color4 } from "core/Maths/math.color";
import type { ColorGradient, FactorGradient } from "core/Misc/gradients";
import { GradientHelper } from "core/Misc/gradients";
import type { Particle } from "./particle";
import type { ThinParticleSystem } from "./thinParticleSystem";
import { Clamp, Lerp, RandomRange } from "core/Maths/math.scalar.functions";
import { TmpVectors, Vector3 } from "core/Maths/math.vector";

/** Color */

/** @internal */
export function _ProcessColorGradients(particle: Particle, system: ThinParticleSystem) {
    const colorGradients = system._colorGradients;
    GradientHelper.GetCurrentGradient(system._ratio, colorGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentColorGradient) {
            particle._currentColor1.copyFrom(particle._currentColor2);
            (<ColorGradient>nextGradient).getColorToRef(particle._currentColor2);
            particle._currentColorGradient = <ColorGradient>currentGradient;
        }
        Color4.LerpToRef(particle._currentColor1, particle._currentColor2, scale, particle.color);
    });
}

/** @internal */
export function _ProcessColor(particle: Particle, system: ThinParticleSystem) {
    particle.colorStep.scaleToRef(system._scaledUpdateSpeed, system._scaledColorStep);
    particle.color.addInPlace(system._scaledColorStep);

    if (particle.color.a < 0) {
        particle.color.a = 0;
    }
}

/** Angular speed */

/** @internal */
export function _ProcessAngularSpeedGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._angularSpeedGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentAngularSpeedGradient) {
            particle._currentAngularSpeed1 = particle._currentAngularSpeed2;
            particle._currentAngularSpeed2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentAngularSpeedGradient = <FactorGradient>currentGradient;
        }
        particle.angularSpeed = Lerp(particle._currentAngularSpeed1, particle._currentAngularSpeed2, scale);
    });
}

/** @internal */
export function _ProcessAngularSpeed(particle: Particle, system: ThinParticleSystem) {
    particle.angle += particle.angularSpeed * system._scaledUpdateSpeed;
}

/** Velocity & direction */

/** @internal */
export function _ProcessVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._velocityGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentVelocityGradient) {
            particle._currentVelocity1 = particle._currentVelocity2;
            particle._currentVelocity2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentVelocityGradient = <FactorGradient>currentGradient;
        }
        system._directionScale *= Lerp(particle._currentVelocity1, particle._currentVelocity2, scale);
    });
}

/** @internal */
export function _ProcessLimitVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._limitVelocityGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentLimitVelocityGradient) {
            particle._currentLimitVelocity1 = particle._currentLimitVelocity2;
            particle._currentLimitVelocity2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentLimitVelocityGradient = <FactorGradient>currentGradient;
        }

        const limitVelocity = Lerp(particle._currentLimitVelocity1, particle._currentLimitVelocity2, scale);
        const currentVelocity = particle.direction.length();

        if (currentVelocity > limitVelocity) {
            particle.direction.scaleInPlace(system.limitVelocityDamping);
        }
    });
}

/** @internal */
export function _ProcessDirection(particle: Particle, system: ThinParticleSystem) {
    particle.direction.scaleToRef(system._directionScale, system._scaledDirection);
}

/** Position */

/** @internal */
export function _CreatePositionData(particle: Particle, system: ThinParticleSystem) {
    system.particleEmitterType.startPositionFunction(system._emitterWorldMatrix, particle.position, particle, system.isLocal);
}

export function _CreateCustomPositionData(particle: Particle, system: ThinParticleSystem) {
    system.startPositionFunction!(system._emitterWorldMatrix, particle.position, particle, system.isLocal);
}

/** @internal */
export function _ProcessPosition(particle: Particle, system: ThinParticleSystem) {
    if (system.isLocal && particle._localPosition) {
        particle._localPosition!.addInPlace(system._scaledDirection);
        Vector3.TransformCoordinatesToRef(particle._localPosition!, system._emitterWorldMatrix, particle.position);
    } else {
        particle.position.addInPlace(system._scaledDirection);
    }
}

/** Drag */

/** @internal */
export function _ProcessDragGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._dragGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentDragGradient) {
            particle._currentDrag1 = particle._currentDrag2;
            particle._currentDrag2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentDragGradient = <FactorGradient>currentGradient;
        }

        const drag = Lerp(particle._currentDrag1, particle._currentDrag2, scale);

        system._scaledDirection.scaleInPlace(1.0 - drag);
    });
}

/** Noise */

/** @internal */
export function _ProcessNoise(particle: Particle, system: ThinParticleSystem) {
    const noiseTextureData = system._noiseTextureData;
    const noiseTextureSize = system._noiseTextureSize;

    if (noiseTextureData && noiseTextureSize && particle._randomNoiseCoordinates1) {
        const fetchedColorR = system._fetchR(
            particle._randomNoiseCoordinates1.x,
            particle._randomNoiseCoordinates1.y,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );
        const fetchedColorG = system._fetchR(
            particle._randomNoiseCoordinates1.z,
            particle._randomNoiseCoordinates2.x,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );
        const fetchedColorB = system._fetchR(
            particle._randomNoiseCoordinates2.y,
            particle._randomNoiseCoordinates2.z,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );

        const force = TmpVectors.Vector3[0];
        const scaledForce = TmpVectors.Vector3[1];

        force.copyFromFloats((2 * fetchedColorR - 1) * system.noiseStrength.x, (2 * fetchedColorG - 1) * system.noiseStrength.y, (2 * fetchedColorB - 1) * system.noiseStrength.z);

        force.scaleToRef(system._tempScaledUpdateSpeed, scaledForce);
        particle.direction.addInPlace(scaledForce);
    }
}

/** Gravity */

/** @internal */
export function _ProcessGravity(particle: Particle, system: ThinParticleSystem) {
    system.gravity.scaleToRef(system._tempScaledUpdateSpeed, system._scaledGravity);
    particle.direction.addInPlace(system._scaledGravity);
}

/** Size */

/** @internal */
export function _ProcessSizeGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._sizeGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentSizeGradient) {
            particle._currentSize1 = particle._currentSize2;
            particle._currentSize2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentSizeGradient = <FactorGradient>currentGradient;
        }
        particle.size = Lerp(particle._currentSize1, particle._currentSize2, scale);
    });
}

/** Remap */

/** @internal */
export function _ProcessRemapGradients(particle: Particle, system: ThinParticleSystem) {
    if (system._colorRemapGradients && system._colorRemapGradients.length > 0) {
        GradientHelper.GetCurrentGradient(system._ratio, system._colorRemapGradients, (currentGradient, nextGradient, scale) => {
            const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
            const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

            particle.remapData.x = min;
            particle.remapData.y = max - min;
        });
    }

    if (system._alphaRemapGradients && system._alphaRemapGradients.length > 0) {
        GradientHelper.GetCurrentGradient(system._ratio, system._alphaRemapGradients, (currentGradient, nextGradient, scale) => {
            const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
            const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

            particle.remapData.z = min;
            particle.remapData.w = max - min;
        });
    }
}

/** Life */

/** @internal */
export function _CreateLifeGradientsData(particle: Particle, system: ThinParticleSystem) {
    const ratio = Clamp(system._actualFrame / system.targetStopDuration);
    GradientHelper.GetCurrentGradient(ratio, system._lifeTimeGradients!, (currentGradient, nextGradient) => {
        const factorGradient1 = <FactorGradient>currentGradient;
        const factorGradient2 = <FactorGradient>nextGradient;
        const lifeTime1 = factorGradient1.getFactor();
        const lifeTime2 = factorGradient2.getFactor();
        const gradient = (ratio - factorGradient1.gradient) / (factorGradient2.gradient - factorGradient1.gradient);
        particle.lifeTime = Lerp(lifeTime1, lifeTime2, gradient);
    });
}

/** @internal */
export function _CreateLifetimeData(particle: Particle, system: ThinParticleSystem) {
    particle.lifeTime = RandomRange(system.minLifeTime, system.maxLifeTime);
}
