ARR="\x1b[32m>>>\x1b[0m"
OK="\x1b[32m... OK\x1b[0m"

optimize_image () {
  name=$1
  suffix=$2
  size=$3
  echo "$ARR Optimize image: $(basename $name) $suffix"
  convert -monitor -strip -quality 90% -resize $size $name.tif "$name"_"$suffix".jpg
  convert -monitor -quality 90 -resize $size -define webp:lossless=false $name.tif "$name"_"$suffix".webp
  echo "$OK\n"
}

DINILD=./assets/textures/dinild

optimize_image $DINILD/diffuse low 512x512
optimize_image $DINILD/diffuse med 1024x1024
optimize_image $DINILD/diffuse high 2048x2048

optimize_image $DINILD/normal low 1024x1024
optimize_image $DINILD/normal med 2048x2048
optimize_image $DINILD/normal high 2048x2048
