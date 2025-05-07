{
  inputs,
  cell,
}: let
  real-estate-app = inputs.cells.repo.packages.app;
in {
  lint-job = real-estate-app.overrideAttrs {
    name = "Lint Job";
    phases = [
      "unpackPhase"
      "configurePhase"
      "checkPhase"
      "installPhase"
    ];
    doCheck = true;
    checkPhase = ''
      runHook preCheck
      bun ./node_modules/typesafe-i18n/cli/typesafe-i18n.mjs --no-watch
      bun lint
      runHook postCheck
    '';
    installPhase = ''
      mkdir $out
    '';
    meta = {
      description = "A job that runs linter on the source";
    };
  };
}
