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
        <filter id="station-haze" x="-20%" y="-120%" width="140%" height="340%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <pattern id="station-service-panels" width="220" height="70" patternUnits="userSpaceOnUse">
          <path d="M0 4H220M22 4v56M198 4v56" stroke="#7A877E" stroke-width="1" opacity=".28" />
          <circle cx="22" cy="32" r="4" fill="#D3A94E" opacity=".72" />
          <path d="M62 23h96v18H62z" fill="#151A19" stroke="#A9853B" opacity=".74" />
          <path d="M74 32h42m12 0h18" stroke="#E6CC86" stroke-width="2" opacity=".46" />
        </pattern>
      </defs>

      <rect width="1600" height="660" fill="url(#station-sky)" />
      <path d="M0 198 C260 166 420 184 646 168 C892 150 1124 178 1600 152 V360 H0 Z" fill="url(#station-window)" opacity="0.72" />

      <g class="station-far-city" opacity=".58">
        <path d="M0 246V164h70v31h42v-72h58v48h66v-94h88v112h54v-54h82v88h66v-126h72v84h58v-42h72v92h72v-118h94v95h56v-66h76v86h72v-142h84v119h58v-72h68v106H1600v18H0z" fill="#0B1214" />
        <g fill="#D7AC52">
          <path d="M24 187h5v5h-5zm89-42h5v5h-5zm104-44h5v5h-5zm23 25h5v5h-5zm121 37h5v5h-5zm102-42h5v5h-5zm103 4h5v5h-5zm127-13h5v5h-5zm98 28h5v5h-5zm136-20h5v5h-5zm114-28h5v5h-5zm132 51h5v5h-5zm121-38h5v5h-5zm94 27h5v5h-5z" />
        </g>
      </g>
      <circle cx="1265" cy="98" r="41" fill="#E7D69C" opacity=".68" />
      <circle cx="1283" cy="86" r="42" fill="#101718" />
      <path d="M-80 250C360 210 1130 236 1680 190" stroke="#A9C9C0" stroke-width="16" opacity=".08" filter="url(#station-haze)" />

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
        <g class="station-train-window-light">
          <path d="M-160 218h210v42h-210zm246 0h182v42H86zm218 0h216v42H304z" fill="#E2BC65" opacity=".1" />
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
        <path d="M-140 392 C310 368 1290 368 1740 392 L1740 524 C1290 494 310 494 -140 524 Z" fill="#0A0F0E" opacity="0.98" />
        <path d="M-140 392 C310 368 1290 368 1740 392 L1740 524 C1290 494 310 494 -140 524 Z" fill="url(#station-sleepers)" opacity="0.9" />
        <path d="M-170 404 C300 378 1300 378 1770 404" stroke="#090D0C" stroke-width="22" fill="none" opacity=".88" />
        <path d="M-170 404 C300 378 1300 378 1770 404" stroke="url(#station-rail-metal)" stroke-width="10" fill="none" />
        <path d="M-170 482 C300 456 1300 456 1770 482" stroke="#090D0C" stroke-width="22" fill="none" opacity=".88" />
        <path d="M-170 482 C300 456 1300 456 1770 482" stroke="url(#station-rail-metal)" stroke-width="10" fill="none" />
        <path d="M-160 418 C310 392 1290 392 1760 418 M-160 496 C310 470 1290 470 1760 496" stroke="#020504" stroke-width="5" fill="none" opacity="0.94" />
        <path d="M-120 427 C330 405 1270 405 1720 427 L1720 469 C1270 449 330 449 -120 469 Z" fill="url(#station-service-panels)" opacity=".86" />
        <g class="station-track-nodes">
          <g transform="translate(175 418)"><path d="M0 0h82v54H0z"/><circle cx="15" cy="15" r="6"/><text x="28" y="19">03-A</text><path d="M12 36h56" class="node-line"/></g>
          <g transform="translate(505 410)"><path d="M0 0h82v54H0z"/><circle cx="15" cy="15" r="6"/><text x="28" y="19">03-B</text><path d="M12 36h56" class="node-line"/></g>
          <g transform="translate(835 406)"><path d="M0 0h82v54H0z"/><circle cx="15" cy="15" r="6"/><text x="28" y="19">03-C</text><path d="M12 36h56" class="node-line"/></g>
          <g transform="translate(1165 410)"><path d="M0 0h82v54H0z"/><circle cx="15" cy="15" r="6"/><text x="28" y="19">03-D</text><path d="M12 36h56" class="node-line"/></g>
          <g transform="translate(1495 418)"><path d="M0 0h82v54H0z"/><circle cx="15" cy="15" r="6"/><text x="28" y="19">03-E</text><path d="M12 36h56" class="node-line"/></g>
        </g>
      </g>

      <path d="M0 526 C320 506 1280 506 1600 526 V560 C1280 540 320 540 0 560 Z" fill="#171E1A" />
      <path d="M0 526 C320 506 1280 506 1600 526" stroke="#D3A94E" stroke-width="12" opacity="0.82" />
      <path d="M0 540 C320 520 1280 520 1600 540" stroke="#F7F2E8" stroke-width="2" opacity="0.38" />
      <path d="M0 560 C320 540 1280 540 1600 560" stroke="#0B0F0E" stroke-width="8" opacity="0.88" />

      <g class="station-track-occluders">
        <path d="M0 334h118l-28 232H0z" fill="#080D0C" />
        <path d="M1600 334h-118l28 232h90z" fill="#080D0C" />
        <path d="M0 346h74l-18 205H0zM1600 346h-74l18 205h56z" fill="#26322D" opacity=".78" />
        <path d="M72 354v182m1456-182v182" stroke="#D3A94E" stroke-width="3" opacity=".42" />
      </g>
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

.station-track-nodes path:first-child {
  fill: #141c19;
  stroke: #8c7741;
  stroke-width: 1.5;
}

.station-track-nodes circle {
  fill: #d3a94e;
  filter: drop-shadow(0 0 5px rgba(211, 169, 78, 0.7));
}

.station-track-nodes text {
  fill: #dfd1ac;
  font-family: var(--station-font-number);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.station-track-nodes .node-line {
  fill: none;
  stroke: #8c7741;
  stroke-width: 2;
  stroke-dasharray: 7 4;
}

.station-hanging-sign {
  position: absolute;
  left: 50%;
  top: clamp(10px, 2.2%, 24px);
  width: clamp(330px, 28vw, 520px);
  min-height: 82px;
  padding: 12px 26px 11px;
  box-sizing: border-box;
  display: grid;
  align-content: center;
  gap: 5px;
  color: var(--station-text-on-surface);
  background:
    linear-gradient(90deg, rgba(91, 52, 31, .16), transparent 22% 78%, rgba(91, 52, 31, .16)),
    linear-gradient(180deg, #f2e8cf, #d7c49c);
  border: 3px solid #5d3e28;
  border-top-width: 7px;
  border-radius: 4px 4px 8px 8px;
  box-shadow:
    inset 0 0 0 2px rgba(255, 246, 217, .72),
    inset 0 -9px 18px rgba(91, 52, 31, .13),
    0 10px 0 #111816,
    0 18px 30px rgba(3, 7, 6, .5),
    0 0 26px rgba(211, 169, 78, .15);
  text-align: center;
  transform: translateX(-50%);
  transform-origin: center top;
  z-index: 2;
}

.station-hanging-sign::before,
.station-hanging-sign::after {
  position: absolute;
  top: -42px;
  width: 3px;
  height: 38px;
  content: '';
  background: var(--station-accent);
  opacity: 0.78;
}

.station-hanging-sign::before { left: 18%; }
.station-hanging-sign::after { right: 18%; }

.station-hanging-sign__hanger {
  position: absolute;
  left: 50%;
  top: -48px;
  width: 13px;
  height: 13px;
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
  font-size: clamp(26px, 1.8vw, 36px);
  line-height: 1.05;
  letter-spacing: 0.16em;
}

.station-hanging-sign strong::before,
.station-hanging-sign strong::after {
  content: '◆';
  margin-inline: 0.65em;
  color: var(--station-primary);
  font-family: var(--station-font-number);
  font-size: .32em;
  vertical-align: middle;
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

@media (prefers-reduced-motion: no-preference) {
  .station-train-window-light {
    animation: station-train-window-pass 14s linear infinite;
    will-change: transform, opacity;
  }
}

@keyframes station-train-window-pass {
  0%, 8% { opacity: 0; transform: translate3d(-34%, 0, 0); }
  18%, 64% { opacity: 1; }
  78%, 100% { opacity: 0; transform: translate3d(112%, 0, 0); }
}

@media (max-width: 900px) {
  .station-hanging-sign { width: min(390px, 44vw); }
  .station-side-column { top: 28%; bottom: 20%; }
  .station-side-column--left { left: 18px; }
  .station-side-column--right { right: 18px; }
}

@media (max-width: 600px) {
  .station-hanging-sign { top: 12px; width: min(290px, 64vw); min-height: 66px; padding: 9px 12px; }
  .station-hanging-sign strong { font-size: 19px; }
  .station-side-column { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .station-platform-scene__svg { transform: none; }
  .station-train-window-light { animation: none; }
}
</style>
