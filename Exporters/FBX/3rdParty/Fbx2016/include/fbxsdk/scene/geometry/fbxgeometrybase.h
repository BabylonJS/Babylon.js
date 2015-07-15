/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxgeometrybase.h
#ifndef _FBXSDK_SCENE_GEOMETRY_BASE_H_
#define _FBXSDK_SCENE_GEOMETRY_BASE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/math/fbxvector4.h>
#include <fbxsdk/scene/geometry/fbxlayercontainer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;

/** This class is the base class for geometric object such as meshes, NURBS and patches.
  * Use the FbxGeometryBase class to manage the control points, normals, binormals and tangents of the
  * geometries. 
  * The meaning of "control point" is dependent of the geometry object type. For meshes, the "control point"
  * is the physical 3D coordinate of polygon vertices while, for NURBS, it is the the actual control point on the curves
  * defining the surface. This class also allow you to define normals, binormals and tangents regardless of the type of 
  * geometric object. However, in reality, applying such definitions to NURBS and patches does not make much sense
  * since these definitions would only exist at the control points and inbetween them, the interpolation would certainly not
  * follow the curve. 
  *
  * Geometric objects are using a system of layered data to extend their construction definition. For example, a typical 
  * layer for a Mesh contains Normals, UVs and Materials but client applications can decide to define another set of 
  * Normals and UVs and swap them during the rendering phase to produce some different results. The combinations are limitless
  * and it would be impossible to discuss them all. This example has been presented to show one possible context where
  * layers can be used. More information can be found in the FbxLayerContainer and FbxLayer classes description.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxGeometryBase : public FbxLayerContainer
{
    FBXSDK_OBJECT_DECLARE(FbxGeometryBase, FbxLayerContainer);

public:
    /**
      * \name Control Points, Normals, Binormals and Tangent Management.
      */
    //@{

    /** Allocates memory space for the array of control points.
      * \param pCount     The number of control points.
      * \remarks          Any previously allocated array of control points will be cleared.
      */
    virtual void InitControlPoints(int pCount);

    /** Allocates memory space for the array of normals.
      * \param pCount     The desired size for the normal array. If pCount is specified, the array will be the same size as pCount.
      *                   If pCount is not specified, the array will be the same length as the array of control points.
      * \remarks          This function must be called after function FbxLayerContainer::InitControlPoints().
      * \remarks          The normals initialized with this function will have the ReferenceMode set to eDirect. Also,
      *                   the array will always be defined on layer 0.
      */
    void InitNormals(int pCount = 0 );

    /** Allocates memory space for the array of normals cloned from the pSrc.
      * \param pSrc       The source geometry from which the normals information is cloned.
      * \remarks          This function must be called with the argument, otherwise it does not do anything. Also,
      *                   it will only process the normals array defined on layer 0 of the pSrc.
      */
    void InitNormals(FbxGeometryBase* pSrc);

    /** Allocates memory space for the array of tangents on specified layer.
      * \param pCount      The desired size of the tangent array. If pCount is specified, the array will be the same size as pCount.
      *                    If pCount is not specified, the array will be the same length as the array of control points.
	  * \param pLayerIndex The specified layer index to allocate memory space for the array of tangents.
	  * \param pName       The specified name for the allocated tangents array.
      * \remarks           This function must be called after function FbxLayerContainer::InitControlPoints().
      *                    The tangents initialized with this function will have the reference mode set to eDirect.
      */
    void InitTangents(int pCount = 0, const int pLayerIndex = 0, const char* pName = "" );

    /** Allocates memory space for the array of tangents cloned from the pSrc on the specified layer.
      * \param pSrc        The source geometry from which the tangents information is cloned.
	  * \param pLayerIndex The specified layer index to allocate memory space for cloned array of tangents from the pSrc.
      * \remarks           This function must be called with the argument, otherwise it does not do anything.
      */
    void InitTangents(FbxGeometryBase* pSrc, const int pLayerIndex = 0);

    /** Allocates memory space for the array of binormals.
      * \param pCount      The desired size of the binormal array. If pCount is specified, the array will have the same size as pCount.
      *                    If pCount is not specified, the array will be the same length as the array of control points.
	  * \param pLayerIndex The specified layer index to allocate memory space for the array of binormals.
	  * \param pName       The specified name for the allocated binormals array.
      * \remarks           This function must be called after function FbxLayerContainer::InitControlPoints().
      *                    The binormals initialized with this function will have the reference mode set to eDirect.
      */
    void InitBinormals(int pCount = 0, const int pLayerIndex = 0, const char* pName = "" );

    /** Allocates memory space for the array of binormals cloned from the pSrc.
      * \param pSrc        The source geometry from which the binormals information is cloned.
	  * \param pLayerIndex The specified layer index to allocate memory space for cloned array of binormals from the pSrc.
      * \remarks           This function must be called with the argument, otherwise it does not do anything.
      */
    void InitBinormals(FbxGeometryBase* pSrc, const int pLayerIndex = 0);

    /** Sets the control point and the normal values at the specified index.
      * \param pCtrlPoint     The value of the control point.
      * \param pNormal        The value of the normal.
      * \param pIndex         The specified index of the control point/normal.
      * \param pI2DSearch     When \c true AND the normals array reference mode is eIndexToDirect, search pNormal in the
      *                       existing array to avoid inserting if it already exist. NOTE: This feature uses a linear
      *                       search algorithm, therefore it can be time consuming if the DIRECT array of normals contains
      *                       a huge number of elements.
      * \remarks              If the arrays (control points and normals) are not big enough to store the values at the 
	  *                       specified index, they will be automatically resized to accommodate the new entries.
      */
    virtual void SetControlPointAt(const FbxVector4 &pCtrlPoint , const FbxVector4 &pNormal , int pIndex, bool pI2DSearch = false);


    /** Sets the control point at a specified index.
    * \param pCtrlPoint     The value of the control point.
    * \param pIndex         The specified index of the control point.
    *
    * \remarks              If the array is not big enough to store the value at the specified index, it will be 
	*						automatically resized to accommodate the new entry.
    */
    virtual void SetControlPointAt(const FbxVector4 &pCtrlPoint , int pIndex);

    /** Gets the control point at the specified index.
    * \param pIndex         The specified index of the control point.
    * \return               The value of the specific control point.
    *
    * \remarks              If index is out of range, FbxVector4(0, 0, 0) is returned.
    */
    virtual FbxVector4 GetControlPointAt(int pIndex) const;

    /** Sets the control point normal value at the specified index.
    * \param pNormal        The value of the normal.
    * \param pIndex         The specified index of the normal.
    * \param pI2DSearch     When \c true AND the normals array reference mode is eIndexToDirect, search pNormal in the
    *                       existing array to avoid inserting it if it already exist. NOTE: this feature uses a linear
    *                       search algorithm, therefore it can be time consuming if the DIRECT array of normals contains
    *                       a huge number of elements.
    * \remarks              If the array is not big enough to store the value at the specified index, it will be 
	*						automatically resized to accommodate the new entry.
    */
    virtual void SetControlPointNormalAt(const FbxVector4 &pNormal, int pIndex, bool pI2DSearch=false);

    /** Returns the number of control points.
      * \return     The number of control points allocated in the geometry.
      */
    virtual int GetControlPointsCount() const;


    /** Returns a pointer to the array of control points.
      * \param pStatus  Not used in the implementation of this class.
      * \return         Pointer to the array of control points, or \c NULL if the array has not been allocated.
      * \remarks        Use the function FbxGeometryBase::InitControlPoints() to allocate the array.
      */
    virtual FbxVector4* GetControlPoints(FbxStatus* pStatus=NULL) const;

    /** Allocates memory space for the array of control points.
      * \param pCount     The number of control points.
      * \remarks          Any previously allocated array of control points will NOT be cleared.
      */
	virtual void SetControlPointCount(int pCount);

    //@}


    /**
      * \name Public and fast access Properties
      */
    //@{
		//! Control the geometry render state. Geometry can still cast shadows even if this is turned off.
		FbxPropertyT<FbxBool> PrimaryVisibility;

		//! If true, the geometry will produce shadows.
		FbxPropertyT<FbxBool> CastShadow;

		//! If true, the geometry will receive shadows.
		FbxPropertyT<FbxBool> ReceiveShadow;

        //! The minimum value of the control points bounding box. 
        FbxPropertyT<FbxDouble3> BBoxMin;

        //! The maximum value of the control points bounding box.
        FbxPropertyT<FbxDouble3> BBoxMax;

        /** Computes the control points Bounding box.
          */
        void ComputeBBox();
    //@}


    /**
      * \name Geometry Element Management.
      *  A FbxGeometryElement describes how the geometry element (normals, UVs and etc.) is mapped to a geometry
      *  surface and how the mapping information is arranged in memory.
      *  FbxGeometryElement is exactly the same as FbxLayerElement but does not expose the geometry's layer information.
      *  Use the geometry element classes to decompose the geometry without dealing with layers.
      */
    //@{

    /** Creates a normal geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementNormal* CreateElementNormal();

    /** Remove the normal geometry element from this geometry.
      * \param pElementNormal   A pointer to the normal element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementNormal(FbxGeometryElementNormal* pElementNormal);

    /** Returns this geometry's normal element.
      * \param pIndex           The normal geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementNormal* GetElementNormal(int pIndex = 0);

    /** Returns this geometry's normal element.
      * \param pIndex           The normal geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementNormal* GetElementNormal(int pIndex = 0) const;

    /** Get the number of this geometry's normal geometry element.
      * \return                 Total number of normal geometry elements for this geometry.
      */
    int GetElementNormalCount() const;

    /** Creates a binormal geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementBinormal* CreateElementBinormal();

    /** Remove the binormal geometry element from this geometry.
      * \param pElementBinormal A pointer to the binormal element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementBinormal(FbxGeometryElementBinormal* pElementBinormal);

    /** Returns this geometry's binormal element.
      * \param pIndex           The binormal geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementBinormal* GetElementBinormal(int pIndex = 0);

    /** Returns this geometry's binormal element.
      * \param pIndex           The binormal geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementBinormal* GetElementBinormal(int pIndex = 0) const;

    /** Get the number of this geometry's binormal geometry element.
      * \return                 Total number of binormal geometry elements for this geometry.
      */
    int GetElementBinormalCount() const;

    /** Creates a tangent geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementTangent* CreateElementTangent();

    /** Remove the tangent geometry element from this geometry.
      * \param pElementTangent  A pointer to the tangent element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementTangent(FbxGeometryElementTangent* pElementTangent);

    /** Returns this geometry's tangent element.
      * \param pIndex           The tangent geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementTangent* GetElementTangent(int pIndex = 0);

    /** Returns this geometry's tangent element.
      * \param pIndex           The tangent geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementTangent* GetElementTangent(int pIndex = 0) const;

    /** Get the number of this geometry's tangent geometry element.
      * \return                 Total number of tangent geometry elements for this geometry.
      */
    int GetElementTangentCount() const;

    /** Creates a material geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementMaterial* CreateElementMaterial();

    /** Remove the material geometry element from this geometry.
      * \param pElementMaterial A pointer to the material element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementMaterial(FbxGeometryElementMaterial* pElementMaterial);

    /** Returns this geometry's material element.
      * \param pIndex           The material geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementMaterial* GetElementMaterial(int pIndex = 0);

    /** Returns this geometry's material element.
      * \param pIndex           The material geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementMaterial* GetElementMaterial(int pIndex = 0) const;

    /** Get the number of this geometry's material geometry element.
      * \return                 Total number of material geometry elements for this geometry.
      */
    int GetElementMaterialCount() const;

    /** Creates a polygon group geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementPolygonGroup* CreateElementPolygonGroup();

    /** Remove the polygon group geometry element from this geometry.
      * \param pElementPolygonGroup   A pointer to the polygon group element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementPolygonGroup(FbxGeometryElementPolygonGroup* pElementPolygonGroup);

    /** Returns this geometry's polygon group element.
      * \param pIndex           The polygon group geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementPolygonGroup* GetElementPolygonGroup(int pIndex = 0);

    /** Returns this geometry's polygon group element.
      * \param pIndex           The polygon group geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementPolygonGroup* GetElementPolygonGroup(int pIndex = 0) const;

    /** Get the number of this geometry's polygon group geometry element.
      * \return                 Total number of polygon group geometry elements for this geometry.
      */
    int GetElementPolygonGroupCount() const;

    /** Creates a vertex color geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementVertexColor* CreateElementVertexColor();

    /** Remove the vertex color geometry element from this geometry.
      * \param pElementVertexColor   A pointer to the vertex color element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementVertexColor(FbxGeometryElementVertexColor* pElementVertexColor);

    /** Returns this geometry's vertex color element.
      * \param pIndex           The vertex color geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementVertexColor* GetElementVertexColor(int pIndex = 0);

    /** Returns this geometry's vertex color element.
      * \param pIndex           The vertex color geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementVertexColor* GetElementVertexColor(int pIndex = 0) const;

    /** Get the number of this geometry's vertex color geometry element.
      * \return                 Total number of vertex color geometry elements for this geometry.
      */
    int GetElementVertexColorCount() const;

    /** Creates a smoothing geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementSmoothing* CreateElementSmoothing();

    /** Remove the smoothing geometry element from this geometry.
      * \param pElementSmoothing   A pointer to the smoothing element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementSmoothing(FbxGeometryElementSmoothing* pElementSmoothing);

    /** Returns this geometry's smoothing element.
      * \param pIndex           The smoothing geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementSmoothing* GetElementSmoothing(int pIndex = 0);

    /** Returns this geometry's smoothing element.
      * \param pIndex           The smoothing geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementSmoothing* GetElementSmoothing(int pIndex = 0) const;

    /** Get the number of this geometry's smoothing geometry element.
      * \return                 Total number of smoothing geometry elements for this geometry.
      */
    int GetElementSmoothingCount() const;

    /** Creates a vertex crease geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementCrease* CreateElementVertexCrease();

    /** Remove the vertex crease geometry element from this geometry.
      * \param pElementCrease   A pointer to the vertex crease element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementVertexCrease(FbxGeometryElementCrease* pElementCrease);

    /** Returns this geometry's vertex crease element.
      * \param pIndex           The vertex crease geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementCrease* GetElementVertexCrease(int pIndex = 0);

    /** Returns this geometry's vertex crease element.
      * \param pIndex           The vertex crease geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementCrease* GetElementVertexCrease(int pIndex = 0) const;

    /** Get the number of this geometry's vertex crease geometry element.
      * \return                 Total number of vertex crease geometry elements for this geometry.
      */
    int GetElementVertexCreaseCount() const;

    /** Creates an edge crease geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementCrease* CreateElementEdgeCrease();

    /** Remove the edge crease geometry element from this geometry.
      * \param pElementCrease   A pointer to the edge crease element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementEdgeCrease(FbxGeometryElementCrease* pElementCrease);

    /** Returns this geometry's edge crease element.
      * \param pIndex           The edge crease geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementCrease* GetElementEdgeCrease(int pIndex = 0);

    /** Returns this geometry's edge crease element.
      * \param pIndex           The edge crease geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementCrease* GetElementEdgeCrease(int pIndex = 0) const;

    /** Get the number of this geometry's edge crease geometry element.
      * \return                 Total number of edge crease geometry elements for this geometry.
      */
    int GetElementEdgeCreaseCount() const;

    /** Creates a hole geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementHole* CreateElementHole();

    /** Remove the hole geometry element from this geometry.
      * \param pElementHole     A pointer to the hole element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementHole(FbxGeometryElementHole* pElementHole);

    /** Returns this geometry's hole element.
      * \param pIndex           The hole geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementHole* GetElementHole(int pIndex = 0);

    /** Returns this geometry's hole element.
      * \param pIndex           The hole geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementHole* GetElementHole(int pIndex = 0) const;

    /** Get the number of this geometry's hole geometry element.
      * \return                 Total number of hole geometry elements for this geometry.
      */
    int GetElementHoleCount() const;

    /** Creates a user data geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementUserData* CreateElementUserData();

    /** Remove the user data geometry element from this geometry.
      * \param pElementUserData A pointer to the user data element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementUserData(FbxGeometryElementUserData* pElementUserData);

    /** Returns this geometry's user data element.
      * \param pIndex           The user data geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementUserData* GetElementUserData(int pIndex = 0);

    /** Returns this geometry's user data element.
      * \param pIndex           The user data geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementUserData* GetElementUserData(int pIndex = 0) const;

    /** Get the number of this geometry's user data geometry element.
      * \return                 Total number of user data geometry elements for this geometry.
      */
    int GetElementUserDataCount() const;

    /** Creates a visibility geometry element for this geometry.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementVisibility* CreateElementVisibility();

    /** Remove the visibility geometry element from this geometry.
      * \param pElementVisibility   A pointer to the visibility element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementVisibility(FbxGeometryElementVisibility* pElementVisibility);

    /** Returns this geometry's visibility element.
      * \param pIndex           The visibility geometry element index.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    FbxGeometryElementVisibility* GetElementVisibility(int pIndex = 0);

    /** Returns this geometry's visibility element.
      * \param pIndex           The visibility geometry element index.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      */
    const FbxGeometryElementVisibility* GetElementVisibility(int pIndex = 0) const;

    /** Get the number of this geometry's visibility geometry element.
      * \return                 Total number of visibility geometry elements for this geometry.
      */
    int GetElementVisibilityCount() const;

    /** Creates a UV geometry element for this geometry.
      * \param pUVSetName       The UV geometry element name.
      * \param pTypeIdentifier  The texture channel the UVIndex refers to.
      * \return                 A pointer to the newly created geometry element.
      * \remarks                The created geometry element is associated with this geometry automatically.
      */
    FbxGeometryElementUV* CreateElementUV(const char* pUVSetName, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

    /** Remove the UV geometry element from this geometry.
      * \param pElementUV       A pointer to the UV element to be removed.
      * \return                 \c True if the geometry element is removed, \c false otherwise.
      */
    bool RemoveElementUV(FbxGeometryElementUV* pElementUV);

    /** Returns this geometry's UV element.
      * \param pIndex           The UV geometry element index.
      * \param pTypeIdentifier  The texture channel the UVIndex refers to.
      * \return                 A pointer to the geometry element or \c NULL if \e pIndex is out of range.
      * \remarks                If \e pTypeIdentifier is not specified, the function will return the geometry element
      *                         regardless of its texture type.
      */
    FbxGeometryElementUV* GetElementUV(int pIndex = 0, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eUnknown);

    /** Returns this geometry's UV element.
      * \param pIndex           The UV geometry element index.
      * \param pTypeIdentifier  The texture channel the UVIndex refers to.
      * \return                 A const pointer to the geometry element or \c NULL if \e pIndex is out of range.
      * \remarks                If \e pTypeIdentifier is not specified, the function will return the geometry element
      *                         regardless of its texture type.
      */
    const FbxGeometryElementUV* GetElementUV(int pIndex = 0, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eUnknown) const;

    /** Get the number of this geometry's UV geometry element.
      * \param pTypeIdentifier  The texture channel the UVIndex refers to.
      * \return                 Total number of UV geometry elements for this geometry.
      * \remarks                If \e pTypeIdentifier is not specified, the function will return the geometry element
      *                         regardless of its texture type.      
      */
    int GetElementUVCount(FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eUnknown) const;

    /** Returns this geometry's UV element.
      * \param pUVSetName       The UV set name of the UV geometry element.
      * \return                 A pointer to the UV geometry element or \c NULL if no UV geometry element with this name exists.
      */
    FbxGeometryElementUV* GetElementUV(const char* pUVSetName);

    /** Returns this geometry's UV element.
      * \param pUVSetName       The UV set name of the UV geometry element.
      * \return                 A const pointer to the UV geometry element or \c NULL if no UV geometry element with this name exists.
      */
    const FbxGeometryElementUV* GetElementUV(const char* pUVSetName) const;

    /** Returns this geometry's all UV set names.
      * \param pUVSetNameList   A reference to \c FbxStringList that will be filled with this geometry's all UV set names.
      */
    void GetUVSetNames(FbxStringList& pUVSetNameList) const;

    //@}


    /**
      * \name Off-loading Serialization section
      *  The methods in this section are typically called by a peripheral (FbxPeripheral). There should be no
	  *  real interest in calling them directly. The functions will write/read the memory dump of the data contained
	  *  in this class. Each data block written/read will start with an (int) value representing the number of items
	  *  in the array. If this value (v) is not zero, it will be followed by the array content. A block of data that is
	  *  (v * sizeof(array item size)) bytes big. The methods will also call the parent class ones to dump the Layers content.
      */
    //@{
        /** Writes the content of the geometry object to the specified stream.
          * \param pStream The destination stream.
          * \return \c True if the content is successfully processed
          * by the receiving stream, \c false otherwise.
          */
        virtual bool ContentWriteTo(FbxStream& pStream) const;

        /** Reads the content of the geometry object from the specified stream.
          * \param pStream The source stream.
          * \return \c True if the geometry object fills itself with the received data
          * from the stream successfully, \c false otherwise.
          */
        virtual bool ContentReadFrom(const FbxStream& pStream);
    //@}

        /** Calculate the actual amount of memory used by this geometry object. 
          * \return The memory size in bytes (includes the amount use by the data defined in the layers).
          */
        virtual int MemoryUsage() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);
	virtual void Compact();

    FbxArray<FbxVector4> mControlPoints;

    bool GetNormals(FbxLayerElementArrayTemplate<FbxVector4>** pLockableArray) const;
    bool GetNormalsIndices(FbxLayerElementArrayTemplate<int>** pLockableArray) const;
    bool GetTangents(FbxLayerElementArrayTemplate<FbxVector4>** pLockableArray, const int pLayerIndex = 0) const;
    bool GetTangentsIndices(FbxLayerElementArrayTemplate<int>** pLockableArray, const int pLayerIndex = 0) const;
    bool GetBinormals(FbxLayerElementArrayTemplate<FbxVector4>** pLockableArray, const int pLayerIndex = 0) const;
    bool GetBinormalsIndices(FbxLayerElementArrayTemplate<int>** pLockableArray, const int pLayerIndex = 0) const;

protected:
    virtual void ConstructProperties(bool pForceSet);
    virtual void ContentClear();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_BASE_H_ */
