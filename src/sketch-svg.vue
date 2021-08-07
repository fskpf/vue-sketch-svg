<template>
  <div class="sketch-svg" :style="`width: ${size.width}px; height: ${size.height}px`">
    <div style="display: none" ref="input">
      <slot></slot>
    </div>
    <div v-show="!showSketch" class="original" ref="original"></div>
    <div v-show="showSketch" class="sketched" ref="sketched"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { RenderMode, Svg2Roughjs } from 'svg2roughjs'

interface SketchSvgData {
  sketchFinished: boolean
  inputSvg: SVGSVGElement | null
}

export default Vue.extend({
  name: 'SketchSvg',
  props: {
    src: String,
    width: Number,
    height: Number,
    sketch: {
      type: Boolean,
      default: true
    },
    combineNestedSvgPaths: {
      type: Boolean,
      default: true
    },
    roughness: {
      type: Number,
      default: 1
    },
    bowing: {
      type: Number,
      default: 1
    },
    fillStyle: {
      type: String,
      default: 'hachure',
      validator: value => {
        const fillStyles = [
          'solid',
          'hachure',
          'zigzag',
          'cross-hatch',
          'dots',
          'dashed',
          'zigzag-line'
        ]
        const isValid = fillStyles.includes(value)
        if (!isValid) {
          console.error(`SketchSvg: fillStyle must be one of ${fillStyles.join(', ')}`)
        }
        return isValid
      }
    }
  },
  data(): SketchSvgData {
    return {
      sketchFinished: false, // indicates whether the input element has been sketched yet
      inputSvg: null
    }
  },
  computed: {
    showSketch(): boolean {
      return this.sketch && this.sketchFinished
    },
    size(): { width: number; height: number } {
      if (typeof this.width === 'undefined' || typeof this.height === 'undefined') {
        return this.getSvgSize(this.inputSvg)
      }
      return { width: this.width!, height: this.height! }
    }
  },
  mounted() {
    // src property has precedence over slot content
    if (this.src) {
      this.loadSvg(this.src)
        .then(svg => {
          this.inputSvg = svg
          this.sketchSvg(svg)
        })
        .catch(e => {
          throw e
        })
    } else if (this.$slots.default) {
      const slotContent = this.$slots.default[0]
      if (slotContent) {
        if (slotContent.tag === 'svg') {
          this.inputSvg = slotContent.elm as SVGSVGElement
          this.sketchSvg(this.inputSvg)
        } else {
          throw new Error('SketchSvg: Slot content is not an SVGSVGElement')
        }
      }
    }
  },
  methods: {
    clearChildren(element: Element): void {
      while (element.firstChild) {
        element.removeChild(element.firstChild)
      }
    },

    createRoughConfig(): any {
      return {
        roughness: this.roughness,
        bowing: this.bowing,
        fillStyle: this.fillStyle,
        combineNestedSvgPaths: this.combineNestedSvgPaths
      }
    },

    sketchSvg(svg: SVGSVGElement): void {
      const sketchedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      sketchedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      const svg2roughjs = new Svg2Roughjs(sketchedSvg, RenderMode.SVG, this.createRoughConfig())
      svg2roughjs.svg = svg

      const sketchContainer = this.$refs.sketched as Element
      const originalContainer = this.$refs.original as Element
      if (this.width && this.height) {
        // warp SVG documents in imgs to properly size them
        sketchContainer.appendChild(this.imgWrap(sketchedSvg, this.width, this.height))
        originalContainer.appendChild(this.imgWrap(svg, this.width, this.height))
      } else {
        sketchContainer.appendChild(sketchedSvg)
        originalContainer.appendChild(svg)
      }
      this.sketchFinished = true
    },

    imgWrap(svg: SVGSVGElement, width: number, height: number): HTMLImageElement {
      const svgString = new XMLSerializer().serializeToString(svg)
      const img = document.createElement('img')
      img.src = `data:image/svg+xml;base64,${btoa(svgString)}`
      img.width = width
      img.height = height
      return img
    },

    /**
     * Tries to load the svg document from the given src parameter.
     * Keep in mind that cross-origin access to external URLs do not work.
     */
    async loadSvg(src: string): Promise<SVGSVGElement> {
      let content: string = ''
      if (src.startsWith('data:') && src.indexOf('image/svg+xml') !== -1) {
        // data:[<media type>][;charset=<character set>][;base64],<data>
        const dataUrlRegex = /^data:([^,]*),(.*)/
        const match = dataUrlRegex.exec(src)
        if (match && match.length > 2) {
          const meta = match[1]
          content = match[2]
          const isBase64 = meta.indexOf('base64') !== -1
          const isUtf8 = meta.indexOf('utf8') !== -1
          if (isBase64) {
            content = atob(content)
          }
          if (!isUtf8) {
            content = decodeURIComponent(content)
          }
        }
      } else {
        content = await this.fetchSvg(src)
      }
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'image/svg+xml')
      const svg = doc.querySelector('svg')

      if (!svg || svg.tagName === 'HTML') {
        throw new Error(`SketchSvg: Could not resolve ${src} as SVGSVGElement`)
      }

      // the input SVG must be in the DOM, otherwise Firefox parses wrong colors
      const inputContainer = this.$refs.input as Element
      this.clearChildren(inputContainer)
      inputContainer.appendChild(svg)

      return svg
    },

    async fetchSvg(url: string): Promise<string> {
      let response
      try {
        response = await fetch(url)
      } catch (e) {
        return Promise.reject(e)
      }
      return response.text()
    },

    getSvgSize(svg: SVGSVGElement | null): { width: number; height: number } {
      if (!svg) {
        return { width: 300, height: 150 }
      }
      let width = parseInt(svg.getAttribute('width')!)
      let height = parseInt(svg.getAttribute('height')!)
      let viewBox = svg.getAttribute('viewBox')
      if (isNaN(width) || isNaN(height)) {
        return viewBox
          ? { width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height }
          : { width: 300, height: 150 }
      }
      return { width, height }
    }
  }
})
</script>

<style scoped>
.sketch-svg {
  position: relative;
}

.original,
.sketched {
  position: absolute;
}
</style>
