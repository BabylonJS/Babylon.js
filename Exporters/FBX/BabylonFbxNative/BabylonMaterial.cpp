#include "stdafx.h"
#include "BabylonMaterial.h"
#include <Windows.h>


web::json::value BabylonMaterial::toJson() const
{
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"id"] = web::json::value::string(id);
	jobj[L"backFaceCulling"] = web::json::value::boolean(backFaceCulling);
	jobj[L"wireframe"] = web::json::value::boolean(wireframe);
	writeVector3(jobj, L"ambient", ambient);
	writeVector3(jobj, L"diffuse", diffuse);
	writeVector3(jobj, L"specular", specular);
	writeVector3(jobj, L"emissive", emissive);
	jobj[L"specularPower"] = web::json::value::number(specularPower);
	jobj[L"alpha"] = web::json::value::number(alpha);
	// todo : textures
	return jobj;
}

BabylonMaterial::BabylonMaterial():
ambient(1,1,1),
diffuse(1,1,1),
specular(1,1,1),
emissive(0,0,0),
specularPower(64),
alpha(1)
{
}

std::wstring utf8ToWstring(const std::string& src){
	auto size = MultiByteToWideChar(CP_UTF8, 0, src.c_str(), src.size(), nullptr, 0);
	std::wstring result;
	result.resize(size, ' ');
	MultiByteToWideChar(CP_UTF8, 0, src.c_str(), src.size(), &result[0], result.size());
	return result;
}


FbxDouble3 GetMaterialProperty(const FbxSurfaceMaterial * pMaterial,
	const char * pPropertyName,
	const char * pFactorPropertyName,
	std::wstring& pTextureName)
{
	FbxDouble3 lResult(0, 0, 0);
	const FbxProperty lProperty = pMaterial->FindProperty(pPropertyName);
	const FbxProperty lFactorProperty = pMaterial->FindProperty(pFactorPropertyName);
	if (lProperty.IsValid() && lFactorProperty.IsValid())
	{
		lResult = lProperty.Get<FbxDouble3>();
		double lFactor = lFactorProperty.Get<FbxDouble>();
		if (lFactor != 1)
		{
			lResult[0] *= lFactor;
			lResult[1] *= lFactor;
			lResult[2] *= lFactor;
		}
	}

	if (lProperty.IsValid())
	{
		const int lTextureCount = lProperty.GetSrcObjectCount<FbxFileTexture>();
		if (lTextureCount)
		{
			const FbxFileTexture* lTexture = lProperty.GetSrcObject<FbxFileTexture>();
			if (lTexture)
			{
				std::string utf8FilePath = lTexture->GetFileName();
				pTextureName = utf8ToWstring(utf8FilePath);
			}
		}
	}

	return lResult;
}



BabylonMaterial::BabylonMaterial(FbxSurfaceMaterial* mat) :
ambient(1, 1, 1),
diffuse(1, 1, 1),
specular(1, 1, 1),
emissive(0, 0, 0),
specularPower(64),
alpha(1){
	std::string ansiName = mat->GetName();
	name = std::wstring(ansiName.begin(), ansiName.end());
	id = getMaterialId(mat);
	std::wstring ambientTex;
	std::wstring diffuseTex;
	std::wstring specularTex;
	std::wstring emissiveTex;
	std::wstring reflectionTex;
	std::wstring bumpTex;
	ambient = GetMaterialProperty(mat, FbxSurfaceMaterial::sAmbient, FbxSurfaceMaterial::sAmbientFactor, ambientTex);
	diffuse = GetMaterialProperty(mat, FbxSurfaceMaterial::sDiffuse, FbxSurfaceMaterial::sDiffuseFactor, diffuseTex);
	specular = GetMaterialProperty(mat, FbxSurfaceMaterial::sSpecular, FbxSurfaceMaterial::sSpecularFactor, specularTex);
	emissive = GetMaterialProperty(mat, FbxSurfaceMaterial::sEmissive, FbxSurfaceMaterial::sEmissiveFactor, emissiveTex);
	GetMaterialProperty(mat, FbxSurfaceMaterial::sReflection, FbxSurfaceMaterial::sReflectionFactor, reflectionTex);
	auto shininessProp = mat->FindProperty(FbxSurfaceMaterial::sShininess);
	if (shininessProp.IsValid()){
		specularPower = shininessProp.Get<FbxDouble>();
	}

	auto normalMapProp = mat->FindProperty(FbxSurfaceMaterial::sNormalMap);
	if (normalMapProp.IsValid()){
		const int lTextureCount = normalMapProp.GetSrcObjectCount<FbxFileTexture>();
		if (lTextureCount)
		{
			const FbxFileTexture* lTexture = normalMapProp.GetSrcObject<FbxFileTexture>();
			if (lTexture)
			{
				std::string utf8FilePath = lTexture->GetFileName();
				bumpTex = utf8ToWstring(utf8FilePath);
			}
		}
	}
	else{
		auto bumpProp = mat->FindProperty(FbxSurfaceMaterial::sBump);
		if (bumpProp.IsValid()){
			const int lTextureCount = bumpProp.GetSrcObjectCount<FbxFileTexture>();
			if (lTextureCount)
			{
				const FbxFileTexture* lTexture = bumpProp.GetSrcObject<FbxFileTexture>();
				if (lTexture)
				{
					std::string utf8FilePath = lTexture->GetFileName();
					bumpTex = utf8ToWstring(utf8FilePath);
				}
			}
		}
	}

	if (ambientTex.size() > 0){
		ambientTexture = std::make_shared<BabylonTexture>();
		ambientTexture->name = ambientTex;
	}
	if (diffuseTex.size() > 0){
		diffuseTexture = std::make_shared<BabylonTexture>();
		diffuseTexture->name = diffuseTex;
	}
	if (specularTex.size() > 0){
		specularTexture = std::make_shared<BabylonTexture>();
		specularTexture->name = specularTex;
	}
	if (emissiveTex.size() > 0){
		emissiveTexture = std::make_shared<BabylonTexture>();
		emissiveTexture->name = emissiveTex;
	}
	if (reflectionTex.size() > 0){
		reflectionTexture = std::make_shared<BabylonTexture>();
		reflectionTexture->name = reflectionTex;
	}
	if (bumpTex.size() > 0){
		bumpTexture = std::make_shared<BabylonTexture>();
		bumpTexture->name = bumpTex;
	}

}


BabylonMaterial::~BabylonMaterial()
{
}

web::json::value BabylonMultiMaterial::toJson() const
{
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"id"] = web::json::value::string(id);

	auto jarray = web::json::value::array();
	for (auto& mat : materials) {
		jarray[jarray.size()] = web::json::value::string(mat);
	}
	jobj[L"materials"] = jarray;
	return jobj;
}
