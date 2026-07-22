"use client";

import { useEffect, useRef, useState } from "react";
import { publicUrl } from "@/lib/base-path";

/** 尊重 reduced-motion：默认不自动播；提供暂停/播放 */
export function DemoReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      video.pause();
      setPlaying(false);
      return;
    }
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="mg-media" aria-label="产品演示录屏">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        poster={publicUrl("/demo-walkthrough.gif")}
        style={{ width: "100%", display: "block" }}
      >
        <source src={publicUrl("/demo-walkthrough.webm")} type="video/webm" />
      </video>
      <button
        type="button"
        onClick={toggle}
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          border: "1px solid rgba(244,241,234,0.35)",
          background: "rgba(18,21,26,0.75)",
          color: "#f4f1ea",
          padding: "8px 12px",
          fontSize: 12,
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          cursor: "pointer",
          borderRadius: 2,
        }}
      >
        {playing ? "暂停演示" : "播放演示"}
      </button>
    </div>
  );
}
