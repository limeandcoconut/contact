const Vector2D = require('./vector2d')

class Contact {

    addSupportVertex(direction) {
        let newVertex = Vector2D.subtract(this.shapeA.support(direction), this.shapeB.support(direction.getInverse()))
        this.vertices.push(newVertex)
        return Vector2D.dotProduct(direction, newVertex) > 0
    }

    evolveSimplex() {
        let direction = this.direction
        let vertices = this.vertices

        switch (vertices.length) {
        case 0: {
            direction = Vector2D.subtract(this.shapeB.center, this.shapeA.center)
            break
        }
        case 1: {
            // Flip direction
            console.log(direction)
            direction.invert()
            break
        }
        case 2: {
            let c = vertices[0]
            let b = vertices[1]

            // Line cb is the line formed by the first two vertices.
            let cb = Vector2D.subtract(b, c)
            // Line c0 is the line from the first vertex to the origin.
            let c0 = c.getInverse()

            // Use the vector triple product to calculate a direction perpendicular to line cb
            // in the direction of the origin.
            direction = Vector2D.tripleCross(cb, c0, cb)
            break
        }
        case 3: {
            // Calculate if the simplex contains the origin.
            let c = vertices[0]
            let b = vertices[1]
            let a = vertices[2]

            let a0 = a.getInverse()
            let ab = Vector2D.subtract(b, a)
            let ac = Vector2D.subtract(c, a)

            // Perpendiculars to the given lines in the direction of the origin.
            // abPerp is unnecessary because it was used to choose the third vertex of our simplex
            let abPerp = Vector2D.tripleCross(ac, ab, ab)
            let acPerp = Vector2D.tripleCross(ab, ac, ac)

            if (Vector2D.dotProduct(abPerp, a0) > 0) {
                // If the origin is outside line ab, remove vertex c and add a new support in the direction of abPerp.
                vertices.splice(vertices.indexOf(c), 1)
                direction = abPerp
            } else if (Vector2D.dotProduct(acPerp, a0) > 0) {
                // If the origin is outside line ac, remove vertex b and add a new support in the direction of acPerp.
                vertices.splice(vertices.indexOf(b), 1)
                direction = acPerp
            } else {
                // The origin is inside both ab and ac therefore it intersects the simplex and our md.
                return Contact.EvolveResult.INTERSECTION
            }
            break
        }
        default:
            throw new RangeError(`Can't have a simplex with ${vertices.length} vertices.`)
        }

        this.direction = direction
        this.vertices = vertices

        return this.addSupportVertex(direction) ? Contact.EvolveResult.STILL_EVOLVING : Contact.EvolveResult.NO_INTERSECTION
    }

    test(shapeA, shapeB) {
        // Reset Everyting
        this.vertices = []
        this.direction = null
        this.shapeA = shapeA
        this.shapeB = shapeB

        let result = Contact.EvolveResult.STILL_EVOLVING
        do {
            result = this.evolveSimplex()
        } while (result === Contact.EvolveResult.STILL_EVOLVING)

        return result === Contact.EvolveResult.INTERSECTION
    }
}

Contact.EvolveResult = Object.freeze({
    INTERSECTION: 'INTERSECTION',
    STILL_EVOLVING: 'STILL_EVOLVING',
    NO_INTERSECTION: 'NO_INTERSECTION',
})

module.exports = Contact
