#pragma once
#include <cstdint>
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
	std::uint32_t AnimStackIndex = 0;
	static GlobalSettings& Current();
};
