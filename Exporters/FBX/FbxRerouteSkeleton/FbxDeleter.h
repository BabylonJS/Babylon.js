#pragma once
#include <fbxsdk.h>
template <typename T>
struct FbxBaseDeleter{
	void operator()(T* fbxObject){
		fbxObject->Destroy();
	}
};

struct FbxManagerDeleter : public FbxBaseDeleter<FbxManager>{};
struct FbxDeleter : public FbxBaseDeleter<FbxObject>{};