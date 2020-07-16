/**
 * A module for representing convex polygons in a way that supports the contact collision package.
 * @module PolygonConvex2D
 */

const { Vector2D } = require('friendly-vectors')
const Shape2D = require('./shape2d.js')
const findCentroid = require('centroid2d')

/**
 * Class for representing 2D convex polygons.
 */
// * @class PolygonConvex2D
class PolygonConvex2D extends Shape2D {

  /**
     * @constructor
     * @param {Array}       vertices    An array containing the vertices of this polygon.
     * @throws {TypeError}              Throws if vertices is not passed as an Array.
     * @throws {RangeError}             Throws if not enough vertices to form a polygon are passed.
     * @throws {TypeError}              Throws if vertices are not either all instances of Vector2D or all arrays.
     */
  constructor(vertices) {
    super()

    if (vertices instanceof PolygonConvex2D) {
      this.center = new Vector2D(vertices.center)
      this.vertices = vertices.vertices.map(vertex => new Vector2D(vertex))
      return
    }

    if (!Array.isArray(vertices)) {
      throw new TypeError('Vertices must be an array or instance of Vector2D')
    }

    switch (typeof vertices[0]) {
    case 'number': {
      if (vertices.length % 2 !== 0) {
        throw new RangeError('An even number of coordinates required to construct vertices.')
      }
      if (vertices.length < 6) {
        throw new RangeError(`At least 3 vertices required, ${vertices.length / 2} provided.`)
      }

      let coordinates = vertices
      vertices = []
      for (let i = 0; i < coordinates.length; i += 2) {
        vertices.push(new Vector2D(coordinates[i], coordinates[i + 1]))
      }
      break
    }
    case 'object': {
      if (vertices.length < 3) {
        throw new RangeError(`At least 3 vertices required, ${vertices.length} provided.`)
      }
      if (vertices[0] instanceof Vector2D) {
        Vector2D.assertVectors(vertices)
        break
      }

      vertices = vertices.map(
        Array.isArray(vertices[0]) ?
          vertex => new Vector2D(vertex[0], vertex[1]) :
          vertex => new Vector2D(vertex.x, vertex.y),
      )
      break
    }
    default:
      throw new TypeError('Unacceptable arguments.')
    }

    this.vertices = vertices
    let centroid = findCentroid(vertices.map(vertex => vertex.toArray()))
    this.center = new Vector2D(centroid)
  }

  /**
     * Returns the point on this shape furthest in the direction passed.
     * @override
     * @method support
     * @param   {Vector2D}      direction       A Vector2D representing the desired support direction.
     * @throws  {TypeError}                     Throws if direction is not passed as an instance of Vector2D.
     * @throws  {RangeError}                    Throws if direction is the zero vector.
     * @return  {Vector2D}                      A Vector2D representing the point furthest 'support-ward' on the polgon.
     */
  support(direction) {
    if (!(direction instanceof Vector2D)) {
      throw new TypeError('Direction must be an instance of Vector2D')
    }

    if (direction.magnitude() === 0) {
      throw new RangeError('Direction must be non-zero.')
    }

    let furthestDistance = Number.NEGATIVE_INFINITY
    let furthestVertex
    let distance

    for (const vertex of this.vertices) {
      distance = Vector2D.dotProduct(vertex, direction)
      if (distance > furthestDistance) {
        furthestDistance = distance
        furthestVertex = vertex
      }
    }

    return furthestVertex
  }

  /**
     * Translates every vertex in the shape by the given vector.
     * @method translate
     * @param   {Vector2D}      vector          A Vector2D  to translate this polygon by.
     * @throws  {TypeError}                     Throws if vector is not passed as an instance of Vector2D.
     * @return  {PolygonConvex2D}               Returns this, for chaining.
     */
  translate(vector) {
    if (!(vector instanceof Vector2D)) {
      throw new TypeError('Translation vector must be an instance of Vector2D')
    }

    this.vertices = this.vertices.map(vertex => Vector2D.add(vertex, vector))
    this.center = Vector2D.add(this.center, vector)

    return this
  }

  /**
   * @function toArray
   * @return {Array} An array of numbers prepresenting vertex coordinates.
   */
  toArray() {
    const array = []
    for (const vertex of this.vertices) {
      array.push(vertex.x)
      array.push(vertex.y)
    }
    return array
  }
}

module.exports = PolygonConvex2D
