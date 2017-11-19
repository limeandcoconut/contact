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

        // Sort distances decending
        supportingDistances.sort((a, b) => {
            return b.distance - a.distance
        })

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
        let separatingDistancest0 = []
        let sd
        let separated = false
        let iLen = supportingDistancest0.length
        for (let i = 0; i < iLen; i++) {
            sd = supportingDistancest0[i]

            if (sd.distance > 0) {
                separatingDistancest0.push(sd)
                // Handle for initial collision.
                // throw new Error(`Collision at t0. ${sd.distance}`)
                separated = true
                // return false
            } else {
                break
            }

            // Perhaps sort here later.
        }

        // If the shapes are not separated return a collision.
        if (!separated) {
            return true
        }

        let primarySupportingDistances = supportingDistancest0

        let relativeVelocity = Vector2D.subtract(shapeBVelocity, shapeAVelocity)

        // Shape B at time = 1.
        let shapeBt1 = new Polygon(shapeB)
        shapeBt1.translate(relativeVelocity)

        let supportingDistancest1 = this.getSupportingDistances(primarySupportingDistances, shapeA, shapeBt1)

        if (supportingDistancest1[0].distance > 0) {
            // if (relativeVelocity.magnitude() > 0) {

            //     console.log(relativeVelocity.magnitude())
            //     supportingDistancest1.forEach((sd) => {
            //         console.log(sd.distance, sd.direction)
            //     })
            // console.log('')
            // }/
            return false
        }
        // return supportingDistancest1[0].distance <= 0

        let lowerLimit = 0
        let upperLimit = 1
        // let lowerLimit = supportingDistancest1[0].distance
        // let upperLimit = primarySupportingDistances[primarySupportingDistances.length - 1].distance

        // let tolerance = 0

        let func = (t) => {
            // Scale v by t.
            let vt = new Vector2D(relativeVelocity)
            vt.scale(t)
            // Translate shapeB by vt.
            let shapeBt = new Polygon(shapeB)
            shapeBt.translate(vt)
            // Get supporting distances for shapeA and shapeBt using direction vectors from inital supporting distances.
            let supportingDistancest = this.getSupportingDistances(primarySupportingDistances, shapeA, shapeBt)
            // If the support distance is positive a simple extrusion test wont be precise enough,
            // we need to run a full GJK extrusion to get the closest distance.
            // Probably need to use the new supporting distances for future extrusions...
            if (supportingDistancest[0].distance > 0) {
                supportingDistancest = this.gjk(shapeA, shapeBt)
                supportingDistancest = supportingDistancest.filter((sd) => sd.distance > 0)
                primarySupportingDistances = supportingDistancest
            }

            // Return maximum distance
            return supportingDistancest[0].distance
        }

        // let intersectTime = 1

        // do {
        let intersectTime = this.findRoot({
            func,
            lowerLimit,
            upperLimit,
        })

        // if (Math.abs(intersectTime) > tolerance && intersectTime > 0) {
        //     let shapeBt = new Polygon(shapeB)
        //     let vt = new Vector2D(relativeVelocity)
        //     vt.scale(intersectTime)
        //     shapeBt.translate(vt)
        //     supportingDistancest0 = this.gjk(shapeA, shapeBt)
        // }
        // console.log(func(intersectTime))
        return intersectTime
        // } while (Math.abs(intersectTime) > tolerance)
    }

    getSupportingDistances(supportingDistances, shapeA, shapeB) {
        let newSupportingDistances = []

        let direction
        let distance
        let iLen = supportingDistances.length
        for (let i = 0; i < iLen; i++) {
            direction = supportingDistances[i].direction
            distance = this.supportingDistance(direction, shapeA, shapeB)
            // if (distance > 0) {
            newSupportingDistances.push({
                distance,
                direction,
            })
            // }
        }

        // Sort distances decending
        newSupportingDistances.sort((a, b) => {
            return b.distance - a.distance
        })

        return newSupportingDistances
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

    // getIntersectTime({supportingDistancest0, lowerSD, upperSD, shapeA, shapeB, relativeVelocity}) {
    // }

    findRoot({func, lowerLimit, upperLimit, errorTolerance, maxIterations}) {
        let a = lowerLimit
        let b = upperLimit
        let c = a
        let fa = func(a)
        let fb = func(b)
        let fc = fa
        // let s = 0
        // let fs = 0
        // Actual tolerance
        let actualTolerance
        // Step at this iteration
        let newStep
        // Distance from the last but one to the last approximation
        let previousStep
        // Interpolation step is calculated in the form p/q; division is delayed until the last moment
        let p
        let q

        errorTolerance = errorTolerance || 0
        maxIterations = maxIterations || 1000

        while (maxIterations-- > 0) {

            previousStep = b - a

            if (Math.abs(fc) < Math.abs(fb)) {
                // Swap data for b to be the best approximation
                a = b
                b = c
                c = a
                fa = fb
                fb = fc
                fc = fa
            }

            actualTolerance = (1e-15 * Math.abs(b)) + (errorTolerance / 2)
            // Bisection?
            newStep = (c - b) / 2

            if (Math.abs(newStep) <= actualTolerance || fb === 0) {
                // Acceptable approx. is found
                return b
            }

            // Decide if the interpolation can be tried
            if (Math.abs(previousStep) >= actualTolerance && Math.abs(fa) > Math.abs(fb)) {
                // If previousStep was large enough and was in true direction, Interpolatiom may be tried
                let t1
                let cb
                let t2

                cb = c - b

                if (a === c) {
                    // If we have only two distinct points linear interpolation can only be applied
                    t1 = fb / fa
                    p = cb * t1
                    q = 1.0 - t1
                } else {
                    // Quadric inverse interpolation
                    q = fa / fc
                    t1 = fb / fc
                    t2 = fb / fa
                    p = t2 * ((cb * q * (q - t1)) - ((b - a) * (t1 - 1)))
                    q = (q - 1) * (t1 - 1) * (t2 - 1)
                }

                if (p > 0) {
                    // p was calculated with the opposite sign; make p positive
                    q = -q
                } else {
                    // and assign possible minus to q
                    p = -p
                }

                if (p < ((0.75 * cb * q) - (Math.abs(actualTolerance * q) / 2)) &&
                    p < Math.abs(previousStep * q / 2)) {
                    // If (b + p / q) falls in [b,c] and isn't too large it is accepted
                    newStep = p / q
                }

                // If p/q is too large then the bissection procedure can reduce [b,c] range to a greater extent
            }

            if (Math.abs(newStep) < actualTolerance) {
                // Adjust the step to be not less than tolerance
                newStep = (newStep > 0) ? actualTolerance : -actualTolerance
            }

            // Save the previous approximation
            a = b
            fa = fb
            // Do step to a new approximate
            b += newStep
            fb = func(b)

            if ((fb > 0 && fc > 0) ||
                (fb < 0 && fc < 0)) {
                // Adjust c for it to have a sign opposite to that of b
                c = a
                fc = fa
            }
        }

        // uniroot()

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
