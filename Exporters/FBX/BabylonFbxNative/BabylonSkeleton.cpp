#include "stdafx.h"
#include "BabylonSkeleton.h"


BabylonSkeleton::BabylonSkeleton()
{
}



web::json::value BabylonBone::toJson(){
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"index"] = web::json::value::number(index);
	jobj[L"parentBoneIndex"] = web::json::value::number(parentBoneIndex);

	auto jmat = web::json::value::array();
	for (auto x = 0; x < 4; ++x){
		for (auto y = 0; y < 4; ++y){
			jmat[x * 4 + y] = web::json::value::number(matrix[x][y]);
		}
	}
	jobj[L"matrix"] = jmat;
	if (animation){
		jobj[L"animation"] = animation->toJson();
	}
	return jobj;
}


web::json::value BabylonSkeleton::toJson(){
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"id"] = web::json::value::number(id);
	auto jbones = web::json::value::array();
	for (auto ix = 0u; ix < bones.size(); ++ix){
		jbones[ix] = bones[ix].toJson();
	}
	jobj[L"bones"] = jbones;
	return jobj;
}