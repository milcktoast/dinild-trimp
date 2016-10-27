ARR="\x1b[32m>>>\x1b[0m"
OK="\x1b[32m... OK\x1b[0m\n"

optimize_track () {
  name=$1
  echo "$ARR Optimize track: $(basename $name .ogg)"
  ffmpeg -loglevel quiet -y -i $name.ogg -c:a libmp3lame -q:a 5 $name.mp3
  echo "$OK"
}

cd ./assets/audio
optimize_track childhood
optimize_track deal
optimize_track honestly
optimize_track love
optimize_track people
optimize_track pussy
optimize_track strict
