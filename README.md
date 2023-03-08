# Reactive HTML
A typesafe clientside javascript library to add reactive variables in your HTML

## Installing
Install this module with `yarn add reactive-htmlor `npm i reactive-html`.

## Use within HTML
### Add Variables to html using /variable/
```HTML
<body>
	<span>/foo/</span>
	<div style="opacity: /bar/"></div>
</body>
```

## Import using ES6 imports
```TS
import { init } from "reactive-html";
```

## Initialize using the root element
```TS
const app = init('body');
```

## Reference HTML in JS
```TS
const foo = app.ref('foo', "Hello World");
const bar = app.ref('bar', 0);
```

## Reactively change HTML data using references
```TS
foo.value = "Hello New World!";
bar.value = 1;
```
