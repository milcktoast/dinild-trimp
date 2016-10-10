SOURCE=./assets/audio/clips/sources.csv

fetch_audio () {
  ytdl-audio $1 --seek $2 --duration $3 | pv --bytes --timer --name "$4" > ./assets/audio/clips/$4.mp3
}

sed 1d $SOURCE | while IFS=, read video_id seek duration name url
do
  fetch_audio $video_id $seek $duration $name
done
