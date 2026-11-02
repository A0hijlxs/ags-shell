{ pkgs }:

pkgs.writeShellScriptBin "change-volume" ''
    maxVolume="''${AGS_MAX_VOLUME:-1.5}"
    maxVolumePct=$(awk -v m="$maxVolume" 'BEGIN { printf "%d", int(m * 100) }')

    decimalValue=$(wpctl get-volume @DEFAULT_AUDIO_SINK@ | awk -F "Volume: " '{print $2}')

    vol=$(awk -v d="$decimalValue" 'BEGIN { printf "%d", int(d * 100) }')

    echo "current volume: $vol"

    increase() {
        if [[ $vol -le $((maxVolumePct - 5)) ]]; then
            wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
        else
            wpctl set-volume @DEFAULT_AUDIO_SINK@ $maxVolume
        fi
    }

    decrease() {
        if [[ $vol -ge 5 ]]; then
            wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
        else
            wpctl set-volume @DEFAULT_AUDIO_SINK@ 0
        fi
    }

    mute-audio() {
        wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
    }

    mute-mic() {
        wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle
    }

    value() {
        if [[ $(bc -l <<< "$1 > $maxVolume") -eq 1 ]]; then
            wpctl set-volume @DEFAULT_AUDIO_SINK@ $maxVolume
        elif [[ $(bc -l <<< "$1 < 0") -eq 1 ]]; then
            wpctl set-volume @DEFAULT_AUDIO_SINK@ 0
        else
            wpctl set-volume @DEFAULT_AUDIO_SINK@ $1
        fi
    }

    if [ "$1" = "increase" ]; then
        increase
    elif [ "$1" = "decrease" ]; then
        decrease
    elif [ "$1" = "mute-audio" ]; then
        mute-audio
    elif [ "$1" = "mute-mic" ]; then
        mute-mic
    elif [ "$1" = "value" ]; then
        value $2
    fi
''
