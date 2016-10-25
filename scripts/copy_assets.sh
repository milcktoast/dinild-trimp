SRC=$PROJECT_ASSETS_DIR/dinild-trimp
DEST=./assets

set -x
rm -rf ./assets
mkdir ./assets
cp -R $SRC/audio $DEST/audio
cp -R $SRC/models $DEST/models
cp -R $SRC/textures $DEST/textures
