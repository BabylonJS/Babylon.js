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


void exploreMeshes(BabylonScene& scene, BabylonNode& node) {
	if (node.nodeType() == BabylonNodeType::Skeleton && node.hasOnlySkeletonDescendants()) {
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
		exploreMeshes(scene, child);
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

void exportTexture(TextureFormat outputFormat, const std::shared_ptr<BabylonTexture>& tex, const std::wstring& wOutputPath){
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
	std::wcout << L"Usage : FbxExporter <path to fbx file> <outdir> [jpg|png|dds]" << std::endl;
	if (argc < 3 || argc >4) {
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
	TextureFormat texFormat = TextureFormat::Png;
	if (argc == 4) {
		std::wstring wFormat(argv[3]);
		std::wstring wFormatLower;
		wFormatLower.reserve(wFormat.size());
		std::transform(wFormat.begin(), wFormat.end(), std::back_inserter(wFormatLower), towlower);
		if (wFormatLower == L"jpg") {
			texFormat = TextureFormat::Jpg;
		}
		else if (wFormatLower == L"png") {
			texFormat = TextureFormat::Png;
		}
		else if (wFormatLower == L"dds") {
			texFormat = TextureFormat::Dds;
		}
		else {

			std::wcerr << L"Invalid texture format : " << wFormat << std::endl;
			return -1;
		}
	}


	FbxSceneLoader sceneLoader(std::string(wInputPath.begin(), wInputPath.end()));
	auto root = sceneLoader.rootNode();
	printNode(*root);

	BabylonScene babScene;
	std::cout << "exporting empty nodes as empty meshes" << std::endl;
	exploreMeshes(babScene, *root);

	for (auto& mat : babScene.materials()){
		exportTexture(texFormat, mat.ambientTexture, wOutputPath);
		exportTexture(texFormat, mat.diffuseTexture, wOutputPath);
		exportTexture(texFormat, mat.specularTexture, wOutputPath);
		exportTexture(texFormat, mat.emissiveTexture, wOutputPath);
		exportTexture(texFormat, mat.reflectionTexture, wOutputPath);
		exportTexture(texFormat, mat.bumpTexture, wOutputPath);
		
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

