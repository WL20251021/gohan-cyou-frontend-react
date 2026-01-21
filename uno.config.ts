import presetIcons from '@unocss/preset-icons'
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
    presets: [
        presetWind4({
            preflights: {
                reset: true
            }
        }),
        presetIcons({
            prefix: 'i-',
            extraProperties: {
                display: 'inline-block'
            }
        })
    ],
    rules: [
        // [/^m-([\.\d]+)$/, ([_, num]) => ({ margin: `${num}px` })],
        // [/^p-([\.\d]+)$/, ([_, num]) => ({ padding: `${num}px` })],
    ]
})