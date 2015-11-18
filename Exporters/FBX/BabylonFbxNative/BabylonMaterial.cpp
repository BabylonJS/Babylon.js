#include "stdafx.h"
#include "BabylonMaterial.h"
#include <Windows.h>
#include "NodeHelpers.h"
#include "GlobalSettings.h"
#include "StringUtils.h"

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

	if (diffuseTexture){
		jobj[L"diffuseTexture"] = diffuseTexture->toJson();
	}
	if (ambientTexture){
		jobj[L"ambientTexture"] = ambientTexture->toJson();

	}
	if (opacityTexture){
		jobj[L"opacityTexture"] = opacityTexture->toJson();

	}
	if (reflectionTexture){
		jobj[L"reflectionTexture"] = reflectionTexture->toJson();

	}
	if (emissiveTexture){
		jobj[L"emissiveTexture"] = emissiveTexture->toJson();

	}
	if (specularTexture){
		jobj[L"specularTexture"] = specularTexture->toJson();

	}
	if (bumpTexture){
		jobj[L"bumpTexture"] = bumpTexture->toJson();

	}


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




FbxDouble3 GetMaterialProperty(const FbxSurfaceMaterial * pMaterial,
	const char * pPropertyName,
	const char * pFactorPropertyName,
	FbxFileTexture*& pTexture)
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
			FbxFileTexture* lTexture = lProperty.GetSrcObject<FbxFileTexture>();
			pTexture = lTexture;
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
	auto rawId = mat->GetUniqueID();
	id = getMaterialId(mat);
	FbxFileTexture* ambientTex = nullptr;
	FbxFileTexture* diffuseTex = nullptr;
	FbxFileTexture* specularTex = nullptr;
	FbxFileTexture* emissiveTex = nullptr;
	FbxFileTexture* reflectionTex = nullptr;
	FbxFileTexture* opacityTex = nullptr;
	FbxFileTexture* bumpTex = nullptr;
	GetMaterialProperty(mat, FbxSurfaceMaterial::sTransparentColor, FbxSurfaceMaterial::sTransparencyFactor, opacityTex)[0];

	FbxDouble3 transcolor;
	FbxDouble transfactor;
	auto transFactorProp = mat->FindProperty(FbxSurfaceMaterial::sTransparencyFactor);
	auto transColorProp = mat->FindProperty(FbxSurfaceMaterial::sTransparentColor);
	if (transFactorProp.IsValid() && transColorProp.IsValid()){
		transfactor = transFactorProp.Get<FbxDouble>();
		transcolor = transColorProp.Get<FbxDouble3>();
		if (transfactor== 1.0){ // from Maya .fbx
			if (transcolor[0] >= DBL_MIN) {
				alpha = static_cast<float>(1 - transcolor[0]);
			}
			else {
				alpha = 1;
			}
		}
		else { // from 3dsmax .fbx
			if (transfactor>=DBL_MIN){
				alpha = static_cast<float>(1 - transfactor);
			}
			else {
				alpha = 1;
			}
		}
	}

	ambient = GetMaterialProperty(mat, FbxSurfaceMaterial::sAmbient, FbxSurfaceMaterial::sAmbientFactor, ambientTex);
	diffuse = GetMaterialProperty(mat, FbxSurfaceMaterial::sDiffuse, FbxSurfaceMaterial::sDiffuseFactor, diffuseTex);
	specular = GetMaterialProperty(mat, FbxSurfaceMaterial::sSpecular, FbxSurfaceMaterial::sSpecularFactor, specularTex);
	emissive = GetMaterialProperty(mat, FbxSurfaceMaterial::sEmissive, FbxSurfaceMaterial::sEmissiveFactor, emissiveTex);
	GetMaterialProperty(mat, FbxSurfaceMaterial::sReflection, FbxSurfaceMaterial::sReflectionFactor, reflectionTex);
	auto shininessProp = mat->FindProperty(FbxSurfaceMaterial::sShininess);
	if (shininessProp.IsValid()){
		specularPower = static_cast<float>(shininessProp.Get<FbxDouble>())*12;
	}

	auto normalMapProp = mat->FindProperty(FbxSurfaceMaterial::sNormalMap);
	if (normalMapProp.IsValid()){
		const int lTextureCount = normalMapProp.GetSrcObjectCount<FbxFileTexture>();
		if (lTextureCount)
		{
			FbxFileTexture* lTexture = normalMapProp.GetSrcObject<FbxFileTexture>();
			if (lTexture)
			{
				bumpTex = lTexture;
			}
		}
	}
	else{
		auto bumpProp = mat->FindProperty(FbxSurfaceMaterial::sBump);
		if (bumpProp.IsValid()){
			const int lTextureCount = bumpProp.GetSrcObjectCount<FbxFileTexture>();
			if (lTextureCount)
			{
				FbxFileTexture* lTexture = bumpProp.GetSrcObject<FbxFileTexture>();
				if (lTexture)
				{
					bumpTex = lTexture;
				}
			}
		}
	}

	if (ambientTex){
		ambientTexture = std::make_shared<BabylonTexture>(ambientTex);
	}
	if (diffuseTex){
		diffuseTexture = std::make_shared<BabylonTexture>(diffuseTex);
	}
	if (specularTex){
		specularTexture = std::make_shared<BabylonTexture>(specularTex);
	}
	if (emissiveTex){
		emissiveTexture = std::make_shared<BabylonTexture>(emissiveTex);
	}
	if (reflectionTex){
		reflectionTexture = std::make_shared<BabylonTexture>(reflectionTex);
	}
	if (bumpTex){
		bumpTexture = std::make_shared<BabylonTexture>(bumpTex);
	}

	if (opacityTex){
		opacityTexture = std::make_shared<BabylonTexture>(opacityTex);
	}

}


BabylonMaterial::BabylonMaterial(BabylonMaterial && moved) : 
	name(std::move(moved.name)),
	id(std::move(moved.id)),
	backFaceCulling(std::move(moved.backFaceCulling)),
	wireframe(std::move(moved.wireframe)),
	ambient(std::move(moved.ambient)),
	diffuse(std::move(moved.diffuse)),
	specular(std::move(moved.specular)),
	emissive(std::move(moved.emissive)),
	specularPower(std::move(moved.specularPower)),
	alpha(std::move(moved.alpha)),
	diffuseTexture(std::move(moved.diffuseTexture)),
	ambientTexture(std::move(moved.ambientTexture)),
	opacityTexture(std::move(moved.opacityTexture)),
	reflectionTexture(std::move(moved.reflectionTexture)),
	emissiveTexture(std::move(moved.emissiveTexture)),
	specularTexture(std::move(moved.specularTexture)),
	bumpTexture(std::move(moved.bumpTexture))
{
}

BabylonMaterial::~BabylonMaterial()
{
}

BabylonMultiMaterial::BabylonMultiMaterial(BabylonMultiMaterial && moved) :
	name(std::move(moved.name)),
	id(std::move(moved.id)),
	materials(std::move(moved.materials))
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


BabylonTexture::BabylonTexture(BabylonTexture && moved) : 
	name(std::move(moved.name)),
	fullPath(std::move(moved.fullPath)),
	uvset(std::move(moved.uvset)),
	level(std::move(moved.level)),
	hasAlpha(std::move(moved.hasAlpha)),
	getAlphaFromRGB(std::move(moved.getAlphaFromRGB)),
	coordinatesMode(std::move(moved.coordinatesMode)),
	isCube(std::move(moved.isCube)),
	uOffset(std::move(moved.uOffset)),
	vOffset(std::move(moved.vOffset)),
	uScale(std::move(moved.uScale)),
	vScale(std::move(moved.vScale)),
	uAng(std::move(moved.uAng)),
	vAng(std::move(moved.vAng)),
	wAng(std::move(moved.wAng)),
	wrapU(std::move(moved.wrapU)),
	wrapV(std::move(moved.wrapV)),
	coordinatesIndex(std::move(moved.coordinatesIndex)),
	isRenderTarget(std::move(moved.isRenderTarget)),
	animations(std::move(moved.animations))
{
}

web::json::value BabylonTexture::toJson(){
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"level"] = web::json::value::number(level);
	jobj[L"hasAlpha"] = web::json::value::boolean(hasAlpha);
	jobj[L"getAlphaFromRGB"] = web::json::value::boolean(getAlphaFromRGB);
	jobj[L"coordinatesMode"] = web::json::value::number(coordinatesMode);
	jobj[L"isCube"] = web::json::value::boolean(isCube);
	jobj[L"uOffset"] = web::json::value::number(uOffset);
	jobj[L"vOffset"] = web::json::value::number(vOffset);
	jobj[L"uScale"] = web::json::value::number(uScale);
	jobj[L"vScale"] = web::json::value::number(vScale);
	jobj[L"uAng"] = web::json::value::number(uAng);
	jobj[L"vAng"] = web::json::value::number(vAng);
	jobj[L"wAng"] = web::json::value::number(wAng);
	jobj[L"wrapU"] = web::json::value::boolean(wrapU);
	jobj[L"wrapV"] = web::json::value::boolean(wrapV);
	jobj[L"coordinatesIndex"] = web::json::value::number(coordinatesIndex);
	jobj[L"isRenderTarget"] = web::json::value::boolean(isRenderTarget);
	auto janims = web::json::value::array();
	for (auto& anim : animations) {
		janims[janims.size()] = anim->toJson();
	}
	jobj[L"animations"] = janims;
	return jobj;
}
BabylonTexture::BabylonTexture(FbxFileTexture* texture){
	fullPath = utf8ToWstring(texture->GetFileName());
	auto indexOfLastBackslash = fullPath.find_last_of(L'\\');
	name = std::wstring(fullPath.begin() + indexOfLastBackslash + 1, fullPath.end());
	auto mappingType = texture->GetMappingType();
	switch (mappingType)
	{
	case fbxsdk::FbxTexture::eNull:
		break;
	case fbxsdk::FbxTexture::ePlanar:
		coordinatesMode = 2;
		break;
	case fbxsdk::FbxTexture::eSpherical:
		coordinatesMode = 1;
		break;
	case fbxsdk::FbxTexture::eCylindrical:
		break;
	case fbxsdk::FbxTexture::eBox:
		coordinatesMode = 5;
		break;
	case fbxsdk::FbxTexture::eFace:
		break;
	case fbxsdk::FbxTexture::eUV:
		break;
	case fbxsdk::FbxTexture::eEnvironment:
		break;
	default:
		break;
	}
	auto alphaSource = texture->GetAlphaSource();

	switch (alphaSource)
	{
	case fbxsdk::FbxTexture::eNone:
		hasAlpha = false;
		getAlphaFromRGB = false;
		break;
	case fbxsdk::FbxTexture::eRGBIntensity:
		hasAlpha = true;
		getAlphaFromRGB = true;
		break;
	case fbxsdk::FbxTexture::eBlack:
		hasAlpha = true;
		getAlphaFromRGB = false;
		break;
	default:
		break;
	}

	babylon_vector3 rot = texture->Rotation.Get();
	babylon_vector3 scaling = texture->Scaling.Get();

	babylon_vector2 trans((float)texture->GetTranslationU(), (float)texture->GetTranslationV());
	
	
	uOffset = trans.x;
	vOffset = trans.y;
	uScale = scaling.x;
	vScale = scaling.y;
	std::string strFileName = texture->GetFileName();
	auto lastDot = strFileName.find_last_of('.');
	auto ext = strFileName.substr(lastDot);
	if (_stricmp(ext.c_str(), ".dds") == 0) {
		vScale *= -1;
	}
	uAng = static_cast<float>(rot.x * Euler2Rad);
	vAng = static_cast<float>(rot.y * Euler2Rad);
	wAng = static_cast<float>(rot.z * Euler2Rad);
	auto uwrapMode = texture->GetWrapModeU();
	auto vwrapMode = texture->GetWrapModeV();
	wrapU = uwrapMode == FbxTexture::eRepeat;
	wrapV = vwrapMode == FbxTexture::eRepeat;

	uvset = texture->UVSet.Get();
	
	

}