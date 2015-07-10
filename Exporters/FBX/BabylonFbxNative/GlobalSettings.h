#pragma once
#include <fbxsdk.h>
class GlobalSettings
{
private:

	GlobalSettings();
public:
	FbxTime::EMode AnimationsTimeMode = FbxTime::eFrames24;
	double AnimationsFrameRate(){
		return FbxTime::GetFrameRate(AnimationsTimeMode);
	}
	static GlobalSettings& Current();
};
