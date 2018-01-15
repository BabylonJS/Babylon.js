module BABYLON {
    export class SubParticleSystem extends ParticleSystem {
        constructor(name: string, capacity: number, scene: Scene, private _generation: number, private _parentParticleSystem: ParticleSystem, customEffect: Nullable<Effect> = null, _isAnimationSheetEnabled: boolean = false, epsilon: number = 0.01) {
            super(name, capacity, scene, customEffect, _isAnimationSheetEnabled, epsilon);
        }

        public stoppedEmitting(): void {
            var generationString = this._generation.toString();
            if (this._parentParticleSystem.stockSubSystems.contains(generationString)) {
                (this._parentParticleSystem.stockSubSystems.get(generationString) as (Array<SubParticleSystem>)).push(this);
            }
            else {
                var subSysArray = new Array<SubParticleSystem>();
                subSysArray.push(this);
                this._parentParticleSystem.stockSubSystems.add(generationString, subSysArray);
            }
        }

        public emitFromParticle(particle: Particle): void {
            ParticleSystem.emitFromGeneration(this._parentParticleSystem, particle, this._generation + 1);
        }

        public recycleParticle(particle: Particle): void {
            ParticleSystem.recycleParticle(this._parentParticleSystem, this, particle);
        }

        public createParticle(): Particle {
            return ParticleSystem.createParticle(this._parentParticleSystem, this);
        }
    }
}