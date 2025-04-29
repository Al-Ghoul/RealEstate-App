{
  inputs,
  cell,
}: let
  real-estate-app = inputs.cells.repo.packages.app;
in {
  lint-job = real-estate-app.overrideAttrs {
    name = "Lint Job";
    doCheck = true;
    dontNpmBuild = true;
    checkPhase = ''
      runHook preCheck

      npm run lint

      runHook postCheck
    '';
    meta = {
      description = "A job that runs linter on the source";
    };
  };
}
