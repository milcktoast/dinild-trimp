optimize_image () {
  convert -strip -quality 90% $1.tif $1.jpg
  convert -quality 90 -define webp:lossless=false $1.tif $1.webp
}

DINILD=./assets/textures/dinild
optimize_image $DINILD/diffuse
optimize_image $DINILD/normal
