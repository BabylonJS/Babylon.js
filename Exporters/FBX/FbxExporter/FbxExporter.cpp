// FbxExporter.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include "..\BabylonFbxNative\FbxSceneLoader.h"
#include "..\BabylonFbxNative\FbxMeshLoader.h"
#include "..\BabylonFbxNative\Export.h"
#include <iostream>
#include <fstream>
#include <Windows.h>
#include <string>
#include <sstream>
#include "..\BabylonFbxNative\BabylonScene.h"
#include "..\BabylonFbxNative\GlobalSettings.h"

std::string toString(BabylonNodeType type) {
	switch (type)
	{
	case BabylonNodeType::Camera:
		return "camera";
		break;
	case BabylonNodeType::Mesh:
		return "mesh";
		break;
	case BabylonNodeType::Skeleton:
		return "skeleton";
		break;
	case BabylonNodeType::Light:
		return "light";
		break;
	case BabylonNodeType::Empty:
		return "<empty>";
		break;
	default:
		break;
	}
}

std::string toString(FbxDouble3 value) {
	std::stringstream s;
	s << "(" << value[0] << "," << value[1] << "," << value[2] << ")";
	return s.str();
}
void printNode(BabylonNode& node, int indent = 0) {
	for (auto i = 0; i < indent; ++i) {
		std::cout << '\t';
	}
	std::cout << node.uniqueId() << " : " << node.name() << " " << toString(node.nodeType()) << " has only skeleton desc : " << node.hasOnlySkeletonDescendants() << std::endl;
	for (auto i = 0; i < indent; ++i) {
		std::cout << '\t';
	}
	
}


std::string wstringToUtf8(const std::wstring& src){
	auto size = WideCharToMultiByte(CP_UTF8, 0, src.c_str(), src.size(), nullptr, 0, nullptr, nullptr);
	std::string result;
	result.resize(size, ' ');
	WideCharToMultiByte(CP_UTF8, 0, src.c_str(), src.size(), &result[0], result.size(),nullptr, nullptr);
	return result;
}

bool isNodeOrDescendantVisible(FbxNode* node){
	if (node == nullptr){
		return false;
	}
	if (node->GetVisibility()){
		return true;
	}

	auto childCount = node->GetChildCount();
	for (auto ix = 0; ix < childCount; ++ix){
		if (isNodeOrDescendantVisible(node->GetChild(ix))){
			return true;
		}
	}
	return false;
}

void exploreMeshes(BabylonScene& scene, BabylonNode& node, bool skipEmptyNodes) {
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
		auto matCount = node.fbxNode()->GetMaterialCount();
		BabylonMultiMaterial multiMat;
		for (auto i = 0; i < matCount; ++i) {
			auto mat = node.fbxNode()->GetMaterial(i);
			if (mat) {
				BabylonMaterial babMat(mat);
				auto id = babMat.id;
				multiMat.materials.push_back(id);
				auto existing = std::find_if(scene.materials().begin(), scene.materials().end(), [id](const BabylonMaterial& e) {
					return e.id == id;
				});
				if (existing == scene.materials().end()) {
					scene.materials().push_back(babMat);
				}
			}
		}

		scene.meshes().emplace_back(&node);
		auto& mesh = scene.meshes()[scene.meshes().size() - 1];
		if (mesh.associatedSkeleton){
			mesh.associatedSkeleton->id = scene.skeletons().size()+1;
			mesh.skeletonId(scene.skeletons().size()+1);
			scene.skeletons().push_back(mesh.associatedSkeleton);
		}
		if (multiMat.materials.size() > 0) {
			auto& mesh = scene.meshes()[scene.meshes().size() - 1];
			multiMat.id = mesh.id();
			multiMat.name = mesh.name();
			mesh.materialId(multiMat.id);
			scene.multiMaterials().push_back(multiMat);
		}
	}
	break;
	case BabylonNodeType::Camera:
	{
		scene.cameras().emplace_back(node);
		if (scene.cameras().size() == 1) {
			scene.activeCameraID(scene.cameras()[0].id);
		}
	}
	break;
	case BabylonNodeType::Light:
		scene.lights().emplace_back(node);
	default:
		break;
	}


	for (auto& child : node.children()) {
		exploreMeshes(scene, child, skipEmptyNodes);
	}



}

TextureFormat getInputFormat(const std::wstring& fileName){
	std::wstring ext = fileName.substr(fileName.find_last_of(L'.') + 1);
	std::wstring extLower;
	extLower.reserve(ext.size());
	std::transform(ext.begin(), ext.end(), std::back_inserter(extLower), towlower);
	if (extLower == L"png"){
		return TextureFormat::Png;
	}
	else if (extLower == L"jpg"){
		return TextureFormat::Jpg;
	}
	else if (extLower == L"tga"){
		return TextureFormat::Tga;
	}
	else if (extLower == L"dds"){
		return TextureFormat::Dds;
	}
	return TextureFormat::Unkwown;
}

void exportTexture(const std::shared_ptr<BabylonTexture>& tex, const std::wstring& wOutputPath){
	if (!tex){
		return;
	}
	auto fullPath = tex->fullPath;
	for (;;){
		auto indexOfSlash = fullPath.find(L'/');
		if (indexOfSlash == fullPath.npos){
			break;
		}
		fullPath[indexOfSlash] = L'\\';
	}
	auto inputFormat = getInputFormat(tex->fullPath);
	auto outputPath = tex->name;
	for (;;){
		auto indexOfSlash = outputPath.find(L'/');
		if (indexOfSlash == outputPath.npos){
			break;
		}
		outputPath[indexOfSlash] = L'\\';
	}
	auto start = 0;
	for (;;){
		auto indexOfSlash = outputPath.find(L'\\', start);
		if (indexOfSlash == outputPath.npos){
			break;
		}
		auto pathToCreate = wOutputPath;
		if (pathToCreate[pathToCreate.size() - 1] != L'\\'){
			pathToCreate.push_back(L'\\');
		}
		pathToCreate.append(outputPath.begin(), outputPath.begin() + indexOfSlash);
		CreateDirectory(pathToCreate.c_str(), nullptr);
		start = indexOfSlash + 1;
	}
	auto fullOutputPath = wOutputPath;
	if (fullOutputPath[fullOutputPath.size() - 1] != L'\\'){
		fullOutputPath.push_back(L'\\');
	}
	fullOutputPath.append(outputPath);
	CopyFile(fullPath.c_str(), fullOutputPath.c_str(), false);
}

int _tmain(int argc, _TCHAR* argv[])
{
	std::wcout << L"Usage : FbxExporter <path to fbx file> <outdir> [/fps:60|30|24] [/skipemptynodes]" << std::endl;
	if (argc < 3) {
		std::wcerr << L"Invalid argument count" << std::endl;
		return -1;
	}
	std::wstring wInputPath(argv[1]);
	std::wstring wInputDir(argv[1]);
	std::wstring wInputFileName(argv[1]);
	auto lastDirSeparator = wInputDir.find_last_of(L'\\');
	if (lastDirSeparator == wInputDir.npos) {
		wInputDir = L".";
	}
	else {
		wInputDir.erase(lastDirSeparator);
		wInputFileName.erase(0, lastDirSeparator + 1);
	}
	std::wstring wOutputPath(argv[2]);
	CreateDirectory(wOutputPath.c_str(), nullptr);
	bool skipEmptyNodes = false;
	for (int i = 3; i < argc; ++i){
		std::wstring warg = argv[i];
		if (warg == L"/skipemptynodes") {
			skipEmptyNodes = true;
		}
		else if (warg.find(L"/fps:") == 0){
			if (warg == L"/fps:60"){
				GlobalSettings::Current().AnimationsTimeMode = FbxTime::EMode::eFrames60;
			}
			else if (warg == L"/fps:30"){
				GlobalSettings::Current().AnimationsTimeMode = FbxTime::EMode::eFrames30;
			}
			else if (warg == L"/fps:24"){
				GlobalSettings::Current().AnimationsTimeMode = FbxTime::EMode::eFrames24;
			}
			else{
				std::wcerr << L"Unrecognized fps parameter" << std::endl;
				return -2;
			}
		}
		
	}
	

	FbxSceneLoader sceneLoader(wstringToUtf8(wInputPath));
	auto root = sceneLoader.rootNode();
	printNode(*root);

	BabylonScene babScene;
	std::cout << "exporting empty nodes as empty meshes" << std::endl;
	exploreMeshes(babScene, *root, skipEmptyNodes);

	for (auto& mat : babScene.materials()){
		exportTexture(mat.ambientTexture, wOutputPath);
		exportTexture(mat.diffuseTexture, wOutputPath);
		exportTexture(mat.specularTexture, wOutputPath);
		exportTexture(mat.emissiveTexture, wOutputPath);
		exportTexture(mat.reflectionTexture, wOutputPath);
		exportTexture(mat.bumpTexture, wOutputPath);
		
	}
	if (babScene.cameras().size() == 0){
		babylon_boundingbox bbox(sceneLoader.getScene());
		auto cam = buildCameraFromBoundingBox(bbox);
		babScene.cameras().push_back(cam);
		babScene.activeCameraID(cam.id);
	}
	if (babScene.lights().size() == 0){
		babylon_boundingbox bbox(sceneLoader.getScene());
		BabylonLight light;
		light.diffuse = babylon_vector3(1, 1, 1);
		light.specular = babylon_vector3(1, 1, 1);
		light.position = babylon_vector3(0,0,0);
		light.parentId = babScene.activeCameraID();
		light.type = 0;
		light.id = L"default_light";
		light.name = L"default_light";
		light.intensity = 1;
		babScene.lights().push_back(light);
		//	web::json::value defaultLight = web::json::value::object();
		//	writeVector3(defaultLight, L"diffuse", babylon_vector3(1, 1, 1));
		//	writeVector3(defaultLight, L"specular", babylon_vector3(1, 1, 1));
		//	writeVector3(defaultLight, L"position", babylon_vector3(bbox.getMinX()*2, bbox.getMaxY()*2, bbox.getMinZ()*2));
		//	defaultLight[L"type"] = web::json::value(0);
		//	defaultLight[L"direction"] = web::json::value::null();
		//	defaultLight[L"id"] = web::json::value(L"default light");
		//	defaultLight[L"name"] = web::json::value(L"default light");
		//	defaultLight[L"intensity"] = web::json::value(1);
	}
	/*auto camera = sceneLoader.GetDefaultCamera();
	auto spaceshipSettings = sceneLoader.getGlobalSettings();
	FbxMaterialStore materials(wInputDir, wOutputPath, texFormat);
	for (int i = 0; i < sceneLoader.getMeshCount(); ++i){
		meshes.push_back(loadStaticMesh<babylon_vertex_normal_uv_color>(sceneLoader.getFbxMesh(i), sceneLoader.getScene(), materials));
	}
	auto json = exportScene(spaceshipSettings, materials.buildMaterialVector(), meshes);
	if ('\\' != *wOutputPath.cend()){
		wOutputPath.append(L"\\");
	}
	wOutputPath.append(wInputFileName);

	auto lastDot = wOutputPath.find_last_of(L'.');
	wOutputPath.erase(lastDot);
	wOutputPath.append(L".babylon");
	DeleteFile(wOutputPath.c_str());
	std::wofstream stream(wOutputPath);
	json.serialize(stream);
	stream.flush();*/

	auto json = babScene.toJson();
	if (L'\\' != *wOutputPath.crbegin()) {
		wOutputPath.append(L"\\");
	}
	wOutputPath.append(wInputFileName);

	auto lastDot = wOutputPath.find_last_of(L'.');
	wOutputPath.erase(lastDot);
	wOutputPath.append(L".babylon");
	DeleteFile(wOutputPath.c_str());
	std::wofstream stream(wOutputPath);
	json.serialize(stream);
	stream.flush();
	return 0;
}

