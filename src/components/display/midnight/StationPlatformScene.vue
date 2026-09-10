<template>
  <div
    class="station-platform-scene"
    aria-hidden="true"
  >
    <svg
      class="station-platform-scene__svg"
      viewBox="0 0 1600 660"
      preserveAspectRatio="none"
      focusable="false"
    >
      <defs>
        <linearGradient id="station-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#0E1211" />
          <stop offset="0.55" stop-color="#151A19" />
          <stop offset="1" stop-color="#202824" />
        </linearGradient>
        <linearGradient id="station-canopy" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#303B35" />
          <stop offset="1" stop-color="#151A19" />
        </linearGradient>
        <linearGradient id="station-platform-floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#28332D" />
          <stop offset="1" stop-color="#0E1211" />
        </linearGradient>
        <linearGradient id="station-rail-metal" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#69756D" />
          <stop offset="0.46" stop-color="#E3D6B5" />
          <stop offset="0.62" stop-color="#59665D" />
          <stop offset="1" stop-color="#252F2A" />
        </linearGradient>
        <linearGradient id="station-lamp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#FFF1B5" stop-opacity="0.96" />
          <stop offset="1" stop-color="#D3A94E" stop-opacity="0.08" />
        </linearGradient>
        <radialGradient id="station-window" cx="50%" cy="0%" r="100%">
          <stop offset="0" stop-color="#D3A94E" stop-opacity="0.42" />
          <stop offset="0.42" stop-color="#31584D" stop-opacity="0.18" />
          <stop offset="1" stop-color="#0E1211" stop-opacity="0" />
        </radialGradient>
        <pattern id="station-sleepers" width="62" height="50" patternUnits="userSpaceOnUse">
          <path d="M8 7 L54 17 L52 31 L6 21 Z" fill="#0B0F0E" opacity="0.86" />
          <path d="M8 8 L54 18" stroke="#48554C" stroke-width="2" opacity="0.58" />
        </pattern>
        <pattern id="station-floor-seams" width="120" height="42" patternUnits="userSpaceOnUse">
          <path d="M0 2 H120" stroke="#6D776B" stroke-width="1" opacity="0.22" />
          <path d="M16 2 V42 M88 2 V42" stroke="#6D776B" stroke-width="1" opacity="0.11" />
        </pattern>
        <filter id="station-sign-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="7" flood-color="#080B0A" flood-opacity="0.46" />
        </filter>
      </defs>

      <rect width="1600" height="660" fill="url(#station-sky)" />
      <path d="M0 198 C260 166 420 184 646 168 C892 150 1124 178 1600 152 V360 H0 Z" fill="url(#station-window)" opacity="0.72" />

      <g class="station-background-architecture">
        <path d="M0 68 H1600 V126 H0 Z" fill="url(#station-canopy)" />
        <path d="M0 123 H1600 V142 H0 Z" fill="#0A0E0D" />
        <path d="M42 146 H1558" stroke="#6D776B" stroke-width="6" opacity="0.52" />
        <path d="M42 153 H1558" stroke="#D3A94E" stroke-width="2" opacity="0.58" />
        <g class="station-column-shape">
          <path d="M82 142 H150 V492 H82 Z" fill="#26332D" />
          <path d="M1450 142 H1518 V492 H1450 Z" fill="#26332D" />
          <path d="M91 156 H112 V480 H91 Z" fill="#536058" opacity="0.5" />
          <path d="M1488 156 H1509 V480 H1488 Z" fill="#536058" opacity="0.5" />
        </g>
        <g class="station-window-row">
          <path d="M210 180 H1390 V286 H210 Z" fill="#0B1110" opacity="0.74" />
          <path d="M228 198 H540 V268 H228 Z" fill="#31584D" opacity="0.18" />
          <path d="M594 198 H1006 V268 H594 Z" fill="#D3A94E" opacity="0.08" />
          <path d="M1060 198 H1372 V268 H1060 Z" fill="#31584D" opacity="0.18" />
          <path d="M590 180 V286 M1010 180 V286" stroke="#6D776B" stroke-width="3" opacity="0.42" />
        </g>
      </g>

      <path d="M0 344 C270 328 446 342 650 334 C920 324 1180 342 1600 326 V660 H0 Z" fill="url(#station-platform-floor)" />
      <path d="M0 344 C270 328 446 342 650 334 C920 324 1180 342 1600 326 V660 H0 Z" fill="url(#station-floor-seams)" opacity="0.6" />

      <g class="station-platform-lamps">
        <path d="M116 150 V244" stroke="#6D776B" stroke-width="6" opacity="0.58" />
        <path d="M1484 150 V244" stroke="#6D776B" stroke-width="6" opacity="0.58" />
        <path d="M96 204 H136 V246 H96 Z M1464 204 H1504 V246 H1464 Z" fill="url(#station-lamp)" opacity="0.9" />
        <path d="M116 246 V338 M1484 246 V338" stroke="url(#station-lamp)" stroke-width="16" opacity="0.2" />
      </g>

      <g class="station-main-track">
        <path d="M76 392 C388 374 1212 374 1524 392 L1524 514 C1212 494 388 494 76 514 Z" fill="#101513" opacity="0.92" />
        <path d="M76 392 C388 374 1212 374 1524 392 L1524 514 C1212 494 388 494 76 514 Z" fill="url(#station-sleepers)" opacity="0.82" />
        <path d="M66 404 C396 386 1204 386 1534 404" stroke="url(#station-rail-metal)" stroke-width="9" fill="none" />
        <path d="M66 480 C396 462 1204 462 1534 480" stroke="url(#station-rail-metal)" stroke-width="9" fill="none" />
        <path d="M72 418 C402 400 1198 400 1528 418 M72 494 C402 476 1198 476 1528 494" stroke="#0A0D0C" stroke-width="4" fill="none" opacity="0.92" />
      </g>

      <path d="M0 526 C320 506 1280 506 1600 526 V560 C1280 540 320 540 0 560 Z" fill="#171E1A" />
      <path d="M0 526 C320 506 1280 506 1600 526" stroke="#D3A94E" stroke-width="12" opacity="0.82" />
      <path d="M0 540 C320 520 1280 520 1600 540" stroke="#F7F2E8" stroke-width="2" opacity="0.38" />
      <path d="M0 560 C320 540 1280 540 1600 560" stroke="#0B0F0E" stroke-width="8" opacity="0.88" />
    </svg>

    <div class="station-hanging-sign">
      <span class="station-hanging-sign__hanger"></span>
      <span class="station-hanging-sign__kicker">SANHE DINING</span>
      <strong>深夜食堂</strong>
      <span class="station-hanging-sign__route">PLATFORM 03 · SEAT SERVICE</span>
    </div>

    <div class="station-side-column station-side-column--left">
      <span class="station-side-column__lamp"></span>
      <span class="station-side-column__number">03</span>
    </div>
    <div class="station-side-column station-side-column--right">
      <span class="station-side-column__lamp"></span>
      <span class="station-side-column__number">夜</span>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.station-platform-scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
  perspective: 900px;
}

.station-platform-scene__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  transform: perspective(1100px) rotateX(2deg) scale(1.015);
  transform-origin: center bottom;
}

.station-hanging-sign {
  position: absolute;
  left: 50%;
  top: clamp(24px, 5.4%, 62px);
  width: clamp(248px, 22vw, 390px);
  min-height: 64px;
  padding: 12px 18px 10px;
  box-sizing: border-box;
  display: grid;
  align-content: center;
  gap: 3px;
  color: var(--station-text-on-surface);
  background: var(--station-surface);
  border: 2px solid var(--station-accent);
  border-top: 0;
  border-radius: 0 0 var(--station-radius-ticket) var(--station-radius-ticket);
  box-shadow: var(--station-shadow-e2);
  text-align: center;
  transform: translateX(-50%);
  transform-origin: center top;
  z-index: 2;
}

.station-hanging-sign::before,
.station-hanging-sign::after {
  position: absolute;
  top: -32px;
  width: 1px;
  height: 32px;
  content: '';
  background: var(--station-accent);
  opacity: 0.78;
}

.station-hanging-sign::before { left: 20%; }
.station-hanging-sign::after { right: 20%; }

.station-hanging-sign__hanger {
  position: absolute;
  left: 50%;
  top: -35px;
  width: 9px;
  height: 9px;
  border: 1px solid var(--station-accent);
  border-radius: 50%;
  background: var(--station-background-deep);
  transform: translateX(-50%);
}

.station-hanging-sign__kicker,
.station-hanging-sign__route {
  color: var(--station-primary-strong);
  font-family: var(--station-font-number);
  font-size: clamp(9px, 0.56vw, 12px);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.station-hanging-sign strong {
  font-family: var(--station-font-brand);
  font-size: clamp(19px, 1.35vw, 27px);
  line-height: 1.05;
  letter-spacing: 0.16em;
}

.station-hanging-sign__route {
  color: var(--station-secondary);
  font-size: clamp(8px, 0.5vw, 10px);
  letter-spacing: 0.08em;
}

.station-side-column {
  position: absolute;
  top: 25%;
  bottom: 22%;
  z-index: 2;
  width: clamp(24px, 2.5vw, 42px);
  border-inline: 2px solid var(--station-border);
  background: linear-gradient(90deg, rgba(14, 18, 17, 0.82), rgba(81, 97, 87, 0.34), rgba(14, 18, 17, 0.82));
  box-shadow: var(--station-shadow-e1);
}

.station-side-column--left { left: clamp(22px, 6vw, 110px); }
.station-side-column--right { right: clamp(22px, 6vw, 110px); }

.station-side-column__lamp {
  position: absolute;
  left: 50%;
  top: 8%;
  width: 12px;
  height: 68px;
  background: linear-gradient(180deg, var(--station-accent), rgba(211, 169, 78, 0.06));
  box-shadow: 0 0 18px rgba(211, 169, 78, 0.22);
  transform: translateX(-50%);
}

.station-side-column__number {
  position: absolute;
  left: 50%;
  bottom: 12%;
  padding: 4px 3px;
  color: var(--station-accent);
  font-family: var(--station-font-number);
  font-size: clamp(10px, 0.68vw, 14px);
  letter-spacing: 0.12em;
  transform: translateX(-50%);
}

@media (max-width: 900px) {
  .station-hanging-sign { width: min(300px, 36vw); }
  .station-side-column { top: 28%; bottom: 20%; }
  .station-side-column--left { left: 18px; }
  .station-side-column--right { right: 18px; }
}

@media (max-width: 600px) {
  .station-hanging-sign { top: 30px; width: min(250px, 54vw); min-height: 54px; padding: 8px 10px; }
  .station-hanging-sign strong { font-size: 16px; }
  .station-side-column { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .station-platform-scene__svg { transform: none; }
}
</style>
