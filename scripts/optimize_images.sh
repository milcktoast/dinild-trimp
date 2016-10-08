DINILD=./assets/textures/dinild
convert -strip -quality 90% $DINILD/diffuse.tif $DINILD/diffuse.jpg
convert -strip -quality 90% $DINILD/normal.tif $DINILD/normal.jpg
convert -quality 90 -define webp:lossless=false $DINILD/diffuse.tif $DINILD/diffuse.webp
convert -quality 90 -define webp:lossless=false $DINILD/normal.tif $DINILD/normal.webp
