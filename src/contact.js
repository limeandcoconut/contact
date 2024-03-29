const { Vector2D } = require('friendly-vectors')
const Shape2D = require('./shapes/shape2d')
const brentsMethod = require('brents-method')
// TODO: update brents method

/*
 * P   = shapeB
 * Q   = shapeA
 * s   = direction at this iteration
 * t0  = beginning of interval
 * t1  = end of interval
 * TOI = Time of intercept
 */

/**
 * Sort separating information objects in descending order by distance.
 * @function distanceDescending
 * @param  {Object} a  One of the objects to sort.
 * @param  {Object} b  One of the objects to sort.
 * @return {Number}    A positive, negative, or zero number used to sort distances.
 */
const distanceDescending = (a, b) => {
  return b.distance - a.distance
}

/**
 * Find a supporting vertex on the Minkowski Difference formed by the two shapes.
 * @function getSupportVertex
 * @param   {Vector2D}  direction   The vector along which to find supporting vertices.
 * @param   {Shape2D}   shapeA      One of the shapes.
 * @param   {Shape2D}   shapeB      The other shape.
 * @return  {Vector2D}              The new vertex on the Minkowski Difference.
 */
const getSupportVertex = (direction, shapeA, shapeB) =>
  // Vq = Sq(-s)
  // Vp = Sp(s)
  // Vz = Vq - Vp
  Vector2D.subtract(shapeA.support(direction.getInverse()), shapeB.support(direction))

/**
 * Get the supporting distance between the given shapes along the given vector.
 * @function supportingDistance
 * @param   {Vector2D}  direction   The supporting direction along which to the supporting distance.
 * @param   {Shape2D}   shapeA      One of the shapes.
 * @param   {Shape2D}   shapeB      The other.
 * @return  {Number}                The signed distance between those shapes along the given vector.
 */
const supportingDistance = (direction, shapeA, shapeB) => {
  // SD(P, Q, s) = s • Sq(-s) - s • Sp(s)
  let a = Vector2D.dotProduct(direction, shapeA.support(direction.getInverse()))
  let b = Vector2D.dotProduct(direction, shapeB.support(direction))

  let sd = a - b
  return sd
}

/**
 * Prune vertices to the two closest to the origin. This mutates the passed Array.
 * @function pruneVertices
 * @param   {Array} vertices  An array of Vector2D vertices on the Minkowski Difference. Will be mutated.
 * @return  {Array}           An array of the two vertices closest to the origin.
 */
const pruneVertices = (vertices) => {
  if (vertices.length < 3) {
    return vertices
  }

  // Sort ascending
  // This might look redundant (since the MD should decrease at each iteration) but this line from the reference
  // material:
  // "If P and Q are disjoint, convex analysis proves that the Minkowski distance will converge monotonically to the
  // global closest distance, and the closest features can be interpreted directly from the final sets Vp and Vq."
  //
  // implies otherwise. Bears testing to confirm.
  vertices.sort((a, b) => a.magnitude() - b.magnitude())

  vertices = vertices.slice(0, 2)
  return vertices
}

/**
 * Find the closeset feature on the Minkowski Difference of the given shapes to the origin, then return an Array of
 * supporting directions and distances needed for extrusion testing.
 * @function gjk
 * @param   {Shape2D}   shapeA      One of the necessary shapes.
 * @param   {Shape2D}   shapeB      One of the necessary shapes.
 * @return  {Array}                 An Array of objects containing supporting directions and distances.
 */
const gjk = (shapeA, shapeB) => {
  // Used to check if the Minkowski Distance is still decreasing at each iteration.
  let lastMD
  let currentMD
  // Vertices representing the feature of the Minkowski Difference closeset to the origin (a line or point).
  let vertices = []
  // The two vertices that potentially make up the closes features
  let v1
  let v2
  // A vector between them
  let v1v2

  let supportingDistances = []
  // The initial direction is the difference between the two shapes centers.
  let direction = Vector2D.subtract(shapeA.center, shapeB.center)
  // Get the first supporting distance.
  supportingDistances.push({
    distance: supportingDistance(direction, shapeA, shapeB),
    direction,
  })
  // The closest feature of the MD to the origin must initially be the only vertex so far computed.
  // The vector to this point is used as the new direction.
  direction = getSupportVertex(direction, shapeA, shapeB)
  vertices.push(direction)
  currentMD = direction.magnitude()

  // Proceed in finding the direction between the closest features
  do {
    // Add the new distance.
    supportingDistances.push({
      distance: supportingDistance(direction, shapeA, shapeB),
      direction,
    })
    // Add the next supporting virtex.
    vertices.push(getSupportVertex(direction, shapeA, shapeB))

    // If there are more than two vertices return the two closeset to the origin as our closest feature.
    vertices = pruneVertices(vertices)

    // Find the distance from the closest feature to the origin. This uses vector projection clamped to a line segment.
    // *See Figure 1 for diagrams of below.*
    v1 = vertices[0]
    v2 = vertices[1]

    // If we recieved the same vertex twice then the Minkowski Distance will not decrease anymore. Break early.
    if (v1.equals(v2)) {
      break
    }

    // Line segment from v1 to v2. This is an edge of the MD.
    v1v2 = Vector2D.subtract(v2, v1)

    // Project the vector *from v1 to the origin* along the segment v1v2. Clamp the projection to the line segment so that
    // if it doesn't fall in the middle either v1 or v2 will be used to calculate the Minkowski Distance. This is the
    // new direction.
    // *Again see Figure 1 for diagrams.*
    direction = Vector2D.projectVector(v1.getInverse(), v1v2, true)
    direction = Vector2D.add(direction, v1)

    lastMD = currentMD
    currentMD = direction.magnitude()
  } while (currentMD < lastMD)
  // Stop when the distance is no longer decreasing.

  supportingDistances.sort(distanceDescending)

  return supportingDistances
}

/**
 * Get supporting distances for given supporting directions and shapes. This is an extrusion of supporting distances
 * from a previous time to the current time as represented by the provided shapes.
 * @function supportingHyperspaceExtrusion
 * @param   {Array}     supportingDistances     An array of objects with supporting distances and directions.
 * @param   {Shape2D}   shapeA                  One of the two shapes.
 * @param   {Shape2D}   shapeB                  One of the two shapes.
 * @return  {Array}                             An array of obects with supporting distances (and the provided
 *                                              directions) for this configuration of shapes (for this time t).
 */
const supportingHyperspaceExtrusion = (supportingDistances, shapeA, shapeB) => {
  const newSupportingDistances = []

  let distance
  for (const { direction } of supportingDistances) {
    // Get the distance for the proveded direction.
    distance = supportingDistance(direction, shapeA, shapeB)

    newSupportingDistances.push({
      distance,
      direction,
    })
  }

  // Sort distances descending
  newSupportingDistances.sort(distanceDescending)

  return newSupportingDistances
}

/**
 * Perform an intersect test on two shapes with given velocities across a time interval represented by the velocities.
 * If necessary get the time of intercept for the two shapes.
 * @function test
 * @param   {Shape2D}           shapeA          One of the shapes to perform the intersect test on.
 * @param   {Shape2D}           shapeB          Another shape to perform the intersect test on.
 * @param   {Vector2D}          shapeAVelocity  The velocity of shapeA.
 * @param   {Vector2D}          shapeBVelocity  The velocity of shapeB.
 * @return  {Boolean|Number}                    If the shapes intersect initially return true.
 *                                              If the shapes do not intersect at all return false.
 *                                              If necessary return a Number on the interval [0, 1] representing a
 *                                              fractional time of intercept.
 */
const test = (shapeA, shapeB, shapeAVelocity, shapeBVelocity) => {
  if (!(shapeA instanceof Shape2D)) {
    throw new TypeError(`Shape A must be an instance of Shape2D. ${shapeA.constructor.name} provided.`)
  }
  if (!(shapeB instanceof Shape2D)) {
    throw new TypeError(`Shape B must be an instance of Shape2D. ${shapeB.constructor.name} provided.`)
  }
  if (!(shapeAVelocity instanceof Vector2D)) {
    throw new TypeError(`Shape A velocity must be an instance of Vector2D. ${shapeAVelocity.constructor.name} provided.`)
  }
  if (!(shapeBVelocity instanceof Vector2D)) {
    throw new TypeError(`Shape B velocity must be an instance of Vector2D. ${shapeBVelocity.constructor.name} provided.`)
  }
  /*
  * Get supporting directions and distances at t0 to see if there is an initial separating distance (positive supporting
  * distance) which would indicate that there is at least one plane separating the shapes at t0.
  * Supporting distances at t0 are sorted descending.
  * These are objects with distance and direction.
  * Distances are signed as they correspond to a direction.
  * Negative distances represent no separation on that plane.
  */
  const supportingDistancest0 = gjk(shapeA, shapeB)
  const separatingDistancest0 = []

  // Filter out negative distances and determine if the shapes are in contact initially.
  let separated = false
  for (const support of supportingDistancest0) {
    // If the supporting distance is positive it separates the shapes.
    if (support.distance > 0) {
      separatingDistancest0.push(support)
      // There is at east one plane separating the shapes at t0.
      separated = true
    } else {
      // Break at the first negative distance (they are sorted).
      break
    }
  }

  // If the shapes are not separated return a collision at t0.
  if (!separated) {
    return true
  }

  // Do an extrusion of the separating space from t0  to t1. This is the separating hyperspace.

  // The directions are used to get supporting distances (along the same vectors) from other times tx.
  let initialSeparatingDirections = separatingDistancest0
  // Simplify matters by using only one vector to move shapes.
  let relativeVelocity = Vector2D.subtract(shapeBVelocity, shapeAVelocity)

  // Shape B at t1.
  let shapeBt1 = shapeB.clone()
  shapeBt1.translate(relativeVelocity)

  // Get supporting distances at t1 (again sorted descending).
  let supportingDistancest1 = supportingHyperspaceExtrusion(initialSeparatingDirections, shapeA, shapeBt1)

  // If at least one distance is positive then there is a plane separating P and Q on the interval t0 to t1.
  // Remember this is true because we use the same supporting directions.
  if (supportingDistancest1[0].distance > 0) {
    return false
  }

  /*
  * There is separating distance at t0 and none at t1 therefore we need to find a TOI.
  * This is done using Brent's Method of Root Solving. Brent's Method requires, at least, a function of x
  * (in our case SD(t)) and lower and upper bounds within which to search for an x intercept. In our case
  * the x intecept represents SD(tx) = 0 where tx is some time inbetween t0 and t1.
  */

  // Return any potential intersect time.
  // This can be used as a scalar for the velocities of shapeA and shapeB to provide movement to the exact place that
  // they intercept.
  return brentsMethod(
    // This is our function for finding time of intercept.
    // It takes t and returns the maximum supporting distance at that time based on the supporting directions that were
    // found earlier.
    (t) => {
      // Scale v by t.
      let vt = new Vector2D(relativeVelocity)
      vt.scale(t)
      // Translate shapeB by vt.
      let shapeBt = shapeB.clone()
      shapeBt.translate(vt)
      // Get supporting distances for shapeA and shapeBt using direction vectors from inital separating distances.
      let supportingDistancest = supportingHyperspaceExtrusion(initialSeparatingDirections, shapeA, shapeBt)

      // If greatest support distance is positive then we know that P and Q are disjoint from t0 to now. This means that
      // a simple extrusion test won't be precise enough, we need to run a full GJK extrusion to get the closest
      // distance.
      if (supportingDistancest[0].distance > 0) {
        supportingDistancest = gjk(shapeA, shapeBt)
        // Go ahead and use the new supporting directions to calculate future distances.
        // It's good to use the refined directions from this t because we know that P and Q are disjoint from t0 to now.
        initialSeparatingDirections = supportingDistancest.filter(({ distance }) => distance > 0)
      }

      // Return maximum distance
      return supportingDistancest[0].distance
    },
    // Limits of t for the function
    0,
    1,
    {
      // The default 1e-7 is too great and will give false positives in some
      errorTolerance: 1e-12,
      maxIterations: 100,
    },
  )
}

/* Figure 1:
 * When the projection falls within bounds:
 *                           v2
 *                           |
 *                           | v1v2
 *           direction       |
 *      o ------------------>|  ^ }  Projection of v1o onto v1v2
 *        `---.__           ∟|  | }  (closest point on v1v2
 *                `---.__    |  | }  to origin)
 *                        `-v1
 *
 * When it does not:
 *
 *                   v2
 *                  /
 *          dir    /
 *      o ------->v1   }-- When clamped projection will return v1
 *  +-{   ` .    /         (again, closest point on v1v2)
 *  |-{       `∟'
 *  |
 *  |__ Actual projection of v1o onto v1v2
 *
 *
 *
 *             .∟\    } -- Portion of projection of v1o onto v1v2 (clamped away)
 *         . '    \   } _/
 *      o'-------->v2         }-- When clamped projection will return v2
 *       `-._   dir \
 *            `-._   \
 *                 `-.v1
 *
 */

/**
 * A module for doing intersect and TOI tests on 2D shapes.
 * @module contact
 */
module.exports = test

