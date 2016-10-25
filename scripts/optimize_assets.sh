sh ./scripts/optimize_audio.sh
sh ./scripts/optimize_images.sh
node ./scripts/optimize_models.js
terminal-notifier -title "Trimp" -message "Optimize Assets Complete"
