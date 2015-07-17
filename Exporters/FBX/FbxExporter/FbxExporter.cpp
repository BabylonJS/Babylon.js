// FbxExporter.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include "..\BabylonFbxNative\FbxSceneLoader.h"
#include <iostream>
#include <fstream>
#include <Windows.h>
#include <string>
#include <sstream>
#include "..\BabylonFbxNative\BabylonScene.h"
#include "..\BabylonFbxNative\GlobalSettings.h"


std::string wstringToUtf8(const std::wstring& src){
	auto size = WideCharToMultiByte(CP_UTF8, 0, src.c_str(), static_cast<int>( src.size()), nullptr, 0, nullptr, nullptr);
	std::string result;
	result.resize(size, ' ');
	WideCharToMultiByte(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), &result[0], size,nullptr, nullptr);
	return result;
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
	auto outputPath = tex->name;
	for (;;){
		auto indexOfSlash = outputPath.find(L'/');
		if (indexOfSlash == outputPath.npos){
			break;
		}
		outputPath[indexOfSlash] = L'\\';
	}
	size_t start = 0;
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

	BabylonScene babScene(*root, skipEmptyNodes);

	for (auto& mat : babScene.materials()){
		exportTexture(mat.ambientTexture, wOutputPath);
		exportTexture(mat.diffuseTexture, wOutputPath);
		exportTexture(mat.specularTexture, wOutputPath);
		exportTexture(mat.emissiveTexture, wOutputPath);
		exportTexture(mat.reflectionTexture, wOutputPath);
		exportTexture(mat.bumpTexture, wOutputPath);
		
	}
	
	

	auto json = babScene.toJson();
	if (L'\\' != *wOutputPath.crbegin()) {
		wOutputPath.append(L"\\");
	}
	wOutputPath.append(wInputFileName);

	auto lastDot = wOutputPath.find_last_of(L'.');
	wOutputPath.erase(lastDot);
	wOutputPath.append(L".babylon");
	DeleteFile(wOutputPath.c_str());
	std::ofstream stream(wOutputPath);
	json.serialize(stream);
	stream.flush();
	return 0;
}

