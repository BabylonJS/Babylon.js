#include "stdafx.h"
#include "FbxLoadException.h"


FbxLoadException::FbxLoadException(const char* message) : std::exception(message)
{
}


FbxLoadException::~FbxLoadException()
{
}


UnknownVertexTypeException::UnknownVertexTypeException(const char* message) : std::exception(message)
{
}


UnknownVertexTypeException::~UnknownVertexTypeException()
{
}
