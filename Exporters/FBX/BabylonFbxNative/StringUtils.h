#pragma once
#include <string>
#include <Windows.h>

inline std::string wstringToUtf8(const std::wstring& src) {
	auto size = WideCharToMultiByte(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), nullptr, 0, nullptr, nullptr);
	std::string result;
	result.resize(size, ' ');
	WideCharToMultiByte(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), &result[0], size, nullptr, nullptr);
	return result;
}



inline std::wstring utf8ToWstring(const std::string& src) {
	auto size = MultiByteToWideChar(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), nullptr, 0);
	std::wstring result;
	result.resize(size, ' ');
	MultiByteToWideChar(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), &result[0], size);
	return result;
}