export function audioSetupAndPlay(audio, loop = true) {
  audio.loop = loop;
  audio.currentTime = 0;
  audio.autoplay = true;
  audio.play();
  // TODO: load all audio Для корректной работы аудио не забудьте выдать хосту правда на аудио
  return audio;
}

// TODO fade out
export function audioStopAndDestroy(audio) {
  audio.autoplay = false;
  audio.pause();
}
