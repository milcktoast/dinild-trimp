optimize_track () {
  ffmpeg -loglevel quiet -y -i $1 -c:a libmp3lame -q:a 5 "${1/%ogg/mp3}"
  echo "Optimized track: $1"
}

cd ./assets/audio
export -f optimize_track
find . -type f -name '*.ogg' | xargs -n 1 -I {} bash -c 'optimize_track "$@"' _ {}
