/**
 * A module for representing circles in a way that supports the contact collision package.
 * @module Circle2d
 */

const Vector2D = require('./vector2d.js')
const Shape2D = require('./shape2d.js')

/**
 * Class for representing 2D circles.
 */
// * @class Circle2D

class Circle2D extends Shape2D {

    /**
     * @constructor
     * @param {Vector2D}    center      The center of this circle.
     * @param {Number}      radius      The radius of this circle.
     *
     * @throws {TypeError}              Throws if center is not passed as an instance of Vector2D.
     * @throws {TypeError}              Throws if radius is not passed as a Number.
     */
    constructor(center, radius) {
        super()

        if (!(center instanceof Vector2D)) {
            // if (typeof center !== 'object' || typeof center.x !== 'number' || typeof center.y !== 'number') {
            throw new TypeError('Center must be either an instance of Vector2D or an object with x and y.')
            // }

            // center = new Vector2D(center.x, center.y)
        }

        if (typeof radius !== 'number') {
            throw new TypeError('Radius must be a number.')
        }

        this.center = center
        this.radius = radius
    }

    /**
     * Returns the point on this shape furthest in the direction passed.
     * @override
     * @method support
     * @param   {Vector2D}      direction       A Vector2D representing the desired support direction.
     * @throws  {TypeError}                     Throws if direction is not passed as an instance of Vector2D.
     * @return  {Vector2D}                      A Vector2D representing the point furthest 'support-ward' on the circle.
     */
    support(direction) {
        if (!(direction instanceof Vector2D)) {
            throw new TypeError('Direction must be an instance of Vector2D')
        }
        return direction.getNormal().scale(this.radius).add(this.center)
    }

    /**
     * Translates the shape by the given vector.
     * @method translate
     * @param   {Vector2D}      vector          A Vector2D  to translate this circle by.
     * @throws  {TypeError}                     Throws if vector is not passed as an instance of Vector2D.
     * @return  {Circle2D}                      Returns this, for chaining.
     */
    translate(vector) {
        if (!(vector instanceof Vector2D)) {
            throw new TypeError('Translation vector must be an instance of Vector2D')
        }

        this.center = Vector2D.add(this.center, vector)

        return this
    }
}

module.exports = Circle2D
