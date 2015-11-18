#pragma once
#include <vector>
#include <set>
#include <string>
#include <memory>
#include <fbxsdk.h>
#include <cpprest\json.h>

struct babylon_vector4{
	float x;
	float y;
	float z;
	float w;
	babylon_vector4() :x(0), y(0), z(0), w(0){}
	babylon_vector4(float x, float y, float z, float w) :x(x), y(y), z(z), w(w){}
	babylon_vector4(const babylon_vector4& v) :x(v.x), y(v.y), z(v.z), w(v.w) {}
	babylon_vector4(const FbxQuaternion& v) :x(static_cast<float>(v[0])), y(static_cast<float>(v[1])), z(static_cast<float>(v[2])), w(static_cast<float>(v[3])) {}
};
struct babylon_vector3{
	float x;
	float y;
	float z;
	babylon_vector3() :x(0), y(0), z(0){}
	babylon_vector3(float x, float y, float z) :x(x), y(y), z(z){}
	babylon_vector3(const babylon_vector3& v) :x(v.x), y(v.y), z(v.z){}
	babylon_vector3(const FbxDouble3& v) : x((float) v[0]), y((float) v[1]), z((float) v[2]){}
	babylon_vector3(const FbxDouble4& v) : x((float) v[0]), y((float) v[1]), z((float) v[2]){}
};

inline babylon_vector3 operator *(const babylon_vector3& v, float factor){
	return babylon_vector3(v.x*factor, v.y*factor, v.z*factor);
}
inline babylon_vector3 operator *(float factor, const babylon_vector3& v){
	return v*factor;
}

inline babylon_vector3 operator + (const  babylon_vector3& lhs, const  babylon_vector3& rhs){
	return babylon_vector3(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z);
}
inline babylon_vector3 operator - (const  babylon_vector3& lhs, const  babylon_vector3& rhs){
	return babylon_vector3(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z);
}



inline babylon_vector4 operator *(const babylon_vector4& v, float factor){
	return babylon_vector4(v.x*factor, v.y*factor, v.z*factor, v.w*factor);
}
inline babylon_vector4 operator *(float factor, const babylon_vector4& v){
	return v*factor;
}

inline babylon_vector4 operator + (const  babylon_vector4& lhs, const  babylon_vector4& rhs){
	return babylon_vector4(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z, lhs.w+rhs.w);
}
inline babylon_vector4 operator - (const  babylon_vector4& lhs, const  babylon_vector4& rhs){
	return babylon_vector4(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z, lhs.w - rhs.w);
}




inline bool operator <(const babylon_vector3& lhs, const babylon_vector3& rhs){
	if (lhs.x < rhs.x){
		return true;
	}
	else if (lhs.x > rhs.x){
		return false;
	}

	if (lhs.y < rhs.y){
		return true;
	}
	else if (lhs.y > rhs.y){
		return false;
	}

	return lhs.z < rhs.z;
}


struct babylon_vector2{
	float x;
	float y;
	babylon_vector2() :x(0), y(0){}
	babylon_vector2(float x, float y) :x(x), y(y){}
	babylon_vector2(const babylon_vector2& v) :x(v.x), y(v.y){}
	babylon_vector2(const FbxDouble2& v) :x(static_cast<float>(v[0])), y(static_cast<float>(v[1])){}

};

inline bool operator <(const babylon_vector2& lhs, const babylon_vector2& rhs){
	if (lhs.x < rhs.x){
		return true;
	}
	else if (lhs.x > rhs.x){
		return false;
	}



	return lhs.y < rhs.y;
}

struct babylon_vertex_normal_uv_color{
	float pos_x;
	float pos_y;
	float pos_z;
	float normal_x;
	float normal_y;
	float normal_z;
	float uv_x;
	float uv_y;
	float color_r;
	float color_g;
	float color_b;
	float color_a;

	babylon_vector3 getTransformedPosition(const FbxAMatrix& transform) const{
		auto result = transform.MultT(FbxVector4(pos_x, pos_y, pos_z));
		return babylon_vector3((float) result[0], (float) result[1], (float) result[2]);
	}
};

class babylon_boundingbox
{
private:
	float _minX;
	float _minY;
	float _minZ;
	float _maxX;
	float _maxY;
	float _maxZ;
public:
	void addPosition(float x, float y, float z);

	void addPosition(const babylon_vector3& v){
		addPosition(v.x, v.y, v.z);
	}
	float getMinX() const{
		return _minX;
	}
	float getMinY() const{
		return _minY;
	}
	float getMinZ() const{
		return _minZ;
	}


	float getMaxX() const{
		return _maxX;
	}
	float getMaxY() const{
		return _maxY;
	}
	float getMaxZ() const{
		return _maxZ;
	}
	float getWidth() const{
		return _maxX - _minX;
	}
	float getHeight() const{
		return _maxY - _minY;
	}
	float getDepth() const{
		return _maxZ - _minZ;
	}
	babylon_vector3 getMin() const{
		return babylon_vector3(getMinX(), getMinY(), getMinZ());
	}
	babylon_vector3 getMax() const{
		return babylon_vector3(getMaxX(), getMaxY(), getMaxZ());
	}
	babylon_vector3 getCenter() const{
		return babylon_vector3(
			0.5f*(_maxX + _minX),
			0.5f*(_maxY + _minY),
			0.5f*(_maxZ + _minZ));
	}
	babylon_boundingbox();

	babylon_boundingbox(FbxScene* scene);
	~babylon_boundingbox();
};


babylon_boundingbox mergeBoundingBoxes(const std::vector<babylon_boundingbox>& boxes);

struct babylon_submesh{
	std::string material_id;
	int index_start;
	int index_count;
};
template<typename TVertex>
class babylon_mesh{
private:
	std::string _name;
	std::vector<TVertex> _vertices;
	std::vector<int> _indices;
	std::vector<babylon_submesh> _submeshes;
	FbxAMatrix _transform;
	babylon_boundingbox _boundingBox;
public:

	babylon_mesh(const char* name, std::vector<TVertex>&& vertices, std::vector<int>&& indices, std::vector<babylon_submesh>&& submeshes, FbxAMatrix transform) :
		_name(name),
		_vertices(std::move(vertices)),
		_indices(std::move(indices)),
		_submeshes(std::move(submeshes)),
		_transform(transform)
	{
		for (const auto& v : _vertices){
			babylon_vector3 pos = v.getTransformedPosition(_transform);
			_boundingBox.addPosition(pos.x, pos.y, pos.z);
		}
	}

	babylon_mesh() :_materialIndex(-1){

	}

	babylon_mesh(babylon_mesh&& mesh) :
		_name(std::move(mesh._name)),
		_vertices(std::move(mesh._vertices)),
		_indices(std::move(mesh._indices)),
		_transform(mesh._transform),
		_submeshes(std::move(mesh._submeshes)),
		_boundingBox(mesh._boundingBox)
	{

	}
	babylon_boundingbox getBoundingBox()const{
		return _boundingBox;
	}
	const FbxAMatrix& getTransform() const{ return _transform; }
	const std::string& getName() const{ return _name; }
	const std::vector<TVertex>& getVertices() const{ return _vertices; }
	const std::vector<int>& getIndices() const{ return _indices; }
	const std::vector<babylon_submesh>& getSubmeshes() const { return _submeshes; }
	int getUniqueIndexCount(const babylon_submesh& subMesh) const{
		std::set<int> knownIndices;
		for (int i = 0; i < subMesh.index_count; ++i){
			knownIndices.insert(_indices[i + subMesh.index_start]);
		}
		return knownIndices.size();
	}
};

struct babylon_color{
	float r;
	float g;
	float b;
	float a;

	babylon_color() :r(0), g(0), b(0), a(0){}
	babylon_color(const FbxColor& v) : r(static_cast<float>(v.mRed)), g(static_cast<float>(v.mGreen)), b(static_cast<float>(v.mBlue)), a(static_cast<float>(v.mAlpha)){}
};

inline bool operator <(const babylon_color& lhs, const babylon_color& rhs){
	if (lhs.r < rhs.r){
		return true;
	}
	else if (lhs.r > rhs.r){
		return false;
	}
	if (lhs.g < rhs.g){
		return true;
	}
	else if (lhs.g > rhs.g){
		return false;
	}
	if (lhs.b < rhs.b){
		return true;
	}
	else if (lhs.b > rhs.b){
		return false;
	}



	return lhs.a < rhs.a;
}

struct babylon_texture{
	std::string name;
	bool hasAlpha;
};


struct babylon_material{
	std::string id;
	std::string name;
	bool backFaceCulling;
	babylon_vector3 ambient;
	babylon_vector3 diffuse;
	babylon_vector3 specular;
	babylon_vector3 emissive;
	float specularPower;
	float alpha;
	std::shared_ptr<babylon_texture> diffuseTexture;
	std::shared_ptr<babylon_texture> ambientTexture;
	std::shared_ptr<babylon_texture> opacityTexture;
	std::shared_ptr<babylon_texture> reflectionTexture;
	std::shared_ptr<babylon_texture> emissiveTexture;
	std::shared_ptr<babylon_texture> specularTexture;
	std::shared_ptr<babylon_texture> bumpTexture;

};

struct babylon_global_settings{
	bool autoClear;
	babylon_vector3 clearColor;
	babylon_vector3 ambientColor;
	babylon_vector3 gravity;
	int fogMode;
	babylon_vector3 fogColor;
	float fogStart;
	float fogEnd;
	float fogDensity;
	babylon_global_settings(){
		autoClear = true;
		clearColor = babylon_vector3(0.2f, 0.2f, 0.3f);
		ambientColor = babylon_vector3(0.0f, 0.0f, 0.0f);
		gravity = babylon_vector3(0.0f, 0.0f, -0.9f);
		fogMode = 0;
		fogColor = babylon_vector3(0.0f, 0.0f, 0.0f);
		fogStart = 0;
		fogEnd = 0;
		fogDensity = 0;
	}
};

struct babylon_camera{
	std::string name;
	std::string id;
	babylon_vector3 position;
	babylon_vector3 target;
	babylon_vector3 rotation;
	float fov;
	float minZ;
	float maxZ;
	float speed;
	float inertia;
	bool checkCollisions;
	bool applyGravity;
	babylon_vector3 ellipsoid;


};




inline void writeVector3(web::json::value& obj, const wchar_t* name, const babylon_vector3& v) {
	obj[name] = web::json::value::array();
	obj[name][0] = v.x;
	obj[name][1] = v.y;
	obj[name][2] = v.z;
}inline void writeVector4(web::json::value& obj, const wchar_t* name, const babylon_vector4& v) {
	obj[name] = web::json::value::array();
	obj[name][0] = v.x;
	obj[name][1] = v.y;
	obj[name][2] = v.z;
	obj[name][3] = v.w;
}

inline void writeVector2(web::json::value& obj, const wchar_t* name, const babylon_vector2& v) {
	obj[name] = web::json::value::array();
	obj[name][0] = v.x;
	obj[name][1] = v.y;
}

inline void writeFbxQuaterntion(web::json::value& obj, const wchar_t* name, const FbxQuaternion& v) {
	obj[name] = web::json::value::array();
	obj[name][0] = (float) v[0];
	obj[name][1] = (float) v[1];
	obj[name][2] = (float) v[2];
	obj[name][3] = (float) v[3];
}

inline void writeVector3IntoStream(web::json::value& array, const babylon_vector3& v) {
	auto size = array.size();
	array[size] = v.x;
	array[size + 1] = v.y;
	array[size + 2] = v.z;
}
inline void writeVector2IntoStream(web::json::value& array, float x, float y) {
	auto size = array.size();
	array[size] = x;
	array[size + 1] = y;
}

inline void writeMatrix(web::json::value& obj, const wchar_t* name, const FbxMatrix& v) {
	obj[name] = web::json::value::array();
	obj[name][0] = v.mData[0][0];
	obj[name][1] = v.mData[1][0];
	obj[name][2] = v.mData[2][0];
	obj[name][3] = v.mData[3][0];
	obj[name][4] = v.mData[0][1];
	obj[name][5] = v.mData[1][1];
	obj[name][6] = v.mData[2][1];
	obj[name][7] = v.mData[3][1];
	obj[name][8] = v.mData[0][2];
	obj[name][9] = v.mData[1][2];
	obj[name][10] = v.mData[2][2];
	obj[name][11] = v.mData[3][2];
	obj[name][12] = v.mData[0][3];
	obj[name][13] = v.mData[1][3];
	obj[name][14] = v.mData[2][3];
	obj[name][15] = v.mData[3][3];
}