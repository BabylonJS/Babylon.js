#include "stdafx.h"
#include "FbxVertexKey.h"

FbxVertexKey::FbxVertexKey()
{

}
FbxVertexKey::FbxVertexKey(int expectedCapacity)
{
	_keymembers.reserve(expectedCapacity);
}

FbxVertexKey::FbxVertexKey(const FbxVertexKey& copy):
_keymembers(copy._keymembers)
{

}
FbxVertexKey::FbxVertexKey(FbxVertexKey&& moved):
_keymembers(std::move(moved._keymembers)){

}

void FbxVertexKey::push(double dbl){
	_keymembers.push_back(dbl);
}
void FbxVertexKey::push(const double* dbls, int length){
	for (int i = 0; i < length; ++i){
		_keymembers.push_back(dbls[i]);
	}
}

FbxVertexKey& FbxVertexKey::operator = (const FbxVertexKey& copy){
	if (this != &copy){
		this->_keymembers = copy._keymembers;
	}
	return *this;
}
FbxVertexKey& FbxVertexKey::operator = (FbxVertexKey&& moved){
	if (this != &moved){
		this->_keymembers = std::move(moved._keymembers);
	}
	return *this;
}

FbxVertexKey::~FbxVertexKey()
{
}

bool FbxVertexKey::operator == (const FbxVertexKey& other)const {
	if (_keymembers.size() != other._keymembers.size()){
		return false;
	}

	for (size_t i = 0; i < _keymembers.size(); ++i){
		if (abs(_keymembers.at(i) - other._keymembers.at(i))>DBL_EPSILON){
			return false;
		}
	}
	return true;
}
bool FbxVertexKey::operator != (const FbxVertexKey& other)const {
	return !(*this == other);
}
//bool is_less(const FbxVector4& lhs, const FbxVector4& rhs){
//	for (int i = 0; i < 4; i++){
//		if (lhs[i] < rhs[i] - DBL_EPSILON){
//			return true;
//		}
//		else if (rhs[i] < lhs[i] - DBL_EPSILON){
//			return false;
//		}
//	}
//
//	return false;
//}
//bool is_less(const FbxVector2& lhs, const FbxVector2& rhs){
//	for (int i = 0; i < 2; i++){
//		if (lhs[i] < rhs[i] - DBL_EPSILON){
//			return true;
//		}
//		else if (rhs[i] < lhs[i] - DBL_EPSILON){
//			return false;
//		}
//	}
//
//	return false;
//}
bool FbxVertexKey::operator < (const FbxVertexKey& rhs)const {
	if (_keymembers.size() < rhs._keymembers.size()){
		return true;
	}
	else if (rhs._keymembers.size() < _keymembers.size()){
		return false;
	}

	for (size_t i = 0; i < _keymembers.size(); ++i){
		if (_keymembers.at(i) < rhs._keymembers.at(i) - DBL_EPSILON){
			return true;
		}
		else if (rhs._keymembers.at(i) < _keymembers.at(i) - DBL_EPSILON){
			return false;
		}
	}


	return false;
}
const std::vector<double>& FbxVertexKey::getKeyMembers() const{
	return _keymembers;
}
