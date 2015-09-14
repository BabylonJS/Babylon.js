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
#include "..\BabylonFbxNative\StringUtils.h"




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
	std::wcout << L"version : 2015.09.14" << std::endl;
	std::wcout << L"Usage : FbxExporter <path to fbx file> <outdir> [/fps:60|30|24] [/skipemptynodes] [/animstack:\"animstack name\"]" << std::endl;
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
	std::wstring animStackName;
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
		else if (warg.find(L"/animstack:") == 0) {
			animStackName = warg.substr(11);
			
			if (animStackName.size()>0 && animStackName[0] == L'\"') {
				animStackName.erase(0, 1);
			}
			if (animStackName.size() > 0 && animStackName[animStackName.size() - 1] == L'\"') {
				animStackName.erase(animStackName.size() - 1, 1);
			}
		}
		
	}
	

	FbxSceneLoader sceneLoader(wstringToUtf8(wInputPath));
	auto animStackCount = sceneLoader.getScene()->GetSrcObjectCount<FbxAnimStack>();
	if (animStackName.size() == 0) {
		GlobalSettings::Current().AnimStackIndex = 0;
	}
	else {
		for (auto ix = 0; ix < animStackCount; ++ix) {
			auto animStack = sceneLoader.getScene()->GetSrcObject<FbxAnimStack>(ix);
			if (utf8ToWstring(animStack->GetName()) == animStackName) {
				GlobalSettings::Current().AnimStackIndex = ix;
			}
		}
	}
	std::wcout << L"Animation stacks : " << std::endl;
	for (auto ix = 0; ix < animStackCount; ++ix) {
		auto animStack = sceneLoader.getScene()->GetSrcObject<FbxAnimStack>(ix);
		if (ix == GlobalSettings::Current().AnimStackIndex) {
			std::wcout << L"[X] ";
			sceneLoader.getScene()->SetCurrentAnimationStack(animStack);
		}
		else {
			std::wcout << L"[ ] ";
		}
		
		std::wcout << utf8ToWstring(animStack->GetName());
		auto ts=animStack->GetLocalTimeSpan();
		auto start = ts.GetStart();
		auto stop = ts.GetStop();
		std::wcout << L"(" << start.GetMilliSeconds() << L" - " << stop.GetMilliSeconds() << L")" << std::endl;
	}

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

