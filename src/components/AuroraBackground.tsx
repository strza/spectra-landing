import { useEffect, useState } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { initParticlesEngine } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";

const particleOptions: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    color: {
      value: ["#7C8BFF", "#B78EE0", "#4DD9D0", "#D98DB8"],
    },
    links: {
      color: "#7C8BFF",
      distance: 160,
      enable: true,
      opacity: 0.15,
      width: 1,
    },
    move: {
      enable: true,
      speed: { min: 0.3, max: 0.8 },
      direction: "none",
      outModes: { default: "bounce" },
    },
    number: {
      value: 70,
    },
    opacity: {
      value: { min: 0.3, max: 0.7 },
      animation: {
        enable: true,
        speed: 0.5,
        sync: false,
      },
    },
    size: {
      value: { min: 1, max: 3 },
    },
    collisions: {
      enable: true,
      mode: "bounce",
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "grab",
      },
      onClick: {
        enable: true,
        mode: "push",
      },
    },
    modes: {
      grab: {
        distance: 200,
        links: {
          opacity: 0.4,
          color: "#B78EE0",
        },
      },
      push: {
        quantity: 3,
      },
    },
  },
  detectRetina: true,
};

export function AuroraBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Particles
        id="aurora-particles"
        options={particleOptions}
        className="pointer-events-auto absolute inset-0"
      />
    </div>
  );
}
