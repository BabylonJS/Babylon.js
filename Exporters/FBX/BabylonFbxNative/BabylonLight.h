#pragma once
#include "BabylonVertex.h"
#include <limits>
#include "BabylonNode.h"
#include "BabylonAnimation.h"
#include <memory>
#include <string>
#undef max

class BabylonShadowGenerator
{
public:

	int mapSize;

		
	float bias;

		
	std::wstring lightId;

		
	bool useVarianceShadowMap;

		
	bool usePoissonSampling;

		
	bool useBlurVarianceShadowMap;

		
	float blurScale;

		
	float blurBoxOffset;

		
	std::vector<std::wstring> renderList;

	BabylonShadowGenerator(FbxNode* lightNode);
	BabylonShadowGenerator(const BabylonShadowGenerator&) = default;
	BabylonShadowGenerator(BabylonShadowGenerator&& moved);
	web::json::value toJson();

};


class BabylonLight
{
public:
	const int type_omni = 0;
	const int type_Spot = 2;

	const int type_direct = 1;

	const int type_ambient = 3;
	
	std::wstring name;

		
	std::wstring id;

		
	std::wstring parentId;

		
	babylon_vector3 position;

		
	babylon_vector3 direction;

		
	int type = 0;

		
	babylon_vector3 diffuse;

		
	babylon_vector3 specular;

		
	float intensity = 1;

		
	float range = std::numeric_limits<float>::max();

		
	float exponent = 0;

		
	float angle = 0;

		
	babylon_vector3 groundColor;

	bool castShadows;
	std::vector<std::wstring> includedOnlyMeshesIds;
	std::vector<std::wstring> excludedMeshesIds;

		
	std::shared_ptr<BabylonShadowGenerator> shadowGenerator;
	std::vector<std::shared_ptr < BabylonAnimation<babylon_vector3>>> animations;

	web::json::value toJson() const;

	BabylonLight();
	BabylonLight(BabylonNode& babnode);
	BabylonLight(const BabylonLight&) = default;
	BabylonLight(BabylonLight&& moved);
	~BabylonLight();
};

