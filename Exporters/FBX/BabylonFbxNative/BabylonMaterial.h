#pragma once
#include <string>
#include <sstream>
#include <memory>
#include "BabylonVertex.h"
#include <vector>
#include <fbxsdk.h>
#include "BabylonAnimation.h"


class BabylonTexture{
public:
	
	 std::wstring name;
	 std::wstring fullPath;
	 std::string uvset;
		
	 float level = 1.0f;

		
	 bool hasAlpha = false;

		
	 bool getAlphaFromRGB = false;

		
	 int coordinatesMode =0;

		
	 bool isCube = false;

		
	 float uOffset = 0;

		
	 float vOffset = 0;

		
	 float uScale = 1;

		
	 float vScale = 1;

		
	 float uAng = 0;

		
	 float vAng = 0;

		
	 float wAng = 0;

		
	 bool wrapU = true;

		
	 bool wrapV = true;

		
	 int coordinatesIndex = 0;

		
	 bool isRenderTarget = false;
	 std::vector<std::shared_ptr<BabylonAnimationBase>> animations;

	 BabylonTexture(FbxFileTexture* texture);

	 BabylonTexture(const BabylonTexture&) = default;
	 BabylonTexture(BabylonTexture&&);

	 web::json::value toJson();
	
};


inline std::wstring getMaterialId(FbxSurfaceMaterial* mat){
	std::wstringstream strstream;
	strstream <<mat->GetUniqueID();
	return strstream.str();
}

class BabylonMaterial
{
public:
	std::wstring name;
	std::wstring id;
	bool backFaceCulling = true;
	bool wireframe = false;
	babylon_vector3 ambient;
	babylon_vector3 diffuse;
	babylon_vector3 specular;
	babylon_vector3 emissive;
	float specularPower;
	float alpha;
	std::shared_ptr<BabylonTexture> diffuseTexture;

	std::shared_ptr<BabylonTexture> ambientTexture;

	std::shared_ptr<BabylonTexture> opacityTexture;

	std::shared_ptr<BabylonTexture> reflectionTexture;

	std::shared_ptr<BabylonTexture> emissiveTexture;

	std::shared_ptr<BabylonTexture> specularTexture;

	std::shared_ptr<BabylonTexture> bumpTexture;

	web::json::value toJson() const;
	BabylonMaterial();
	BabylonMaterial(FbxSurfaceMaterial* mat);
	BabylonMaterial(const BabylonMaterial&) = default;
	BabylonMaterial(BabylonMaterial&& moved);
	~BabylonMaterial();
};

class BabylonMultiMaterial{
public:
	std::wstring name;
	std::wstring id;
	std::vector<std::wstring> materials;
	BabylonMultiMaterial() = default;
	BabylonMultiMaterial(const BabylonMultiMaterial&) = default;
	BabylonMultiMaterial(BabylonMultiMaterial&& moved) ;
	web::json::value toJson() const;
};
