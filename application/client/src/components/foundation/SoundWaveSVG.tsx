import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const mean = (arr: (number | undefined)[]): number => {
  let sum = 0;
  let count = 0;
  for (const v of arr) {
    if (v != null) {
      sum += v;
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const calculate = async (data: ArrayBuffer): Promise<ParsedData> => {
  const audioCtx = new AudioContext();

  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftData = Array.from(buffer.getChannelData(0), Math.abs);
  const rightData = Array.from(buffer.getChannelData(1), Math.abs);

  const normalized = leftData.map((l, i) => mean([l, rightData[i]]));
  const chunks = chunk(normalized, Math.ceil(normalized.length / 100));
  const peaks = chunks.map(mean);
  const max = Math.max(...peaks);

  return { max, peaks };
};

interface Props {
  soundData: ArrayBuffer;
}

export const SoundWaveSVG = ({ soundData }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const containerRef = useRef<SVGSVGElement>(null);
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    calculate(soundData).then(({ max, peaks }) => {
      setPeaks({ max, peaks });
    });
  }, [soundData, isVisible]);

  return (
    <svg ref={containerRef} className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.map((peak, idx) => {
        const ratio = peak / max;
        return (
          <rect
            key={`${uniqueIdRef.current}#${idx}`}
            fill="var(--color-cax-accent)"
            height={ratio}
            width="1"
            x={idx}
            y={1 - ratio}
          />
        );
      })}
    </svg>
  );
};
