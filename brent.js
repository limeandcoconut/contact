// /**
//  * Searches the interval from <tt>lowerLimit</tt> to <tt>upperLimit</tt>
//  * for a root (i.e., zero) of the function <tt>func</tt> with respect to
//  * its first argument using Brent's method root-finding algorithm.
//  *
//  * Translated from zeroin.c in http://www.netlib.org/c/brent.shar.
//  *
//  * Copyright (c) 2012 Borgar Thorsteinsson <borgar@borgar.net>
//  * MIT License, http://www.opensource.org/licenses/mit-license.php
//  *
//  * @param {function} function for which the root is sought.
//  * @param {number} the lower point of the interval to be searched.
//  * @param {number} the upper point of the interval to be searched.
//  * @param {number} the desired accuracy (convergence tolerance).
//  * @param {number} the maximum number of iterations.
//  * @return an estimate for the root within accuracy.
//  *
//  */
/**
 *
 * @param {*} param0 thing
 * @return {*} thing
 */
function uniroot({func, lowerLimit, upperLimit, errorTolerance, maxIterations}) {
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

        if (fb > 0) {
            break
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

let testCounter

function f1(x) {
    testCounter++
    return (Math.pow(x, 2) - 1) * (x - 5)
}
function f2(x) {
    testCounter++
    return Math.cos(x) - x
}
function f3(x) {
    testCounter++
    return Math.sin(x) - x
}
function f4(x) {
    testCounter++
    return (x + 3) * Math.pow(x - 1, 2)
}
[
    {
        func: f1,
        lowerLimit: 2,
        upperLimit: 3,
    },
    {
        func: f2,
        lowerLimit: 2,
        upperLimit: 3,
    },
    {
        func: f2,
        lowerLimit: -1,
        upperLimit: 3,
    },
    {
        func: f3,
        lowerLimit: -1,
        upperLimit: 3,
    },
    {
        func: f4,
        lowerLimit: -4,
        upperLimit: 4 / 3,
    },
].forEach((args) => {
    testCounter = 0
    let root = uniroot(args)
    console.log('uniroot:', args.func.toString().slice(9, 14), root, testCounter)
    console.log('------------------')
    console.log('')
})
