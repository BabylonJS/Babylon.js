/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxscene.h
#ifndef _FBXSDK_SCENE_H_
#define _FBXSDK_SCENE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxmultimap.h>
#include <fbxsdk/core/base/fbxcharptrset.h>
#include <fbxsdk/scene/fbxdocument.h>
#include <fbxsdk/scene/animation/fbxanimevaluator.h>
#include <fbxsdk/scene/geometry/fbxlayer.h>
#include <fbxsdk/scene/geometry/fbxnodeattribute.h>
#include <fbxsdk/fileio/fbxiosettings.h>
#include <fbxsdk/fileio/fbxglobalsettings.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxGeometry;
class FbxTexture;
class FbxSurfaceMaterial;
class FbxCharacter;
class FbxControlSetPlug;
class FbxGenericNode;
class FbxPose;
class FbxCharacterPose;
class FbxVideo;
class FbxGlobalLightSettings;
class FbxGlobalCameraSettings;

/** This class contains the description of a 3D scene. It contains the nodes (including the root node) (FbxNode),
  * materials, textures, videos, gobos, 
  * poses, characters, character poses, control set plugs, 
  * generic nodes, 
  * scene information, global settings,
  * and a global evaluator.
  * The nodes are structured in a tree under the scene's root node.
  *
  * When an object is created using the FBX SDK, a scene is usually passed as argument to the
  * object creation function to specify that the object belongs to this scene.
  * At this point, a connection is made with the object as source and the scene as destination. 
  * 
  * All objects in the scene can be queried by connection index. In addition,
  * generic nodes, materials, and textures can also be queried by name. In this latter case, the
  * first object with the queried name will be returned.
  *
  * The global evaluator (FbxAnimEvaluator) is used to compute animation values
  * for animated scenes.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxScene : public FbxDocument
{
	FBXSDK_OBJECT_DECLARE(FbxScene, FbxDocument);

public:
	//! \name Scene Management
	//@{
		//! Clear the scene content by deleting the node tree below the root node and restoring default settings.
		void Clear();

		/** Get the root node of the scene.
		* \return Pointer to the root node.
		* \remarks This node is not saved. Do not use it to apply a global transformation to the node hierarchy. If a global transformation must be applied, insert a new node below this one. */
		FbxNode* GetRootNode() const;
	//@}

	//! \name Texture Material and Video Access
	//@{
		/** Clear, then fill, a texture array with all existing textures included in the scene.
		* \param pTextureArray An array of texture pointers. */
		void FillTextureArray(FbxArray<FbxTexture*>& pTextureArray);

		/** Clear, then fill, a material array with all existing materials included in the scene.
		* \param pMaterialArray An array of material pointers. */
		void FillMaterialArray(FbxArray<FbxSurfaceMaterial*>& pMaterialArray);
	//@}

	//! \name Generic Node Access
	//@{
		/** Get number of generic nodes in the scene.
		* \return Number of Generic Nodes in this scene. */
		int GetGenericNodeCount() const;

		/** Get generic node at given index.
		* \param pIndex Position in the list of the generic nodes.
		* \return Pointer to the generic node or \c NULL if the index is out of bounds.
		*/
		FbxGenericNode* GetGenericNode(int pIndex);

		/** Access a generic node from its name.
		*   \param pName Name of the generic node.
		*   \return found generic node
		*/
		FbxGenericNode* GetGenericNode(char* pName);

		/** Add a generic node to this scene.
		* \param pGenericNode Pointer to the generic node to be added.
		* \return If the passed parameter is \c NULL, this method will return \c false, otherwise \c true. */
		bool AddGenericNode(FbxGenericNode* pGenericNode);

		/** Remove the generic node from this scene.
		* \param pGenericNode Pointer to the generic node to be removed.
		* \return If the passed parameter is \c NULL, this method will return \c false, otherwise \c true.
		* \remarks The pointed object is not referenced by the scene anymore but is not deleted. */
		bool RemoveGenericNode(FbxGenericNode* pGenericNode);
	//@}


	//! \name Character Management
	//@{
		/** Get number of characters.
		* \return Number of characters in this scene. */
		int GetCharacterCount() const;

		/** Get character at given index.
		* \param pIndex Position in the list of the characters.
		* \return Pointer to the character or \c NULL if index is out of bounds. */
		FbxCharacter* GetCharacter(int pIndex);

		/** Create a new character.
		* \param pName Name given to character.
		* \return Index of the created character. */
		int CreateCharacter(const char* pName);

		/** Destroy character.
		* \param pIndex Specify which character to destroy. */
		void DestroyCharacter(int pIndex);
	//@}

	//! \name ControlSetPlug Management
	//@{
		/** Get number of ControlSetPlugs.
		* \return Number of ControlSet plugs in this scene. */
		int GetControlSetPlugCount() const;

		/** Get ControlSetPlug at given index.
		* \param pIndex Position in the list of the ControlSetPlug
		* \return Pointer to ControlSetPlug or \c NULL if index is out of bounds. */
		FbxControlSetPlug* GetControlSetPlug(int pIndex);

		/** Create a new ControlSetPlug.
		* \param pName Name given to ControlSetPlug.
		* \return Index of created ControlSetPlug. */
		int CreateControlSetPlug(char* pName);

		/** Destroy ControlSetPlug.
		* \param pIndex Specify which ControlSetPlug to destroy. */
		void DestroyControlSetPlug(int pIndex);
	//@}

	//! \name Character Pose Management
	//@{
		/** Get number of character poses.
		* \return Number of character poses in this scene.
		* \remarks Character Poses and Poses are two distinct entities having their own lists. */
		int GetCharacterPoseCount() const;

		/** Get character pose at given index.
		* \param pIndex Position in the list of character poses.
		* \return Pointer to the character pose or \c NULL if index is out of bounds. */
		FbxCharacterPose* GetCharacterPose(int pIndex);

		/** Create a new character pose.
		* \param pName Name given to character pose.
		* \return Index of created character pose. */
		int CreateCharacterPose(char* pName);

		/** Destroy character pose.
		* \param pIndex Specify which character pose to destroy. */
		void DestroyCharacterPose(int pIndex);
	//@}

	//! \name Pose Management
	//@{
		/** Get number of poses.
		* \return Number of poses in the scene.
		* \remarks Poses and Character Poses are two distinct entities having their own lists. */
		int GetPoseCount() const;

		/** Get pose at given index.
		* \param pIndex Position in the list of poses.
		* \return Pointer to the pose or \c NULL if index is out of bounds. */
		FbxPose* GetPose(int pIndex);

		/** Add a pose to this scene.
		* \param pPose The pose (for example: bind pose, rest pose) to be added to the scene.
		* \return If the pose is correctly added to the scene, return \c true. Otherwise, if the pose is already in the scene, return \c false. */
		bool AddPose(FbxPose* pPose);

		/** Remove the specified pose from the scene.
		* \param pPose The pose (for example: bind pose, rest pose) to be removed from the scene.
		* \return If the pose was successfully removed from the scene, return \c true. Otherwise, if the pose could not be found return \c false. */
		bool RemovePose(FbxPose* pPose);

		/** Remove the pose at the given index from the scene.
		* \param pIndex Index of the pose to be removed.
		* \return If the pose was successfully removed from the scene, return \c true. Otherwise, if the pose could not be found return \c false. */
		bool RemovePose(int pIndex);
	//@}

	//! \name Scene information
	//@{
		/** Get the scene information.
		* \return Pointer to the scene information object. */
		FbxDocumentInfo* GetSceneInfo() { return GetDocumentInfo(); }

		/** Set the scene information.
		* \param pSceneInfo Pointer to the scene information object. */
		void SetSceneInfo(FbxDocumentInfo* pSceneInfo) { SetDocumentInfo(pSceneInfo); }
	//@}

	//! \name Global Settings
	//@{
		/** Access global settings.
		* \return Reference to the Global Settings. */
		FbxGlobalSettings& GetGlobalSettings();

		/** Const access to global settings.
		* \return Const reference to the Global Settings. */
		const FbxGlobalSettings& GetGlobalSettings() const;
	//@}

	/** \name Scene Animation Evaluation
	* The scene's animation evaluator is used to compute animation values for animated scenes. A typical
	* usage would be to compute the global transform matrix of a node \c lNode at a given time \c lTime.
	* \code
	FbxAMatrix& lGlobalMatrix = lNode->GetScene()->GetAnimationEvaluator()->GetNodeGlobalTransform(lNode, lTime);

	or the exact equivalent:

	FbxAMatrix& lGlobalMatrix = lNode->EvaluateGlobalTransform(lTime);
	* \endcode
	*
	* The user can create one or more evaluators in the scene. The default evaluator is set using SetEvaluator. When
	* GetEvaluator is called, if the scene has no evaluator, an evaluator is created with default values. */
	//@{
		/** Set the current animation stack context used by the animation evaluator.
		* \param pAnimStack The animation stack to set as current.
		* \remark Changing the current animation stack will also cause the animation evaluator to reset its state. */
		void SetCurrentAnimationStack(FbxAnimStack* pAnimStack);

		/** Retrieve the current animation stack.
		* \return the current animation stack. If none were set previously, the default one will be returned if it exists. */
		FbxAnimStack* GetCurrentAnimationStack();

		/** Set the global evaluator used by this scene evaluation engine.
		* \param pEvaluator The evaluator to be used for evaluation processing of this scene. */
		void SetAnimationEvaluator(FbxAnimEvaluator* pEvaluator);

		/** Get the global evaluator used by this scene evaluation engine.
		* If no evaluator were previously set, this function will return either the first evaluator found attached to this scene, or a new default evaluator.
		* \return The evaluator to be used for evaluation processing of this scene. */
		FbxAnimEvaluator* GetAnimationEvaluator();
	//@}

	/** Clear then fill a pose array with all existing pose included in the scene.
	* \param pPoseArray An array of pose pointers. */
	void FillPoseArray(FbxArray<FbxPose*>& pPoseArray);

	//! \name Material Access
	//@{
		/** Get number of materials.
		* \return Number of materials in this scene. */
		int GetMaterialCount() const;

		/** Get the material at the given index.
		* \param pIndex Position in the list of materials.
		* \return Pointer to the material or \c NULL if the index is out of bounds.
		* \remarks pIndex must be between 0 and GetMaterialCount(). */
		FbxSurfaceMaterial* GetMaterial(int pIndex);

		/** Get the material by its name.
		* \param pName Name of the material.
		* \return Pointer to the material or \c NULL if not found. */
		FbxSurfaceMaterial* GetMaterial(char* pName);

		/** Add the material to this scene.
		* \param pMaterial Pointer to the material to be added.
		* \return true on successful addition. */
		bool AddMaterial(FbxSurfaceMaterial* pMaterial);

		/** Remove the material from this scene.
		* \param pMaterial Pointer to the material to be removed.
		* \return true on successful removal. */
		bool RemoveMaterial(FbxSurfaceMaterial* pMaterial);
	//@}

	//! \name Texture Access
	//@{
		/** Get number of textures (type FbxTexture).
		* \return Number of textures in this scene. Includes types FbxFileTexture, FbxLayeredTexture and FbxProceduralTexture.
		* \remarks To get the number of textures of a specific type, use GetSrcCount(). For example:
		* \code
		* int lNbFileTextures = lScene->GetSrcObjectCount<FbxFileTexture>();
		* int lNbLayeredTextures = lScene->GetSrcObjectCount<FbxLayeredTexture>();
		* int lNbProceduralTextures = lScene->GetSrcObjectCount<FbxProceduralTexture>();
		* \endcode */
		int GetTextureCount() const;

		/** Get the texture at the given index. pIndex must be between 0 and GetTextureCount().
		* \param pIndex Position in the list of textures.
		* \return Pointer to the texture or \c NULL if the index is out of bounds.
		* \remarks To get the texture of a specific texture type, use GetSrcObject(). For example:
		* \code
		* FbxFileTexture* lFileTexture = lScene->GetSrcObject<FbxFileTexture>(i);
		* FbxLayeredTexture* lLayeredTexture = lScene->GetSrcObject<FbxLayeredTexture>(i);
		* FbxProceduralTexture* lProceduralTexture = lScene->GetSrcObject<FbxProceduralTexture>(i);
		* \endcode */
		FbxTexture* GetTexture(int pIndex);

		/** Get the texture by its name.
		* \param pName Name of the texture.
		* \return Pointer to the texture or \c NULL if not found. */
		FbxTexture* GetTexture(char* pName);

		/** Add the texture to this scene.
		* \param pTexture Pointer to the texture to be added.
		* \return \c true on successful addition. */
		bool AddTexture(FbxTexture* pTexture);

		/** Remove the texture from this scene.
		* \param pTexture Pointer to the texture to be removed.
		* \return \c true on successful removal. */
		bool RemoveTexture(FbxTexture* pTexture);
	//@}

	//! \name Node Access
	//@{
		/** Get number of nodes.
		* \return Number of nodes in this scene. */
		int GetNodeCount() const;

		/** Get the node at the given index.
		* \param pIndex Position in the list of nodes.
		* \return Pointer to the node or \c NULL if the index is out of bounds.
		* \remarks pIndex must be between 0 and GetNodeCount(). */
		FbxNode* GetNode(int pIndex);

		/** Add the node to this scene.
		* \param pNode Pointer to the node to be added.
		* \return true on successful addition. */
		bool AddNode(FbxNode* pNode);

		/** Remove the node from this scene.
		* \param pNode Pointer to the node to be removed.
		* \return true on successful removal. */
		bool RemoveNode(FbxNode* pNode);

		/** Helper method for determining the number of nodes that have curves on surface attributes in the scene. Since the curve-on-surface
		* nodes are connected to nurbs geometry and not any FbxNode in the scene, they won't normally be picked up in a graph traversal.
		* \return The number of curve-on-surface nodes in the scene */
		int GetCurveOnSurfaceCount();

		/** Get the first node with this name.
		* \param pName Name of the node.
		* \return Pointer to the node, or \c NULL if node is not found. */
		FbxNode* FindNodeByName(const FbxString& pName);
	//@}

	//! \name Geometry Access
	//@{
		/** Get number of geometries.
		* \return Number of geometries in this scene. */
		int GetGeometryCount() const;

		/** Get the geometry at the given index.
		* \param pIndex Position in the list of geometries.
		* \return Pointer to the geometry or \c NULL if the index is out of bounds.
		* \remarks pIndex must be between 0 and GetGeometryCount(). */
		FbxGeometry* GetGeometry(int pIndex);

		/** Add the geometry to this scene.
		* \param pGeometry Pointer to the geometry to be added.
		* \return true on successful addition. */
		bool AddGeometry(FbxGeometry* pGeometry);

		/** Remove the geometry from this scene.
		* \param pGeometry Pointer to the geometry to be removed.
		* \return true on successful removal. */
		bool RemoveGeometry(FbxGeometry* pGeometry);
	//@}

	//! \name Video Access
	//@{
		/** Get number of videos.
		* \return Number of videos in this scene. */
		int GetVideoCount() const;

		/** Get the video at the given index.
		* \param pIndex Position in the list of videos.
		* \return Pointer to the video or \c NULL if the index is out of bounds.
		* \remarks pIndex must be between 0 and GetVideoCount(). */
		FbxVideo* GetVideo(int pIndex);

		/** Add the video to this scene.
		* \param pVideo Pointer to the video to be added.
		* \return true on successful addition. */
		bool AddVideo(FbxVideo* pVideo);

		/** Remove the video from this scene.
		* \param pVideo Pointer to the video to be removed.
		* \return true on successful removal. */
		bool RemoveVideo(FbxVideo* pVideo);
	//@}

	/** \name Utilities */
	//@{
		/** Synchronize all the Show properties of node instances.
		* Walks all the node attributes defined in the scene and synchronize the Show property of all the nodes that reference the node attribute so that they all contain the same value.
		* This method should be called after the FBX scene is completely created, typically right after the calls to the FbxImporter::Import() or just before the calls to the FbxExporter::Export().
		* \remarks Applications only need to call this method if their interpretation of the Show property implies that setting the Show state on one instance affect all of them.
		* \see FbxNode::Visibility property, FbxNode::Show property */
		void SyncShowPropertyForInstance();

		/** Compute the bounding box and its center for all (or selected) nodes.
		* \param pBBoxMin The minimum value of the bounding box upon successful return.
		* \param pBBoxMax The maximum value of the bounding box upon successful return.
		* \param pBBoxCenter The center value of the bounding box upon successful return.
		* \param pSelected If \c true, only take into account selected geometry, otherwise take all geometry into account.
		* \param pTime If different from FBXSDK_TIME_INFINITE, time used to compute the bounding box for deformed geometry.
		* \return \c true if successful, otherwise \c false.
		* \remark If geometry have been unloaded from memory, their bounding box cannot be calculated and will use any value set previously. */
		bool ComputeBoundingBoxMinMaxCenter(FbxVector4& pBBoxMin, FbxVector4& pBBoxMax, FbxVector4& pBBoxCenter, bool pSelected=false, const FbxTime& pTime=FBXSDK_TIME_INFINITE);
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	void ConvertNurbsSurfaceToNurbs();
	void ConvertMeshNormals();
	void ConvertNurbsCurvesToNulls();
	void ConnectTextures();
	void BuildTextureLayersDirectArray();
	void FixInheritType(FbxNode *pNode);

	void UpdateScaleCompensate(FbxNode *pNode, FbxIOSettings& pIOS);

	FbxClassId ConvertAttributeTypeToClassID(FbxNodeAttribute::EType pAttributeType);

	// These data structures are only used for legacy FBX files (version 6.x and earlier). The
	// validity of their content is not guaranteed with the most recent versions.
	FbxGlobalLightSettings&  GlobalLightSettings()  { return *mGlobalLightSettings; }
	FbxGlobalCameraSettings& GlobalCameraSettings() { return *mGlobalCameraSettings; }

	//  Clone this scene object (and everything else it contains if clone type is eDeepClone)
	virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;    
	virtual FbxObject& Copy(const FbxObject& pObject);

	void ConnectMaterials();

	void BuildMaterialLayersDirectArray();
	void ReindexMaterialConnections(); // called to make sure that eIndex is remapped to eIndexToDirect

	FbxMultiMap* AddTakeTimeWarpSet(char *pTakeName);
	FbxMultiMap* GetTakeTimeWarpSet(char *pTakeName);

	// This function will destroy the scene (and all the objects directly connected to it) without sending 
	// the Connect notifications nor trying to disconnect the objects first. This is a bypass of the intended
	// workflow and should be used with care.
	void ForceKill();

private:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);

	void ConnectTextureLayerElement(FbxLayerContainer* pLayerContainer, FbxLayerElement::EType pLayerType, FbxNode* pParentNode);
	void BuildTextureLayersDirectArrayForLayerType(FbxLayerContainer* pLayerContainer, FbxLayerElement::EType pLayerType);

	FbxNode*					mRootNode;
	FbxGlobalLightSettings*		mGlobalLightSettings;
	FbxGlobalCameraSettings*	mGlobalCameraSettings;
	FbxAnimEvaluator*			mAnimationEvaluator;
	FbxAnimStack*				mCurrentAnimationStack;
	FbxCharPtrSet				mTakeTimeWarpSet;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_H_ */
