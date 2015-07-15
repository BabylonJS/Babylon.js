#pragma once
#include <fbxsdk.h>
#include "FbxLoadException.h"
#include <map>
#include <vector>
#include "FbxVertexKey.h"
#include "FbxMaterialHandler.h"

template<typename T>
T extractElementValue(FbxLayerElementTemplate<T>* element, int polygon, int edge, int vertexIndex, int controlPointIndex){
	auto mappingMode = element->GetMappingMode();
	auto referenceMode = element->GetReferenceMode();
	int index = 0;
	switch (mappingMode){
	case FbxLayerElementTemplate<T>::eAllSame:
		index = 0;
		break;
	case FbxLayerElementTemplate<T>::eByControlPoint:
		index = controlPointIndex;
		break;
	case FbxLayerElementTemplate<T>::eByPolygon:
		index = polygon;
		break;
	case FbxLayerElementTemplate<T>::eByPolygonVertex:
		index = vertexIndex;
		break;
	case FbxLayerElementTemplate<T>::eByEdge:
		index = edge;
		break;
	}
	if (referenceMode == FbxLayerElementTemplate<T>::eIndex || referenceMode == FbxLayerElementTemplate<T>::eIndexToDirect){
		index = element->GetIndexArray().GetAt(index);
	}

	return element->GetDirectArray().GetAt(index);
}

template<typename VertexType>
babylon_mesh<VertexType> loadStaticMesh(FbxMesh* mesh, FbxScene* scene, FbxMaterialStore& materialHandler){
	throw UnknownVertexTypeException("unknown vertex type");
}


template<typename VertexType>
struct Submesh{
	std::string materialId;
	std::map<FbxVertexKey, int> resolvedVertices;
	std::vector<VertexType> vertices;
	std::vector<int> indices;
};


FbxAMatrix ComputeTotalMatrix(FbxNode* Node)
{
	FbxAMatrix Geometry;
	FbxVector4 Translation, Rotation, Scaling;
	Translation = Node->GetGeometricTranslation(FbxNode::eSourcePivot);
	Rotation = Node->GetGeometricRotation(FbxNode::eSourcePivot);
	Scaling = Node->GetGeometricScaling(FbxNode::eSourcePivot);
	Geometry.SetT(Translation);
	Geometry.SetR(Rotation);
	Geometry.SetS(Scaling);

	//For Single Matrix situation, obtain transfrom matrix from eDESTINATION_SET, which include pivot offsets and pre/post rotations.
	FbxAMatrix& GlobalTransform = Node->GetAnimationEvaluator()->GetNodeGlobalTransform(Node);

	FbxAMatrix TotalMatrix;
	TotalMatrix = GlobalTransform * Geometry;

	return TotalMatrix;
}

bool IsOddNegativeScale(FbxAMatrix& TotalMatrix)
{
	FbxVector4 Scale = TotalMatrix.GetS();
	int32_t NegativeNum = 0;

	if (Scale[0] < 0) NegativeNum++;
	if (Scale[1] < 0) NegativeNum++;
	if (Scale[2] < 0) NegativeNum++;

	return NegativeNum == 1 || NegativeNum == 3;
}


template<>
babylon_mesh<babylon_vertex_normal_uv_color> loadStaticMesh<babylon_vertex_normal_uv_color>(FbxMesh* mesh, FbxScene* scene, FbxMaterialStore& materialHandler){
	auto node = mesh->GetNode();
	std::map<FbxSurfaceMaterial*, Submesh<babylon_vertex_normal_uv_color>> submeshes;
	mesh->RemoveBadPolygons();
	// ensure mesh has normals
	mesh->GenerateNormals();

	FbxGeometryConverter geometryConverter(mesh->GetFbxManager());
	geometryConverter.ComputePolygonSmoothingFromEdgeSmoothing(mesh);
	if (!mesh->IsTriangleMesh()){
		// triangulate
		mesh = (FbxMesh*)geometryConverter.Triangulate(mesh, false);
	}

	FbxStringList uvSetNameList;
	mesh->GetUVSetNames(uvSetNameList);
	int uvCount = uvSetNameList.GetCount();
	bool hasUv = uvCount > 0;
	char* uvSetName = nullptr;
	// consider Max 1 uv coordiantes
	if (hasUv){
		uvSetName = uvSetNameList.GetStringAt(0);
	}
	using namespace std;

	auto normals = mesh->GetElementNormal();
	FbxGeometryElementUV* uvs = nullptr;
	if (hasUv){
		uvs = mesh->GetElementUV(uvSetName);
	}
	auto colors = mesh->GetElementVertexColor();
	auto materials = mesh->GetElementMaterial();

	FbxAMatrix totalMatrix;
	FbxAMatrix totalMatrixForNormal;
	totalMatrix = ComputeTotalMatrix(node);
	totalMatrixForNormal = totalMatrix.Inverse();
	totalMatrixForNormal = totalMatrixForNormal.Transpose();

	// polygons have been triangulated. so we do not bother with polygon sizes;
	for (int i = 0; i < mesh->GetPolygonVertexCount(); ++i){
		auto polygonIndex = i / 3;
		auto indexInPolygon = i % 3;

		
		
		auto controlPointIndex = mesh->GetPolygonVertex(polygonIndex, indexInPolygon);
		auto edgeIndex = mesh->GetMeshEdgeIndexForPolygon(polygonIndex, indexInPolygon);
		FbxVertexKey vertexKey(12);
		FbxVector4 normal(0, 0, 0, 0);
		FbxColor color(0, 0, 0, 1);
		FbxVector2 uv(0, 0);
		if (normals){
			normal = extractElementValue(normals, polygonIndex, edgeIndex, i, controlPointIndex);
			normal.Normalize();
		}
		if (colors){
			color = extractElementValue(colors, polygonIndex, edgeIndex, i, controlPointIndex);
		}

		if (hasUv){
			uv = extractElementValue(uvs, polygonIndex, edgeIndex, i, controlPointIndex);
		}
		FbxSurfaceMaterial* material = nullptr;
		if (materials){
			material = extractElementValue(materials, polygonIndex, edgeIndex, i, controlPointIndex);
		}
		auto submeshNode = submeshes.find(material);
		
		if (submeshNode == submeshes.end()){
			submeshNode = submeshes.insert(std::pair<FbxSurfaceMaterial*, Submesh<babylon_vertex_normal_uv_color>>(material, Submesh<babylon_vertex_normal_uv_color>())).first;
		}

		auto& submesh = submeshNode->second;

		vertexKey.push(totalMatrix.MultT(mesh->GetControlPointAt(controlPointIndex)), 3);
		vertexKey.push(totalMatrixForNormal.MultT(normal), 3);
		vertexKey.push(uv, 2);
		vertexKey.push((double*)&color, 4);

		auto found = submesh.resolvedVertices.find(vertexKey);
		if (found != submesh.resolvedVertices.end()){
			submesh.indices.push_back(found->second);
		}
		else{
			int index = submesh.resolvedVertices.size();
			babylon_vertex_normal_uv_color babVertex;
			auto& elements = vertexKey.getKeyMembers();
			babVertex.pos_x = (float) elements.at(0);
			babVertex.pos_y = (float) elements.at(1);
			babVertex.pos_z = (float) elements.at(2);
			babVertex.normal_x = (float) elements.at(3);
			babVertex.normal_y = (float) elements.at(4);
			babVertex.normal_z = (float) elements.at(5);
			babVertex.uv_x = (float) elements.at(6);
			babVertex.uv_y = (float) elements.at(7);
			babVertex.color_r = (float) elements.at(8);
			babVertex.color_g = (float) elements.at(9);
			babVertex.color_b = (float) elements.at(10);
			babVertex.color_a = (float) elements.at(11);
			submesh.vertices.push_back(babVertex);
			submesh.indices.push_back(index);
			submesh.resolvedVertices.insert(std::pair<FbxVertexKey, int>(std::move(vertexKey), index));
		}
	}
	int totalVertices = 0;
	int totalIndices = 0;
	for (auto&& submesh : submeshes){
		totalVertices += submesh.second.vertices.size();
		totalIndices += submesh.second.indices.size();
	}
	std::vector<babylon_vertex_normal_uv_color>vertices(totalVertices);
	std::vector<int> indices(totalIndices);
	std::vector<babylon_submesh> finalSubmeshes;
	int verticesFilled=0;
	int indicesFilled=0;
	for (auto&& submesh : submeshes){
		// use C based arrays for efficiency
		babylon_vertex_normal_uv_color* vertexOutput = &vertices[verticesFilled];
		int* indexOutput = &indices[indicesFilled];

		babylon_vertex_normal_uv_color* vertexInput = &submesh.second.vertices[0];
		int* indexInput = &submesh.second.indices[0];

		memcpy_s(vertexOutput, sizeof(babylon_vertex_normal_uv_color) * (totalVertices - verticesFilled), vertexInput, sizeof(babylon_vertex_normal_uv_color) *submesh.second.vertices.size());
		memcpy_s(indexOutput, sizeof(int) * (totalIndices - indicesFilled), indexInput, sizeof(int) *submesh.second.indices.size());
		// reoffseting indices (webGL does not support "base vertex")
		// perf: this loop should be autoparallelized / autovectorized
		for (int i = 0; i < submesh.second.indices.size(); ++i){
			indexOutput[i] += verticesFilled;
		}
		babylon_submesh babSubmesh;
		babSubmesh.material_id = materialHandler.RegisterMaterial(submesh.first);
		babSubmesh.index_start = indicesFilled;
		babSubmesh.index_count = submesh.second.indices.size();
		finalSubmeshes.push_back(babSubmesh);
		verticesFilled += submesh.second.vertices.size();
		indicesFilled += submesh.second.indices.size();
	}
	return babylon_mesh<babylon_vertex_normal_uv_color>(mesh->GetName(), std::move(vertices), std::move(indices), std::move(finalSubmeshes), node->GetAnimationEvaluator()->GetNodeGlobalTransform(node));
}