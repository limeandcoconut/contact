const Polygon = require('./polygon-convex2d.js')
const Vector2D = require('./vector2d.js')

const Contact = require('./contact')

let a = new Polygon([
    5, 3,
    5, 1,
    1, 1,
    1, 3,
])
// let a = new Polygon([
//     5, 3,
//     0.2, 6,
//     -2, 4.3,
//     -5, 2,
//     -4, -4,
//     -1, -3,
// ])

let av = new Vector2D(0, 0)

let b = new Polygon([
    4, -1,
    4, -5,
    2, -5,
    2, -1,
])
// let b = new Polygon([
//     1, -1,
//     5, -3,
//     2.7, -5,
//     0, -4,
// ])

// b.translate(new Vector2D(0, 2))
let bv = new Vector2D(0, 3)

// console.log(b.vertices)
let contact = new Contact()

console.log(contact.test(a, b, av, bv))

// console.log(Vector2D.add(a.vertices[0], a.vertices[1]))

// console.log(Vector2D.tripleCross(new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(0, 1)))

// console.log('')
// console.log(a.center)

// console.log(a.support(new Vector2D(5, 5)))
