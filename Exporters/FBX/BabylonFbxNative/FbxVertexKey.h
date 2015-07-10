#pragma once
#include "BabylonVertex.h"
class FbxVertexKey
{
private:
	std::vector<double> _keymembers;
	
public:
	FbxVertexKey();
	FbxVertexKey(int expectedCapacity);
	FbxVertexKey(const FbxVertexKey& copy);
	FbxVertexKey(FbxVertexKey&& moved);
	FbxVertexKey& operator=(const FbxVertexKey& copy);
	FbxVertexKey& operator=(FbxVertexKey&& moved);
	~FbxVertexKey();

	void push(double dbl);
	void push(const double* dbl, int length);

	bool operator==(const FbxVertexKey& other) const;
	bool operator!=(const FbxVertexKey& other) const;
	bool operator<(const FbxVertexKey& other) const;

	const std::vector<double>& getKeyMembers() const;
};

