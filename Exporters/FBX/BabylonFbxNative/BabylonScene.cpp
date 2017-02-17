#include "stdafx.h"
#include "BabylonScene.h"


web::json::value BabylonScene::toJson() 
{
	auto jobj = web::json::value::object();
	jobj[L"autoClear"] = web::json::value::boolean(_autoClear);
	writeVector3(jobj, L"clearColor", _clearColor);
	writeVector3(jobj, L"ambientColor", _ambientColor);
	jobj[L"fogMode"] = web::json::value::number(_fogMode);
	writeVector3(jobj, L"fogColor", _fogColor);
	jobj[L"fogStart"] = web::json::value::number(_fogStart);
	jobj[L"fogEnd"] = web::json::value::number(_fogEnd);
	jobj[L"fogDensity"] = web::json::value::number(_fogDensity);
	writeVector3(jobj, L"gravity", _gravity);
	jobj[L"activeCameraID"] = web::json::value::string(_activeCameraID);

	auto jcameras = web::json::value::array();

	for (auto& cam : _cameras) {
		jcameras[jcameras.size()] = cam.toJson();
	}

	jobj[L"cameras"] = jcameras;

	auto jmeshes = web::json::value::array();
	for (auto& mesh : _meshes) {
		jmeshes[jmeshes.size()] = mesh.toJson();
	}
	jobj[L"meshes"] = jmeshes;


	auto jmats = web::json::value::array();
	for (auto& mat : _materials) {
		jmats[jmats.size()] = mat.toJson();
	}
	jobj[L"materials"] = jmats;

	auto jmulmats = web::json::value::array();
	for (auto& mat : _multiMaterials) {
		jmulmats[jmulmats.size()] = mat.toJson();
	}
	jobj[L"multiMaterials"] = jmulmats;

	auto jlights = web::json::value::array();
	for (auto& light : _lights) {
		jlights[jlights.size()] = light.toJson();
	}
	jobj[L"lights"] = jlights;

	auto jskeletons = web::json::value::array();
	for (auto& skel : _skeletons){
		jskeletons[jskeletons.size()] = skel->toJson();
	}
	jobj[L"skeletons"] = jskeletons;
	auto jshadowGenerators = web::json::value::array();
	for (auto& sg : _shadowGenerators) {
		jshadowGenerators[jshadowGenerators.size()] = sg->toJson();
	}
	jobj[L"shadowGenerators"] = jshadowGenerators;
	return jobj;
}

BabylonScene::BabylonScene() :
_autoClear(true),
_clearColor(.2f, .2f, .3f),
_ambientColor(0,0,0),
_gravity(0,0,-.9f)
{
}

BabylonScene::BabylonScene(BabylonNode & rootNode, bool skipEmptyNodes) :
	_autoClear(true),
	_clearColor(.2f, .2f, .3f),
	_ambientColor(0, 0, 0),
	_gravity(0, 0, -.9f)
{
	std::map<FbxMesh*, size_t> meshInstanceMap;
	exploreNodes(rootNode, skipEmptyNodes, meshInstanceMap);
	if (_cameras.size() == 0) {
		babylon_boundingbox bbox(rootNode.fbxNode()->GetScene());
		auto cam = buildCameraFromBoundingBox(bbox);
		_activeCameraID = cam.id;
		_cameras.push_back(std::move(cam));
	}
	if (_lights.size() == 0) {
		BabylonLight light;
		light.diffuse = babylon_vector3(1, 1, 1);
		light.specular = babylon_vector3(1, 1, 1);
		light.position = babylon_vector3(0, 0, 0);
		light.parentId = _activeCameraID;
		light.type = 0;
		light.id = L"default_light";
		light.name = L"default_light";
		light.intensity = 1;
		_lights.push_back(std::move(light));
	}
}


BabylonScene::BabylonScene(BabylonScene && moved) : 
	_autoClear(std::move(moved._autoClear)),
	_clearColor(std::move(moved._clearColor)),
	_ambientColor(std::move(moved._ambientColor)),
	_fogMode(std::move(moved._fogMode)),
	_fogColor(std::move(moved._fogColor)),
	_fogStart(std::move(moved._fogStart)),
	_fogEnd(std::move(moved._fogEnd)),
	_fogDensity(std::move(moved._fogDensity)),
	_gravity(std::move(moved._gravity)),
	_cameras(std::move(moved._cameras)),
	_activeCameraID(std::move(moved._activeCameraID)),
	_meshes(std::move(moved._meshes)),
	_materials(std::move(moved._materials)),
	_multiMaterials(std::move(moved._multiMaterials)),
	_lights(std::move(moved._lights)),
	_shadowGenerators(std::move(moved._shadowGenerators)),
	_skeletons(std::move(moved._skeletons))
{
}

BabylonScene::~BabylonScene()
{
}


void fixupTextureCoordinateIndices(BabylonMaterial& mat, BabylonMesh& mesh) {
	std::vector<std::shared_ptr<BabylonTexture>> textures;
	if (mat.ambientTexture) {
		textures.push_back(mat.ambientTexture);
	}
	if (mat.diffuseTexture) {
		textures.push_back(mat.diffuseTexture);
	}
	if (mat.specularTexture) {
		textures.push_back(mat.specularTexture);
	}
	if (mat.emissiveTexture) {
		textures.push_back(mat.emissiveTexture);
	}
	if (mat.reflectionTexture) {
		textures.push_back(mat.reflectionTexture);
	}
	if (mat.bumpTexture) {
		textures.push_back(mat.bumpTexture);
	}
	for (auto& tex : textures) {
		auto found = std::find(mesh.uvsets.begin(), mesh.uvsets.end(), tex->uvset);
		if (found != mesh.uvsets.end()) {
			tex->coordinatesIndex = static_cast<int>(found - mesh.uvsets.begin());
		}
	}
}
bool isAlreadyInstanciatedMesh(FbxNode* node, std::map<FbxMesh*, size_t>& meshInstanceMap, size_t* oIndex) {
	auto mesh = node->GetMesh();
	if (!mesh) {
		return false;
	}
	auto found = meshInstanceMap.find(mesh);
	if (found == meshInstanceMap.end()) {
		return false;
	}

	*oIndex = found->second;
	return true;
}
void BabylonScene::exploreNodes(BabylonNode & node, bool skipEmptyNodes, std::map<FbxMesh*, size_t>& meshInstanceMap)
{
	if (node.nodeType() == BabylonNodeType::Skeleton && node.hasOnlySkeletonDescendants()) {
		return;
	}
	if (skipEmptyNodes && node.isEmptySkeletonOrEmptyMeshRecursive()) {
		return;
	}
	// append mesh
	switch (node.nodeType())
	{
	case BabylonNodeType::Empty:
	case BabylonNodeType::Mesh:
	case BabylonNodeType::Skeleton:
	{
		size_t instanceOwnerIndex;
		if (isAlreadyInstanciatedMesh(node.fbxNode(), meshInstanceMap, &instanceOwnerIndex)) {
			_meshes[instanceOwnerIndex].addInstance(&node);
		}
		else {
			BabylonMesh mesh(&node);

			auto matCount = node.fbxNode()->GetMaterialCount();
			BabylonMultiMaterial multiMat;
			for (auto i = 0; i < matCount; ++i) {
				auto mat = node.fbxNode()->GetMaterial(i);
				if (mat) {

					auto id = getMaterialId(mat);
					auto existing = std::find_if(_materials.begin(), _materials.end(), [id](const BabylonMaterial& e) {
						return e.id == id;
					});
					if (existing == _materials.end()) {
						auto babMat = BabylonMaterial(mat);
						fixupTextureCoordinateIndices(babMat, mesh);
						_materials.push_back(std::move(babMat));
					}

					multiMat.materials.push_back(id);

				}
			}

			if (mesh.associatedSkeleton) {
				mesh.associatedSkeleton->id = static_cast<int>(_skeletons.size() + 1);
				mesh.skeletonId(static_cast<int>(_skeletons.size() + 1));
				_skeletons.push_back(mesh.associatedSkeleton);
			}
			if (multiMat.materials.size() > 0) {

				multiMat.id = mesh.id();
				multiMat.name = mesh.name();
				mesh.materialId(multiMat.id);
				_multiMaterials.push_back(std::move(multiMat));
			}

			auto fbxMesh = node.fbxNode()->GetMesh();
			if (fbxMesh) {
				meshInstanceMap[fbxMesh] = _meshes.size();
			}
			_meshes.push_back(std::move(mesh));
		}
	}
	break;
	case BabylonNodeType::Camera:
	{
		_cameras.emplace_back(node);
		if (_cameras.size() == 1) {
			activeCameraID(_cameras[0].id);
		}
	}
	break;
	case BabylonNodeType::Light:
	{
		_lights.emplace_back(node);
		auto& l = _lights[_lights.size() - 1];
		if (l.shadowGenerator) {
			_shadowGenerators.push_back(l.shadowGenerator);
		}
	}
	break;
	default:
		break;
	}


	for (auto& child : node.children()) {
		exploreNodes(child, skipEmptyNodes, meshInstanceMap);
	}

}
