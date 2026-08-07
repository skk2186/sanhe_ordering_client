import { markRaw } from 'vue'
import RunnerGame from '@/components/games/RunnerGame.vue'
import SushiCatchGame from '@/components/games/SushiCatchGame.vue'
import runnerCover from '@/assets/games/runner/background.webp'
import sushiCatchCover from '@/assets/games/sushi/background.webp'

const readBestScore = (storageKey) => {
  const value = Number(localStorage.getItem(storageKey))
  return Number.isFinite(value) && value > 0 ? value : 0
}

export const createGameConfigs = () => [
  {
    id: 'sushi-runner',
    title: '寿司疾送',
    titleKey: 'games.runner.title',
    descriptionKey: 'games.runner.description',
    status: 'ready',
    bestScore: readBestScore('game-best-sushi-runner'),
    storageKey: 'game-best-sushi-runner',
    cover: runnerCover,
    component: markRaw(RunnerGame)
  },
  {
    id: 'sushi-catch',
    title: '寿司接接乐',
    titleKey: 'games.sushiCatch.title',
    descriptionKey: 'games.sushiCatch.description',
    status: 'ready',
    bestScore: readBestScore('game-best-sushi-catch'),
    storageKey: 'game-best-sushi-catch',
    cover: sushiCatchCover,
    component: markRaw(SushiCatchGame)
  }
]
