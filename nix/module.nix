self:
{ config, lib, pkgs, ... }:

let
    cfg = config.programs.ags-shell;
    reloadAgs = pkgs.writeShellScriptBin "reload-ags" ''
        systemctl --user restart ags-shell.service
    '';
in
{
    imports = [ ./hypr ];

    options.programs.ags-shell = {
        enable = lib.mkEnableOption "the ags-shell desktop shell";

        package = lib.mkOption {
            type = lib.types.package;
            default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
            description = "The ags-shell package: the launcher, ags with the shell's libraries, and its helper scripts.";
        };

        wallpaperDir = lib.mkOption {
            type = lib.types.str;
            default = "${config.home.homeDirectory}/Pictures/Wallpapers";
            description = "Directory the launcher's wallpaper picker lists.";
        };

        screenshotDir = lib.mkOption {
            type = lib.types.str;
            default = "${config.home.homeDirectory}/Pictures/Screenshots";
            description = "Where screen captures are saved.";
        };

        cacheDir = lib.mkOption {
            type = lib.types.str;
            default = "${config.xdg.cacheHome}/ags";
            description = "State and thumbnail cache.";
        };

        maxVolume = lib.mkOption {
            type = lib.types.float;
            default = 1.5;
            description = "Upper volume limit for the volume keys and slider (1.0 = 100%).";
        };
    };

    config = lib.mkIf cfg.enable {
        home.packages = [ cfg.package reloadAgs ];

        services = {
            awww.enable = true;
            hyprpolkitagent.enable = true;
        };

        systemd.user.services.ags-shell = {
            Unit = {
                Description = "ags-shell desktop shell";
                PartOf = [ "graphical-session.target" ];
                After = [ "graphical-session.target" "awww.service" ];
            };
            Service = {
                ExecStart = lib.getExe cfg.package;
                Environment = [
                    "AGS_CACHE_DIR=${cfg.cacheDir}"
                    "AGS_WALLPAPER_DIR=${cfg.wallpaperDir}"
                    "AGS_SCREENSHOT_DIR=${cfg.screenshotDir}"
                    "AGS_MAX_VOLUME=${toString cfg.maxVolume}"
                    "AGS_SHELL_RESET_HYPRLAND=0"
                    "AWWW_TRANSITION=wipe"
                    "AWWW_TRANSITION_FPS=45"
                    "AWWW_TRANSITION_STEP=60"
                ];
                Restart = "on-failure";
            };
            Install.WantedBy = [ "graphical-session.target" ];
        };
    };
}
