SRC=$PROJECT_ASSETS_DIR/dinild-trimp
DEST=./assets
ARR="\x1b[32m>>>\x1b[0m"
OK="\x1b[32m... OK\x1b[0m\n"

copy_asset_dir () {
  echo "$ARR Copy $1"
  cp -LR $SRC/$1/ $DEST/$1
  echo "$OK"
}

if [ $# -eq 0 ]
  then
    rm -rf ./assets
    mkdir ./assets
    copy_asset_dir audio
    copy_asset_dir images
    copy_asset_dir models
    copy_asset_dir textures
  else
    rm -rf ./assets/$1
    copy_asset_dir $1
fi
