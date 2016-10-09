fetch_audio () {
  ytdl-audio $1 --seek $2 --duration $3 | pv --bytes --timer --name "$4" > ./assets/audio/clips/$4.mp3
}

fetch_audio 'hhy-xQbQ14s' '02:12' '2' 'deal'
fetch_audio 'hI14958GL0Q' '00:15' '6' 'childhood'
fetch_audio 'hI14958GL0Q' '00:29' '4' 'strict'
fetch_audio 'hI14958GL0Q' '01:02' '6' 'love'
fetch_audio 'hI14958GL0Q' '01:34' '3' 'honestly'
fetch_audio 'SPh_raqO_A0' '00:30' '3' 'people'
