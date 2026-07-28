const form = document.querySelector('#trial-form');
const status = document.querySelector('#status');
const role = document.querySelector('#role');
const handFields = document.querySelector('#handedness');
const battingLabel = document.querySelector('#batting-hand-label');
const bowlingLabel = document.querySelector('#bowling-hand-label');

role.addEventListener('change', () => {
  const selected = role.value;
  handFields.hidden = !selected;
  battingLabel.hidden = selected === 'Bowler';
  bowlingLabel.hidden = selected === 'Batter' || selected === 'Wicket-keeper';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Submitting your registration…';
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch('/api/registrations', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Could not save registration');
    const result = await response.json();
    status.textContent = result.emailSent
      ? `Registration complete! Your registration number is ${result.registrationNumber}. Confirmation has been sent to your email.`
      : `Registration complete! Your registration number is ${result.registrationNumber}. Please contact the academy if you do not receive your confirmation email.`;
    form.reset();
  } catch (error) {
    status.textContent = 'Registration could not be sent. Please try again or contact the academy.';
  }
});
