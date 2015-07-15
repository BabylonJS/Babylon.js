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
};

