#pragma once
#include "BabylonVertex.h"
#include <map>

enum class TextureFormat{
	Jpg,
	Png,
	Dds,
	Tga,
	Unkwown
};
class FbxMaterialStore
{

private:
	TextureFormat _textureFormat;
	std::wstring _inputFolder;
	std::wstring _outputFolder;
	std::map<FbxSurfaceMaterial*, babylon_material> _materials;
public:
	const char* RegisterMaterial(FbxSurfaceMaterial* material);
	FbxMaterialStore(const std::wstring& inputFolder,const std::wstring& outputFolder, TextureFormat textureFormat = TextureFormat::Jpg);
	~FbxMaterialStore();
	std::vector<babylon_material> buildMaterialVector(){
		std::vector<babylon_material> result;
		for (auto&& pair : _materials){
			result.push_back(pair.second);
		}
		return result;
	}
};

