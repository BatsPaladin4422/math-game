let args = window.location.hash

let input = ""
let question = ""

let count = 0
let usedExpressions = []

let correct = 0

const startingTime = Date.now()
let totalTime = 10000

let paused = false

let ops = ["+", "-", "*", ""]
let opMult = 1.5


let seed = 0
if(args.length >= 1) {
    seed = Number.parseFloat(args.substring(1))
} else seed = (Math.random() * 2 ** 32) >>> 0
console.log(seed)

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const random = mulberry32(seed)

addEventListener("keydown", (event) => {
    if(paused) return;
    console.log(event.code)
    if((legalChars.includes(event.key) || event.key == "-" && input == "")) {
        document.getElementById("answer").classList.remove("grayed")
        input += event.key
        document.getElementById("answer").innerText = input
    } else if(event.code == "Enter") {
        submit()
    } else if(event.code == "Backspace") {
        if(event.ctrlKey || event.metaKey) {
            input = ""
            document.getElementById("answer").classList.add("grayed")
            document.getElementById("answer").innerText = "Answer... (type to enter)"
        } else {
            document.getElementById("answer").classList.remove("grayed")
            input = input.substring(0, input.length - 1)
            document.getElementById("answer").innerText = input
            if(input.length == 0) {
                document.getElementById("answer").classList.add("grayed")
                document.getElementById("answer").innerText = "Answer... (type to enter)"
            }
        }
    }
})

function submit() {
    if(Math.abs(evaluate(input) - evaluate(question)) < 0.1) {
        correct++
        document.getElementById("answers").innerText = correct + "✔︎"
        nextQuestion()
        totalTime += 5000
    }
    input = ""
    document.getElementById("answer").classList.add("grayed")
    document.getElementById("answer").innerText = "Answer... (type to enter)"
}

function nextQuestion() {
    question = (Math.floor(random() * 9) + 1) + ""
    let lastOp = -1
    for(let i = 0; i < Math.max(1, Math.log(correct) * opMult); i++) {
        let op = lastOp
        while(op == lastOp) {
            op = Math.floor(Math.pow(random(), 1.2) * ops.length)
        }
        question += ops[op]
        question += (Math.floor(random() * 9) + 1)
        lastOp = op
    }
    document.getElementById("question").innerText = question
}

nextQuestion()

setInterval(() => {
    if(paused) return;

    let time = Math.round((totalTime - (Date.now() - startingTime)) / 10) / 100

    if(time <= 0) {
        submit()
    }

    time = Math.round((totalTime - (Date.now() - startingTime)) / 10) / 100

    if(time <= 0) {
        paused = true
        document.getElementById("answers").innerText += " Seed: " + seed
    }

    if(time % 1 == 0) time += ".0"
    if((time * 10) % 1 == 0) time += "0"
    document.getElementById("timer").innerText = time

}, 10)

let legalChars = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."
]

let operations = [
    "+", "-", "*", "/", "%", "^"
]


let priorities = {
    "+": 0,
    "-": 0,
    "*": 1,
    "/": 1,
    "%": 1,
    "^": 2
}

let unaryMinusDetection = [
    "(", "+", "-", "*", "/", "%", "^", ""
]

let letters = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"
]

function evaluate(str) {
    if(str.charAt(0) == "(" && str.charAt(str.length - 1) == ")") str = str.substring(1, str.length - 1)
    
    let lowestPriority = 999999
    let lowestBrackets = 999999
    let index = Infinity
    let operation = ""
    let lastChar = ""

    let currentBrackets = 0

    let readingWord = false
    let word = ""

    for(let i = 0; i < str.length; i++) {
        c = str.charAt(i)

        if(!letters.includes(c) && readingWord) {
            readingWord = false

            if(currentBrackets < lowestBrackets) {
                index = i - 1
                operation = word
                lowestBrackets = currentBrackets
                lowestPriority = 4
                console.log(operation)
            }
            word = ""
        }

        if(c == "(") currentBrackets += 1
        if(c == ")") currentBrackets -= 1

        if(operations.includes(c)) {
            if(c == "-" && unaryMinusDetection.includes(lastChar)) {
                if(currentBrackets < lowestBrackets || (currentBrackets == lowestBrackets && 3 <= lowestPriority)) {
                    index = i
                    operation = "u-"
                    lowestBrackets = currentBrackets
                    lowestPriority = 3
                }
            } else if(currentBrackets < lowestBrackets) {
                index = i
                operation = c
                lowestBrackets = currentBrackets
                lowestPriority = priorities[c]
            } else if(currentBrackets == lowestBrackets) {
                if(priorities[c] <= lowestPriority) {
                    index = i
                    operation = c
                    lowestPriority = priorities[c]
                }
            }
        } else if(letters.includes(c)) {
            readingWord = true
            word += c
        }
        lastChar = c
    }
    
    if(index == Infinity) return Number.parseFloat(str)
    else {
        let left = str.substring(0, index)
        let right = str.substring(index + 1, str.length)
        if(operation == "+") return evaluate(left) + evaluate(right)
        if(operation == "-") return evaluate(left) - evaluate(right)
        if(operation == "u-") return -evaluate(right)
        if(operation == "*") return evaluate(left) * evaluate(right)
        if(operation == "/") return evaluate(left) / evaluate(right)
        if(operation == "%") return evaluate(left) % evaluate(right)
        if(operation == "^") return Math.pow(evaluate(left), evaluate(right))

        if(operation == "sin") return Math.sin(evaluate(right) * Math.PI / 180)
        if(operation == "cos") return Math.cos(evaluate(right) * Math.PI / 180)
        if(operation == "tan" || operation == "tg") return Math.tan(evaluate(right) * Math.PI / 180)

        if(operation == "asin") return Math.asin(evaluate(right)) / Math.PI * 180
        if(operation == "acos") return Math.acos(evaluate(right)) / Math.PI * 180
        if(operation == "atan" || operation == "atg") return Math.atan(evaluate(right)) / Math.PI * 180

        if(operation == "sqrt" || operation == "rt") return Math.sqrt(evaluate(right))
        if(operation == "cbrt") return Math.pow(evaluate(right), 1/3)
        if(operation == "hcrt") return Math.pow(evaluate(right), 1/4)

        if(operation == "floor") return Math.floor(evaluate(right))
        if(operation == "ceil") return Math.ceil(evaluate(right))
        if(operation == "round") return Math.round(evaluate(right))

        if(operation == "abs") return Math.abs(evaluate(right))

        if(operation == "log") return Math.log10(evaluate(right))
        if(operation == "ln") return Math.log(evaluate(right))
    }
}