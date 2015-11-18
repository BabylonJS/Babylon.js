#pragma once
#include <string>
#include <vector>
#include <fbxsdk.h>
#include <cpprest\json.h>
#include "BabylonAnimation.h"

class BabylonBone{
public:

	std::wstring name;
	int index;
	int parentBoneIndex = -1;
	FbxMatrix matrix;
	std::shared_ptr<BabylonAnimation<FbxMatrix>> animation;
	web::json::value toJson();
	BabylonBone() = default;
	BabylonBone(const BabylonBone&) = default;
	BabylonBone(BabylonBone&& moved) :
		name(std::move(moved.name)),
		index(std::move(moved.index)),
		parentBoneIndex(std::move(moved.parentBoneIndex)),
		matrix(std::move(moved.matrix)),
		animation(std::move(moved.animation))
	{}
	//public BabylonAnimation animation{ get; set; }
};
class BabylonSkeleton
{
public:
	int id;

	std::wstring name;

	std::vector<BabylonBone> bones;

	web::json::value toJson();
	BabylonSkeleton();
	BabylonSkeleton(const BabylonSkeleton&) = default;
	BabylonSkeleton(BabylonSkeleton&& moved) :
		id(std::move(moved.id)),
		name(std::move(moved.name)),
		bones(std::move(moved.bones))
	{

	}
};

