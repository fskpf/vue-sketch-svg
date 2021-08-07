# vue-sketch-svg

[![npm version](https://badge.fury.io/js/vue-sketch-svg)](https://badge.fury.io/js/vue-sketch-svg)

Wraps [svg2roughjs](https://github.com/fskpf/svg2roughjs) in a Vue component to easily embed SVGs as sketchy, hand-drawn SVGs.

<img src="https://fskpf.github.io/static/assets/sketch.png" width="400px">

See how your SVG looks sketched [here](https://fskpf.github.io/).

## Installation

Install the component from the NPM registry:

```shell
npm install --save vue-sketch-svg
```

## Usage

To get started, import it as component:

```javascript
import SketchSvg from 'vue-sketch-svg'
export default {
  name: 'MyVueComponent',
  components: {
    SketchSvg
  }
  // ...
}
```

And utilize one of the different ways to pass an SVG to the component.

### Inline as slotted content

```xml
<sketch-svg>
  <svg xmlns="http://www.w3.org/2000/svg" width="590" height="615">
    <!-- SVG content ... -->
  </svg>
</sketch-svg>
```

### As self-contained data-uri

```xml
<sketch-svg src="data:image/svg+xml;base64,..." />
```

### As path to the file

```xml
<sketch-svg src="<path-to-svg>.svg" />
```

:warning: This approach fetches the SVG on the given path. Therefore it must be served on the same origin or cross-origin accessible. See also [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

## API

The component supports several properties:

| Property                | Description                                                                                                                    | Default     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `src`                   | Can be used _instead_ of inlining the SVG as component content. Supports self-contained data URIs or fetch-able paths          | `undefined` |
| `width`                 | Controls the size of the component. Only works in conjuction with `height`.                                                    | `undefined` |
| `height`                | Controls the size of the component. Only works in conjunction with `width`.                                                    | `undefined` |
| `sketch`                | Whether the sketch or the original SVG should be shown. SVG.                                                                   | `true`      |
| `combineNestedSvgPaths` | Can be used on SVGs with nested paths to avoid filling of empty inner areas.                                                   | `true`      |
| `roughness`             | Controls the overall roughness of the sketched.                                                                                | `1`         |
| `bowing`                | Controls the bowing the lines of the sketch.                                                                                   | `1`         |
| `fillStyle`             | Specifies the fill style of the sketch. Supports: `solid`, `hachure`, `zigzag`, `cross-hatch`, `dots`, `dashed`, `zigzag-line` | `hachure`   |

## Dependencies

- [svg2roughjs](https://github.com/fskpf/svg2roughjs)

## License

[MIT License](https://github.com/fskpf/vue-sketch-svg/blob/master/LICENSE.md) © Fabian Schwarzkopf
