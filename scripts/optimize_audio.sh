PATH=$(npm bin):$PATH
ARR="\x1b[32m>>>\x1b[0m"
OK="\x1b[32m... OK\x1b[0m\n"

AUDIOSPRITE=./node_modules/.bin/audiosprite
AUDIO=./assets/audio

create_sprite () {
  NAME=$1
  echo "$ARR Create audio sprite: $NAME"
  node $AUDIOSPRITE --format howler --gap 0.25 --output $AUDIO"_sprite"/$NAME $AUDIO/$NAME/*.ogg
  echo "$OK"
}

create_sprite words
