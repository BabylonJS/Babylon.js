#pragma once
#include <cpprest\json.h>
#include "BabylonVertex.h"
#include "BabylonMesh.h"
#include "BabylonMaterial.h"
#include "BabylonCamera.h"
#include "BabylonLight.h"
#include "BabylonSkeleton.h"
#include <memory>
#include "BabylonNode.h"

class BabylonScene
{
private:
	bool _autoClear;
	babylon_vector3 _clearColor;
	babylon_vector3 _ambientColor;
	int _fogMode;
	babylon_vector3 _fogColor;
	float _fogStart;
	float _fogEnd;
	float _fogDensity;
	babylon_vector3 _gravity;
	std::vector<BabylonCamera> _cameras;
	std::wstring _activeCameraID;
	std::vector<BabylonMesh> _meshes;
	std::vector<BabylonMaterial> _materials;
	std::vector<BabylonMultiMaterial> _multiMaterials;
	std::vector<BabylonLight> _lights;
	std::vector<std::shared_ptr<BabylonShadowGenerator>> _shadowGenerators;
	std::vector<std::shared_ptr<BabylonSkeleton>> _skeletons;
	// particleSystems
	// lensFlareSystems
	// shadowGenerators
	// skeletons

public:

	bool autoClear(){ return _autoClear; }
	babylon_vector3 clearColor(){ return _clearColor; }
	babylon_vector3 ambientColor(){ return _ambientColor; }
	int fogMode(){ return _fogMode; }
	babylon_vector3 fogColor(){ return _fogColor; }
	float fogStart(){ return _fogStart; }
	float fogEnd(){ return _fogEnd; }
	float fogDensity(){ return _fogDensity; }
	babylon_vector3 gravity(){ return _gravity; }

	std::vector<BabylonCamera>& cameras() { return _cameras; }
	const std::wstring& activeCameraID() { return _activeCameraID; }
	// lights
	std::vector<BabylonMesh>& meshes() { return _meshes; }
	std::vector<BabylonMaterial>& materials(){ return _materials; }
	std::vector<BabylonMultiMaterial>& multiMaterials(){ return _multiMaterials; }

	std::vector<BabylonLight>& lights() { return _lights; }
	std::vector<std::shared_ptr<BabylonShadowGenerator>>& shadowGenerators() { return _shadowGenerators; }
	std::vector<std::shared_ptr<BabylonSkeleton>>& skeletons() { return _skeletons; }
	// particleSystems
	// lensFlareSystems
	// shadowGenerators
	// skeletons

	void autoClear(bool value){ _autoClear = value; }
	void clearColor(babylon_vector3 value){ _clearColor = value; }
	void ambientColor(babylon_vector3 value){ _ambientColor = value; }
	void fogMode(int value){ _fogMode = value; }
	void fogColor(babylon_vector3 value){ _fogColor = value; }
	void fogStart(float value){ _fogStart = value; }
	void fogEnd(float value){ _fogEnd = value; }
	void fogDensity(float value){ _fogDensity = value; }
	void gravity(babylon_vector3 value){ _gravity = value; }


	void activeCameraID(const std::wstring& value) { _activeCameraID = value; }
	// lights
	// materials
	// multiMaterials
	// particleSystems
	// lensFlareSystems
	// shadowGenerators
	// skeletons

	web::json::value toJson() ;

	BabylonScene();
	BabylonScene(BabylonNode& rootNode, bool skipEmptyNodes);
	BabylonScene(const BabylonScene&) = default;
	BabylonScene(BabylonScene&& moved);
	~BabylonScene();
private:
	void exploreNodes(BabylonNode& node, bool skipEmptyNodes, std::map<FbxMesh*, size_t>& meshInstanceMap);
};

