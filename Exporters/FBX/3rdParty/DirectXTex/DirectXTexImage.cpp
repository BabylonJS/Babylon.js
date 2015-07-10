//-------------------------------------------------------------------------------------
// DirectXTexImage.cpp
//  
// DirectX Texture Library - Image container
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

namespace DirectX
{

extern bool _CalculateMipLevels( _In_ size_t width, _In_ size_t height, _Inout_ size_t& mipLevels );
extern bool _CalculateMipLevels3D( _In_ size_t width, _In_ size_t height, _In_ size_t depth, _Inout_ size_t& mipLevels );
extern bool _IsAlphaAllOpaqueBC( _In_ const Image& cImage );

//-------------------------------------------------------------------------------------
// Determines number of image array entries and pixel size
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void _DetermineImageArray( const TexMetadata& metadata, DWORD cpFlags,
                           size_t& nImages, size_t& pixelSize )
{
    assert( metadata.width > 0 && metadata.height > 0 && metadata.depth > 0 );
    assert( metadata.arraySize > 0 );
    assert( metadata.mipLevels > 0 );

    size_t _pixelSize = 0;
    size_t _nimages = 0;

    switch( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        for( size_t item = 0; item < metadata.arraySize; ++item )
        {
            size_t w = metadata.width;
            size_t h = metadata.height;

            for( size_t level=0; level < metadata.mipLevels; ++level )
            {
                size_t rowPitch, slicePitch;
                ComputePitch( metadata.format, w, h, rowPitch, slicePitch, cpFlags );

                _pixelSize += slicePitch;
                ++_nimages;

                if ( h > 1 )
                    h >>= 1;

                if ( w > 1 )
                    w >>= 1;
            }
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        {
            size_t w = metadata.width;
            size_t h = metadata.height;
            size_t d = metadata.depth;

            for( size_t level=0; level < metadata.mipLevels; ++level )
            {
                size_t rowPitch, slicePitch;
                ComputePitch( metadata.format, w, h, rowPitch, slicePitch, cpFlags );

                for( size_t slice=0; slice < d; ++slice )
                {
                    _pixelSize += slicePitch;
                    ++_nimages;
                }

                if ( h > 1 )
                    h >>= 1;

                if ( w > 1 )
                    w >>= 1;

                if ( d > 1 )
                    d >>= 1;
            }
        }
        break;

    default:
        assert( false );
        break;
    }

    nImages = _nimages;
    pixelSize = _pixelSize;
}


//-------------------------------------------------------------------------------------
// Fills in the image array entries
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
bool _SetupImageArray( uint8_t *pMemory, size_t pixelSize,
                       const TexMetadata& metadata, DWORD cpFlags,
                       Image* images, size_t nImages )
{
    assert( pMemory );
    assert( pixelSize > 0 );
    assert( nImages > 0 );

    if ( !images )
        return false;

    size_t index = 0;
    uint8_t* pixels = pMemory;
    const uint8_t* pEndBits = pMemory + pixelSize;

    switch( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        if (metadata.arraySize == 0 || metadata.mipLevels == 0)
        {
            return false;
        }

        for( size_t item = 0; item < metadata.arraySize; ++item )
        {
            size_t w = metadata.width;
            size_t h = metadata.height;

            for( size_t level=0; level < metadata.mipLevels; ++level )
            {
                if ( index >= nImages )
                {
                    return false;
                }

                size_t rowPitch, slicePitch;
                ComputePitch( metadata.format, w, h, rowPitch, slicePitch, cpFlags );

                images[index].width = w;
                images[index].height = h;
                images[index].format = metadata.format;
                images[index].rowPitch = rowPitch;
                images[index].slicePitch = slicePitch;
                images[index].pixels = pixels;
                ++index;

                pixels += slicePitch;
                if ( pixels > pEndBits )
                {
                    return false;
                }
            
                if ( h > 1 )
                    h >>= 1;

                if ( w > 1 )
                    w >>= 1;
            }
        }
        return true;

    case TEX_DIMENSION_TEXTURE3D:
        {
            if (metadata.mipLevels == 0 || metadata.depth == 0)
            {
                return false;
            }

            size_t w = metadata.width;
            size_t h = metadata.height;
            size_t d = metadata.depth;

            for( size_t level=0; level < metadata.mipLevels; ++level )
            {
                size_t rowPitch, slicePitch;
                ComputePitch( metadata.format, w, h, rowPitch, slicePitch, cpFlags );

                for( size_t slice=0; slice < d; ++slice )
                {
                    if ( index >= nImages )
                    {
                        return false;
                    }

                    // We use the same memory organization that Direct3D 11 needs for D3D11_SUBRESOURCE_DATA
                    // with all slices of a given miplevel being continuous in memory
                    images[index].width = w;
                    images[index].height = h;
                    images[index].format = metadata.format;
                    images[index].rowPitch = rowPitch;
                    images[index].slicePitch = slicePitch;
                    images[index].pixels = pixels;
                    ++index;

                    pixels += slicePitch;
                    if ( pixels > pEndBits )
                    {
                        return false;
                    }
                }
            
                if ( h > 1 )
                    h >>= 1;

                if ( w > 1 )
                    w >>= 1;

                if ( d > 1 )
                    d >>= 1;
            }
        }
        return true;

    default:
        return false;
    }
}


//=====================================================================================
// ScratchImage - Bitmap image container
//=====================================================================================

ScratchImage& ScratchImage::operator= (ScratchImage&& moveFrom)
{
    if ( this != &moveFrom )
    {
        Release();

        _nimages = moveFrom._nimages;
        _size = moveFrom._size;
        _metadata = moveFrom._metadata;
        _image = moveFrom._image;
        _memory = moveFrom._memory;

        moveFrom._nimages = 0;
        moveFrom._size = 0;
        moveFrom._image = nullptr;
        moveFrom._memory = nullptr;
    }
    return *this;
}


//-------------------------------------------------------------------------------------
// Methods
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT ScratchImage::Initialize( const TexMetadata& mdata, DWORD flags )
{
    if ( !IsValid(mdata.format) )
        return E_INVALIDARG;

    if ( IsPalettized(mdata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    size_t mipLevels = mdata.mipLevels;

    switch( mdata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
        if ( !mdata.width || mdata.height != 1 || mdata.depth != 1 || !mdata.arraySize )
            return E_INVALIDARG;

        if ( IsVideo(mdata.format) )
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

        if ( !_CalculateMipLevels(mdata.width,1,mipLevels) )
            return E_INVALIDARG;
        break;

    case TEX_DIMENSION_TEXTURE2D:
        if ( !mdata.width || !mdata.height || mdata.depth != 1 || !mdata.arraySize )
            return E_INVALIDARG;

        if ( mdata.IsCubemap() )
        {
            if ( (mdata.arraySize % 6) != 0 )
                return E_INVALIDARG;

            if ( IsVideo(mdata.format) )
                return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }

        if ( !_CalculateMipLevels(mdata.width,mdata.height,mipLevels) )
            return E_INVALIDARG;
        break;

    case TEX_DIMENSION_TEXTURE3D:
        if ( !mdata.width || !mdata.height || !mdata.depth || mdata.arraySize != 1 )
            return E_INVALIDARG;
        
        if ( IsVideo(mdata.format) || IsPlanar(mdata.format) || IsDepthStencil(mdata.format) )
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

        if ( !_CalculateMipLevels3D(mdata.width,mdata.height,mdata.depth,mipLevels) )
            return E_INVALIDARG;
        break;

    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    Release();

    _metadata.width = mdata.width;
    _metadata.height = mdata.height;
    _metadata.depth = mdata.depth;
    _metadata.arraySize = mdata.arraySize;
    _metadata.mipLevels = mipLevels;
    _metadata.miscFlags = mdata.miscFlags;
    _metadata.miscFlags2 = mdata.miscFlags2;
    _metadata.format = mdata.format;
    _metadata.dimension = mdata.dimension;

    size_t pixelSize, nimages;
    _DetermineImageArray( _metadata, flags, nimages, pixelSize );

    _image = new (std::nothrow) Image[ nimages ];
    if ( !_image )
        return E_OUTOFMEMORY;

    _nimages = nimages;
    memset( _image, 0, sizeof(Image) * nimages );

    _memory = reinterpret_cast<uint8_t*>( _aligned_malloc( pixelSize, 16 ) );
    if ( !_memory )
    {
        Release();
        return E_OUTOFMEMORY;
    }
    _size = pixelSize;
    if ( !_SetupImageArray( _memory, pixelSize, _metadata, flags, _image, nimages ) )
    {
        Release();
        return E_FAIL;
    }

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::Initialize1D( DXGI_FORMAT fmt, size_t length, size_t arraySize, size_t mipLevels, DWORD flags )
{
    if ( !length || !arraySize )
        return E_INVALIDARG;

    if ( IsVideo(fmt) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    // 1D is a special case of the 2D case
    HRESULT hr = Initialize2D( fmt, length, 1, arraySize, mipLevels, flags );
    if ( FAILED(hr) )
        return hr;

    _metadata.dimension = TEX_DIMENSION_TEXTURE1D;

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::Initialize2D( DXGI_FORMAT fmt, size_t width, size_t height, size_t arraySize, size_t mipLevels, DWORD flags )
{
    if ( !IsValid(fmt) || !width || !height || !arraySize )
        return E_INVALIDARG;

    if ( IsPalettized(fmt) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( !_CalculateMipLevels(width,height,mipLevels) )
        return E_INVALIDARG;

    Release();

    _metadata.width = width;
    _metadata.height = height;
    _metadata.depth = 1;
    _metadata.arraySize = arraySize;
    _metadata.mipLevels = mipLevels;
    _metadata.miscFlags = 0;
    _metadata.miscFlags2 = 0;
    _metadata.format = fmt;
    _metadata.dimension = TEX_DIMENSION_TEXTURE2D;

    size_t pixelSize, nimages;
    _DetermineImageArray( _metadata, flags, nimages, pixelSize );

    _image = new (std::nothrow) Image[ nimages ];
    if ( !_image )
        return E_OUTOFMEMORY;

    _nimages = nimages;
    memset( _image, 0, sizeof(Image) * nimages );

    _memory = reinterpret_cast<uint8_t*>( _aligned_malloc( pixelSize, 16 ) );
    if ( !_memory )
    {
        Release();
        return E_OUTOFMEMORY;
    }
    _size = pixelSize;
    if ( !_SetupImageArray( _memory, pixelSize, _metadata, flags, _image, nimages ) )
    {
        Release();
        return E_FAIL;
    }

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::Initialize3D( DXGI_FORMAT fmt, size_t width, size_t height, size_t depth, size_t mipLevels, DWORD flags )
{
    if ( !IsValid(fmt) || !width || !height || !depth )
        return E_INVALIDARG;

    if ( IsVideo(fmt) || IsPlanar(fmt) || IsDepthStencil(fmt) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( !_CalculateMipLevels3D(width,height,depth,mipLevels) )
        return E_INVALIDARG;

    Release();

    _metadata.width = width;
    _metadata.height = height;
    _metadata.depth = depth;
    _metadata.arraySize = 1;    // Direct3D 10.x/11 does not support arrays of 3D textures
    _metadata.mipLevels = mipLevels;
    _metadata.miscFlags = 0;
    _metadata.miscFlags2 = 0;
    _metadata.format = fmt;
    _metadata.dimension = TEX_DIMENSION_TEXTURE3D;

    size_t pixelSize, nimages;
    _DetermineImageArray( _metadata, flags, nimages, pixelSize );

    _image = new (std::nothrow) Image[ nimages ];
    if ( !_image )
    {
        Release();
        return E_OUTOFMEMORY;
    }
    _nimages = nimages;
    memset( _image, 0, sizeof(Image) * nimages );

    _memory = reinterpret_cast<uint8_t*>( _aligned_malloc( pixelSize, 16 ) );
    if ( !_memory )
    {
        Release();
        return E_OUTOFMEMORY;
    }
    _size = pixelSize;

    if ( !_SetupImageArray( _memory, pixelSize, _metadata, flags, _image, nimages ) )
    {
        Release();
        return E_FAIL;
    }

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::InitializeCube( DXGI_FORMAT fmt, size_t width, size_t height, size_t nCubes, size_t mipLevels, DWORD flags )
{
    if ( !width || !height || !nCubes )
        return E_INVALIDARG;

    if ( IsVideo(fmt) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    
    // A DirectX11 cubemap is just a 2D texture array that is a multiple of 6 for each cube
    HRESULT hr = Initialize2D( fmt, width, height, nCubes * 6, mipLevels, flags );
    if ( FAILED(hr) )
        return hr;

    _metadata.miscFlags |= TEX_MISC_TEXTURECUBE;

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::InitializeFromImage( const Image& srcImage, bool allow1D, DWORD flags )
{
    HRESULT hr = ( srcImage.height > 1 || !allow1D )
                 ? Initialize2D( srcImage.format, srcImage.width, srcImage.height, 1, 1, flags )
                 : Initialize1D( srcImage.format, srcImage.width, 1, 1, flags );

    if ( FAILED(hr) )
        return hr;

    size_t rowCount = ComputeScanlines( srcImage.format, srcImage.height );
    if ( !rowCount )
        return E_UNEXPECTED;

    const uint8_t* sptr = reinterpret_cast<const uint8_t*>( srcImage.pixels );
    if ( !sptr )
        return E_POINTER;

    auto dptr = reinterpret_cast<uint8_t*>( _image[0].pixels );
    if ( !dptr )
        return E_POINTER;

    size_t spitch = srcImage.rowPitch;
    size_t dpitch = _image[0].rowPitch;

    size_t size = std::min<size_t>( dpitch, spitch );

    for( size_t y = 0; y < rowCount; ++y )
    {
        memcpy_s( dptr, dpitch, sptr, size );
        sptr += spitch;
        dptr += dpitch;
    }

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::InitializeArrayFromImages( const Image* images, size_t nImages, bool allow1D, DWORD flags )
{
    if ( !images || !nImages )
        return E_INVALIDARG;

    DXGI_FORMAT format = images[0].format;
    size_t width = images[0].width;
    size_t height = images[0].height;

    for( size_t index=0; index < nImages; ++index )
    {
        if ( !images[index].pixels )
            return E_POINTER;

        if ( images[index].format != format || images[index].width != width || images[index].height != height )
        {
            // All images must be the same format, width, and height
            return E_FAIL;
        }
    }

    HRESULT hr = ( height > 1 || !allow1D )
                 ? Initialize2D( format, width, height, nImages, 1, flags )
                 : Initialize1D( format, width, nImages, 1, flags );

    if ( FAILED(hr) )
        return hr;

    size_t rowCount = ComputeScanlines( format, height );
    if ( !rowCount )
        return E_UNEXPECTED;

    for( size_t index=0; index < nImages; ++index )
    {
        auto sptr = reinterpret_cast<const uint8_t*>( images[index].pixels );
        if ( !sptr )
            return E_POINTER;

        assert( index < _nimages );
        auto dptr = reinterpret_cast<uint8_t*>( _image[index].pixels );
        if ( !dptr )
            return E_POINTER;

        size_t spitch = images[index].rowPitch;
        size_t dpitch = _image[index].rowPitch;

        size_t size = std::min<size_t>( dpitch, spitch );

        for( size_t y = 0; y < rowCount; ++y )
        {
            memcpy_s( dptr, dpitch, sptr, size );
            sptr += spitch;
            dptr += dpitch;
        }
    }

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::InitializeCubeFromImages( const Image* images, size_t nImages, DWORD flags )
{
    if ( !images || !nImages )
        return E_INVALIDARG;

    // A DirectX11 cubemap is just a 2D texture array that is a multiple of 6 for each cube
    if ( ( nImages % 6 ) != 0 )
        return E_INVALIDARG;

    if ( IsVideo(images[0].format) || IsPalettized(images[0].format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    HRESULT hr = InitializeArrayFromImages( images, nImages, false, flags );
    if ( FAILED(hr) )
        return hr;

    _metadata.miscFlags |= TEX_MISC_TEXTURECUBE;

    return S_OK;
}

_Use_decl_annotations_
HRESULT ScratchImage::Initialize3DFromImages( const Image* images, size_t depth, DWORD flags )
{
    if ( !images || !depth )
        return E_INVALIDARG;

    DXGI_FORMAT format = images[0].format;
    size_t width = images[0].width;
    size_t height = images[0].height;

    for( size_t slice=0; slice < depth; ++slice )
    {
        if ( !images[slice].pixels )
            return E_POINTER;

        if ( images[slice].format != format || images[slice].width != width || images[slice].height != height )
        {
            // All images must be the same format, width, and height
            return E_FAIL;
        }
    }

    HRESULT hr = Initialize3D( format, width, height, depth, 1, flags );
    if ( FAILED(hr) )
        return hr;

    size_t rowCount = ComputeScanlines( format, height );
    if ( !rowCount )
        return E_UNEXPECTED;

    for( size_t slice=0; slice < depth; ++slice )
    {
        auto sptr = reinterpret_cast<const uint8_t*>( images[slice].pixels );
        if ( !sptr )
            return E_POINTER;

        assert( slice < _nimages );
        auto dptr = reinterpret_cast<uint8_t*>( _image[slice].pixels );
        if ( !dptr )
            return E_POINTER;

        size_t spitch = images[slice].rowPitch;
        size_t dpitch = _image[slice].rowPitch;

        size_t size = std::min<size_t>( dpitch, spitch );

        for( size_t y = 0; y < rowCount; ++y )
        {
            memcpy_s( dptr, dpitch, sptr, size );
            sptr += spitch;
            dptr += dpitch;
        }
    }

    return S_OK;
}

void ScratchImage::Release()
{
    _nimages = 0;
    _size = 0;

    if ( _image )
    {
        delete [] _image;
        _image = 0;
    }

    if ( _memory )
    {
        _aligned_free( _memory );
        _memory = 0;
    }
    
    memset(&_metadata, 0, sizeof(_metadata));
}

_Use_decl_annotations_
bool ScratchImage::OverrideFormat( DXGI_FORMAT f )
{
    if ( !_image )
        return false;

    if ( !IsValid( f ) || IsPlanar( f ) || IsPalettized( f ) )
        return false;

    if ( ( BitsPerPixel( f ) != BitsPerPixel( _metadata.format ) )
         || ( IsCompressed( f ) != IsCompressed( _metadata.format ) )
         || ( IsPacked( f ) != IsPacked( _metadata.format ) )
         || ( IsVideo( f ) != IsVideo( _metadata.format ) ) )
    {
         // Can't change the effective pitch of the format this way
         return false;
    }

    for( size_t index = 0; index < _nimages; ++index )
    {
        _image[ index ].format = f;
    }

    _metadata.format = f;

    return true;
}

_Use_decl_annotations_
const Image* ScratchImage::GetImage(size_t mip, size_t item, size_t slice) const
{
    if ( mip >= _metadata.mipLevels )
        return nullptr;

    size_t index = 0;

    switch( _metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        if ( slice > 0 )
            return nullptr;

        if ( item >= _metadata.arraySize )
            return nullptr;

        index = item*( _metadata.mipLevels ) + mip;
        break;

    case TEX_DIMENSION_TEXTURE3D:
        if ( item > 0 )
        {
            // No support for arrays of volumes
            return nullptr;
        }
        else
        {
            size_t d = _metadata.depth;

            for( size_t level = 0; level < mip; ++level )
            {
                index += d;
                if ( d > 1 )
                    d >>= 1;
            }

            if ( slice >= d )
                return nullptr;

            index += slice;
        }
        break;

    default:
        return nullptr;
    }
 
    return &_image[index];
}

bool ScratchImage::IsAlphaAllOpaque() const
{
    if ( !_image )
        return false;

    if ( !HasAlpha( _metadata.format ) )
        return true;

    if ( IsCompressed( _metadata.format ) )
    {
        for( size_t index = 0; index < _nimages; ++index )
        {
            if ( !_IsAlphaAllOpaqueBC( _image[ index ] ) )
                return false;
        }
    }
    else
    {
        ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*_metadata.width), 16 ) ) );
        if ( !scanline )
            return false;

        static const XMVECTORF32 threshold = { 0.99f, 0.99f, 0.99f, 0.99f };

        for( size_t index = 0; index < _nimages; ++index )
        {
#pragma warning( suppress : 6011 )
            const Image& img = _image[ index ];

            const uint8_t *pPixels = img.pixels;
            assert( pPixels );

            for( size_t h = 0; h < img.height; ++h )
            {
                if ( !_LoadScanline( scanline.get(), img.width, pPixels, img.rowPitch, img.format ) )
                    return false;

                XMVECTOR* ptr = scanline.get();
                for( size_t w = 0; w < img.width; ++w )
                {
                    XMVECTOR alpha = XMVectorSplatW( *ptr );
                    if ( XMVector4Less( alpha, threshold ) )
                        return false;
                    ++ptr;
                }

                pPixels += img.rowPitch;
            }
        }
    }

    return true;
}

}; // namespace
