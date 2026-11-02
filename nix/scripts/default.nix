{ pkgs }:

[
    (import ./change-volume.nix { inherit pkgs; })
    (import ./change-brightness.nix { inherit pkgs; })
    (import ./grimburst.nix { inherit pkgs; })
]
