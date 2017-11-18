const Vector2D = require('./vector2d')
const Polygon = require('./polygon-convex2d')

class Contact {
    constructor() {
        console.log('0.1.2')
    }

    addSupportVertex(direction, shapeA, shapeB, vertices) {
        let newVertex = Vector2D.subtract(shapeA.support(direction.getInverse()), shapeB.support(direction))
        // console.log(`*Sa(-s): ${shapeA.support(direction.getInverse())}`)
        // console.log(`*Sb(s): ${shapeB.support(direction)}`)
        vertices.push(newVertex)
        return newVertex
    }

    supportingDistance(direction, shapeA, shapeB) {
        // a and b might be backwards here. Dunno for sure which one is p and which is q.
        let a = Vector2D.dotProduct(direction, shapeA.support(direction.getInverse()))
        let b = Vector2D.dotProduct(direction, shapeB.support(direction))

        let sd = a - b
        // console.log(sd)
        // console.log(`: ${shapeA.support(direction.getInverse())}`)
        // console.log(`Sa(-s): ${shapeA.support(direction.getInverse())}`)
        // console.log(`Sb(s):  ${shapeB.support(direction)}`)
        // console.log(`s:      ${direction}`)
        // console.log(`a: ${a}`)
        // console.log(`b: ${b}`)
        // console.log(`----------`)
        return sd
    }

    // p=a
    // q=b

    gjk(shapeA, shapeB) {
        let lastMD = Number.MAX_SAFE_INTEGER
        let currentMD = 0
        let vertices = []
        let v1
        let v2
        let v1v2

        let supportingDistances = []

        let direction = Vector2D.subtract(shapeA.center, shapeB.center)
        // console.log(`direction: ${direction}`)
        supportingDistances.push({
            distance: this.supportingDistance(direction, shapeA, shapeB),
            direction,
        })
        direction = this.addSupportVertex(direction, shapeA, shapeB, vertices)
        // console.log(`direction: ${direction}`)
        currentMD = direction.magnitude()

        do {
            supportingDistances.push({
                distance: this.supportingDistance(direction, shapeA, shapeB),
                direction,
            })
            this.addSupportVertex(direction, shapeA, shapeB, vertices)

            vertices = this.pruneVertices(vertices)

            v1 = vertices[0]
            v2 = vertices[1]
            // console.log(`v1:        ${v1}`)
            // console.log(`v2:        ${v2}`)
            if (v1.equals(v2)) {
                break
            }
            v1v2 = Vector2D.subtract(v2, v1)
            // console.log(`v1v2:       ${v1v2}`)

            direction = Vector2D.projectVector(v1.getInverse(), v1v2)
            // console.log(`projection: ${direction}`)
            direction = Vector2D.add(direction, v1)
            // console.log(`adjusted:   ${direction}`)

            lastMD = currentMD
            currentMD = direction.magnitude()
            // console.log(currentMD, lastMD)
        } while (currentMD < lastMD)
        // console.log('done')

        return supportingDistances
    }

    test(shapeA, shapeB, shapeAVelocity, shapeBVelocity) {
        // Reset Everyting
        // this.vertices = []
        // this.direction = null
        // this.shapeA = shapeA
        // this.shapeB = shapeB

        // Supporting distances at time = 0.
        let supportingDistancest0 = this.gjk(shapeA, shapeB)
        let sd
        let separated = false
        let iLen = supportingDistancest0.length
        for (let i = 0; i < iLen; i++) {
            sd = supportingDistancest0[i]

            if (sd.distance > 0) {
                // Handle for initial collision.
                // throw new Error(`Collision at t0. ${sd.distance}`)
                separated = true
                // return false
            }

            // Perhaps sort here later.
        }

        if (!separated) {
            return true
        }

        let relativeVelocity = Vector2D.add(shapeAVelocity, shapeBVelocity)

        // Shape B at time = 1.
        let shapeBt1 = new Polygon(shapeB)
        shapeBt1.translate(relativeVelocity)

        let separatingDistances = this.checkSupportingDistances(supportingDistancest0, shapeA, shapeBt1)

        return separatingDistances.length === 0
    }

    checkSupportingDistances(supportingDistances, shapeA, shapeB) {
        let separatingDistances = []

        let direction
        let distance
        let iLen = supportingDistances.length
        for (let i = 0; i < iLen; i++) {
            direction = supportingDistances[i].direction
            distance = this.supportingDistance(direction, shapeA, shapeB)
            if (distance > 0) {
                separatingDistances.push({
                    distance,
                    direction,
                })
            }
        }

        return separatingDistances
    }

    pruneVertices(vertices) {
        if (vertices.length < 3) {
            return vertices
        }

        vertices.sort((a, b) => {
            return a.magnitude() - b.magnitude()
        })

        return vertices.slice(0, 2)
    }
}

// Contact.EvolveResult = Object.freeze({
//     INTERSECTION: 'INTERSECTION',
//     STILL_EVOLVING: 'STILL_EVOLVING',
//     NO_INTERSECTION: 'NO_INTERSECTION',
// })

module.exports = Contact

/*
             *                           v2
             *                           |
             *                           | v1v2
             *           direction       |
             *      o ------------------>|  ^ }  projection of v1o onto v1v2
             *         `---.__          ∟|  | }  (closest point on v1v2
             *                 `---.__   |  | }  to origin)
             *                         `>v1
             *
             *                   v2
             *                  /
             *          dir    /
             *      o ------->v1   }-- when clamped projection will return v1
             *  +-{   ` .    /         (again closest point on v1v2)
             *  |-{       `∟'
             *  |
             *  |__ actual projection of v1o onto v1v2
             */
