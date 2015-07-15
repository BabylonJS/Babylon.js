#pragma once
#include <string>
#include <vector>
#include "BabylonVertex.h"
#include <cpprest\json.h>
class BabylonAnimationBase
{
public:
	/*
	"dataType": int (0 = float, 1 = vector3, 2 = quaternion, 3 = matrix),
    "framePerSecond": int,
    "loopBehavior": int (0 = relative, 1 = cycle, 2 = constant),
    "name": string,
    "property": string,
    "keys": array of AnimationKeys (see below),
    "autoAnimate": boolean,
    "autoAnimateFrom": int,
    "autoAnimateTo": int,
    "autoAnimateLoop": boolean

	*/
	static const int dataType_Float = 0;
	static const int dataType_Vector3 = 1;
	static const int dataType_Quaternion = 2;
	static const int dataType_Matrix = 3;
	static const int loopBehavior_Relative = 0;
	static const int loopBehavior_Cycle = 1;
	static const int loopBehavior_Constant = 2;
	int dataType;
	int loopBehavior;
	int framePerSecond;
	std::wstring name;
	std::wstring property;
	bool autoAnimate;
	int autoAnimateFrom;
	int autoAnimateTo;
	bool autoAnimateLoop;
	BabylonAnimationBase(int loopBehavior, int fps, const std::wstring& name, const std::wstring& animatedProperty, bool autoAnimate, int autoAnimateFrom, int autoAnimateTo, bool autoAnimateLoop);
	virtual ~BabylonAnimationBase(){}
};

template<typename T>
struct babylon_animation_key{
	/*
	"frame": int,
    "values": array of float (depending of animated value)
	*/
	int frame;
	T values;
};

template<typename T>
struct bab_anim_traits{

};

template<>
struct bab_anim_traits < babylon_vector3 >
{
	static const int dataType = BabylonAnimationBase::dataType_Vector3;

	static web::json::value jsonify(const babylon_vector3& value){
		auto jarray = web::json::value::array();
		jarray[0] = web::json::value::number(value.x);
		jarray[1] = web::json::value::number(value.y);
		jarray[2] = web::json::value::number(value.z);
		return jarray;
	}
};

template<>
struct bab_anim_traits < babylon_vector4 >
{
	static const int dataType = BabylonAnimationBase::dataType_Quaternion;

	static web::json::value jsonify(const babylon_vector4& value){
		auto jarray = web::json::value::array();
		jarray[0] = web::json::value::number(value.x);
		jarray[1] = web::json::value::number(value.y);
		jarray[2] = web::json::value::number(value.z);
		jarray[3] = web::json::value::number(value.w);
		return jarray;
	}
};

template<>
struct bab_anim_traits < FbxAMatrix >
{
	static const int dataType = BabylonAnimationBase::dataType_Matrix;

	static web::json::value jsonify(const FbxAMatrix& value){
		auto jmat = web::json::value::array();
		for (auto x = 0; x < 4; ++x){
			for (auto y = 0; y < 4; ++y){
				jmat[x * 4 + y] = web::json::value::number(value[x][y]);
			}
		}
		return jmat;
	}
};
template<>
struct bab_anim_traits < float >
{
	static const int dataType = BabylonAnimationBase::dataType_Float;

	static web::json::value jsonify(float value){
		auto jarray = web::json::value::array();
		jarray[0] = web::json::value::number(value);
		return jarray;
	}
};

template<typename T>
bool isNear(const T& lhs, const T& rhs);

template <>
inline bool isNear<float>(const float& lhs, const float& rhs){
	auto diff = lhs - rhs;
	return diff >= -0.000001f && diff <= 0.000001f;
}

template <>
inline bool isNear<FbxAMatrix>(const FbxAMatrix& lhs, const FbxAMatrix& rhs){
	return lhs == rhs;
}

template <>
inline bool isNear<babylon_vector3>(const babylon_vector3& lhs, const babylon_vector3& rhs){
	return isNear(lhs.x, rhs.x)
		&& isNear(lhs.y, rhs.y)
		&& isNear(lhs.z, rhs.z);
}
template <>
inline bool isNear<babylon_vector4>(const babylon_vector4& lhs, const babylon_vector4& rhs){
	return isNear(lhs.x, rhs.x)
		&& isNear(lhs.y, rhs.y)
		&& isNear(lhs.z, rhs.z)
		&& isNear(lhs.w, rhs.w);
}

template<typename T>
inline T lerp(const T& start, const T& end, float factor){
	return start + (end - start)*factor;
}

template<>
inline FbxAMatrix lerp(const FbxAMatrix& start, const FbxAMatrix& end, float factor){
	return start.Slerp(end, factor);
}
template<typename T>
bool isLinearInterpolation(const babylon_animation_key<T>& key0, const babylon_animation_key<T>& key1, const babylon_animation_key<T>& key2){
	auto testVal = lerp(key0.values, key2.values, static_cast<float>(key1.frame - key0.frame) / static_cast<float>(key2.frame - key0.frame));
	return isNear(testVal, key1.values);
}

template<typename T>
class BabylonAnimation : public BabylonAnimationBase
{
public:
	std::vector<babylon_animation_key<T>> keys;
	BabylonAnimation(int loopBehavior, int fps, const std::wstring& name, const std::wstring& animatedProperty, bool autoAnimate, int autoAnimateFrom, int autoAnimateTo, bool autoAnimateLoop) :
		BabylonAnimationBase(loopBehavior, fps, name, animatedProperty, autoAnimate, autoAnimateFrom, autoAnimateTo, autoAnimateLoop)
		
	{
		dataType = bab_anim_traits<T>::dataType;
	}

	void appendKey(const babylon_animation_key<T>& key){
		if (keys.size() <= 1){
			// nothing to simplify
			keys.push_back(key);
		}
		else{
			if (isNear(key.values, keys[keys.size() - 1].values) && isNear(key.values, keys[keys.size() - 2].values)){
				// if 3 times the same value, eliminate intermediate key
				keys.resize(keys.size() - 1);
				keys.push_back(key);
			}
			else if (isLinearInterpolation(keys[keys.size() - 2], keys[keys.size() - 1], key)){
				// if the 3 last values are linearly interpolated, eliminate the intermediate key
				keys.resize(keys.size() - 1);
				keys.push_back(key);

			}
			else{

				keys.push_back(key);
			}

		}
	}

	bool isConstant(){
		if (keys.size() < 2){
			return true;
		}
		if (keys.size() > 2){
			return false;
		}

		return isNear(keys[0].values, keys[1].values);
	}

	web::json::value toJson() const{
		auto jobj = web::json::value::object();

		/*
		"dataType": int (0 = float, 1 = vector3, 2 = quaternion, 3 = matrix),
		"framePerSecond": int,
		"loopBehavior": int (0 = relative, 1 = cycle, 2 = constant),
		"name": string,
		"property": string,
		"keys": array of AnimationKeys (see below),
		"autoAnimate": boolean,
		"autoAnimateFrom": int,
		"autoAnimateTo": int,
		"autoAnimateLoop": boolean

		*/

		jobj[L"dataType"] = web::json::value::number(dataType);
		jobj[L"framePerSecond"] = web::json::value::number(framePerSecond);
		jobj[L"loopBehavior"] = web::json::value::number(loopBehavior);
		jobj[L"name"] = web::json::value::string(name);
		jobj[L"property"] = web::json::value::string(property);
		jobj[L"autoAnimate"] = web::json::value::boolean(autoAnimate);
		jobj[L"autoAnimateFrom"] = web::json::value::number(autoAnimateFrom);
		jobj[L"autoAnimateTo"] = web::json::value::number(autoAnimateTo);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(autoAnimateLoop);

		auto jkeys = web::json::value::array();

		for (auto ix = 0u; ix < keys.size(); ++ix){
			auto jkey = web::json::value::object();
			jkey[L"frame"] = keys[ix].frame;
			jkey[L"values"] = bab_anim_traits<T>::jsonify(keys[ix].values);
			jkeys[jkeys.size()] = jkey;
		}

		jobj[L"keys"] = jkeys;

		return jobj;
	}
};


