# Final Year Group Project (C0600)

## Preliminaries

First install dependencies.

``` sh
# Run this from project root:
$ npm install
```

## Running

``` sh
# Run this from project root:
$ npm run start
```

## Testing

``` sh
# Run this from project root:
$ npm run test
```

## Documentation

We plan to document public functions (i.e. functions that are exported) using the standard docstring syntax. 
This will allow us to generate documentation from the code using [JSDoc](http://usejsdoc.org/).

**NOTE**

Tests are recognised by the file name. Jest uses the following rules:

- e.g.: for file `user.js` the test would be `user.test.js`
- all `*.js` files in `__tests__` are considered tests

## Code Style

Unless specified otherwise / if in doubt assume we are using the Google Style Guide.

| Language   | URL                                                   |
| ---------- | ----------------------------------------------------- |
| JavaScript | https://google.github.io/styleguide/jsguide.html      |
| HTML & CSS | https://google.github.io/styleguide/htmlcssguide.html |

**NOTE**

There is an `.eslintrc.json` file configured to enforce it for JavaScript.
