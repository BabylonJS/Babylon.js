#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV == 0
	if (v_INFONAME_ == 0.)
	{
		v_VARYINGNAME_UV = vec2(_MATRIXNAME_Matrix * vec4(uvUpdated, 1.0, 0.0));
	}
	else if (v_INFONAME_ == 1.)
	{
		v_VARYINGNAME_UV = vec2(_MATRIXNAME_Matrix * vec4(uv2, 1.0, 0.0));
	}
	else if (v_INFONAME_ == 2.)
	{
		v_VARYINGNAME_UV = vec2(_MATRIXNAME_Matrix * vec4(uv3, 1.0, 0.0));
	}
	else if (v_INFONAME_ == 3.)
	{
		v_VARYINGNAME_UV = vec2(_MATRIXNAME_Matrix * vec4(uv4, 1.0, 0.0));
	}
	else if (v_INFONAME_ == 4.)
	{
		v_VARYINGNAME_UV = vec2(_MATRIXNAME_Matrix * vec4(uv5, 1.0, 0.0));
	}
	else if (v_INFONAME_ == 5.)
	{
		v_VARYINGNAME_UV = vec2(_MATRIXNAME_Matrix * vec4(uv6, 1.0, 0.0));
	}
#endif
