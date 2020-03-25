### Using the Android Emulator

- Install HAXM by again opening the SDK Manager, checking *Intel x86 Emulator Accelerator (HAXM installer)*, then clicking *Apply*. If the installer fails, see [HAXM Installation Troubleshooting](#HAXM-Installation-Troubleshooting).
- Create an Android Emulator through the AVD Manager (Android phone icon in the upper right). Pixel 2 with API 27 has been tested.
- In Android Studio, click the *Run->Run App* menu item and select your device if prompted.

### HAXM Installation Troubleshooting

The HAXM installer can fail for a number of reasons. Many solutions are discussed in [HAXM issue 105](https://github.com/intel/haxm/issues/105), including:

- Enabling Intel virtualization in the bios
- Disabling Hyper-V in Windows
- Disabling memory integrity in Windows
- Disabling virtualization security with the Device Guard and Credential Guard hardware readiness tool
