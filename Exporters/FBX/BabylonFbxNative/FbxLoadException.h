#pragma once
#include <exception>

class FbxLoadException : public std::exception
{
public:
	explicit FbxLoadException(const char* message);
	~FbxLoadException();
};

class UnknownVertexTypeException : public std::exception{

public:
	explicit UnknownVertexTypeException(const char* message);
	~UnknownVertexTypeException();
};

