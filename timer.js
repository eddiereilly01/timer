// --- Constants ---
const STATE = {
  IDLE:        0,
  WORK:        1,
  REST:        2,
  REST_PAUSED: 3,
}

const RED_THEME   = "red"
const WHITE_THEME = "white"
const GREEN_THEME = "green"

let MAX_ROUNDS   = 5
let ROUND_LENGTH = 120 * 1000  // milliseconds
let REST_LENGTH  = 30  * 1000  // milliseconds

// --- Elements ---
const timeElement        = document.querySelector('#time')
const roundTextElement   = document.querySelector('#round-text')
const timerButtonElement = document.querySelector('#timer-button')
const bodyElement        = document.getElementById("body")

// --- State ---
const roundTimer = { elapsedTime: 0 }
let currentRound = 1
let timerState   = STATE.IDLE
const roundEndBell = new Audio('../bell.mp3')

// --- Event listeners ---
timerButtonElement.addEventListener('click', () => timerButtonWasClicked())


// --- Theme ---
function changeTheme(state) {
  if (state === STATE.IDLE) {
    bodyElement.classList.replace(GREEN_THEME, RED_THEME)
    bodyElement.classList.replace(WHITE_THEME, RED_THEME)
    timerButtonElement.style.backgroundColor = 'lightgreen'
    timerButtonElement.style.color           = 'darkgreen'
  } else if (state === STATE.WORK) {
    bodyElement.classList.replace(RED_THEME,   GREEN_THEME)
    bodyElement.classList.replace(WHITE_THEME, GREEN_THEME)
    timerButtonElement.style.backgroundColor = 'red'
    timerButtonElement.style.color           = 'white'
  } else if (state === STATE.REST) {
    bodyElement.classList.replace(GREEN_THEME, WHITE_THEME)
    bodyElement.classList.replace(RED_THEME,   WHITE_THEME)
    timerButtonElement.style.backgroundColor = 'lightgreen'
    timerButtonElement.style.color           = 'darkgreen'
  }
}

// --- Button handlers ---
function resetButtonWasClicked() {
  clearInterval(roundTimer.intervalId)
  currentRound = 1
  timerState   = STATE.IDLE
  resetTime()
  changeTheme(STATE.IDLE)
  changeTimerButtonText('Start')
  updateRoundText()
  displayTime([0, 0])

  // Return to form
  formContainer.style.display  = 'block'
  timerContainer.style.display = 'none'
}

function timerButtonWasClicked() {
  switch (timerState) {
    case STATE.IDLE:        beginWorkRound();  break
    case STATE.WORK:        pauseWorkRound();  break
    case STATE.REST:        pauseRestRound();  break
    case STATE.REST_PAUSED: playRestRound();   break
  }
}

function changeTimerButtonText(text) {
  timerButtonElement.textContent = text
}

function updateRoundText() {
  roundTextElement.textContent = `Round ${currentRound} / ${MAX_ROUNDS}`
}


// --- Work round ---
function beginWorkRound() {
  timerState = STATE.WORK
  changeTheme(timerState)
  changeTimerButtonText('Stop')
  updateRoundText()
  startRoundTimer()
}

function pauseWorkRound() {
  roundTimer.elapsedTime += Date.now() - roundTimer.startTime
  clearInterval(roundTimer.intervalId)
  timerState = STATE.IDLE
  changeTheme(timerState)
  changeTimerButtonText('Start')
}


// --- Rest round ---
function playRestRound() {
  timerState = STATE.REST
  changeTheme(timerState)
  changeTimerButtonText('Stop')
  startRoundTimer()
}

function pauseRestRound() {
  roundTimer.elapsedTime += Date.now() - roundTimer.startTime
  clearInterval(roundTimer.intervalId)
  timerState = STATE.REST_PAUSED
  changeTimerButtonText('Start')
}


// --- Timer core ---
function startRoundTimer() {
  roundTimer.startTime = Date.now()
  roundTimer.intervalId = setInterval(() => {
    const elapsedTime = Date.now() - roundTimer.startTime + roundTimer.elapsedTime
    const seconds     = Math.floor((elapsedTime / 1000) % 60)
    const minutes     = Math.floor((elapsedTime / (1000 * 60)) % 60)
    displayTime([minutes, seconds])
    isRoundOver(elapsedTime)
  }, 100)
}

function isRoundOver(elapsedMs) {
  if (timerState === STATE.WORK && elapsedMs >= ROUND_LENGTH) {
    endRound(STATE.REST)
  } else if (timerState === STATE.REST && elapsedMs >= REST_LENGTH) {
    endRound(STATE.IDLE)
  }
}

function endRound(nextState) {
  clearInterval(roundTimer.intervalId)
  roundEndBell.play()

  if (nextState === STATE.REST) {
    // Work round just ended — start rest automatically
    timerState = STATE.REST
    changeTheme(timerState)
    changeTimerButtonText('Rest')
    resetTime()
    startRoundTimer()
  } else {
    // Rest just ended — move to next work round
    currentRound++

    if (currentRound > MAX_ROUNDS) {
      // All rounds complete
      timerState = STATE.IDLE
      changeTheme(timerState)
      changeTimerButtonText('Start')
      roundTextElement.textContent = 'Done!'
      resetTime()
      displayTime([0, 0])
      return
    }

    timerState = STATE.IDLE
    changeTheme(timerState)
    changeTimerButtonText(`Round ${currentRound}`)
    updateRoundText()
    resetTime()
    displayTime([0, 0])
  }
}

function displayTime([minutes, seconds]) {
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  timeElement.textContent = `${mm}:${ss}`
}

function resetTime() {
  roundTimer.elapsedTime = 0
  roundTimer.startTime   = Date.now()
}

const submitButton  = document.querySelector('#submit-button')
const formContainer = document.querySelector('.form-container')
const timerContainer = document.querySelector('#timer-container')

const roundsInput   = document.querySelector('#rounds')
const roundMinInput = document.querySelector('#round-min')
const roundSecInput = document.querySelector('#round-sec')
const restMinInput  = document.querySelector('#rest-min')
const restSecInput  = document.querySelector('#rest-sec')

submitButton.addEventListener('click', () => {
  const rounds    = parseInt(roundsInput.value)
  const roundMins = parseInt(roundMinInput.value) || 0
  const roundSecs = parseInt(roundSecInput.value) || 0
  const restMins  = parseInt(restMinInput.value)  || 0
  const restSecs  = parseInt(restSecInput.value)  || 0

  if (!isNaN(rounds) && rounds > 0) MAX_ROUNDS = rounds

  const roundTotal = (roundMins * 60) + roundSecs
  const restTotal  = (restMins  * 60) + restSecs

  if (roundTotal > 0) ROUND_LENGTH = roundTotal * 1000
  if (restTotal  > 0) REST_LENGTH  = restTotal  * 1000

  resetButtonWasClicked()
  updateRoundText()

  formContainer.style.display  = 'none'
  timerContainer.style.display = 'block'
})

const settingsButton = document.querySelector('#settings-button')

settingsButton.addEventListener('click', () => {
  resetButtonWasClicked()
})

const prevRoundButton = document.querySelector('#prev-round-button')
const nextRoundButton = document.querySelector('#next-round-button')

prevRoundButton.addEventListener('click', () => changeRound(-1))
nextRoundButton.addEventListener('click', () => changeRound(1))

function changeRound(direction) {
  const newRound = currentRound + direction
  if (newRound < 1 || newRound > MAX_ROUNDS) return

  clearInterval(roundTimer.intervalId)
  currentRound = newRound
  timerState   = STATE.IDLE
  changeTheme(STATE.IDLE)
  changeTimerButtonText('Start')
  updateRoundText()
  resetTime()
  displayTime([0, 0])
}