{
    description = "ags-shell - a retired AGS/Astal (GTK4) desktop shell for Hyprland, as a home-manager module";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
        ags = {
            url = "github:aylur/ags";
            inputs.nixpkgs.follows = "nixpkgs";
        };
    };

    outputs = { self, nixpkgs, ags }:
    let
        forAllSystems = f: nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system: f nixpkgs.legacyPackages.${system});
    in {
        packages = forAllSystems (pkgs: {
            default = import ./nix/package.nix { inherit pkgs ags; };
        });

        homeManagerModules.default = import ./nix/module.nix self;
        nixosModules.default = import ./nix/nixos.nix;
    };
}
