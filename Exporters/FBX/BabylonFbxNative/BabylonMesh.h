#pragma once
#include "BabylonAbstractMesh.h"
#include <vector>
#include <cstdint>
#include "BabylonAnimation.h"
#include "SkinInfo.h"

struct BabylonSubmesh{
	int materialIndex;
	int verticesStart;
	int verticesCount;
	int indexStart;
	int indexCount;


	web::json::value toJson();
};

class BabylonMesh :
	public BabylonAbstractMesh
{
private:
	std::wstring _id;
	std::wstring _parentId;
	std::wstring _materialId;
	bool _isEnabled;
	bool _isVisible;
	bool _pickable;
	std::vector<babylon_vector3> _positions;
	std::vector<babylon_vector3> _normals;
	std::vector<babylon_vector2> _uvs;
	std::vector<babylon_vector2> _uvs2;
	std::vector<babylon_vector2> _uvs3;
	std::vector<babylon_vector2> _uvs4;
	std::vector<babylon_vector2> _uvs5;
	std::vector<babylon_vector2> _uvs6;
	std::vector<babylon_color> _colors;
	bool _hasVertexAlpha;
	std::vector<std::uint32_t> _boneIndices;
	std::vector<babylon_vector4> _boneWeights;
	std::vector<std::uint32_t> _indices;
	bool _checkCollision;
	bool _receiveShadows;
	bool _infiniteDistance;
	int _billboardMode;
	float _visibility;
	std::vector<BabylonSubmesh> _submeshes;
	std::vector<BabylonAbstractMesh> _instances;
	int _skeletonId;
	bool _autoAnimate;
	int _autoAnimateFrom;
	int _autoAnimateTo;
	bool _autoAnimateLoop;
	bool _showBoundingBox;
	bool _showSubMeshesBoundingBox;
	bool _applyFog;
	int _alphaIndex;
public:
	std::shared_ptr<BabylonSkeleton> associatedSkeleton;

	std::vector<std::shared_ptr < BabylonAnimationBase>> animations;
	FbxMatrix pivotMatrix;
	std::vector<std::string> uvsets;
	const std::wstring& id(){ return _id; }
	const std::wstring& parentId(){ return _parentId; }
	const std::wstring& materialId(){ return _materialId; }
	bool isEnabled(){ return _isEnabled; }
	bool isVisible(){ return _isVisible; }
	bool pickable(){ return _pickable; }
	std::vector<babylon_vector3>& positions(){ return _positions; }
	std::vector<babylon_vector3>& normals(){ return _normals; }
	std::vector<babylon_vector2>& uvs(){ return _uvs; }
	std::vector<babylon_vector2>& uvs2(){ return _uvs2; }
	std::vector<babylon_color>& colors(){ return _colors; }
	bool hasVertexAlpha(){ return _hasVertexAlpha; }
	std::vector<std::uint32_t>& boneIndices(){ return _boneIndices; }
	std::vector<babylon_vector4>& boneWeights(){ return _boneWeights; }
	std::vector<std::uint32_t>& indices(){ return _indices; }
	bool checkCollision(){ return _checkCollision; }
	bool receiveShadows(){ return _receiveShadows; }
	bool infiniteDistance(){ return _infiniteDistance; }
	int billboardMode(){ return _billboardMode; }
	float visibility(){ return _visibility; }
	std::vector<BabylonSubmesh>& submeshes(){ return _submeshes; }
	std::vector<BabylonAbstractMesh>& instances(){ return _instances; }
	int skeletonId(){ return _skeletonId; }
	bool autoAnimate(){ return _autoAnimate; }
	int autoAnimateFrom(){ return _autoAnimateFrom; }
	int autoAnimateTo(){ return _autoAnimateTo; }
	bool autoAnimateLoop(){ return _autoAnimateLoop; }
	bool showBoundingBox(){ return _showBoundingBox; }
	bool showSubMeshesBoundingBox(){ return _showSubMeshesBoundingBox; }
	bool applyFog(){ return _applyFog; }
	int alphaIndex(){ return _alphaIndex; }

	void id(const std::wstring& value){ _id = value; }
	void parentId(const std::wstring& value){ _parentId = value; }
	void materialId(const std::wstring& value){ _materialId = value; }
	void isEnabled(bool value){ _isEnabled = value; }
	void isVisible(bool value){ _isVisible = value; }
	void pickable(bool value){ _pickable = value; }
	void hasVertexAlpha(bool value){ _hasVertexAlpha = value; }
	void checkCollision(bool value){ _checkCollision = value; }
	void receiveShadows(bool value){ _receiveShadows = value; }
	void infiniteDistance(bool value){ _infiniteDistance = value; }
	void billboardMode(int value){ _billboardMode = value; }
	void visibility(float value){ _visibility = value; }
	void skeletonId(int value){ _skeletonId = value; }
	void autoAnimate(bool value){ _autoAnimate = value; }
	void autoAnimateFrom(int value){ _autoAnimateFrom = value; }
	void autoAnimateTo(int value){ _autoAnimateTo = value; }
	void autoAnimateLoop(bool value){ _autoAnimateLoop = value; }
	void showBoundingBox(bool value){ _showBoundingBox = value; }
	void showSubMeshesBoundingBox(bool value){ _showSubMeshesBoundingBox = value; }
	void applyFog(bool value){ _applyFog = value; }
	void alphaIndex(int value){ _alphaIndex = value; }


	

	virtual web::json::value toJson() override;
	BabylonMesh();
	BabylonMesh(BabylonNode* node);
	BabylonMesh(const BabylonMesh&) = default;
	BabylonMesh(BabylonMesh&& moved);
	void addInstance(BabylonNode* node);
	virtual ~BabylonMesh();
};

