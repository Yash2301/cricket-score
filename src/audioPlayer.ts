const SIX_COUNT = 5;
const OUT_COUNT = 4;

let current: HTMLAudioElement | null = null;

const pickRandom = (folder: string, count: number): string => {
  const n = Math.floor(Math.random() * count) + 1;
  return `${import.meta.env.BASE_URL}audio/${folder}/${n}.mp3`;
};

export const playBoundaryAudio = (type: "six" | "out") => {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  const src = type === "six" ? pickRandom("six", SIX_COUNT) : pickRandom("out", OUT_COUNT);
  current = new Audio(src);
  current.play().catch(() => {});
};
