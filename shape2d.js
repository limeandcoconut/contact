/**
 * A module containing an abstract class to be inherited by every 2 dimentional shape in this package.
 * @module Shape2D
 */

const AbstractConstructError = require('abstract-class-error').default

/**
 * Abstract Class that is the basis of all 2D shapes in this package.
 * @abstract
 */
// * @class Shape2D

class Shape2D {

    /**
     * @constructor
     * @throws {AbstractConstructError}      Throws if Shape2D class is the target of the new operator, as
     *                                       this class is abstract.
     * @throws {AbstractConstructError}      Throws if support method is not overridden by the user.
     */
    constructor() {
        if (new.target === Shape2D) {
            throw new AbstractConstructError('Cannot construct class Shape2D instances directly.')
        }

        if (this.support === Shape2D.prototype.support) {
            throw new AbstractConstructError('Method "support" must be overridden in class Shape2D')
        }
    }

    /**
     * Return a Vector2D representing the point or vertex on this shape furthest in the given support direction.
     * @method support
     * @abstract
     */
    support() {}
}

module.exports = Shape2D
