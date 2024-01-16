layout(std140, column_major) uniform;

uniform Material
{
	vec4 vSplattingInfos;
};

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
