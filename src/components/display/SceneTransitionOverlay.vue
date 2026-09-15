<template>
  <div
    v-if="phase !== 'idle'"
    class="scene-transition-overlay"
    :class="[`is-${phase}`, `is-${sceneKey}`]"
    role="status"
    aria-live="polite"
    aria-label="Scene changing"
  >
    <div class="scene-transition-curtain" aria-hidden="true">
      <div v-if="sceneKey === 'zhenxian'" class="transition-collage transition-collage--beach">
        <img class="collage-item collage-item--red" src="/images/ui/b/transition/shinchan-red-redrawn.png" alt="" />
        <img class="collage-item collage-item--shark" src="/images/ui/b/transition/shinchan-shark-redrawn.png" alt="" />
        <img class="collage-item collage-item--group" src="/images/ui/b/transition/shinchan-group-redrawn.png" alt="" />
        <img class="collage-item collage-item--beach" src="/images/ui/b/transition/shinchan-beach-redrawn.png" alt="" />
        <div class="beach-foam beach-foam--back"></div>
        <div class="beach-foam beach-foam--front"></div>
      </div>

      <div v-else-if="sceneKey === 'xiaoxin'" class="transition-collage transition-collage--ocean">
        <div class="underwater-light"></div>
        <div class="bubble-field">
          <span v-for="index in 12" :key="index" :style="bubbleStyle(index)"></span>
        </div>
        <span v-for="index in 7" :key="`animal-${index}`" class="ocean-animal-pile" :class="`ocean-animal-pile--${index}`" aria-hidden="true"></span>
      </div>

      <div v-else class="transition-collage transition-collage--midnight">
        <div class="midnight-transition-light"></div>
        <img
          class="midnight-transition-train"
          src="/images/ui/midnight-station/special-express.webp"
          alt=""
          aria-hidden="true"
        />
        <span v-for="index in 6" :key="`mist-${index}`" class="midnight-transition-mist" :class="`midnight-transition-mist--${index}`"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  phase: { type: String, default: 'idle' },
  sceneKey: { type: String, default: 'zhenxian' }
})

const bubbleStyle = (index) => ({
  '--bubble-x': `${6 + ((index * 17) % 88)}%`,
  '--bubble-size': `${8 + ((index * 7) % 28)}px`,
  '--bubble-delay': `${(index % 5) * -0.22}s`,
  '--bubble-duration': `${1.7 + (index % 4) * 0.28}s`
})
</script>

<style lang="scss" scoped>
.scene-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  overflow: hidden;
  pointer-events: auto;
}

.scene-transition-curtain {
  position: absolute;
  inset: 0;
  overflow: hidden;
  will-change: clip-path, opacity;
}

.transition-collage { position: absolute; inset: 0; overflow: hidden; }

.collage-item,
.ocean-animal-pile {
  position: absolute;
  display: block;
  object-fit: contain;
  opacity: 0;
  transform: translate3d(0, 30px, 0) scale(.72) rotate(-4deg);
  filter: drop-shadow(0 12px 8px rgba(0, 66, 99, .22));
}

.collage-item--red { left: 4%; top: 7%; width: clamp(74px, 12vw, 172px); --delay: .05s; }
.collage-item--shark { right: 6%; top: 9%; width: clamp(100px, 16vw, 230px); --delay: .25s; }
.collage-item--group { left: 13%; bottom: 4%; width: clamp(180px, 28vw, 420px); --delay: .55s; }
.collage-item--beach { right: 8%; bottom: 3%; width: clamp(220px, 35vw, 520px); --delay: .82s; }

.ocean-animal-pile { width: clamp(150px, 22vw, 330px); }
.ocean-animal-pile {
  aspect-ratio: 1;
  background-image: url('/images/ui/c/transition/ocean-animals.png');
  background-repeat: no-repeat;
  background-size: 200% 200%;
}

.ocean-animal-pile--1,
.ocean-animal-pile--5 { background-position: 0 0; }
.ocean-animal-pile--2,
.ocean-animal-pile--6 { background-position: 100% 0; }
.ocean-animal-pile--3,
.ocean-animal-pile--7 { background-position: 0 100%; }
.ocean-animal-pile--4 { background-position: 100% 100%; }
.ocean-animal-pile--1 { left: 1%; top: 5%; --delay: .1s; }
.ocean-animal-pile--2 { right: 4%; top: 4%; --delay: .28s; }
.ocean-animal-pile--3 { left: 25%; top: 30%; --delay: .48s; }
.ocean-animal-pile--4 { right: 24%; top: 28%; --delay: .68s; }
.ocean-animal-pile--5 { left: 8%; bottom: 2%; --delay: .88s; }
.ocean-animal-pile--6 { right: 8%; bottom: 2%; --delay: 1.08s; }
.ocean-animal-pile--7 { left: 43%; bottom: -2%; --delay: 1.28s; }

.is-covering .collage-item,
.is-covering .ocean-animal-pile {
  animation: collage-build 1650ms cubic-bezier(.18,.76,.2,1) var(--delay) both;
}

.is-covered .collage-item,
.is-covered .ocean-animal-pile {
  opacity: .92;
  transform: translate3d(0, 0, 0) scale(1) rotate(0);
}

.is-revealing .collage-item,
.is-revealing .ocean-animal-pile {
  animation: collage-clear 1050ms ease-in both;
}

.is-zhenxian .scene-transition-curtain {
  background: #37b8e7;
}

.is-xiaoxin .scene-transition-curtain {
  background:
    radial-gradient(circle at 50% 8%, rgba(119, 232, 255, 0.48), transparent 28%),
    linear-gradient(180deg, #168fbd 0%, #075c8f 48%, #063a70 100%);
}

.is-midnight-station .scene-transition-curtain {
  background:
    radial-gradient(circle at 52% 28%, rgba(217, 155, 74, .13), transparent 24%),
    linear-gradient(180deg, #101b24 0%, #07111d 58%, #050b11 100%);
}

.is-covering.is-zhenxian .scene-transition-curtain {
  animation: beach-cover 1650ms cubic-bezier(0.52, 0.08, 0.22, 1) both;
}

.is-revealing.is-zhenxian .scene-transition-curtain {
  animation: beach-reveal 900ms cubic-bezier(0.42, 0, 0.18, 1) both;
}

.is-covering.is-xiaoxin .scene-transition-curtain {
  animation: ocean-cover 1650ms cubic-bezier(0.52, 0.08, 0.22, 1) both;
}

.is-revealing.is-xiaoxin .scene-transition-curtain {
  animation: ocean-reveal 900ms cubic-bezier(0.42, 0, 0.18, 1) both;
}

.is-covering.is-midnight-station .scene-transition-curtain {
  animation: midnight-cover 1650ms cubic-bezier(0.52, 0.08, 0.22, 1) both;
}

.is-revealing.is-midnight-station .scene-transition-curtain {
  animation: midnight-reveal 900ms cubic-bezier(0.42, 0, 0.18, 1) both;
}

.is-covered .scene-transition-curtain {
  clip-path: inset(0);
  opacity: 1;
}

.beach-foam {
  position: absolute;
  left: -8%;
  width: 116%;
  height: 20%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 12% 55%, rgba(255, 255, 255, 0.95) 0 16%, transparent 17%),
    radial-gradient(ellipse at 34% 42%, rgba(255, 255, 255, 0.82) 0 18%, transparent 19%),
    radial-gradient(ellipse at 58% 58%, rgba(255, 255, 255, 0.92) 0 17%, transparent 18%),
    radial-gradient(ellipse at 82% 44%, rgba(255, 255, 255, 0.86) 0 19%, transparent 20%);
  filter: blur(1px);
  opacity: 0.9;
}

.beach-foam--back {
  top: 11%;
  transform: rotate(-2deg) scaleY(0.72);
}

.beach-foam--front {
  top: 63%;
  transform: rotate(2deg);
}

.underwater-light {
  position: absolute;
  left: 50%;
  top: -18%;
  width: 44%;
  height: 86%;
  background: linear-gradient(180deg, rgba(208, 250, 255, 0.42), transparent 78%);
  clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%);
  transform: translateX(-50%);
  opacity: 0.7;
}

.midnight-transition-light {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 25%, rgba(242, 201, 120, .1) 48%, transparent 70%);
  opacity: .8;
}

.midnight-transition-train {
  position: absolute;
  left: 50%;
  bottom: 13%;
  width: min(78vw, 2800px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 24px 18px rgba(0, 0, 0, .68));
  opacity: 0;
  transform: translate3d(74vw, 0, 0);
}

.is-covering .midnight-transition-train {
  animation: midnight-train-arrive 1650ms cubic-bezier(.18, .72, .24, 1) both;
}

.is-covered .midnight-transition-train {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
}

.is-revealing .midnight-transition-train {
  animation: midnight-train-depart 900ms ease-in both;
}

.midnight-transition-mist {
  position: absolute;
  bottom: 10%;
  width: 18vw;
  height: 5vw;
  border-radius: 50%;
  background: rgba(171, 190, 196, .13);
  filter: blur(18px);
  opacity: 0;
}

.midnight-transition-mist--1 { left: 8%; }
.midnight-transition-mist--2 { left: 23%; }
.midnight-transition-mist--3 { left: 38%; }
.midnight-transition-mist--4 { left: 53%; }
.midnight-transition-mist--5 { left: 68%; }
.midnight-transition-mist--6 { left: 83%; }

.is-covering .midnight-transition-mist,
.is-covered .midnight-transition-mist {
  opacity: .65;
}

.bubble-field span {
  position: absolute;
  left: var(--bubble-x);
  bottom: -44px;
  width: var(--bubble-size);
  height: var(--bubble-size);
  border: 2px solid rgba(223, 251, 255, 0.74);
  border-radius: 50%;
  box-shadow: inset 2px 2px 0 rgba(255, 255, 255, 0.34);
  animation: transition-bubble-rise var(--bubble-duration) ease-in var(--bubble-delay) infinite;
}

@keyframes beach-cover {
  from { clip-path: inset(100% 0 0); }
  to { clip-path: inset(0); }
}

@keyframes beach-reveal {
  from { clip-path: inset(0); }
  to { clip-path: inset(0 0 100%); }
}

@keyframes ocean-cover {
  from { clip-path: circle(0 at 50% 110%); }
  to { clip-path: circle(150% at 50% 110%); }
}

@keyframes ocean-reveal {
  from { clip-path: circle(150% at 50% -10%); }
  to { clip-path: circle(0 at 50% -10%); }
}

@keyframes midnight-cover {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0); }
}

@keyframes midnight-reveal {
  from { clip-path: inset(0); }
  to { clip-path: inset(0 0 0 100%); }
}

@keyframes midnight-train-arrive {
  from { opacity: 0; transform: translate3d(74vw, 0, 0); }
  18% { opacity: 1; }
  to { opacity: 1; transform: translate3d(-50%, 0, 0); }
}

@keyframes midnight-train-depart {
  from { opacity: 1; transform: translate3d(-50%, 0, 0); }
  to { opacity: 0; transform: translate3d(-128vw, 0, 0); }
}

@keyframes transition-bubble-rise {
  0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.7); }
  18% { opacity: 0.82; }
  100% { opacity: 0; transform: translate3d(18px, -110vh, 0) scale(1.15); }
}

@keyframes collage-build {
  0% { opacity: 0; transform: translate3d(0, 34px, 0) scale(.68) rotate(-6deg); }
  16% { opacity: .88; }
  74% { opacity: .94; transform: translate3d(0, -4px, 0) scale(1.03) rotate(2deg); }
  100% { opacity: .92; transform: translate3d(0, 0, 0) scale(1) rotate(0); }
}

@keyframes collage-clear {
  from { opacity: .92; transform: translate3d(0, 0, 0) scale(1); }
  to { opacity: 0; transform: translate3d(0, -28px, 0) scale(1.08); }
}

@media (prefers-reduced-motion: reduce) {
  .scene-transition-curtain { animation-duration: 1ms !important; }
  .bubble-field span { animation: none; }
  .midnight-transition-train { animation-duration: 1ms !important; }
  .midnight-transition-mist { display: none; }
}
</style>
