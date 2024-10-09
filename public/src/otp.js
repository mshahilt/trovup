function moveToNext(current, nextFieldID) {
    if (current.value.length === 1) {
        document.getElementById(nextFieldID).focus();
    }
}
let timeLeft = 180; 
const timerElement = document.getElementById('timer');
const resendLink = document.getElementById('resendLink');
resendLink.style.pointerEvents = 'none';

const timer = setInterval(() => {
    if (timeLeft <= 0) {
        clearInterval(timer);
        timerElement.textContent = '00:00';
        resendLink.style.pointerEvents = 'auto'; // Enable the resend link after timer ends
    } else {
        const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const seconds = String(timeLeft % 60).padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
        timeLeft--;
    }
}, 1000);