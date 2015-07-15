#include "stdafx.h"
#include "GlobalSettings.h"



GlobalSettings::GlobalSettings()
{
}

GlobalSettings& GlobalSettings::Current(){
	static GlobalSettings settings;
	return settings;
}