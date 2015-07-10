#include "stdafx.h"
#include "FbxMaterialHandler.h"
#include "..\3rdParty\DirectXTex\DirectXTex.h"
#include <Windows.h>


FbxMaterialStore::FbxMaterialStore(const std::wstring& inputFolder, const std::wstring& outputFolder, TextureFormat textureFormat) : _inputFolder(inputFolder), _outputFolder(outputFolder), _textureFormat(textureFormat)
{
	CoInitialize(nullptr);
}


FbxMaterialStore::~FbxMaterialStore()
{
}

TextureFormat getTextureFormatFromFileName(const std::string& lowerCaseFileName){
	if (lowerCaseFileName.compare(lowerCaseFileName.size() - 4, 4, ".jpg") == 0 || lowerCaseFileName.compare(lowerCaseFileName.size() - 5, 5, ".jpeg") == 0){
		return TextureFormat::Jpg;
	}
	if (lowerCaseFileName.compare(lowerCaseFileName.size() - 4, 4, ".png") == 0){
		return TextureFormat::Png;
	}
	if (lowerCaseFileName.compare(lowerCaseFileName.size() - 4, 4, ".dds") == 0){
		return TextureFormat::Dds;
	}
	if (lowerCaseFileName.compare(lowerCaseFileName.size() - 4, 4, ".tga") == 0){
		return TextureFormat::Tga;
	}
	return TextureFormat::Unkwown;
}

void changeFileNameForFormat(std::string& fileName, TextureFormat format){
	auto indexOfDot = fileName.find_last_of('.');
	fileName.erase(indexOfDot + 1);
	switch (format)
	{
	case TextureFormat::Jpg:
		fileName.append("jpg");
		break;
	case TextureFormat::Png:
		fileName.append("png");
		break;
	case TextureFormat::Dds:
		fileName.append("dds");
		break;
	
	default:
		break;
	}
}

void convertTexture(const std::wstring& source, const std::wstring& dest, TextureFormat sourceFormat, TextureFormat destFormat, bool alpha){
	DirectX::ScratchImage srcImg;
	DirectX::TexMetadata srcMetadata;
	switch (sourceFormat)
	{	
	case TextureFormat::Dds:
		DirectX::LoadFromDDSFile(source.c_str(), 0, &srcMetadata, srcImg);
		break;
	case TextureFormat::Tga:
		DirectX::LoadFromTGAFile(source.c_str(), &srcMetadata, srcImg);
		break;
	default:
		DirectX::LoadFromWICFile(source.c_str(), 0, &srcMetadata, srcImg);
		break;
	}

	switch (destFormat)
	{
	case TextureFormat::Jpg:
		DirectX::SaveToWICFile(*srcImg.GetImage(0, 0, 0), 0, DirectX::GetWICCodec(DirectX::WICCodecs::WIC_CODEC_JPEG), dest.c_str());
		break;
	case TextureFormat::Png:
		DirectX::SaveToWICFile(*srcImg.GetImage(0, 0, 0), 0, DirectX::GetWICCodec(DirectX::WICCodecs::WIC_CODEC_PNG), dest.c_str());
		break;
	case TextureFormat::Dds:
	{
		DirectX::ScratchImage imgWithMipMaps;
		auto hr = DirectX::GenerateMipMaps(*srcImg.GetImage(0, 0, 0), DirectX::TEX_FILTER_FLAGS::TEX_FILTER_CUBIC, 0, imgWithMipMaps);

		DirectX::ScratchImage imgInBC2;
		//hr = DirectX::Convert(imgWithMipMaps.GetImages(), imgWithMipMaps.GetImageCount(), srcMetadata, DXGI_FORMAT_BC2_UNORM, DirectX::TEX_FILTER_FLAGS::TEX_FILTER_CUBIC, 0.5f, imgInBC2);
		hr = DirectX::Compress(imgWithMipMaps.GetImages(), imgWithMipMaps.GetImageCount(), imgWithMipMaps.GetMetadata(), alpha ? DXGI_FORMAT_BC3_UNORM : DXGI_FORMAT_BC1_UNORM, DirectX::TEX_COMPRESS_FLAGS::TEX_COMPRESS_DEFAULT | DirectX::TEX_COMPRESS_PARALLEL, 0.5f, imgInBC2);
		
		hr = DirectX::SaveToDDSFile(imgInBC2.GetImages(), imgInBC2.GetImageCount(), imgInBC2.GetMetadata(), 0, dest.c_str());
	}
		break;
	default:
		break;
	}
}

babylon_vector3 extractColorAndTexture(const FbxPropertyT<FbxDouble3>& colorRGB, const FbxPropertyT<FbxDouble>& factorProp, std::shared_ptr<babylon_texture>& oTexture, TextureFormat desiredTextureFormat, const std::wstring& srcDir, const std::wstring& outdir){
	babylon_vector3 color(0,0,0);
	if (colorRGB.IsValid()){
		auto ambient = colorRGB.Get();
		float factor = 1;
		if (factorProp.IsValid()){
			factor = (float) factorProp.Get();
		}
		color.x = (float) (ambient[0] * factor);
		color.y = (float) (ambient[1] * factor);
		color.z = (float) (ambient[2] * factor);
		auto texture = colorRGB.GetSrcObject<FbxFileTexture>();
		if (texture){
			std::string relativeFileName(texture->GetRelativeFileName());
			std::wstring wsourceFile(srcDir);
			if (*wsourceFile.rbegin() != L'\\'){
				wsourceFile.push_back(L'\\');
			}
			wsourceFile.append(std::begin(relativeFileName), std::end(relativeFileName));
			// check if file exists
			DWORD attrib = GetFileAttributes(wsourceFile.c_str());
			if (attrib != 0xFFFFFFFF)
			{
				oTexture.reset(new babylon_texture());
				std::transform(relativeFileName.begin(), relativeFileName.end(), relativeFileName.begin(), [](char c){return (char) tolower(c); });
				oTexture->name = relativeFileName;
				oTexture->hasAlpha = texture->GetAlphaSource() != FbxTexture::eNone;
				TextureFormat sourceTextureFormat = getTextureFormatFromFileName(relativeFileName);



				if (sourceTextureFormat == desiredTextureFormat){
					std::wstring wdestFile(outdir);
					if (*wdestFile.rbegin() != L'\\'){
						wdestFile.push_back(L'\\');
					}
					wdestFile.append(std::wstring(relativeFileName.begin(), relativeFileName.end()));
					CopyFile(wsourceFile.c_str(), wdestFile.c_str(), true);
				}
				else{
					changeFileNameForFormat(relativeFileName, desiredTextureFormat);
					oTexture->name = relativeFileName;
					std::wstring wdestFile(outdir);
					if (*wdestFile.rbegin() != L'\\'){
						wdestFile.push_back(L'\\');
					}
					wdestFile.append(std::wstring(relativeFileName.begin(), relativeFileName.end()));
					convertTexture(wsourceFile, wdestFile, sourceTextureFormat, desiredTextureFormat, oTexture->hasAlpha);
				}
			}

			
		}
	}
	return color;
}

const char* FbxMaterialStore::RegisterMaterial(FbxSurfaceMaterial* material){
	auto found = _materials.find(material);
	if (found != _materials.end()){
		return found->second.id.c_str();
	}



	babylon_material result;
	if (material){
		result.id = std::to_string(_materials.size());
		result.id.append(material->GetName());
		result.name = result.id;
		result.ambient = extractColorAndTexture(material->FindProperty(FbxSurfaceMaterial::sAmbient), material->FindProperty(FbxSurfaceMaterial::sAmbientFactor), result.ambientTexture, _textureFormat, _inputFolder, _outputFolder);
		result.diffuse = extractColorAndTexture(material->FindProperty(FbxSurfaceMaterial::sDiffuse), material->FindProperty(FbxSurfaceMaterial::sDiffuseFactor), result.diffuseTexture, _textureFormat, _inputFolder, _outputFolder);
		result.emissive = extractColorAndTexture(material->FindProperty(FbxSurfaceMaterial::sEmissive), material->FindProperty(FbxSurfaceMaterial::sEmissiveFactor), result.emissiveTexture, _textureFormat, _inputFolder, _outputFolder);
		if (material->FindProperty(FbxSurfaceMaterial::sNormalMap).IsValid()){
			auto texture = material->FindProperty(FbxSurfaceMaterial::sNormalMap).GetSrcObject<FbxFileTexture>();
			if (texture){
				result.bumpTexture.reset(new babylon_texture());
				result.bumpTexture->name = texture->GetRelativeFileName();
				result.bumpTexture->hasAlpha = texture->GetAlphaSource() != FbxTexture::eNone;
			}
		}
		result.alpha = 1;
		result.backFaceCulling = true;


		result.specular.x = 0;
		result.specular.y = 0;
		result.specular.z = 0;
		result.specularPower = 0;
		result.specular = extractColorAndTexture(material->FindProperty(FbxSurfaceMaterial::sSpecular), material->FindProperty(FbxSurfaceMaterial::sSpecularFactor), result.specularTexture, _textureFormat, _inputFolder, _outputFolder);
		if (material->FindProperty(FbxSurfaceMaterial::sShininess).IsValid()){
			result.specularPower = (float) material->FindProperty(FbxSurfaceMaterial::sShininess).Get<FbxDouble>();
		}
	}
	else{
		result.name = "default material";
		result.id = std::to_string(_materials.size());
		result.id.append(result.name);
		result.ambient = babylon_vector3(0.05f, 0.05f, 0.05f);
		result.diffuse = babylon_vector3(0.8f, 0.8f, 0.8f);
		result.emissive = babylon_vector3(0.0f, 0.0f, 0.0f);
		
		result.alpha = 1;
		result.backFaceCulling = true;


		result.specular.x = 1;
		result.specular.y = 1;
		result.specular.z = 1;
		result.specularPower = 8;
		
	}

	return _materials.insert(std::pair<FbxSurfaceMaterial*, babylon_material>(material, result)).first->second.id.c_str();

}