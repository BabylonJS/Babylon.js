//#pragma once
//#include "BabylonVertex.h"
//#include <cpprest\json.h>
//#include <exception>
//
//
//web::json::value exportTexture(const babylon_texture& texture){
//
//	web::json::value obj = web::json::value::object();
//	obj[L"name"] = web::json::value(std::wstring(texture.name.begin(), texture.name.end()));
//	obj[L"level"] = web::json::value(1);
//	obj[L"hasAlpha"] = web::json::value(texture.hasAlpha);
//	obj[L"coordinatesMode"] = web::json::value(0);
//	obj[L"isCube"] = web::json::value::boolean(false);
//	obj[L"uOffset"] = web::json::value(0);
//	obj[L"vOffset"] = web::json::value(0);
//	obj[L"uScale"] = web::json::value(1);
//	obj[L"vScale"] = web::json::value(1);
//	obj[L"uAng"] = web::json::value(0);
//	obj[L"vAng"] = web::json::value(0);
//	obj[L"wAng"] = web::json::value(0);
//	obj[L"wrapU"] = web::json::value(1);
//	obj[L"wrapV"] = web::json::value(1);
//	obj[L"coordinatesIndex"] = web::json::value(0);
//	obj[L"isRenderTarget"] = web::json::value::boolean(false);
//	obj[L"renderTargetSize"] = web::json::value(0);
//	return obj;
//}
//web::json::value exportCamera(const babylon_camera& camera){
//
//	web::json::value obj = web::json::value::object();
//	obj[L"name"] = web::json::value(std::wstring(camera.name.begin(), camera.name.end()));
//	obj[L"id"] = web::json::value(std::wstring(camera.id.begin(), camera.id.end()));
//	writeVector3(obj, L"position", camera.position);
//	writeVector3(obj, L"target", camera.target);
//	writeVector3(obj, L"rotation", camera.rotation);
//	obj[L"fov"] = web::json::value(camera.fov);
//	obj[L"minZ"] = web::json::value(camera.minZ);
//	obj[L"maxZ"] = web::json::value(camera.maxZ);
//	obj[L"speed"] = web::json::value(camera.speed);
//	obj[L"inertia"] = web::json::value(camera.inertia);
//	obj[L"checkCollisions"] = web::json::value(camera.checkCollisions);
//	obj[L"applyGravity"] = web::json::value(camera.applyGravity);
//	writeVector3(obj, L"ellipsoid", camera.ellipsoid);
//	return obj;
//}
//web::json::value exportMaterial(const babylon_material& material){
//	web::json::value obj = web::json::value::object();
//	obj[L"name"] = web::json::value(std::wstring(material.name.begin(), material.name.end()));
//	obj[L"id"] = web::json::value(std::wstring(material.id.begin(), material.id.end()));
//	obj[L"backFaceCulling"] = web::json::value::boolean(material.backFaceCulling);
//	writeVector3(obj, L"ambient", material.ambient);
//	writeVector3(obj, L"diffuse", material.diffuse);
//	writeVector3(obj, L"specular", material.specular);
//	writeVector3(obj, L"emissive", material.emissive);
//	obj[L"specularPower"] = web::json::value(material.specularPower);
//	obj[L"alpha"] = web::json::value(material.alpha);
//	if (material.diffuseTexture){
//		obj[L"diffuseTexture"] = exportTexture(*material.diffuseTexture);
//	}
//	if (material.ambientTexture){
//		obj[L"ambientTexture"] = exportTexture(*material.ambientTexture);
//	}
//	if (material.opacityTexture){
//		obj[L"opacityTexture"] = exportTexture(*material.opacityTexture);
//	}
//	if (material.reflectionTexture){
//		obj[L"reflectionTexture"] = exportTexture(*material.reflectionTexture);
//	}
//	if (material.emissiveTexture){
//		obj[L"emissiveTexture"] = exportTexture(*material.emissiveTexture);
//	}
//	if (material.specularTexture){
//		obj[L"specularTexture"] = exportTexture(*material.specularTexture);
//	}
//	if (material.bumpTexture){
//		obj[L"bumpTexture"] = exportTexture(*material.bumpTexture);
//	}
//	return obj;
//}
//web::json::value exportScene(const babylon_global_settings& globalSettings, const std::vector<babylon_material>& materials, const std::vector<babylon_mesh<babylon_vertex_normal_uv_color>>& meshes, bool reorderIndices = true){
//	
//	std::vector<babylon_boundingbox> boxes;
//	for (auto& m : meshes){
//		boxes.push_back(m.getBoundingBox());
//	}
//
//	babylon_boundingbox bbox = mergeBoundingBoxes(boxes);
//	babylon_camera camera = buildCameraFromBoundingBox(bbox);
//	
//	auto result = web::json::value::object();
//	result[L"autoClear"] = web::json::value::boolean(globalSettings.autoClear);
//	writeVector3(result, L"clearColor", globalSettings.clearColor);
//	writeVector3(result, L"ambientColor", globalSettings.ambientColor);
//	result[L"fogMode"] = globalSettings.fogMode;
//	writeVector3(result, L"fogColor", globalSettings.fogColor);
//	result[L"fogStart"] = globalSettings.fogStart;
//	result[L"fogEnd"] = globalSettings.fogEnd;
//	result[L"fogDensity"] = globalSettings.fogDensity;
//	writeVector3(result, L"gravity", globalSettings.gravity);
//	result[L"multiMaterials"] = web::json::value::array();
//	result[L"materials"] = web::json::value::array();
//	result[L"lights"] = web::json::value::array();
//	web::json::value defaultLight = web::json::value::object();
//	writeVector3(defaultLight, L"diffuse", babylon_vector3(1, 1, 1));
//	writeVector3(defaultLight, L"specular", babylon_vector3(1, 1, 1));
//	writeVector3(defaultLight, L"position", babylon_vector3(bbox.getMinX()*2, bbox.getMaxY()*2, bbox.getMinZ()*2));
//	defaultLight[L"type"] = web::json::value(0);
//	defaultLight[L"direction"] = web::json::value::null();
//	defaultLight[L"id"] = web::json::value(L"default light");
//	defaultLight[L"name"] = web::json::value(L"default light");
//	defaultLight[L"intensity"] = web::json::value(1);
//	result[L"lights"][0] = defaultLight;
//	result[L"cameras"] = web::json::value::array();
//	result[L"cameras"][0] = exportCamera(camera);
//	result[L"activeCamera"] = web::json::value(std::wstring(camera.id.begin(), camera.id.end()));
//	for (auto&& mat : materials){
//		result[L"materials"][result[L"materials"].size()] = exportMaterial(mat);
//	}
//	result[L"meshes"] = web::json::value::array();
//	int meshesAdded = 0;
//	for (auto&& mesh : meshes){
//		auto meshObj = web::json::value::object();
//		meshObj[L"name"] = web::json::value(std::wstring(mesh.getName().begin(), mesh.getName().end()));
//		std::wstring id(std::to_wstring(meshesAdded));
//		id.append(L"-");
//		id.append(mesh.getName().begin(), mesh.getName().end());
//		meshObj[L"id"] = web::json::value(id);
//		auto positions = web::json::value::array();
//		auto normals =  web::json::value::array();
//		auto uvs = web::json::value::array();
//		for (auto&& vertex : mesh.getVertices()){
//			writeVector3IntoStream(positions, babylon_vector3(vertex.pos_x, vertex.pos_y, vertex.pos_z));
//			writeVector3IntoStream(normals, babylon_vector3(vertex.normal_x, vertex.normal_y, vertex.normal_z));
//			writeVector2IntoStream(uvs, vertex.uv_x, vertex.uv_y);
//		}
//		meshObj[L"positions"] = positions;
//		meshObj[L"normals"] = normals;
//		meshObj[L"uvs"] = uvs;
//
//		auto indices = web::json::value::array();
//		if (!reorderIndices){
//			for (auto&& index : mesh.getIndices()){
//				indices[indices.size()] = index;
//			}
//		}
//		else{
//			for (int i = 0; i < mesh.getIndices().size(); i += 3){
//				indices[i] = mesh.getIndices()[i];
//				indices[i+1] = mesh.getIndices()[i+2];
//				indices[i+2] = mesh.getIndices()[i+1];
//			}
//		}
//		
//		meshObj[L"indices"] = indices;
//		std::wstring materialId(id);
//		materialId.append(L"_material");
//		meshObj[L"materialId"] = web::json::value(materialId);
//		meshObj[L"isEnabled"] = web::json::value::boolean(true);
//		meshObj[L"isVisible"] = web::json::value::boolean(true);
//		meshObj[L"billboardMode"] = web::json::value(0);
//		FbxVector4 translation = mesh.getTransform().GetT();
//		FbxVector4 rotation = mesh.getTransform().GetR();
//		FbxVector4 scaling = mesh.getTransform().GetS();
//		double sign;
//		writeVector3(meshObj, L"position", babylon_vector3((float)translation[0], (float)translation[1], (float)translation[2]));
//		writeVector3(meshObj, L"rotation", babylon_vector3((float) rotation[0], (float) rotation[1], (float) rotation[2]));
//		writeVector3(meshObj, L"scaling", babylon_vector3((float) scaling[0], (float) scaling[1], (float) scaling[2]));
//		//writeMatrix(meshObj, L"localMatrix", mesh.getTransform());
//		auto multiMaterial = web::json::value::object();
//		multiMaterial[L"id"] = web::json::value(materialId);
//		multiMaterial[L"name"] = web::json::value(materialId);
//		multiMaterial[L"materials"] = web::json::value::array();
//		meshObj[L"subMeshes"] = web::json::value::array();
//		for (int i = 0; i < mesh.getSubmeshes().size(); ++i){
//			auto& submesh = mesh.getSubmeshes().at(i);
//			multiMaterial[L"materials"][i] = web::json::value(std::wstring(submesh.material_id.begin(), submesh.material_id.end()));
//			meshObj[L"subMeshes"][i] = web::json::value::object();
//			meshObj[L"subMeshes"][i][L"materialIndex"] = web::json::value(i);
//			meshObj[L"subMeshes"][i][L"indexStart"] = web::json::value(submesh.index_start);
//			meshObj[L"subMeshes"][i][L"indexCount"] = web::json::value(submesh.index_count);
//			meshObj[L"subMeshes"][i][L"verticesCount"] = web::json::value(mesh.getUniqueIndexCount(submesh));
//		}
//		result[L"multiMaterials"][result[L"multiMaterials"].size()] = multiMaterial;
//
//		result[L"meshes"][meshesAdded] = meshObj;
//		meshesAdded++;
//	}
//	return result;
//}