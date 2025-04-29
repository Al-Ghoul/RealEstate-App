{
  inputs,
  cell,
}: let
  inherit (inputs) self nixpkgs;
in {
  app = nixpkgs.buildNpmPackage rec {
    pname = "RealEstate-App";
    src = self + /app;

    inherit ((builtins.fromJSON (builtins.readFile "${src}/package.json"))) version;

    doCheck = false;
    doDist = false;
    dontFixup = true;

    npmPackFlags = ["--ignore-scripts"];
    npmDepsHash = "sha256-+LjdASGNAunihDWAXKqNQbjZpcTO5eng7VPdi+HjCd0=";
  };
}
