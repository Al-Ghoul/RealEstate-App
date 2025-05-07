{
  description = "A Real Estate mobile app.";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
    std = {
      url = "github:divnix/std";
      inputs = {
        devshell.url = "github:numtide/devshell";
        nixago.url = "github:nix-community/nixago";
      };
    };
    bun2nix = {
      url = "github:baileyluTCD/bun2nix";
    };
  };

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  outputs = {std, ...} @ inputs:
    std.growOn {
      inherit inputs;
      cellsFrom = ./nix;
      nixpkgsConfig = {
        allowUnfree = true;
        android_sdk.accept_license = true;
      };
      cellBlocks = with std.blockTypes; [
        (devshells "shells")
        (nixago "configs")
        (installables "packages")

        (runnables "jobs" {ci.build = true;})
      ];
    } {
    };
}
