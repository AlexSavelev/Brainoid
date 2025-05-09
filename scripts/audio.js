export function audioSetupAndPlay(path, parentID, loop = true) {
  const audio = new Audio(path);
  document.getElementById(parentID).appendChild(audio);
  audio.addEventListener('canplaythrough', () => {
    audio.loop = loop;
    audio.autoplay = true;
    // audio.play(); // TODO
    // TODO: load all audio Для корректной работы аудио не забудьте выдать хосту правда на аудио
  });
  return audio;
}

export function audioStopAndDestroy(audio) {
  audio.remove();  // TODO: fade out
}
