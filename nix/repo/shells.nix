{
  inputs,
  cell,
}: let
  inherit (inputs.std) lib std;
  pkgs = inputs.nixpkgs.appendOverlays [inputs.nixgl.overlay];
in
  builtins.mapAttrs (_: lib.dev.mkShell) {
    # Tool Homepage: https://numtide.github.io/devshell/
    default = let
      # These specific versions are REQUIRED by react native
      # Please do NOT mess with them unless you know what you're doing.
      buildToolsVersion = "35.0.0";
      androidComposition = inputs.nixpkgs.androidenv.composeAndroidPackages {
        toolsVersion = null;
        platformVersions = ["35"];
        buildToolsVersions = [buildToolsVersion "34.0.0"];
        includeNDK = true;
        ndkVersion = "26.1.10909125";
        cmakeVersions = ["3.22.1"];
        useGoogleAPIs = false;
        useGoogleTVAddOns = false;
        includeEmulator = false;
        includeSources = false;
        includeSystemImages = false;
      };
    in {
      name = "Real-Estate App Dev Shell";

      imports = [std.devshellProfiles.default];

      nixago = [
        cell.configs.treefmt
        cell.configs.conform
        cell.configs.lefthook
        cell.configs.just
      ];

      commands = [
        {
          package =
            inputs.bun2nix.packages.default;
        }
        {package = inputs.nixpkgs.nodejs;}
        {package = inputs.nixpkgs.bun;}
        {package = inputs.nixpkgs.eas-cli;}

        {
          # Expose platform tools (aka adb & other executables)
          package = androidComposition.platform-tools;
        }
        {
          package = pkgs.nixgl.nixGLIntel;
          help = "NixGL for Intel graphics cards";
        }

        {package = inputs.nixpkgs.jdk17;}
      ];

      env = [
        {
          name = "ANDROID_SDK_ROOT";
          value = "${androidComposition.androidsdk}/libexec/android-sdk";
        }

        {
          name = "GRADLE_OPTS";
          value = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidComposition.androidsdk}/libexec/android-sdk/build-tools/${buildToolsVersion}/aapt2";
        }

        {
          name = "ANDROID_NDK_ROOT";
          value = "${androidComposition.androidsdk}/libexec/android-sdk/ndk-bundle";
        }

        {
          name = "android";
          value = inputs.nixpkgs.androidenv.emulateApp {
            configOptions = {
              "hw.gpu.enabled" = "yes";
            }; # Enable GPU acceleration
            name = "AlGhoul's-Emulator";
            platformVersion = "29";
            abiVersion = "x86";
            systemImageType = "google_apis_playstore";
            # Resolution could be anything you want, keep the others if your Hardware supports KVM (for better performance)
            androidEmulatorFlags = "-skin 480x800 -accel on -gpu host -qemu -enable-kvm";
          };
        }
      ];
    };
  }
