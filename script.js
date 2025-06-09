// Utility function for input sanitization
const sanitizeInput = (input) => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.replace(/[<>]/g, '');
};

// Utility function for validation
const validateInput = (id, value, errorElement, regex = null, message = 'This field is required') => {
  if (!value.trim()) {
    errorElement.textContent = message;
    return false;
  }
  if (regex && !regex.test(value)) {
    errorElement.textContent = `Invalid ${id}`;
    return false;
  }
  errorElement.textContent = '';
  return true;
};

// ========== USER PAGE ==========
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');

    // Disable button and show loading
    submitBtn.disabled = true;
    loading.style.display = 'block';
    message.textContent = '';

    // Get form values
    const name = sanitizeInput(document.getElementById('name').value);
    const mobile = document.getElementById('mobile').value;
    const pickup = sanitizeInput(document.getElementById('pickup').value);
    const drop = sanitizeInput(document.getElementById('drop').value);
    const dateTime = document.getElementById('dateTime').value;

    // Validate inputs
    const isValid = [
      validateInput('name', name, document.getElementById('nameError')),
      validateInput('mobile', mobile, document.getElementById('mobileError'), /^[0-9]{10}$/, 'Enter a valid 10-digit mobile number'),
      validateInput('pickup', pickup, document.getElementById('pickupError')),
      validateInput('drop', drop, document.getElementById('dropError')),
      validateInput('dateTime', dateTime, document.getElementById('dateTimeError'), null, 'Please select a date and time'),
    ].every((valid) => valid);

    if (!isValid) {
      submitBtn.disabled = false;
      loading.style.display = 'none';
      return;
    }

    try {
      const newBooking = { name, mobile, pickup, drop, dateTime, driver: 'Not Assigned', status: 'Pending' };
      const existing = JSON.parse(localStorage.getItem('rikshaBookings') || '[]');
      existing.push(newBooking);
      localStorage.setItem('rikshaBookings', JSON.stringify(existing));

      message.textContent = 'Booking successful! You will be notified once a driver is assigned.';
      bookingForm.reset();
    } catch (error) {
      console.error('Error saving booking:', error);
      message.textContent = 'Error processing booking. Please try again.';
    } finally {
      submitBtn.disabled = false;
      loading.style.display = 'none';
    }
  });
}

// ========== ADMIN PAGE ==========
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    const loginError = document.getElementById('loginError');

    // Basic client-side validation
    if (!username || !password) {
      loginError.textContent = 'Please enter both username and password.';
      return;
    }

    // In production, replace with secure server-side authentication
    const defaultUser = 'admin';
    const defaultPass = 'password123'; // TODO: Replace with secure auth (e.g., JWT)

    if (username === defaultUser && password === defaultPass) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      document.getElementById('loginPanel').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      showBookings();
    } else {
      loginError.textContent = 'Invalid credentials.';
    }
  });
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAdminLoggedIn');
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminLoginForm').reset();
    document.getElementById('loginError').textContent = '';
  });
}

// Check login status on page load
if (localStorage.getItem('isAdminLoggedIn') === 'true') {
  document.getElementById('loginPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  showBookings();
}

function showBookings() {
  const data = JSON.parse(localStorage.getItem('rikshaBookings') || '[]');
  const tbody = document.querySelector('#bookingTable tbody');
  tbody.innerHTML = '';

  data.forEach((booking, index) => {
    const row = document.createElement('tr');

    // Driver dropdown
    const driverSelect = document.createElement('select');
    const drivers = ['Not Assigned', 'Raju', 'Meena', 'Karan', 'Sita'];
    drivers.forEach((driver) => {
      const option = document.createElement('option');
      option.value = driver;
      option.textContent = driver;
      if (booking.driver === driver) option.selected = true;
      driverSelect.appendChild(option);
    });
    driverSelect.addEventListener('change', () => assignDriver(index, driverSelect.value));

    // Status dropdown
    const statusSelect = document.createElement('select');
    const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    statuses.forEach((status) => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      if (booking.status === status) option.selected = true;
      statusSelect.appendChild(option);
    });
    statusSelect.addEventListener('change', () => updateStatus(index, statusSelect.value));

    row.innerHTML = `
      <td>${booking.name}</td>
      <td>${booking.mobile}</td>
      <td>${booking.pickup}</td>
      <td>${booking.drop}</td>
      <td>${new Date(booking.dateTime).toLocaleString()}</td>
    `;
    const driverCell = document.createElement('td');
    driverCell.appendChild(driverSelect);
    row.appendChild(driverCell);

    const statusCell = document.createElement('td');
    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    tbody.appendChild(row);
  });
}

function assignDriver(index, driverName) {
  const bookings = JSON.parse(localStorage.getItem('rikshaBookings') || '[]');
  if (bookings[index].driver === driverName) {
    alert('Driver is already assigned to this booking.');
    return;
  }

  bookings[index].driver = driverName;
  bookings[index].status = driverName === 'Not Assigned' ? 'Pending' : 'Confirmed';
  localStorage.setItem('rikshaBookings', JSON.stringify(bookings));

  alert(`✅ Driver "${driverName}" assigned to ${bookings[index].name}.`);
  setTimeout(() => {
    alert(`📢 Rider Notification:\nHello ${bookings[index].name}, your driver "${driverName}" has been assigned for your ride from ${bookings[index].pickup} to ${bookings[index].drop} on ${new Date(bookings[index].dateTime).toLocaleString()}.`);
  }, 500);
  showBookings();
}

function updateStatus(index, status) {
  const bookings = JSON.parse(localStorage.getItem('rikshaBookings') || '[]');
  if (bookings[index].status === status) return;

  bookings[index].status = status;
  localStorage.setItem('rikshaBookings', JSON.stringify(bookings));

  alert(`✅ Booking status updated to "${status}" for ${bookings[index].name}.`);
  setTimeout(() => {
    alert(`📢 Rider Notification:\nHello ${bookings[index].name}, your booking from ${bookings[index].pickup} to ${bookings[index].drop} is now ${status}.`);
  }, 500);
  showBookings();
}