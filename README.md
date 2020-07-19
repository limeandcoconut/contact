# Contact
A module for testing 2D shapes for collisions over a time interval. Uses the GJK algorithm to find closest distances and separating extrusion to find time of intercept if needed.


## Example
```js
const contact = require('contact')

contact.test(shapeA, shapeB, velocityA, velocityB)
// Returns true for a colision initially, false for no collision, or a number (scalar) for TOI.
```

## Testing
Coming soon.

## TODO:

- [ ] Tests
- [ ] Wiki links
- [ ] More thorough description
- [ ] Usage stats
- [ ] Docs site
- [ ] Consider making constructors chainable

## Feedback ✉️

[Website 🌐](https://jacobsmith.tech)

[js@jacobsmith.tech 📧](mailto:js@jacobsmith.tech)

[https://github.com/limeandcoconut 🐙😸](https://github.com/limeandcoconut)

[@limeandcoconut 🐦](https://twitter.com/limeandcoconut)

Cheers!

## License

ISC, see [license](./license) for details.


