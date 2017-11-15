let p = [
    5, 3,
    0.2, 6,
    -2, 4.3,
    -5, 2,
    -4, -4,
    -1, -3,
]

let context = canvas.getContext('2d')
context.fillStyle = '#00ffcb'
context.beginPath()
context.moveTo(p[0] + 250, p[1] + 125)

for (let i = 2; i < p.length; i += 2) {
    context.lineTo(p[i] + 250, p[i + 1] + 125)
}

context.closePath()
context.fill()
