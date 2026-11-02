{ pkgs }:

pkgs.writeShellScriptBin "reload-ags" ''
    systemctl --user restart ags-shell.service
''
