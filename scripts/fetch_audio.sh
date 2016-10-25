PATH=$(npm bin):$PATH
CLIPS=$PROJECT_ASSETS_DIR/dinild-trimp/audio_clips

fetch_audio () {
  ytdl-audio $1 --seek $2 --duration $3 | pv --bytes --timer --name "$4" > $CLIPS/$4.mp3
}

sed 1d $CLIPS/_sources.csv | while IFS=, read video_id seek duration name url
do
  fetch_audio $video_id $seek $duration $name
done
