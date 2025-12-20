import transformerVariantGroup from '@unocss/transformer-variant-group'
import presetIcons from '@unocss/preset-icons'
import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  transformers: [
    transformerVariantGroup(),
  ],
  presets: [
    presetWind3(),
    presetIcons(),
  ],
})