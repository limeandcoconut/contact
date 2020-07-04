/**
 * A module for representing rectangles in a way that supports the contact collision package.
 * @module Rect2D
 */

const { Vector2D } = require('friendly-vectors')
const Shape2D = require('./shape2d.js')

/**
 * Class for representing 2D rectangles.
 */
// * @class Rect2D

class Rect2D extends Shape2D {

  /**
     * @constructor
     * @param {Vector2D}    center      The center of this rectangle.
     * @param {Number}      extents      The extents of this rectangle.
     * @throws {TypeError}              Throws if either center or extents is not passed as either an instance of
     *                                  Vector2D or an object which can be used to construct a Vector2D.
     */
  constructor(center, extents) {
    super()

    if (!(center instanceof Vector2D) || !(extents instanceof Vector2D)) {
      if (typeof center !== 'object' || typeof extents !== 'object') {
        throw new TypeError('Center and extents must be either instances of Vector2D or objects compatible with that constructor.')
      }

      center = new Vector2D(center)
      extents = new Vector2D(extents)
    }

    this.center = center
    this.extents = extents
  }

  /**
     * Returns the point on this shape furthest in the direction passed.
     * @override
     * @method support
     * @param   {Vector2D}      direction       A Vector2D representing the desired support direction.
     * @throws  {TypeError}                     Throws if direction is not passed as an instance of Vector2D.
     * @throws  {RangeError}                    Throws if direction is the zero vector.
     * @return  {Vector2D}                      A Vector2D representing the corner furthest 'support-ward'.
     */
  support(direction) {
    if (!(direction instanceof Vector2D)) {
      throw new TypeError('Direction must be an instance of Vector2D.')
    }
    if (direction.magnitude() === 0) {
      throw new RangeError('Direction must be non-zero.')
    }

    if (this.extents.magnitude() === 0) {
      return this.center
    }

    let i = 0
    let vertex
    let furthestVertex
    let furthestDistance = 0
    let distance

    do {
      // Pick a corner.
      switch (i) {
      case 0:
        vertex = new Vector2D(this.extents)
        break
      case 1:
        vertex.x *= -1
        break
      case 2:
        vertex.y *= -1
        break
      default: // 3
        vertex.x *= -1
        break
      }

      // If this corner is closest to the direction mark it as best.
      distance = Vector2D.dotProduct(vertex, direction)
      if (distance > furthestDistance) {
        furthestDistance = distance
        furthestVertex = vertex
      }

      i++
    } while (i < 4)

    // Adjust corner by the center.
    return Vector2D.add(furthestVertex, this.center)
  }

  /**
     * Translates the shape by the given vector.
     * @method translate
     * @param   {Vector2D}      vector          A Vector2D  to translate this rectangle by.
     * @throws  {TypeError}                     Throws if vector is not passed as an instance of Vector2D.
     * @return  {Rect2D}                      Returns this, for chaining.
     */
  translate(vector) {
    if (!(vector instanceof Vector2D)) {
      throw new TypeError('Translation vector must be an instance of Vector2D.')
    }

    this.center = Vector2D.add(this.center, vector)

    return this
  }
}

module.exports = Rect2D
