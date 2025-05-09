export function audioSetupAndPlay(audioInfo, loop = true) {
  const audio = audioInfo.asset;
  const volumeMod = audioInfo.volumeMod;

  audio.loop = loop;
  audio.currentTime = 0;
  audio.volume = 0.0;
  audio.autoplay = true;
  audio.play();

  // Fade in
  const fadeAudio = setInterval(function () {
    audio.volume = Math.min(volumeMod, audio.volume + 0.1 * volumeMod);
    if (audio.volume == volumeMod) {
      clearInterval(fadeAudio);
    }
  }, 100);
  return audioInfo;
}

export function audioStopAndDestroy(audioInfo) {
  const audio = audioInfo.asset;
  const volumeMod = audioInfo.volumeMod;

  // Fade out
  const fadeAudio = setInterval(function () {
    audio.volume = Math.max(0.0, audio.volume - 0.1 * volumeMod);
    if (audio.volume == 0.0) {
      audio.autoplay = false;
      audio.pause();
      clearInterval(fadeAudio);
    }
  }, 100);
}

// For SFX
export function audioPlayOnce(audioInfo) {
  const audio = audioInfo.asset;

  audio.loop = false;
  audio.autoplay = false;
  audio.volume = audioInfo.volumeMod;
  audio.play();
}
