precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 view;
uniform mat4 projection;
uniform mat4 worldViewProjection;

#include<bonesDeclaration>
#include<instancesDeclaration>

varying vec3 vColor;

uniform vec3 colorBase;
uniform vec3 colorZero;
uniform vec3 colorQuarter;
uniform vec3 colorHalf;
uniform vec3 colorFull;

uniform float targetBoneIndex;

void main() {
	vec3 positionUpdated = position;

	#include<instancesVertex>
	#include<bonesVertex>

	vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

	vec3 color = colorBase;
	float totalWeight = 0.;
	if(matricesIndices[0] == targetBoneIndex && matricesWeights[0] > 0.){
		totalWeight += matricesWeights[0];
	}
	if(matricesIndices[1] == targetBoneIndex && matricesWeights[1] > 0.){
		totalWeight += matricesWeights[1];
	}
	if(matricesIndices[2] == targetBoneIndex && matricesWeights[2] > 0.){
		totalWeight += matricesWeights[2];
	}
	if(matricesIndices[3] == targetBoneIndex && matricesWeights[3] > 0.){
		totalWeight += matricesWeights[3];
	}

	color = mix(color, colorZero, smoothstep(0., 0.25, totalWeight));
	color = mix(color, colorQuarter, smoothstep(0.25, 0.5, totalWeight));
	color = mix(color, colorHalf, smoothstep(0.5, 0.75, totalWeight));
	color = mix(color, colorFull, smoothstep(0.75, 1.0, totalWeight));


	gl_Position = projection * view * worldPos;
}