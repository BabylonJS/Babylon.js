package com.android.babylonnative.playground;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.view.View;

import BabylonNative.BabylonView;

public class PlaygroundActivity extends Activity implements BabylonView.ViewDelegate {
    BabylonView mView;

    // Activity life
    @Override
    protected void onCreate(Bundle icicle) {
        super.onCreate(icicle);
        mView = new BabylonView(getApplication(), this);
        setContentView(mView);
    }

    @Override
    protected void onPause() {
        mView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mView.onResume();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        mView.onRequestPermissionsResult(requestCode, permissions, results);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && mView.getVisibility() == View.GONE) {
            mView.setVisibility(View.VISIBLE);
        }
    }

    @Override
    public void onViewReady() {
        mView.loadScript("app:///Scripts/experience.js");
    }
}
