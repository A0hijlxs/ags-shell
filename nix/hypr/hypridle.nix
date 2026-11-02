{ config, lib, ... }:

let
    cfg = config.programs.ags-shell;
in
{
    services.hypridle = lib.mkIf (cfg.enable && cfg.lock.enable) {
        enable = true;
        settings = {

            general = {
                lock_cmd = "pidof hyprlock || hyprlock";                            # avoid starting multiple hyprlock instances.
                before_sleep_cmd = "loginctl lock-session";                         # lock before suspend.
                after_sleep_cmd = "hyprctl dispatch 'hl.dsp.dpms({ action = \"on\" })'";                       # to avoid having to press a key twice to turn on the display.
            };

            listener = [
                {
                    timeout = 150;                                                  # 2.5min.
                    on-timeout = "brightnessctl -s set 10";                         # set monitor backlight to minimum, avoid 0 on OLED monitor.
                    on-resume = "brightnessctl -r";                                 # monitor backlight restore.
                }
                {
                    timeout = 300;                                                  # 5min
                    on-timeout = "loginctl lock-session";                           # lock screen when timeout has passed
                }
                {
                    timeout = 330;                                                  # 5.5min
                    on-timeout = "hyprctl dispatch 'hl.dsp.dpms({ action = \"off\" })'";                       # screen off when timeout has passed
                    on-resume = "hyprctl dispatch 'hl.dsp.dpms({ action = \"on\" })'";                         # screen on when activity is detected after timeout has fired.
                }
            ] ++ lib.optional (cfg.lock.keyboardBacklight != null) {
                timeout = 150;
                on-timeout = "brightnessctl -sd ${cfg.lock.keyboardBacklight} set 0";
                on-resume = "brightnessctl -rd ${cfg.lock.keyboardBacklight}";
            } ++ lib.optional cfg.lock.autosuspend {
                timeout = 900;                                                      # 15min
                on-timeout = "systemctl suspend";                               # suspend pc
            };
        };
    };
}
