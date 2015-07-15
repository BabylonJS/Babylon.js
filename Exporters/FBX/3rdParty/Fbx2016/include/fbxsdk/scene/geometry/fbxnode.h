/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxnode.h
#ifndef _FBXSDK_SCENE_GEOMETRY_NODE_H_
#define _FBXSDK_SCENE_GEOMETRY_NODE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/math/fbxtransforms.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;
class FbxNodeAttribute;
class FbxCachedEffect;
class FbxLODGroup;
class FbxNull;
class FbxMarker;
class FbxSkeleton;
class FbxGeometry;
class FbxMesh;
class FbxNurbs;
class FbxNurbsCurve;
class FbxLine;
class FbxNurbsSurface;
class FbxTrimNurbsSurface;
class FbxPatch;
class FbxCamera;
class FbxCameraStereo;
class FbxCameraSwitcher;
class FbxLight;
class FbxOpticalReference;
class FbxSubDiv;
class FbxCharacter;
class FbxSurfaceMaterial;
class FbxAnimStack;
class FbxAnimCurveFilterMatrixConverter;

/** Represents an element in the scene graph. A scene graph is a tree of FbxNode 
  * objects. The tree management services are self contained in this class.
  *
  * \note The FBX SDK does not test the validity of the constructed scene graph. It 
  * is the responsibility of the caller to make sure that it does not generate cyclic 
  * graphs in a node hierarchy.
  *
  * Besides the tree management, this class defines all the properties required to describe
  * the position of the object in the scene. This information include the basic Translation,
  * Rotation and Scaling properties and the more advanced options for pivots, limits, and IK joints
  * attributes such the stiffness and dampening.
  *
  * When it is first created, the FbxNode object is "empty" (i.e: it is an object without any 
  * graphical representation that only contains the position information). In this state, it can
  * be used to represent parents in the node tree structure but not much more. The normal use of
  * this type of objects is to add them an attribute that will specialize the node (see the 
  * "Node Attribute Management" section). 
  *
  * The node attribute is an object in itself and is connected to the the FbxNode. This also 
  * means that the same node attribute can be shared among multiple nodes. FbxCamera, FbxLight,
  * FbxMesh, etc... are all node attributes and they all derive from the base class FbxNodeAttribute. 
  *
  */
class FBXSDK_DLL FbxNode : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxNode, FbxObject);

public:
	/**
	  * \name Node Tree Management
	  */
	//@{
		/** Get the parent node.
		  * \return Pointer to parent node or \c NULL if the current node has no parent.
		  */
		FbxNode* GetParent();
		const FbxNode* GetParent() const;

		/** Add a child node and its underlying node tree.
		  * \param pNode Node we want to make child of \c this.
		  * \return \c true on success, \c false if \e pNode is \c NULL or the system is 
		  *            unable to make the connection.
		  * \remarks If \e pNode already has a parent, first it is removed from current parent and then
		  *          added to this one.
		  */
		bool AddChild(FbxNode* pNode);

		/** Remove the child node.
		  * \param pNode The child node to be removed.
		  * \return The removed child node.
		  */
		FbxNode* RemoveChild(FbxNode* pNode);

		/** Get the number of children nodes.
		  * \param pRecursive If \c true the method will also count all the descendant children.
		  * \return Total number of children for this node.
		  */
		int GetChildCount(bool pRecursive = false) const;

		/** Get child by index.
		  * \param pIndex The child index.
		  * \return Child node or \c NULL if \e pIndex is out of range (i.e: < 0 or > GetChildCount()).
		  */
		FbxNode* GetChild(int pIndex);

		/** Get child by index.
		  * \param pIndex The child index.
		  * \return Child node or \c NULL if \e pIndex is out of range (i.e: < 0 or > GetChildCount()).
		  */
		const FbxNode* GetChild(int pIndex) const;

		/** Finds a child node by name.
		  * \param pName Name of the searched child node.
		  * \param pRecursive Flag to request recursive calls.
		  * \param pInitial If set to \c true, the search compares the initial name of 
		  *                 the node (see the FbxObject class)
		  * \return Found child node or \c NULL if no child node with this name exists.
		  */
		FbxNode* FindChild(const char* pName, bool pRecursive=true, bool pInitial=false);
	//@}

	/**
	  * \name Node Target Management
	  * The FbxNode class allows the client to set a "follow" target node. This target 
	  * forces the node to re-align itself so it points to the target. By default, the node
	  * uses its X axis as the aiming constraint. A rotation offset can be added to change 
	  * this behavior. While the default relative orientation to the target (the X axis) is 
	  * sufficient for the FBX cameras (with a (0,0,0) rotation vector, they are aiming
	  * along the X axis), this rotation offset becomes particularly useful with the lights
	  * objects because their default orientation (when they have a 0,0,0 rotation vector) is to
	  * point along the -Y axis and they need to be adjusted with a 90-degree offset on the Z axis.
	  *
	  * The FbxNode class also permits the use of node to define an Up-vector. By default, 
	  * the node's up vector points towards the Up node. If the Up node is not specified, 
	  * then the node's Up vector points towards the Y axis. Here too, a rotation offset can be 
	  * added to change the default behavior. 
	  *
	  * Of course, these offsets can be applied to anything, not only the cameras and lights.
	  *
	  * \note Objects in the FBX SDK are always created in the right handed, Y-Up system and need 
	  *       to be adjusted for any other axis system by explicitly convert them (the class 
	  *       FbxAxisSystem can help in that process).
	  *       
	  */
	//@{
		/** The target must be part of the same scene and it cannot be itself.
		  * \param pNode The target.
		  */
		void SetTarget(FbxNode* pNode);

		/** Get the target for this node.
		  * \returns \c NULL if target isn't set.
		  */
		FbxNode* GetTarget() const;

		/** Set rotation offset from default relative orientation to target.
		  * \param pVector The rotation offset.
		  */
		void SetPostTargetRotation(FbxVector4 pVector);

		/** Get rotation offset from default relative orientation to target.
		  * \return The rotation offset.
		  */
		FbxVector4 GetPostTargetRotation() const;

		/** The target up node must be part of the same scene and it cannot be itself.
		  * \param pNode The target.
		  */
		void SetTargetUp(FbxNode* pNode);

		/** Get the target up node.
		  * \return \c NULL if the target up model isn't set.
		  */
		FbxNode* GetTargetUp() const;

		/** Set up vector offset from default relative target up vector.
		  * \param pVector The rotation offset.
		  */
		void SetTargetUpVector(FbxVector4 pVector);

		/** Get up vector offset from default relative target up vector.
		  * \return The up vector offset.
		  */
		FbxVector4 GetTargetUpVector() const;
	//@}

	/**
	  * \name Node Display Parameters
	  */
	//@{
		/** Set the node Visibility value from the boolean parameter. 
		  * \param pIsVisible Node is visible in the scene if set to \c true.
		  * \remarks This method checks for the validity of the property before attempting to 
		  * set its value. In fact, the exact same result can be achieved by the following code:
		  * \code
		  * if( Visibility.IsValid() )
		  * {
		  *     Visibility.Set(FbxDouble(pIsVisible));
		  * }
		  * \endcode
		  *
		  * \see Visibility property.
		  */
		void SetVisibility(bool pIsVisible);

		/** Get the current value of the Visibility property.
		  * \return \c false if the Visibility property value is 0.0 and \c true for any other value.
		  * \remarks This method expects the Visibility property to exist and to be valid. If this 
		  *          condition is not met, the returned value will be \c false.
		  */
		bool GetVisibility() const;

		/** \enum EShadingMode Shading modes.
		  * These shading modes are not directly used by the FBX SDK but it is guaranteed that the information is
		  * carried to and from the FBX files. The typical context of using these modes is to affect the rendering of 
		  * geometric objects (this is, of course, performed at the application level) and the possible definition
		  * for each mode is:
		  */
		enum EShadingMode
		{
			eHardShading,		//!< Solid geometries rendered with smooth surfaces - using the system light.
			eWireFrame,			//!< Geometries displayed in wire frame.
			eFlatShading,		//!< Solid geometries rendered faceted - using the system light.
			eLightShading,		//!< Solid geometries rendered with the scene lights.
			eTextureShading,	//!< Solid geometries rendered with smooth textured surfaces - using system light.
			eFullShading		//!< Solid geometries rendered with smooth textured surfaces and scene lights.
		};

		/** Set the shading mode.
		  * \param pShadingMode The shading mode.
		  */
		void SetShadingMode(EShadingMode pShadingMode);

		/** Get the shading mode.
		  * \return The currently set shading mode.
		  */
		EShadingMode GetShadingMode() const;
	//@}

	/**
	  * \name Node Attribute Management
	  */
	//@{
		/** Set the node attribute.
		  * \param pNodeAttribute Node attribute object
		  * \return Pointer to previous node attribute object.
		  * \c NULL if the node didn't have a node attribute or if
		  * the new node attribute is equal to the one currently set.
		  * \remarks A node attribute can be shared between nodes.
		  * \remarks If this node has more than one attribute (added via the AddAttribute() method), this call
		  * will destroy all, but the default node attribute.
		  */
		FbxNodeAttribute* SetNodeAttribute(FbxNodeAttribute* pNodeAttribute);

		/** Get the default node attribute.
		  * The default node attribute is the attribute that has been set by the call to SetNodeAttribute().
		  * \return Pointer to the default node attribute or \c NULL if the node doesn't
		  * have a node attribute.
		  */
		FbxNodeAttribute* GetNodeAttribute();

		/** Get the default node attribute.
		  * The default node attribute is the attribute that has been set by the call to SetNodeAttribute(...).
		  * \return Pointer to the default node attribute or \c NULL if the node doesn't
		  * have a node attribute.
		  */
		const FbxNodeAttribute* GetNodeAttribute() const;

		//! Get the number of node attribute(s) connected to this node.
		int GetNodeAttributeCount() const;

		/** Get the index, in the list of connected node attributes, of the node attribute that is set
		  * to be the default one.
		  * \return Index of the default node attribute or \c -1 if there is no default node attribute set.
		  */
		int GetDefaultNodeAttributeIndex() const;

		/** Set index of the default node attribute.
		  * \param pIndex Identifies which of the connected node attributes is becoming the default one.
		  *               This value represent the connection number of the node.
           * \param pStatus The FbxStatus object to hold error codes.
		  * \return \c true if the operation succeeds or \c false if the passed index is invalid.
		  */
		bool SetDefaultNodeAttributeIndex(int pIndex, FbxStatus* pStatus = NULL);

		/** Get the connected node attribute by specifying its index in the connection list.
		  * \param pIndex The connection number of the node.
		  * \return Pointer to corresponding node attribute or \c NULL if the index is out of range.
		  */
		FbxNodeAttribute* GetNodeAttributeByIndex(int pIndex);

		/** Get the connected node attribute by specifying its index in the connection list.
		  * \param pIndex The connection number of the node.
		  * \return Pointer to corresponding node attribute or \c NULL if the index is out of range.
		  */
		const FbxNodeAttribute* GetNodeAttributeByIndex(int pIndex) const;

		/** Get the connection index of the specified node attribute.
		  * This method will do a linear search of all the connected node attributes (from the last to
		  * the first connection) until it finds \e pNodeAttribue.
		  * \param pNodeAttribute The pointer to the node attribute.
          * \param pStatus The FbxStatus object to hold error codes.
		  * \return The connection number of the node attribute or \c -1 if pNodeAttribute is \c NULL 
		  * or not connected to this node. 
		  */
		int GetNodeAttributeIndex(FbxNodeAttribute* pNodeAttribute, FbxStatus* pStatus = NULL) const;

		/** Add the new node attribute to this node.
		  * If no other node attribute is already set as the default one, this new node attribute is
		  * automatically set as the default one.
		  * \param pNodeAttribute The pointer to a node attribute.
          * \param pStatus The FbxStatus object to hold error codes.
		  * \return \c true if the operation succeeded or \c false if the operation failed.
		  * \remarks The failing conditions for this methods are:
		  *      - The received object pointer is \c NULL.
		  *      - The received object is already connected to this node.
		  *      - An internal error prevented the connection to successfully complete.
		  */
		bool AddNodeAttribute(FbxNodeAttribute* pNodeAttribute, FbxStatus* pStatus = NULL);

		/** Remove the node attribute from the connection list of this node.
		  * \param pNodeAttribute The pointer to a node attribute.
		  * \return Pointer to the removed node attribute or \c NULL if the operation failed.
		  */
		FbxNodeAttribute* RemoveNodeAttribute(FbxNodeAttribute* pNodeAttribute);

		/** Remove the node attribute, specified by the connection index, from the connection 
		  * list of this node.
		  * \param pIndex Index of the node attribute.
		  * \return Pointer to the removed node attribute or \c NULL if the operation failed.
		  * \remarks If the specified node attribute is also the default one, its predecessor in
		  *          the connection list will become the new default node attribute. And if there 
		  *          are no more predecessors, the node DefaultNodeAttributeIndex is reset to -1.
		  */
		FbxNodeAttribute* RemoveNodeAttributeByIndex(int pIndex);

		/** Get the default node attribute casted to a FbxCachedEffect pointer.
		  * \return Pointer to the cached effect object. 
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxCachedEffect* GetCachedEffect();

		/** Get the default node attribute casted to a FbxLODGroup pointer.
		  * \return Pointer to the lod group object. 
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxLODGroup* GetLodGroup();

		/** Get the default node attribute casted to a FbxNull pointer.
		  * \return Pointer to the null object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxNull* GetNull();

		/** Get the node attribute casted to a FbxMarker pointer.
		  * \return Pointer to the marker object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxMarker* GetMarker();

		/** Get the node attribute casted to a FbxSkeleton pointer.
		  * \return Pointer to the skeleton object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxSkeleton* GetSkeleton();

		/** Get the node attribute casted to a FbxGeometry pointer.
		  * \return Pointer to the geometry object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  * \remarks For this method to succeed, the node attribute's GetAttributeType() must returns one of the 
		  *          following:
		  *          - FbxNodeAttribute::eMesh
		  *          - FbxNodeAttribute::eNurbs
		  *          - FbxNodeAttribute::eNurbsSurface
		  *          - FbxNodeAttribute::ePatch
		  *          - FbxNodeAttribute::eNurbsCurve
		  *          - FbxNodeAttribute::eBoundary
		  *          - FbxNodeAttribute::eTrimNurbsSurface
		  *          - FbxNodeAttribute::eSubDiv
		  *          - FbxNodeAttribute::eLine
		  */
		FbxGeometry* GetGeometry();

		/** Get the node attribute casted to a FbxMesh pointer.
		  * \return Pointer to the mesh object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::eMesh.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxMesh* GetMesh();

		/** Get the node attribute casted to a FbxNurbs pointer.
		  * \return Pointer to the nurb object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::eNurbs.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxNurbs* GetNurbs();

		/** Get the node attribute casted to a FbxNurbsSurface pointer.
		  * \return Pointer to the nurbs surface object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::eNurbsSurface.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxNurbsSurface* GetNurbsSurface();

		/** Get the node attribute casted to a FbxNurbsCurve pointer.
		  * \return Pointer to the nurbs curve object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::eNurbsCurve.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxNurbsCurve* GetNurbsCurve();

		/** Get the node attribute casted to a FbxLine pointer.
		* \return Pointer to the line object.
		* \remarks This method will try to process the default node attribute first. If it cannot
		*          find it, it will scan the list of connected node attributes and get the first
		*          object that is a FbxNodeAttribute::eLine.
		* \remarks If the above search failed to get a valid pointer or it cannot
		*          be successfully casted, this method will return \c NULL.
		*/
		FbxLine* GetLine();

		/** Get the node attribute casted to a FbxTrimNurbsSurface pointer.
		  * \return Pointer to the trim nurbs surface object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::eTrimNurbsSurface.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxTrimNurbsSurface* GetTrimNurbsSurface();

		/** Get the node attribute casted to a FbxSubDiv pointer.
		  * \return Pointer to the subdivision surface object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::eSubDiv.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxSubDiv* GetSubdiv();

		/** Get the node attribute casted to a FbxPatch pointer.
		  * \return Pointer to the patch object.
		  * \remarks This method will try to process the default node attribute first. If it cannot
		  *          find it, it will scan the list of connected node attributes and get the first
		  *          object that is a FbxNodeAttribute::ePatch.
		  * \remarks If the above search failed to get a valid pointer or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxPatch* GetPatch();

		/** Get the node attribute casted to a FbxCamera pointer.
		  * \return Pointer to the camera object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxCamera* GetCamera();
		const FbxCamera* GetCamera() const;

		/** Get the node attribute casted to a FbxCameraStereo pointer.
		* \return Pointer to the stereo camera object.
		* \remarks If the type cast failed because there is not default node attribute set or it cannot
		*          be successfully casted, this method will return \c NULL.
		*/
		FbxCameraStereo* GetCameraStereo();

		/** Get the node attribute casted to a FbxCameraSwitcher pointer.
		  * \return Pointer to the camera switcher object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxCameraSwitcher* GetCameraSwitcher();

		/** Get the node attribute casted to a FbxLight pointer.
		  * \return Pointer to the light object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxLight* GetLight();
		const FbxLight* GetLight() const;

		/** Get the node attribute casted to a FbxOpticalReference pointer.
		  * \return Pointer to the optical reference object.
		  * \remarks If the type cast failed because there is not default node attribute set or it cannot
		  *          be successfully casted, this method will return \c NULL.
		  */
		FbxOpticalReference* GetOpticalReference();
	//@}

	/**
	  * \name Transformation propagation
	  * This set of functions provides direct access to the transformation propagations settings 
	  * of the FbxNode. These settings determine how transformations must be applied when 
	  * evaluating a node's transformation matrix. The possible values are:
	  *     - eInheritRrSs : Scaling of parent is applied in the child world after the local child rotation.
	  *     - eInheritRSrs : Scaling of parent is applied in the parent world.
	  *     - eInheritRrs  : Scaling of parent does not affect the scaling of children.
	  */
	//@{
		/** Sets how child transforms are inherited from parent transforms.
		  * \param pInheritType One of the following values eInheritRrSs, eInheritRSrs or eInheritRrs
		  */
		void SetTransformationInheritType(FbxTransform::EInheritType pInheritType);

		//! Get transformation inherit type.
		void GetTransformationInheritType(FbxTransform::EInheritType& pInheritType) const;
	//@}

	/**
	  * \name Pivot Management
	  * Pivots are used to specify translation, rotation and scaling centers in coordinates 
	  * relative to a node's origin. 
	  * A node has two pivot contexts defined by the EPivotSet enumeration. The node's animation 
	  * data can be converted from one pivot context to the other. Each context can be set to be
	  * either active or passive (reference). By default the two pivot contexts are passive. They
	  * need to be active to be processed during the evaluation of the node final transformation
	  * matrix. In its passive state, a pivot context can still be accessed to retrieve its content
	  * for any other required purpose. Each pivot context stores values (as FbxVector4) for:
	  * \code
	  *     - Rotation offset (Roff)
	  *     - Rotation pivot (Rp)
	  *     - Pre-rotation (Rpre)
	  *     - Post-rotation (Rpost)
	  *     - Scaling offset (Soff)
	  *     - Scaling pivot (Sp)
	  *     - Geometric translation (Gt)
	  *     - Geometric rotation (Gr)
	  *     - Geometric scaling (Gs)
	  * 
	  * These values combine in the matrix form to compute the World transform of the node 
	  * using the formula:
	  *
	  * 	World = ParentWorld * T * Roff * Rp * Rpre * R * Rpost * Rp-1 * Soff * Sp * S * Sp-1
	  * \endcode
	  *
	  * The geometric transformation (Gt * Gr * Gs) is applied only to the node attribute and after 
	  * the node transformations. This transformation is not inherited across the node hierarchy.
	  *
	  * \note Please refer to the FBX SDK programmers guide for more details.
	  * 
	  * The application of the pivots is performed by calling the method ConvertPivotAnimation(). Typically,
	  * you set-up the eDestinationPivot context to match what your system can directly support and leave at (0,0,0) the
	  * attributes that are not supported by your system. When the values of a specific attribute in the 
	  * two contexts (source and destination) are identical, the system considers that no adjustment is 
	  * required because the attribute is directly supported in the destination world.
	  *
	  * Below is an example of code that shows how the pivot information could be setup before calling ConvertPivotAnimation(). 
	  * \code
	  * FbxVector4 lZero(0,0,0);
      * FbxVector4 lOne(1,1,1);
	  * pNode->SetPivotState(FbxNode::eSourcePivot, FbxNode::ePivotActive);
	  * pNode->SetPivotState(FbxNode::eDestinationPivot, FbxNode::ePivotActive);
	  *	
	  * EFbxRotationOrder lRotationOrder;
	  * pNode->GetRotationOrder(FbxNode::eSourcePivot , lRotationOrder);
	  * pNode->SetRotationOrder(FbxNode::eDestinationPivot , lRotationOrder);
	  *
	  * //For cameras and lights (without targets) let's compensate the postrotation.
	  * if( pNode->GetCamera() || pNode->GetLight() )
	  * {
	  *    if( !pNode->GetTarget() )
	  *    {
	  *        FbxVector4 lRV(90, 0, 0);
	  *        if( pNode->GetCamera() )
	  *           lRV.Set(0, 90, 0);
	  *
	  *        FbxVector4 prV = pNode->GetPostRotation(FbxNode::eSourcePivot);
	  *        FbxAMatrix lSourceR;
	  *        FbxAMatrix lR(lZero, lRV, lOne);
	  *        FbxVector4 res = prV;
	  *
	  *        // Rotation order don't affect post rotation, so just use the default XYZ order
	  *        FbxRotationOrder rOrder;
	  *        rOrder.V2M(lSourceR, res);
	  *
	  *        lR = lSourceR * lR;
	  *        rOrder.M2V(res, lR);
	  *        prV = res;
	  *        pNode->SetPostRotation(FbxNode::eSourcePivot, prV);
	  *        pNode->SetRotationActive(true);
	  *    }
	  *
	  *    // Point light do not need to be adjusted (since they radiate in all the directions).
	  *    if( pNode->GetLight() && pNode->GetLight()->LightType.Get() == FbxLight::ePoint )
	  *    {
	  *        pNode->SetPostRotation(FbxNode::eSourcePivot, FbxVector4(0,0,0,0));
	  *    }
	  * }
      * // apply Pre rotations only on bones / end of chains
	  * if( pNode->GetNodeAttribute() && pNode->GetNodeAttribute()->GetAttributeType() == FbxNodeAttribute::eSkeleton
	  *    || (pNode->GetMarker() && pNode->GetMarker()->GetType() == FbxMarker::eEffectorFK)
	  *    || (pNode->GetMarker() && pNode->GetMarker()->GetType() == FbxMarker::eEffectorIK) )
	  * {
	  *    if( pNode->GetRotationActive() )
	  *    {
	  *       pNode->SetPreRotation(FbxNode::eDestinationPivot, pNode->GetPreRotation(FbxNode::eSourcePivot));
	  *    }
	  *			            
	  *    // No pivots on bones
	  *    pNode->SetRotationPivot(FbxNode::eDestinationPivot, lZero);    
	  *    pNode->SetScalingPivot(FbxNode::eDestinationPivot, lZero);    
	  *    pNode->SetRotationOffset(FbxNode::eDestinationPivot,lZero);    
	  *    pNode->SetScalingOffset(FbxNode::eDestinationPivot, lZero);
	  * }
	  * else
	  * {
	  *    // any other type: no pre-rotation support but...
	  *    pNode->SetPreRotation(FbxNode::eDestinationPivot, lZero);
	  *       
	  *    // support for rotation and scaling pivots.
	  *    pNode->SetRotationPivot(FbxNode::eDestinationPivot, pNode->GetRotationPivot(FbxNode::eSourcePivot));    
	  *    pNode->SetScalingPivot(FbxNode::eDestinationPivot, pNode->GetScalingPivot(FbxNode::eSourcePivot));    
	  *    // Rotation and scaling offset are supported
	  *    pNode->SetRotationOffset(FbxNode::eDestinationPivot, pNode->GetRotationOffset(FbxNode::eSourcePivot));    
	  *    pNode->SetScalingOffset(FbxNode::eDestinationPivot, pNode->GetScalingOffset(FbxNode::eSourcePivot));
	  *    //
	  *    // If we don't "support" scaling pivots, we can simply do:
	  *    // pNode->SetRotationPivot(FbxNode::eDestinationPivot, lZero);
	  *    // pNode->SetScalingPivot(FbxNode::eDestinationPivot, lZero);
	  * }
	  * \endcode
	  *
	  */
	//@{
		/** \enum EPivotSet  Pivot context identifier.
		  */
		enum EPivotSet
		{
			eSourcePivot,		//!< The source pivot context.
			eDestinationPivot	//!< The destination pivot context.
		};

		/** \enum EPivotState  Pivot context state.
		  */
		enum EPivotState
		{
			ePivotActive,	//!< The pivot context with this state is affecting the node's transform computation.
			ePivotReference	//!< The pivot context with this state is not used during the node transform computation but can be accessed for reference purposes.
		};

		/** Change the state of the pivot context.
		  * \param pPivotSet Specify which pivot context is manipulated.
		  * \param pPivotState The new state of the pivot context.
		  */
		void SetPivotState(EPivotSet pPivotSet, EPivotState pPivotState);

		/** Get the pivot context state.
		  * The returned value tells if this pivot context is used in the
		  * evaluation of the node transform or not. 
		  * \param pPivotSet Specify which pivot context is queried.
		  * \param pPivotState The current state of the pivot set.
		  */
		void GetPivotState(EPivotSet pPivotSet, EPivotState& pPivotState) const;

		/** Set rotation space
		  * Determine the rotation space (Euler or Spheric) and the rotation order.
		  * \param pPivotSet Specify which pivot context is manipulated.
		  * \param pRotationOrder The new value for the pivot rotation order.
		  */
		void SetRotationOrder(EPivotSet pPivotSet, EFbxRotationOrder pRotationOrder);

		/** Get rotation order
		  * \param pPivotSet Specify which pivot context is queried.
		  * \param pRotationOrder The current value of the pivot rotation order.
		  */
		void GetRotationOrder(EPivotSet pPivotSet, EFbxRotationOrder& pRotationOrder) const;

		/** Set rotation space for limit only.
		  * \param pPivotSet Specify which pivot context is manipulated.
		  * \param pUseForLimitOnly When set to \c true, the current rotation space 
		  *                         (set with SetRotationOrder) define the rotation space for 
		  *                         the limit only; leaving the rotation animation in 
		  *                         Euler XYZ space. When set to \c false, the current rotation
		  *                         space defines the rotation space for both the limits and the 
		  *                         rotation animation data.
		  */
		void SetUseRotationSpaceForLimitOnly(EPivotSet pPivotSet, bool pUseForLimitOnly);

		/** Get rotation space for limit only.
		  * \param pPivotSet Specify which pivot context is queried.
		  * \return The current rotation space limit flag value.
		  */
		bool GetUseRotationSpaceForLimitOnly(EPivotSet pPivotSet) const;

		/** Set the RotationActive state.
		  * \param pVal The new state of the property.
		  * \remarks When this flag is set to false, the RotationOrder, the Pre/Post rotation values
		  *          and the rotation limits should be ignored.
		  */
		void SetRotationActive(bool pVal);

		/** Get the RotationActive state.
		  * \return The value of the RotationActive flag.
		  */
		bool GetRotationActive() const;

		/** Specify which Quaternion interpolation mode is used on the pivot context.
		  * \param pPivotSet Specify which pivot context is manipulated.
		  * \param pQuatIterp  The new value.
		  * \remarks When the \e pPivotSet is eSourcePivot, this method also updates the value of the 
		  *          QuaternionInterpolate property.
		  */
		void SetQuaternionInterpolation(EPivotSet pPivotSet, EFbxQuatInterpMode pQuatIterp);

		/** Get the Quaternion interpolation mode of the pivot context.
		  * \param pPivotSet Specify which pivot context is queried.
		  * \return The current mode set on the pivot context.
		  */
		EFbxQuatInterpMode GetQuaternionInterpolation(EPivotSet pPivotSet) const;

		/** Set the rotation stiffness.
		  * The stiffness attribute is used by IK solvers to generate a resistance
		  * to a joint motion. The higher the stiffness the less it will rotate.
		  * Stiffness works in a relative sense: it determines the willingness of
		  * this joint to rotate with respect to the other joint in the IK chain.
		  * \param pRotationStiffness The rotation stiffness values are limited to
		  * the range [0, 100].
		  */
		void SetRotationStiffness(FbxVector4 pRotationStiffness);

		/** Get the rotation stiffness
		  * \return The currently set rotation stiffness values.
		  */
		FbxVector4 GetRotationStiffness() const;

		/** Set the minimum damp range angles.
		  * This attributes apply resistance to a joint rotation as it approaches the
		  * lower boundary of its rotation limits. This functionality allows joint
		  * motion to slow down smoothly until the joint reaches its rotation limits
		  * instead of stopping abruptly. The MinDampRange specifies when the
		  * deceleration should start.
		  * \param pMinDampRange Angle, in degrees, where deceleration should start
		  */
		void SetMinDampRange(FbxVector4 pMinDampRange);

		/** Get the minimum damp range angles
		  * \return The currently set minimum damp range angles.
		  */
		FbxVector4 GetMinDampRange() const;

		/** Set the maximum damp range angles.
		  * This attributes apply resistance to a joint rotation as it approaches the
		  * upper boundary of its rotation limits. This functionality allows joint
		  * motion to slow down smoothly until the joint reaches its rotation limits
		  * instead of stopping abruptly. The MaxDampRange specifies when the
		  * deceleration should start.
		  * \param pMaxDampRange Angle, in degrees, where deceleration should start
		  */
		void SetMaxDampRange(FbxVector4 pMaxDampRange);

		/** Get the maximum damp range angles
		  * \return The currently set maximum damp range angles.
		  */
		FbxVector4 GetMaxDampRange() const;

		/** Set the minimum damp strength.
		  * This attributes apply resistance to a joint rotation as it approaches the
		  * lower boundary of its rotation limits. This functionality allows joint
		  * motion to slow down smoothly until the joint reaches its rotation limits
		  * instead of stopping abruptly. The MinDampStrength defines the
		  * rate of deceleration.
		  * \param pMinDampStrength Values are limited to the range [0, 100].
		  */
		void SetMinDampStrength(FbxVector4 pMinDampStrength);

		/** Get the minimum damp strength
		  * \return The currently set minimum damp strength values.
		  */
		FbxVector4 GetMinDampStrength() const;

		/** Set the maximum damp strength.
		  * This attributes apply resistance to a joint rotation as it approaches the
		  * upper boundary of its rotation limits. This functionality allows joint
		  * motion to slow down smoothly until the joint reaches its rotation limits
		  * instead of stopping abruptly. The MaxDampStrength defines the
		  * rate of deceleration.
		  * \param pMaxDampStrength Values are limited to the range [0, 100].
		  */
		void SetMaxDampStrength(FbxVector4 pMaxDampStrength);

		/** Get the maximum damp strength
		  * \return The currently set maximum damp strength values.
		  */
		FbxVector4 GetMaxDampStrength() const;

		/** Set the preferred angle.
		  * The preferredAngle attribute defines the initial joint configuration used
		  * by a single chain IK solver to calculate the inverse kinematic solution.
		  * \param pPreferedAngle Angle in degrees
		  */
		void SetPreferedAngle(FbxVector4 pPreferedAngle);

		/** Get the preferred angle
		  * \return The currently set preferred angle.
		  */
		FbxVector4 GetPreferedAngle() const;

		/** Set a translation offset for the rotation pivot.
		  * The translation offset is in coordinates relative to the node's origin.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X,Y and Z translation values (the 4th component of the FbxVector4 is ignored).
		  */
		void SetRotationOffset(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get the translation offset for the rotation pivot.
		  * The translation offset is in coordinates relative to the node's origin.
		  * \param pPivotSet Specify which pivot set to to query the value.
		  * \return The X, Y and Z translation offset values (the 4th component of the FbxVector4 is always 1).
		  */
		const FbxVector4& GetRotationOffset(EPivotSet pPivotSet) const;

		/** Set rotation pivot.
		  * The rotation pivot is the center of rotation in coordinates relative to
		  * the node's origin.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The new position of the rotation pivot (the 4th component of the FbxVector4 is ignored).
		  */
		void SetRotationPivot(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get rotation pivot.
		  * The rotation pivot is the center of rotation in coordinates relative to
		  * the node's origin.
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The current position of the rotation pivot (the 4th component of the FbxVector4 is always 1).
		  */
		const FbxVector4& GetRotationPivot(EPivotSet pPivotSet) const;

		/** Set pre-rotation in Euler angles.
		  * The pre-rotation is the rotation applied to the node before
		  * rotation animation data.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X,Y,Z rotation values to set (the 4th component of the FbxVector4 is ignored).
		  */
		void SetPreRotation(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get pre-rotation in Euler angles.
		  * The pre-rotation is the rotation applied to the node before
		  * rotation animation data.
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The X,Y and Z rotation values (the 4th component of the FbxVector4 is always 1).
		  */
		const FbxVector4& GetPreRotation(EPivotSet pPivotSet) const;

		/** Set post-rotation in Euler angles.
		  * The post-rotation is the rotation applied to the node after the
		  * rotation animation data.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X,Y,Z rotation values to set (the 4th component of the FbxVector4 is ignored).
		  */
		void SetPostRotation(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get post-rotation in Euler angles.
		  * The post-rotation is the rotation applied to the node after the
		  * rotation animation data.
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The X,Y and Z rotation values (the 4th component of the FbxVector4 is always 1).
		  */
		const FbxVector4& GetPostRotation(EPivotSet pPivotSet) const;

		/** Set a translation offset for the scaling pivot.
		  * The translation offset is in coordinates relative to the node's origin.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X,Y and Z translation values (the 4th component of the FbxVector4 is ignored).
		  */
		void SetScalingOffset(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get the translation offset for the scaling pivot.
		  * The translation offset is in coordinates relative to the node's origin.
		  * \param pPivotSet Specify which pivot set to query the value.
		  * \return The X, Y and Z translation offset values (the 4th component of the FbxVector4 is always 1).
		  */
		const FbxVector4& GetScalingOffset(EPivotSet pPivotSet) const;

		/** Set scaling pivot.
		  * The scaling pivot is the center of scaling in coordinates relative to
		  * the node's origin.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The new position of the scaling pivot (the 4th component of the FbxVector4 is ignored).
		  */
		void SetScalingPivot(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get scaling pivot.
		  * The scaling pivot is the center of scaling in coordinates relative to
		  * the node's origin.
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The current position of the rotation pivot (the 4th component of the FbxVector4 is always 1).
		  */
		const FbxVector4& GetScalingPivot(EPivotSet pPivotSet) const;

		/** Set geometric translation
		  * The geometric translation is a local translation that is applied
		  * to a node attribute only. This translation is applied to the node attribute
		  * after the node transformations. This translation is not inherited across the
		  * node hierarchy.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X, Y, and Z translation values (the 4th component of the FbxVector4 is ignored).
		  */
		void SetGeometricTranslation(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get geometric translation
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The current geometric translation (the 4th component of the FbxVector4 is always 1).
		  */
		FbxVector4 GetGeometricTranslation(EPivotSet pPivotSet) const;

		/** Set geometric rotation
		  * The geometric rotation is a local rotation that is applied
		  * to a node attribute only. This rotation is applied to the node attribute
		  * after the node transformations. This rotation is not inherited across the
		  * node hierarchy.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X,Y and Z rotation values (the 4th component of the FbxVector4 is ignored).
		  */
		void SetGeometricRotation(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get geometric rotation
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The current geometric rotation (the 4th component of the FbxVector4 is always 1).
		  */
		FbxVector4 GetGeometricRotation(EPivotSet pPivotSet) const;

		/** Set geometric scaling
		  * The geometric scaling is a local scaling that is applied
		  * to a node attribute only. This scaling is applied to the node attribute
		  * after the node transformations. This scaling is not inherited across the
		  * node hierarchy.
		  * \param pPivotSet Specify which pivot set to modify.
		  * \param pVector The X,Y and Z scale values (the 4th component of the FbxVector4 is ignored).
		  */
		void SetGeometricScaling(EPivotSet pPivotSet, FbxVector4 pVector);

		/** Get geometric scaling
		  * \param pPivotSet Specify which pivot set to query.
		  * \return The current geometric scaling (the 4th component of the FbxVector4 is always 1).
		  */
		FbxVector4 GetGeometricScaling(EPivotSet pPivotSet) const;

		/** Reset a pivot set to the default pivot context.
		  * If the node has a geometry, reset the geometry's pivot to the identity matrix.
		  * \param pPivotSet Pivot set to reset.
		  * \remarks The default pivot context is a context with all the vector attributes
		  *          set to (0,0,0) except the GeometricScaling attribute that is reset to (1,1,1).
		  */
		void ResetPivotSet( FbxNode::EPivotSet pPivotSet );

		/** This version is an improved version of the ConvertPivotAnimation(). It fully supports all the
		  * attributes defined in the pivot sets and can process animation data defined on different animation
		  * stack. 
		  * \param pAnimStack The animation stack on which the conversion will take place. If equals \c NULL, convert the animation on all the animation stacks.
		  * \param pConversionTarget If set to EPivotSet::eDestinationPivot,
		  *                          convert animation data from the EPivotSet::eSourcePivot pivot context
		  *                          to the EPivotSet::eDestinationPivot pivot context. Otherwise, the
		  *                          conversion is computed the other way around.
		  * \param pFrameRate Resampling frame rate in frames per second.
		  * \param pKeyReduce Apply or skip key reducing filter.
		  * \remarks Due to the intrinsic properties of the mathematical operations performed,
		  *          sometimes, it is necessary to resample animation curves to maintain the accurate
		  *          conversion. When this resampling is required, the method will use the \e pFrameRate
		  *          value to specify the number of samples. To avoid a huge number of keys in the animation
		  *          curves, a constant key reducer filter (FbxKFCurveFilterConstantKeyReducer) is 
		  *          automatically applied to all the affected curves to remove as much consecutive keys 
		  *          that have the same value. This filter is private and its settings cannot be changed.
		  *          It is possible that, after the filtering pass, the animations curves do not contain keys
		  *          anymore. This is a normal result and does not affect the overall results.
		  * \note    Although it is possible to call this method several times with a different
		  *          AnimStack name, users must be aware that some pivot computation can irreversibly
		  *          modify the geometric nodes with a cumulative effect of the \e GeometricTranslation, 
		  *          \e GeometricRotation and \e GeometricScaling which will produce undesirable results. It is recommended
		  *          to call ConvertPivotAnimationRecursive with \p pAnimStackName = NULL and let the method convert 
		  *          the animation on all the Anim stacks at once. 
		  *          In the case when there are no geometric nodes in the scene tree, specifying the animation stack
		  *          is safe and somewhat faster.
		  *          If any transform limits are active, they are applied during the conversion and disabled.
		 */
		void ConvertPivotAnimationRecursive(FbxAnimStack* pAnimStack, EPivotSet pConversionTarget, double pFrameRate, bool pKeyReduce=true);

		/** Reset all the pivot sets to the default pivot context and convert the animation.
		  * \param pFrameRate Resampling frame rate in frames per second.
		  * \param pKeyReduce Apply or skip key reducing filter.
		  * \param pToNodeCenter: Reset pivots to node center if \c true, or retain pivot places if \c false.
		  * \param pForceResetLimits  If \c true, this flag will reset all the Translation, Rotation and Scaling 
		  *                           limits and clears the enabled flags.
		  * \remarks The resulting animation will be visually equivalent and all the pivots will be cleared.
		  *          The conversion is performed on all animation stacks.
		  * \remarks Will recursively convert the animation of all the children nodes.
		  * \remarks The \e pForceResetLimits flag has a destructive behavior and should be used only in very 
		  *          limited cases where the values of the limits are not required after the call to this method.
		  * \remarks Currently, this function just works under RSrs inherit type if pToNodeCenter is set to \c false.
		  */
		void ResetPivotSetAndConvertAnimation(double pFrameRate=30.0, bool pKeyReduce=false, bool pToNodeCenter=true, bool pForceResetLimits=false);

		/** Set rotation pivot as node center recursively
		  * \param pParentGeometricOffset Offset vector to be applied.
		  */
		void SetRotationPivotAsCenterRecursive(FbxVector4 pParentGeometricOffset=FbxVector4());
	//@}

	/**
	  * \name Node Evaluation Functions
	  */
	//@{
		/** Retrieve the proper animation evaluator to use for this node.
		* \return If the object has no scene, returns the default evaluator, otherwise the object's scene evaluator. */
		FbxAnimEvaluator* GetAnimationEvaluator() const;

		/** Returns this node's global transformation matrix at the specified time. The node's translation, rotation and scaling limits are taken into consideration.
		  * \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		  * \param pPivotSet The pivot set to take into account
		  * \param pApplyTarget Applies the necessary transform to align into the target node
		  * \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		  * \return The resulting global transform of the specified node at the specified time.
		  * \remarks This function is the equivalent of calling Scene->GetEvaluator()->GetNodeGlobalTransform().
		  */
		FbxAMatrix& EvaluateGlobalTransform(FbxTime pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

		/** Returns this node's local transformation matrix at the specified time. The node's translation, rotation and scaling limits are taken into consideration.
		  * \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		  * \param pPivotSet The pivot set to take into account
		  * \param pApplyTarget Applies the necessary transform to align into the target node
		  * \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		  * \return The resulting local transform of the specified node for the specified time.
		  * \remarks The local transform matrix is calculated in this way: ParentGlobal.Inverse * Global, all transforms such as pre/post rotation are taken into consideration.
		  * This will return a different value than LclTranslation, LclRotation and LclScaling at the specified time. To evaluate these properties separately
		  * without taking pre/post rotation, pivots and offsets into consideration, please use GetNodeLocalTranslation(), GetNodeLocalRotation() and GetNodeLocalScaling().
		  * This function is the equivalent of calling Scene->GetEvaluator()->GetNodeLocalTransform().
		  */
		FbxAMatrix& EvaluateLocalTransform(FbxTime pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

		/** Returns this node's LclTranslation property at the specified time.
		  * No pivot, offsets, or any other transform is taken into consideration. The translation limit is applied.
		  * \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		  * \param pPivotSet The pivot set to take into account
		  * \param pApplyTarget Applies the necessary transform to align into the target node
		  * \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		  * \return The resulting value of LclTranslation property of the specified node at the specified time.
		  * \remarks This function is the equivalent of calling Scene->GetEvaluator()->GetNodeLocalTranslation().
		  */
		FbxVector4& EvaluateLocalTranslation(FbxTime pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

		/** Returns this node's LclRotation property at the specified time.
		  * No pre/post rotation, rotation pivot, rotation offset or any other transform is taken into consideration. The rotation limit is applied.
		  * \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		  * \param pPivotSet The pivot set to take into account
		  * \param pApplyTarget Applies the necessary transform to align into the target node
		  * \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		  * \return The resulting value of LclRotation property of the specified node at the specified time.
		  * \remarks This function is the equivalent of calling Scene->GetEvaluator()->GetNodeLocalRotation().
		  */
		FbxVector4& EvaluateLocalRotation(FbxTime pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

		/** Returns this node's LclScaling property at the specified time.
		  * No scaling pivot, scaling offset or any other transform is taken into consideration. The scaling limit is applied.
		  * \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		  * \param pPivotSet The pivot set to take into account
		  * \param pApplyTarget Applies the necessary transform to align into the target node
		  * \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		  * \return The resulting value of LclScaling property of the specified node at the specified time.
		  * \remarks This function is the equivalent of calling Scene->GetEvaluator()->GetNodeLocalScaling().
		  */
		FbxVector4& EvaluateLocalScaling(FbxTime pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

		/** Compute the node's bounding box and its center in global coordinates.
		* \param pBBoxMin The minimum value of the bounding box upon successful return.
		* \param pBBoxMax The maximum value of the bounding box upon successful return.
		* \param pBBoxCenter The center value of the bounding box upon successful return.
		* \param pTime If different from FBXSDK_TIME_INFINITE, time used to compute the bounding box for deformed geometry.
		* \return \c true if successful, otherwise \c false.
		* \remark If geometry have been unloaded from memory, their bounding box cannot be calculated and will use any value set previously. */
		bool EvaluateGlobalBoundingBoxMinMaxCenter(FbxVector4& pBBoxMin, FbxVector4& pBBoxMax, FbxVector4& pBBoxCenter, const FbxTime& pTime=FBXSDK_TIME_INFINITE);

		/** Compute closest ray intersection point with mesh attributes of this node (triangle meshes only!).
		* \param pOut The closest intersection point from pRayOrigin location in pRayDir direction. Variable is unchanged if return value is \c false.
		* \param pRayOrigin The origin location to cast the ray from.
		* \param pRayDir The direction the cast ray to test mesh triangles from.
		* \param pCulling If \c true, only test triangles that are front facing, otherwise test both sides.
		* \param pTime The time to use to evaluate mesh deformations.
		* \return \c true if a triangle intersect with the ray, otherwise \c false.
		* \remark This function will automatically fail if the node's meshes are not triangulated. */
		bool EvaluateRayIntersectionPoint(FbxVector4& pOut, const FbxVector4& pRayOrigin, const FbxVector4& pRayDir, bool pCulling=false, const FbxTime& pTime=FBXSDK_TIME_INFINITE);
	//@}

	/**
	  * \name Character Link
	  */
	//@{
		/** Get number of character links.
		  * \return The number of character links.
		  */
		int GetCharacterLinkCount() const;

		/** Get character link at given index.
		  * \param pIndex Index of character link.
		  * \param pCharacter Pointer to receive linked character if function succeeds.
		  * \param pCharacterLinkType Pointer to receive character link type if function succeeds,
		  *                           cast to \c FbxCharacterLink::Type.
		  * \param pNodeId Pointer to receive the node ID if function succeeds. This ID should be casted 
		  *                to \c FbxCharacter::ENodeId type when the character link type is \c eCharacterLink or
		  *                \c eControlSetLink  else to the \c FbxEffector::ENodeId type if the character link type is 
		  *                \c eControlSetEffector or \c eControlSetEffectorAux.
		  * \param pNodeSubId For internal use.
		  * \return \c false if the index is out of range or any of the pointer arguments is NULL.
		  */
		bool GetCharacterLink(int pIndex, FbxCharacter** pCharacter, int* pCharacterLinkType, int* pNodeId, int* pNodeSubId);

		/** Looks if the given character link exists on this node.
		  * \param pCharacter Character searched.
		  * \param pCharacterLinkType Character link type searched. Its value must be one of 
		  *                           the \c FbxCharacterLink::Type symbols..
		  * \param pNodeId Node ID searched. If \e pCharacterLinkType is \c eCharacterLink or \c eControlSetLink
		  *                the \e pNodeId value is casted to the \c FbxCharacter::ENodeId type. If the \e pCharacterLinkType
		  *			       is \c eControlSetEffector or \c eControlSetEffectorAux then the \e pNodeId is casted to the
		  *                \c FbxEffector::ENodeId type.
		  * \param pNodeSubId For internal use.
		  * \return Index of found character link if it exists, -1 otherwise.
		  */
		int FindCharacterLink(FbxCharacter* pCharacter, int pCharacterLinkType, int pNodeId, int pNodeSubId) const;
	//@}

	/** Find out start and end time of the animation curves for this node (and its children).
	  * \param pInterval	This node's animation interval.
	  * \param pAnimStack	Animation stack where to retrieve animation curves. 
	  * \param pAnimLayerId	Specific animation layer on the animStack to use. 
	  * \return \c true if the node (or its children) is animated, \c false otherwise.
	  * \remarks If pAnimStack is left NULL, the function will try to get the first AnimStack that is connected
	  *          to the scene. \e pAnimLayerId represent the index of the connection. For example, the call:
	  * \code
	  *	lNode->GetAnimationInterval(span, myStack, 3);
	  * \endcode
	  * will scan all the animation curves of this node, and it's children, that are defined on the third 
	  * animation layer of \c myStack.
	  */
	bool GetAnimationInterval(FbxTimeSpan& pInterval, FbxAnimStack* pAnimStack=NULL, int pAnimLayerId=0);

	/**
	  * \name Material Management
	  */
	//@{
		/** Add a material to this node.
		  * \param pMaterial The material to add.
		  * \return non-negative index of added material, or -1 on error.
		  */
		int AddMaterial(FbxSurfaceMaterial* pMaterial);

		/** Remove a material from this node.
		  * \param pMaterial The material to remove.
		  * \return true on success, false otherwise
		  */
		bool RemoveMaterial(FbxSurfaceMaterial* pMaterial);

		/**
		  * \return The number of materials applied to this node.
		  * \remarks If this node has an instanced node attribute, it is possible
		  *          to have a material applied to this node more than once. The material
		  *          count may not reflect the distinct material count.
		  */
		int GetMaterialCount() const;

		/** Access a material on this node.
		  * \param pIndex Valid range is [0, GetMaterialCount() - 1]
		  * \return The pIndex-th material, or NULL if pIndex is invalid.
		  */
		FbxSurfaceMaterial* GetMaterial(int pIndex) const;

		/** Remove all materials applied to this node.
		  */
		void RemoveAllMaterials();

		/** Find an applied material with the given name.
		  * \param pName The requested name
		  * \return an index to a material, or -1 if no applied material
		  * has the requested name.
		  */
		int GetMaterialIndex(const char* pName) const;
	//@}

	/**
	  * \name Public and fast access Properties
	  */
	//@{
		/** This property contains the translation information of the node
		*
		* To access this property do: LclTranslation.Get().
		* To set this property do: LclTranslation.Set(FbxDouble3).
		*
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> LclTranslation;

		/** This property contains the rotation information of the node
		*
		* To access this property do: LclRotation.Get().
		* To set this property do: LclRotation.Set(FbxDouble3).
		*
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> LclRotation;

		/** This property contains the scaling information of the node
		*
		* To access this property do: LclScaling.Get().
		* To set this property do: LclScaling.Set(FbxDouble3).
		*
		* Default value is 1.,1.,1.
		*/
		FbxPropertyT<FbxDouble3> LclScaling;

		/** This property contains the visibility information of the node.
		* The assumed behavior of this property is to affect the visibility of the node, all the 
		* nodes attributes connected to it as well as all its descendants. This property can be
		* animated.
		*
		* To access this property do: Visibility.Get().
		* To set this property do: Visibility.Set(FbxDouble).
		*
		* Default value is 1.
		* \remarks  \li This property holds values ranging from 0.0 to 1.0 where the value 0.0 means
		*           a totally invisible object, the value 1.0, a full visible object and anything inbetween, a
		*           percentage degree of visibility.\n
		*
		*          \li Since not all the applications may support a degree of visibility, it is agreed that
		*          a value of 0.0 means invisible and anything else means visible.
		*
		* \see Show property.
		*/
		FbxPropertyT<FbxDouble> Visibility;

		/** This property contains the visibility inheritance flag that allow applications to modify
		* the Visibility property interpretation. By default, this value is set to \c true because it is
		* assumed (as explained in the Visibility property description) that the node visibility is inherited
		* from its parent. In other words, applications should always process the Visibility property of the 
		* node and, depending on its value, decide whether or not the node has to be displayed. After
		* this first assessment, check the node VisibilityInheritance flag. If its value is set to \c false then
		* move to the next object, else use the parent's Visibility value and modify this node display state 
		* by performing the logical AND operation between this node Visibility property and its parent's.
		*
		* To access this property do: VisibilityInheritance.Get().
		* To set this property do: VisibilityInheritance.Set(FbxBool).
		*
		* Default value is \c true.
		* \remarks This property is non-animatable and is not used inside the FBX SDK but it is guaranteed
		*          to exist in FBX files with version 7.2 and above.
		* \see Visibility property.
		*/
		FbxPropertyT<FbxBool> VisibilityInheritance;


		/** This property contains the quaternion interpolate flag of the node
		*
		* To access this property do: QuaternionInterpolate.Get().
		* To set this property do: QuaternionInterpolate.Set(EFbxQuatInterpMode).
		*
		* Default value is eQuatInterpOff.
		*/
		FbxPropertyT<EFbxQuatInterpMode> QuaternionInterpolate;

		/** This property contains the rotation offset information of the node
		*
		* To access this property do: RotationOffset.Get().
		* To set this property do: RotationOffset.Set(FbxDouble3).
		*
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> RotationOffset;

		/** This property contains the rotation pivot information of the node
		*
		* To access this property do: RotationPivot.Get().
		* To set this property do: RotationPivot.Set(FbxDouble3).
		*
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> RotationPivot;

		/** This property contains the scaling offset information of the node
		*
		* To access this property do: ScalingOffset.Get().
		* To set this property do: ScalingOffset.Set(FbxDouble3).
		*
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> ScalingOffset;

		/** This property contains the scaling pivot information of the node
		*
		* To access this property do: ScalingPivot.Get().
		* To set this property do: ScalingPivot.Set(FbxDouble3).
		*
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> ScalingPivot;

		/** This property enables or disables the limit on translation. 
        * When set to \c false the object can translate in any direction without limitations.
		* Else the 
        * \ref TranslationMinX, \ref TranslationMinY, \ref TranslationMinZ,
        * \ref TranslationMaxX, \ref TranslationMaxY and \ref TranslationMaxZ flags are used to
        * limit the translation on each individual axis.
		*
		* To access this property do: TranslationActive.Get().
		* To set this property do: TranslationActive.Set(FbxBool).
		*
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationActive;

		/** This property sets the minimum translation values the object can occupy on each individual axis.
		*
		* To access this property do: TranslationMin.Get().
		* To set this property do: TranslationMin.Set(FbxDouble3).
		* Default value is 0.,0.,0.
		*
		*/
		FbxPropertyT<FbxDouble3> TranslationMin;

		/** This property sets the maximum translation values the object can occupy on each individual axis.
		*
		* To access this property do: TranslationMax.Get().
		* To set this property do: TranslationMax.Set(FbxDouble3).
		* Default value is 0.,0.,0.
		*
		*/
		FbxPropertyT<FbxDouble3> TranslationMax;

		/** This property enables or disables the limit on translation X. 
		* When set to \c true, the object translation is constrained by the value of \ref TranslationMin.
		*
		* To access this property do: TranslationMinX.Get().
		* To set this property do: TranslationMinX.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationMinX;

		/** This property enables or disables the limit on translation Y. 
		* When set to \c true, the object translation is constrained by the value of \ref TranslationMin.
		*
		* To access this property do: TranslationMinY.Get().
		* To set this property do: TranslationMinY.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationMinY;

		
		/** This property enables or disables the limit on translation Z. 
		* When set to \c true, the object translation is constrained by the value of \ref TranslationMin.
		*
		* To access this property do: TranslationMinZ.Get().
		* To set this property do: TranslationMinZ.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationMinZ;

		/** This property enables or disables the limit on translation X. 
		* When set to \c true, the object translation is constrained by the value of \ref TranslationMax.
		*
		* To access this property do: TranslationMaxX.Get().
		* To set this property do: TranslationMaxX.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationMaxX;

		/** This property enables or disables the limit on translation Y. 
		* When set to \c true, the object translation is constrained by the value of \ref TranslationMax.
		*
		* To access this property do: TranslationMaxY.Get().
		* To set this property do: TranslationMaxY.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationMaxY;

		/** This property enables or disables the limit on translation Z. 
		* When set to \c true, the object translation is constrained by the value of \ref TranslationMax.
		*
		* To access this property do: TranslationMaxZ.Get().
		* To set this property do: TranslationMaxZ.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> TranslationMaxZ;

		/** This property contains the rotation order information of the node
		*
		* To access this property do: RotationOrder.Get().
		* To set this property do: RotationOrder.Set(EFbxRotationOrder).
		* Default value is eEulerXYZ.
		*
		*/
		FbxPropertyT<EFbxRotationOrder> RotationOrder;

		/** This property contains the rotation space for limit only flag of the node.
		* When set to \c true, the Rotation space is applied only on the limit data (provided the \ref RotationActive is
        * also \c true).
		*
		* To access this property do: RotationSpaceForLimitOnly.Get().
		* To set this property do: RotationSpaceForLimitOnly.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationSpaceForLimitOnly;

		/** This property contains the x value of the rotation stiffness of the node
		*
		* To access this property do: RotationStiffnessX.Get().
		* To set this property do: RotationStiffnessX.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> RotationStiffnessX;

		/** This property contains the y value of the rotation stiffness of the node
		*
		* To access this property do: RotationStiffnessY.Get().
		* To set this property do: RotationStiffnessY.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> RotationStiffnessY;

		/** This property contains the z value of the rotation stiffness of the node
		*
		* To access this property do: RotationStiffnessZ.Get().
		* To set this property do: RotationStiffnessZ.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> RotationStiffnessZ;

		/** This property contains axis length information of the node
		*
		* To access this property do: AxisLen.Get().
		* To set this property do: AxisLen.Set(FbxDouble).
		* 
		* Default value is 10.
		*/
		FbxPropertyT<FbxDouble> AxisLen;
	 
		/** This property contains pre-rotation information of the node
		*
		* To access this property do: PreRotation.Get().
		* To set this property do: PreRotation.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> PreRotation;

		/** This property contains post-rotation information of the node
		*
		* To access this property do: PostRotation.Get().
		* To set this property do: PostRotation.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> PostRotation;

		/** This property enables or disables the limit on rotation. 
        * When set to \c false the object can rotate in any direction without limitations.
		* Else the 
		* \ref RotationMinX, \ref RotationMinY, \ref RotationMinZ,
        * \ref RotationMaxX, \ref RotationMaxY and \ref RotationMaxZ flags are used to
        * limit the rotation on each individual axis.
		* \remarks The PreRotation value is applied before the limit, while the PostRotation is applied
		* after the limit.
		*
		* To access this property do: RotationActive.Get().
		* To set this property do: RotationActive.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationActive;

		/** This property sets the minimum rotation values the object can occupy on each individual axis.
		*
		* To access this property do: RotationMin.Get().
		* To set this property do: RotationMin.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> RotationMin;

		/** This property sets the maximum rotation values the object can occupy on each individual axis.
		*
		* To access this property do: RotationMax.Get().
		* To set this property do: RotationMax.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> RotationMax;

		/** This property enables or disables the limit on rotation X. 
		* When set to \c true, the object rotation is constrained by the value of \ref RotationMin.
		*
		* To access this property do: RotationMinX.Get().
		* To set this property do: RotationMinX.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationMinX;

		/** This property enables or disables the limit on rotation Y. 
		* When set to \c true, the object rotation is constrained by the value of \ref RotationMin.
		*
		* To access this property do: RotationMinY.Get().
		* To set this property do: RotationMinY.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationMinY;

		/** This property enables or disables the limit on rotation Z. 
		* When set to \c true, the object rotation is constrained by the value of \ref RotationMin.
		*
		* To access this property do: RotationMinZ.Get().
		* To set this property do: RotationMinZ.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationMinZ;

		/** This property enables or disables the limit on rotation X. 
		* When set to \c true, the object rotation is constrained by the value of \ref RotationMax.
		*
		* To access this property do: RotationMaxX.Get().
		* To set this property do: RotationMaxX.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationMaxX;

		/** This property enables or disables the limit on rotation Y. 
		* When set to \c true, the object rotation is constrained by the value of \ref RotationMax.
		*
		* To access this property do: RotationMaxY.Get().
		* To set this property do: RotationMaxY.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationMaxY;

		/** This property enables or disables the limit on rotation Z.
		* When set to \c true, the object rotation is constrained by the value of \ref RotationMax.
		*
		* To access this property do: RotationMaxZ.Get().
		* To set this property do: RotationMaxZ.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> RotationMaxZ;

		/** This property contains inherit type information of the node
		*
		* To access this property do: InheritType.Get().
		* To set this property do: InheritType.Set(FbxTransform::EInheritType).
		* 
		* Default value is eInheritRrSs.
		*/
		FbxPropertyT<FbxTransform::EInheritType> InheritType;

		/** This property enables or disables the limit on scaling. 
        * When set to \c false the object can scale in any direction without limitations.
		* Else the 
		* \ref ScalingMinX, \ref ScalingMinY, \ref ScalingMinZ,
        * \ref ScalingMaxX, \ref ScalingMaxY and \ref ScalingMaxZ flags are used to
        * limit the scaling on each individual axis.
		*
		* To access this property do: ScalingActive.Get().
		* To set this property do: ScalingActive.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingActive;

		/** This property sets the minimum scaling values the object can occupy on each individual axis.
		*
		* To access this property do: ScalingMin.Get().
		* To set this property do: ScalingMin.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> ScalingMin;

		/** This property sets the maximum scaling values the object can occupy on each individual axis.
		*
		* To access this property do: ScalingMax.Get().
		* To set this property do: ScalingMax.Set(FbxDouble3).
		* 
		* Default value is 1.,1.,1.
		*/
		FbxPropertyT<FbxDouble3> ScalingMax;

		/** This property activates or disables the limit on scaling X. When active, the object scaling
		* is constrained by the value of \ref ScalingMin.
		*
		* To access this property do: ScalingMinX.Get().
		* To set this property do: ScalingMinX.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingMinX;

		/** This property enables or disables the limit on scaling Y. 
		* When set to \c true, the object scaling is constrained by the value of \ref ScalingMin.
		*
		* To access this property do: ScalingMinY.Get().
		* To set this property do: ScalingMinY.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingMinY;

		/** This property enables or disables the limit on scaling Z. 
		* When set to \c true, the object scaling is constrained by the value of \ref ScalingMin.
		*
		* To access this property do: ScalingMinZ.Get().
		* To set this property do: ScalingMinZ.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingMinZ;

		/** This property enables or disables the limit on scaling X. 
		* When set to \c true, the object scaling is constrained by the value of \ref ScalingMax.
		*
		* To access this property do: ScalingMaxX.Get().
		* To set this property do: ScalingMaxX.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingMaxX;

		/** This property enables or disables the limit on scaling Y. 
		* When set to \c true, the object scaling is constrained by the value of \ref ScalingMax.
		*
		* To access this property do: ScalingMaxY.Get().
		* To set this property do: ScalingMaxY.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingMaxY;

		/** This property enables or disables the limit on scaling Z. 
		* When set to \c true, the object scaling is constrained by the value of \ref ScalingMax.
		*
		* To access this property do: ScalingMaxZ.Get().
		* To set this property do: ScalingMaxZ.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> ScalingMaxZ;

		/** This property contains geometric translation information of the node
		*
		* To access this property do: GeometricTranslation.Get().
		* To set this property do: GeometricTranslation.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> GeometricTranslation;

		/** This property contains geometric rotation information of the node
		*
		* To access this property do: GeometricRotation.Get().
		* To set this property do: GeometricRotation.Set(FbxDouble3).
		* 
		* Default value is 0.,0.,0.
		*/
		FbxPropertyT<FbxDouble3> GeometricRotation;
	 
		/** This property contains geometric scaling information of the node
		*
		* To access this property do: GeometricScaling.Get().
		* To set this property do: GeometricScaling.Set(FbxDouble3).
		* 
		* Default value is 1.,1.,1.
		*/
		FbxPropertyT<FbxDouble3> GeometricScaling;

		// IK Settings
		//////////////////////////////////////////////////////////

		/** This property contains the x component of the minimum damp range angles of the node
		*
		* To access this property do: MinDampRangeX.Get().
		* To set this property do: MinDampRangeX.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MinDampRangeX;

		/** This property contains the y component of the minimum damp range angles of the node
		*
		* To access this property do: MinDampRangeY.Get().
		* To set this property do: MinDampRangeY.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MinDampRangeY;

		/** This property contains the z component of the minimum damp range angles of the node
		*
		* To access this property do: MinDampRangeZ.Get().
		* To set this property do: MinDampRangeZ.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MinDampRangeZ;

		/** This property contains the x component of the maximum damp range angles of the node
		*
		* To access this property do: MaxDampRangeX.Get().
		* To set this property do: MaxDampRangeX.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MaxDampRangeX;

		/** This property contains the y component of the maximum damp range angles of the node
		*
		* To access this property do: MaxDampRangeY.Get().
		* To set this property do: MaxDampRangeY.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MaxDampRangeY;

		/** This property contains the z component of the maximum damp range angles of the node
		*
		* To access this property do: MaxDampRangeZ.Get().
		* To set this property do: MaxDampRangeZ.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MaxDampRangeZ;

		/** This property contains the x component of the minimum damp strength of the node
		*
		* To access this property do: MinDampStrengthX.Get().
		* To set this property do: MinDampStrengthX.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MinDampStrengthX;

		/** This property contains the y component of the minimum damp strength of the node
		*
		* To access this property do: MinDampStrengthY.Get().
		* To set this property do: MinDampStrengthY.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MinDampStrengthY;

		/** This property contains the z component of the minimum damp strength of the node
		*
		* To access this property do: MinDampStrengthZ.Get().
		* To set this property do: MinDampStrengthZ.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MinDampStrengthZ;

		/** This property contains the x component of the maximum damp strength of the node
		*
		* To access this property do: MaxDampStrengthX.Get().
		* To set this property do: MaxDampStrengthX.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MaxDampStrengthX;

		/** This property contains the y component of the maximum damp strength of the node
		*
		* To access this property do: MaxDampStrengthY.Get().
		* To set this property do: MaxDampStrengthY.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MaxDampStrengthY;

		/** This property contains the z component of the maximum damp strength of the node
		*
		* To access this property do: MaxDampStrengthZ.Get().
		* To set this property do: MaxDampStrengthZ.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> MaxDampStrengthZ;

		/** This property contains the x component of the preferred angle of the node
		*
		* To access this property do: PreferedAngleX.Get().
		* To set this property do: PreferedAngleX.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> PreferedAngleX;

		/** This property contains the y component of the preferred angle of the node
		*
		* To access this property do: PreferedAngleY.Get().
		* To set this property do: PreferedAngleY.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> PreferedAngleY;

		/** This property contains the z component of the preferred angle of the node
		*
		* To access this property do: PreferedAngleZ.Get().
		* To set this property do: PreferedAngleZ.Set(FbxDouble).
		* 
		* Default value is 0.
		*/
		FbxPropertyT<FbxDouble> PreferedAngleZ;

		///////////////////////////////////////////////////////

		/** This property contains lookat property of the node
		*
		* To access this property do: LookAtProperty.Get().
		* To set this property do: LookAtProperty.Set(FbxReference).
		* 
		*/
		FbxPropertyT<FbxReference> LookAtProperty;

		/** This property contains the up vector property of the node
		*
		* To access this property do: UpVectorProperty.Get().
		* To set this property do: UpVectorProperty.Set(FbxReference).
		* 
		*/
		FbxPropertyT<FbxReference> UpVectorProperty;

		/** This property contains the show information of the node.
		* As opposed to the Visibility property, this one cannot be animated. The assumed behavior of 
		* this property is to represent the show/hide state of all the nodes attributes connected to this 
		* node only.
		*
		* To access this property do: Show.Get().
		* To set this property do: Show.Set(FbxBool).
		* 
		* Default value is true.
		*
		* \remarks  \li Because node attributes can be shared by multiple nodes (instances), the FBX SDK provides an utility
		*           function FbxScene::SyncShowPropertyForInstance() to propagates the same Show value across all the nodes
		*           referencing the node attribute. The applied logic is that as soon as one of these nodes has the Show 
		*           property set to \c false, all will be set to \c false (basically it is an AND operation on all the
		*           Show flags).
		*
		*           \li Depending on the support of the Show and Visibility properties that applications will implement, there 
		*           may be conflicts with these two states. In this case, it is suggested that the Visibility property
		*           always overrides the Show.
		*
		* \see Visibility property.
		*/
		FbxPropertyT<FbxBool> Show;

		/** This property contains negative percent shape support information of the node
		*
		* To access this property do: NegativePercentShapeSupport.Get().
		* To set this property do: NegativePercentShapeSupport.Set(FbxBool).
		* 
		* Default value is true.
		*/
		FbxPropertyT<FbxBool> NegativePercentShapeSupport;

		/** This property contains default attribute index information of the node
		*
		* To access this property do: DefaultAttributeIndex.Get().
		* To set this property do: DefaultAttributeIndex.Set(FbxInt).
		* 
		* Default value is -1.
		*/
		FbxPropertyT<FbxInt> DefaultAttributeIndex;

		/** This property contains manipulation state information of the node
		*
		* To access this property do: Freeze.Get().
		* To set this property do: Freeze.Set(FbxBool).
		* 
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> Freeze;

		/** This property contains level of detail mode information of the node
		*
		* To access this property do: LODBox.Get().
		* To set this property do: LODBox.Set(FbxBool).
		* 
		* True: Bounding box
		* False: Geometry object is displayed.
		* Default value is false.
		*/
		FbxPropertyT<FbxBool> LODBox;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	class FBXSDK_DLL Pivot
	{
	public:
		static const FbxVector4 sZeroVector;
		static const FbxVector4 sOneVector;

		Pivot()
		{
			mRotationOffset = NULL;
			mRotationPivot = NULL;
			mPreRotation = NULL;
			mPostRotation = NULL;
			mScalingOffset = NULL;
			mScalingPivot = NULL;
			mGeometricTranslation = NULL;
			mGeometricRotation = NULL;
			mGeometricScaling = NULL;
			Reset();
		}
		~Pivot() { Reset(); }

		void Reset()
		{
			FBX_SAFE_DELETE(mRotationOffset);
			FBX_SAFE_DELETE(mRotationPivot); 
			FBX_SAFE_DELETE(mPreRotation);
			FBX_SAFE_DELETE(mPostRotation);
			FBX_SAFE_DELETE(mScalingOffset);
			FBX_SAFE_DELETE(mScalingPivot);
			FBX_SAFE_DELETE(mGeometricTranslation);
			FBX_SAFE_DELETE(mGeometricRotation);
			FBX_SAFE_DELETE(mGeometricScaling);
			mRotationOrder = eEulerXYZ;
			mRotationSpaceForLimitOnly = false;
			mPivotState = FbxNode::ePivotReference;
			mQuaternionInterpolate  = eQuatInterpOff;
		}

		inline const FbxVector4& GetRotationOffset() const { return (mRotationOffset) ? *mRotationOffset : sZeroVector; }
		inline void SetRotationOffset(const FbxVector4& pV)
		{
			if( !mRotationOffset )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mRotationOffset = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mRotationOffset = FbxNew< FbxVector4 >(pV);
			#endif
			}
			else
			{
				*mRotationOffset = pV;
			}
		}

		inline const FbxVector4& GetRotationPivot() const { return (mRotationPivot) ? *mRotationPivot : sZeroVector; }
		inline void SetRotationPivot(const FbxVector4& pV)
		{
			if( !mRotationPivot )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mRotationPivot = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mRotationPivot = FbxNew< FbxVector4 >(pV);
			#endif
			}
			else
			{
				*mRotationPivot = pV;
			}
		}

		inline const FbxVector4& GetPreRotation() const { return (mPreRotation) ? *mPreRotation : sZeroVector; }
		inline void SetPreRotation(const FbxVector4& pV)
		{
			if( !mPreRotation )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mPreRotation = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mPreRotation = FbxNew< FbxVector4 >(pV);
			#endif
			}
			else
			{
				*mPreRotation = pV;
			}
		}

		inline const FbxVector4& GetPostRotation() const { return (mPostRotation) ? *mPostRotation : sZeroVector; }
		inline void SetPostRotation(const FbxVector4& pV)
		{
			if( !mPostRotation )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mPostRotation = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mPostRotation = FbxNew< FbxVector4 >(pV);
			#endif
			}
			else
			{
				*mPostRotation = pV;
			}
		}

		inline const FbxVector4& GetScalingOffset() const { return (mScalingOffset) ? *mScalingOffset : sZeroVector; }
		inline void SetScalingOffset(const FbxVector4& pV)
		{
			if( !mScalingOffset )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mScalingOffset = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else                    
				mScalingOffset = FbxNew< FbxVector4 >(pV);
			#endif                        
			}
			else
			{
				*mScalingOffset = pV;
			}
		}

		inline const FbxVector4& GetScalingPivot() const { return (mScalingPivot) ? *mScalingPivot : sZeroVector; }
		inline void SetScalingPivot(const FbxVector4& pV)
		{
			if( !mScalingPivot )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mScalingPivot = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else                    
				mScalingPivot = FbxNew< FbxVector4 >(pV);
			#endif                        
			}
			else
			{
				*mScalingPivot = pV;
			}
		}

		inline const FbxVector4& GetGeometricTranslation() const { return (mGeometricTranslation) ? *mGeometricTranslation : sZeroVector; }
		inline void SetGeometricTranslation(const FbxVector4& pV)
		{
			if( !mGeometricTranslation )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mGeometricTranslation = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mGeometricTranslation = FbxNew< FbxVector4 >(pV);
			#endif
			}
			else
			{
				*mGeometricTranslation = pV;
			}
		}

		inline const FbxVector4& GetGeometricRotation() const { return (mGeometricRotation) ? *mGeometricRotation : sZeroVector; }
		inline void SetGeometricRotation(const FbxVector4& pV)
		{
			if( !mGeometricRotation )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mGeometricRotation = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mGeometricRotation = FbxNew< FbxVector4 >(pV);
			#endif
			}
			else
			{
				*mGeometricRotation = pV;
			}
		}

		inline const FbxVector4& GetGeometricScaling() const { return (mGeometricScaling) ? *mGeometricScaling : sOneVector; }
		inline void SetGeometricScaling(const FbxVector4& pV)
		{
			if( !mGeometricScaling )
			{
			#if defined(__GNUC__) && (__GNUC__ < 4)
				mGeometricScaling = FbxNew< FbxVector4 >((FbxVector4&)pV);
			#else
				mGeometricScaling = FbxNew< FbxVector4 >(pV);
			#endif                        
			}
			else
			{
				*mGeometricScaling = pV;
			}
		}

		inline EFbxRotationOrder GetRotationOrder() const { return mRotationOrder; }
		inline void SetRotationOrder(EFbxRotationOrder pROrder) { mRotationOrder = pROrder; }
		inline bool GetRotationSpaceForLimitOnly() const { return mRotationSpaceForLimitOnly; }
		inline void SetRotationSpaceForLimitOnly(bool pVal) { mRotationSpaceForLimitOnly = pVal; }
		inline EFbxQuatInterpMode GetQuaternionInterpolate() const { return mQuaternionInterpolate; }
		inline void SetQuaternionInterpolate(EFbxQuatInterpMode pVal) { mQuaternionInterpolate = pVal;  }
		inline FbxNode::EPivotState GetPivotState() const { return mPivotState; }
		inline void SetPivotState(FbxNode::EPivotState pVal) { mPivotState = pVal; }

	private:
		FbxVector4*				mRotationOffset;
		FbxVector4*				mRotationPivot;
		FbxVector4*				mPreRotation;
		FbxVector4*				mPostRotation;
		FbxVector4*				mScalingOffset;
		FbxVector4*				mScalingPivot;
		FbxVector4*				mGeometricTranslation;
		FbxVector4*				mGeometricRotation;
		FbxVector4*				mGeometricScaling;
		EFbxRotationOrder		mRotationOrder;
		bool					mRotationSpaceForLimitOnly;
		EFbxQuatInterpMode		mQuaternionInterpolate;
		FbxNode::EPivotState	mPivotState;
	};

	class FBXSDK_DLL Pivots
	{
	public:
		Pivots()
		{
			for( int i = 0; i < 2; i++ )
			{
				mIsDefault[i] = true;
				mPivotState[i] = FbxNode::ePivotReference;
				mPivot[i] = NULL;
			}
		}

		~Pivots()
		{
			FbxDelete(mPivot[0]);
			FbxDelete(mPivot[1]);
		}

		Pivot& Get(int id)
		{
			FBX_ASSERT(id == 0 || id == 1);
			if (mPivot[id] == NULL && mIsDefault[id])
			{
				smDefaultPivot.SetPivotState(mPivotState[id]);
				return smDefaultPivot;
			}

			if (!mPivot[id])
				mPivot[id] = FbxNew< Pivot >();

			FBX_ASSERT(mPivot[id] != NULL);
			if (mPivot[id])
				mPivot[id]->SetPivotState(mPivotState[id]);

			return *mPivot[id];
		}

		#define MACRO_PIVOT_VECTOR_FCTS(name, defVect) \
			inline const FbxVector4& Get##name(int id) const \
			{\
				FBX_ASSERT(id == 0 || id == 1); \
				Pivot* p = mPivot[id]; \
				if (p == NULL) p = &smDefaultPivot; \
				return p->Get##name(); \
			}\
			inline void Set##name(int id, const FbxVector4& pV) \
			{\
				FBX_ASSERT(id == 0 || id == 1); \
				if (mIsDefault[id] && pV[0] == defVect[0] && pV[1] == defVect[1] && pV[2] == defVect[2]) return; \
				mIsDefault[id] = false; \
				Get(id).Set##name(pV); \
			}

		MACRO_PIVOT_VECTOR_FCTS(RotationOffset, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(RotationPivot, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(PreRotation, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(PostRotation, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(ScalingOffset, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(ScalingPivot, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(GeometricTranslation, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(GeometricRotation, Pivot::sZeroVector);
		MACRO_PIVOT_VECTOR_FCTS(GeometricScaling, Pivot::sOneVector);

		#define MACRO_PIVOT_BOOL_FCTS(name) \
			inline bool Get##name(int id) const \
			{\
				FBX_ASSERT(id == 0 || id == 1); \
				Pivot* p = mPivot[id]; \
				if (p == NULL) p = &smDefaultPivot; \
				return p->Get##name(); \
			}\
			inline void Set##name(int id, bool pV) \
			{\
				FBX_ASSERT(id == 0 || id == 1); \
				mIsDefault[id] = false; \
				Get(id).Set##name(pV); \
			}

		MACRO_PIVOT_BOOL_FCTS(RotationSpaceForLimitOnly);

		inline EFbxQuatInterpMode GetQuaternionInterpolate(int id) const
		{
			FBX_ASSERT(id == 0 || id == 1);
			Pivot* p = mPivot[id];
			if (p == NULL) p = &smDefaultPivot;
			return p->GetQuaternionInterpolate();
		}

		inline void SetQuaternionInterpolate(int id, EFbxQuatInterpMode pV)
		{
			FBX_ASSERT(id == 0 || id == 1);
			// If pivot has default values, and we want to set default eQuatInterpOff, 
			// return to avoid allocating memory for the pivot (in Get(id).)
			if (mIsDefault[id] && pV == eQuatInterpOff) return;
			mIsDefault[id] = false;
			Get(id).SetQuaternionInterpolate(pV);
		}

		inline EFbxRotationOrder GetRotationOrder(int id) const
		{
			FBX_ASSERT(id == 0 || id == 1);
			Pivot* p = mPivot[id];
			if (p == NULL) p = &smDefaultPivot;
			return p->GetRotationOrder();
		}

		inline void SetRotationOrder(int id, EFbxRotationOrder pROrder)
		{
			FBX_ASSERT(id == 0 || id == 1);
			// If pivot has default values, and we want to set default rotation order eEulerXYZ, 
			// return to avoid allocating memory for the pivot (in Get(id).)
			if (mIsDefault[id] && pROrder == eEulerXYZ) return;
			mIsDefault[id] = false;
			Get(id).SetRotationOrder(pROrder);
		}

		inline FbxNode::EPivotState GetPivotState(int id) const
		{
			FBX_ASSERT(id == 0 || id == 1);
			return mPivotState[id];
		}

		inline void SetPivotState(int id, FbxNode::EPivotState pVal)
		{
			FBX_ASSERT(id == 0 || id == 1);
			if (pVal == FbxNode::ePivotReference) return;
			mPivotState[id] = pVal;
			if (mPivot[id])
				mPivot[id]->SetPivotState(pVal);
		}

		#undef MACRO_PIVOT_VECTOR_FCTS
		#undef MACRO_PIVOT_BOOL_FCTS

		void Reset()
		{
			smDefaultPivot.Reset();
			for (int i = 0; i < 2; i++)
			{
				mIsDefault[i] = true;
				mPivotState[i] = FbxNode::ePivotReference;
				if (mPivot[i]) mPivot[i]->Reset();
			}
		}

	private:
		Pivot*					mPivot[2];
		FbxNode::EPivotState	mPivotState[2];
		bool					mIsDefault[2];
		static Pivot			smDefaultPivot;
	};

	class FBXSDK_DLL LinkToCharacter
	{
	public:
		bool operator==(LinkToCharacter& pLinkToCharacter)
		{
			if (mCharacter == pLinkToCharacter.mCharacter &&
				mType == pLinkToCharacter.mType &&
				mIndex == pLinkToCharacter.mIndex &&
				mSubIndex == pLinkToCharacter.mSubIndex)
			{
				return true;
			}
			else return false;
		}

		FbxCharacter* mCharacter;
		int mType;
		int mIndex;
		int mSubIndex;
	};

    void					AddChildName(char* pChildName);
    char*					GetChildName(FbxUInt pIndex) const;
    FbxUInt					GetChildNameCount() const;

    FbxTransform&			GetTransform();
	FbxLimits&				GetTranslationLimits();
	FbxLimits&				GetRotationLimits();
	FbxLimits&				GetScalingLimits();
	Pivots&					GetPivots();

    void					UpdatePivotsAndLimitsFromProperties();
    void					UpdatePropertiesFromPivotsAndLimits();

    void					SetRotationActiveProperty(bool pVal);
    void					PivotSetToMBTransform(EPivotSet pPivotSet);

    int						AddCharacterLink(FbxCharacter* pCharacter, int pCharacterLinkType, int pNodeId, int pNodeSubId);
    int						RemoveCharacterLink(FbxCharacter* pCharacter, int pCharacterLinkType, int pNodeId, int pNodeSubId);

    // Duplicate this node as well as all its node attributes and the Target and UpTarget objects.
    FbxNode*                DeepCloneWithNodeAttributes();

    virtual FbxObject&		Copy(const FbxObject& pObject);
    virtual const char*		GetTypeName() const;
    virtual FbxStringList	GetTypeFlags() const;
    virtual bool			PropertyNotify(EPropertyNotifyType pType, FbxProperty& pProperty);

    enum ECullingType
	{
		eCullingOff,
		eCullingOnCCW,
		eCullingOnCW
	};

    ECullingType			mCullingType;
    bool					mCorrectInheritType;

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);

	void				Reset();
	bool				GetAnimationIntervalRecursive(FbxTimeSpan& pTimeInterval, FbxAnimLayer* pAnimLayer);

private:
	typedef FbxSet<FbxHandle> GeomInstSet;

	void				ResetLimitsRecursive(FbxNode* pNode);

	void				ConvertPivotAnimationRecurseLoop(FbxAnimStack* pAnimStack, const EPivotSet pConversionTarget, const double pFrameRate, const bool pKeyReduce, GeomInstSet& pGeomInstSet);
	void				ConvertPivotAnimation(FbxAnimStack* pAnimStack, const EPivotSet pConversionTarget, const double pFrameRate, const bool pKeyReduce, GeomInstSet& pGeomInstSet);
	bool				ConvertPivotAnimation_SetupMatrixConverter(FbxAnimCurveFilterMatrixConverter& pConverter, const EPivotSet& pSrcSet, const EPivotSet& pDstSet, const double pFrameRate, const bool pKeyReduce, GeomInstSet& pGeomInstSet);
	void				ConvertPivotAnimation_ApplyGeometryPivot(const EPivotSet& pSrcSet, const EPivotSet& pDstSet, GeomInstSet& pGeomInstSet);

	FbxTransform				mTransform;
	Pivots						mPivots;
	FbxObject*					mAnimCurveNodeContainer;
	FbxArray<FbxString*>		mChildrenNameList;
	FbxVector4					mPostTargetRotation;
	FbxVector4					mTargetUpVector;
	FbxNode::EShadingMode		mShadingMode;
	FbxArray<LinkToCharacter>	mLinkToCharacter;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const EFbxRotationOrder&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxTransform::EInheritType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const EFbxQuatInterpMode&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_NODE_H_ */
