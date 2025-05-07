{
  inputs,
  cell,
}: let
  inherit (inputs) self bun2nix;
in {
  app = bun2nix.lib.mkBunDerivation rec {
    pname = "RealEstate-API";
    src = self + /app;
    inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;

    phases = [
      "unpackPhase"
      "configurePhase"
      "installPhase"
    ];

    installPhase = ''
      mkdir $out
    '';

    buildFlags = [];
    bunNix = self + /bun.nix;
    index = "";
  };
}
