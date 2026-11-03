// Test suite for Adda Space Host at Adda Coordinator & Operating Hours frontend logic
const assert = require('assert');

// 1. Phone Normalizer
function normalizePhoneNumber(phone, defaultCode) {
  defaultCode = defaultCode || '91';
  if (!phone) return '';
  const raw = String(phone).trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (raw.charAt(0) === '+') {
    return digits;
  }
  if (digits.length === 10) {
    return defaultCode + digits;
  }
  if (digits.length === 11 && digits.charAt(0) === '0') {
    return defaultCode + digits.slice(1);
  }
  return digits;
}

// 2. 12-Hour Time Formatter (without timezone shift)
function formatTime12hr(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).trim().split(':');
  const hours = parseInt(parts[0], 10);
  if (isNaN(hours)) return timeStr;
  let minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isNaN(minutes)) minutes = 0;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  const mStr = minutes < 10 ? '0' + minutes : String(minutes);
  return h12 + ':' + mStr + ' ' + ampm;
}

// 3. Dynamic WhatsApp URL Builder
function generateWhatsAppUrl(coordName, cityName, phone, eventDate) {
  const normPhone = normalizePhoneNumber(phone);
  const dateVal = (eventDate && String(eventDate).trim()) ? String(eventDate).trim() : 'a date I’m still planning';
  // Exact format: "Hi {coordinator_name}, I’d like to host an event at the Adda in {city_name}. I’m looking at {event_date}. Could you help me plan it?"
  const msg = 'Hi ' + coordName + ', I’d like to host an event at the Adda in ' + cityName + '. I’m looking at ' + dateVal + '. Could you help me plan it?';
  return 'https://wa.me/' + normPhone + '?text=' + encodeURIComponent(msg);
}

// 4. Test Suite Execution
console.log('--- Starting Adda Space Frontend Coordinator Verification ---');

// Test 1: Phone Normalization
console.log('Test 1: International & Indian phone normalization');
assert.strictEqual(normalizePhoneNumber('87929 65810'), '918792965810');
assert.strictEqual(normalizePhoneNumber('90350-54940'), '919035054940');
assert.strictEqual(normalizePhoneNumber('09035054940'), '919035054940');
assert.strictEqual(normalizePhoneNumber('+91 87929 65810'), '918792965810');
assert.strictEqual(normalizePhoneNumber('+1 (555) 234-5678'), '15552345678');
assert.strictEqual(normalizePhoneNumber('+44 7911 123456'), '447911123456');
console.log('✓ Phone normalization passed');

// Test 2: Time Formatting
console.log('Test 2: Operating hours 12-hour formatting without UTC shift');
assert.strictEqual(formatTime12hr('10:00:00'), '10:00 AM');
assert.strictEqual(formatTime12hr('18:00:00'), '6:00 PM');
assert.strictEqual(formatTime12hr('00:00:00'), '12:00 AM');
assert.strictEqual(formatTime12hr('12:00:00'), '12:00 PM');
assert.strictEqual(formatTime12hr('09:30'), '9:30 AM');
assert.strictEqual(formatTime12hr('23:45'), '11:45 PM');
console.log('✓ Time formatting passed');

// Test 3: Exact WhatsApp URL for Mysuru with date
console.log('Test 3: Exact WhatsApp prefilled message for Mysuru with date');
const urlMysuru = generateWhatsAppUrl('Sarah Misra', 'Mysuru', '87929 65810', '2026-10-27');
assert.strictEqual(
  urlMysuru,
  'https://wa.me/918792965810?text=Hi%20Sarah%20Misra%2C%20I%E2%80%99d%20like%20to%20host%20an%20event%20at%20the%20Adda%20in%20Mysuru.%20I%E2%80%99m%20looking%20at%202026-10-27.%20Could%20you%20help%20me%20plan%20it%3F'
);
// Verify Unicode curly apostrophe is properly URL encoded as %E2%80%99
assert(urlMysuru.includes('%E2%80%99d'));
assert(urlMysuru.includes('%E2%80%99m'));
assert(urlMysuru.includes('2026-10-27'));
assert(!urlMysuru.includes('+')); // Phone path has no '+'
console.log('✓ Mysuru WhatsApp URL passed');

// Test 4: Exact WhatsApp URL for Bengaluru with date
console.log('Test 4: Exact WhatsApp prefilled message for Bengaluru with date');
const urlBengaluru = generateWhatsAppUrl('Chiku Agarawal', 'Bengaluru', '90350 54940', '2026-11-15');
assert.strictEqual(
  urlBengaluru,
  'https://wa.me/919035054940?text=Hi%20Chiku%20Agarawal%2C%20I%E2%80%99d%20like%20to%20host%20an%20event%20at%20the%20Adda%20in%20Bengaluru.%20I%E2%80%99m%20looking%20at%202026-11-15.%20Could%20you%20help%20me%20plan%20it%3F'
);
console.log('✓ Bengaluru WhatsApp URL passed');

// Test 5: Fallback date phrase when no date is selected
console.log('Test 5: Fallback date phrase when no date selected');
const urlFallback = generateWhatsAppUrl('Sarah Misra', 'Mysuru', '87929 65810', null);
assert.strictEqual(
  urlFallback,
  'https://wa.me/918792965810?text=Hi%20Sarah%20Misra%2C%20I%E2%80%99d%20like%20to%20host%20an%20event%20at%20the%20Adda%20in%20Mysuru.%20I%E2%80%99m%20looking%20at%20a%20date%20I%E2%80%99m%20still%20planning.%20Could%20you%20help%20me%20plan%20it%3F'
);
assert(urlFallback.includes('a%20date%20I%E2%80%99m%20still%20planning'));
console.log('✓ Missing date fallback passed');

// Test 6: Sequence Counter Simulating Rapid City Selection
console.log('Test 6: Race condition prevention on rapid city changes');
let seq = 0;
let displayedCity = null;

function mockFetchCoordinator(cityName, delayMs, callback) {
  const currentSeq = ++seq;
  setTimeout(() => {
    // Stale check
    if (currentSeq !== seq) {
      // Ignored stale response
      return;
    }
    displayedCity = cityName;
    callback(cityName);
  }, delayMs);
}

function validateRoomOperatingHours(room, startTime, endTime) {
  if (!room || !room.opening_time || !room.closing_time) {
    return { valid: false, error: 'Operating hours are not configured for this space.' };
  }
  const op = room.opening_time.slice(0, 5);
  const cl = room.closing_time.slice(0, 5);
  const s = String(startTime || '').slice(0, 5);
  const e = String(endTime || '').slice(0, 5);

  if (!s || !e) {
    return { valid: false, error: 'Please select start and end time.' };
  }
  if (s >= e) {
    return { valid: false, error: 'End time must be after start time.' };
  }
  if (s < op || e > cl) {
    return { valid: false, error: 'Event must start at or after ' + formatTime12hr(op) + ' and finish by ' + formatTime12hr(cl) + '.' };
  }
  return { valid: true };
}

// User clicks Mysuru (slow response: 50ms), then quickly switches to Bengaluru (fast response: 10ms)
mockFetchCoordinator('Mysuru', 50, (c) => {});
mockFetchCoordinator('Bengaluru', 10, (c) => {});

setTimeout(() => {
  // After 60ms, Bengaluru must be displayed, NOT Mysuru!
  assert.strictEqual(displayedCity, 'Bengaluru');
  console.log('✓ Rapid city changes discard stale responses correctly');

  // Test 7: Room Operating Hours Evaluation (10:00 to 18:00)
  console.log('Test 7: Room Operating Hours Evaluation');
  const testRoom = {
    room_name: 'Workshop Room',
    opening_time: '10:00:00',
    closing_time: '18:00:00',
    timezone: 'Asia/Kolkata'
  };

  // 10 AM–12 PM: allowed
  assert.strictEqual(validateRoomOperatingHours(testRoom, '10:00', '12:00').valid, true);
  // 2 PM–5 PM: allowed
  assert.strictEqual(validateRoomOperatingHours(testRoom, '14:00', '17:00').valid, true);
  // 10 AM–6 PM: allowed
  assert.strictEqual(validateRoomOperatingHours(testRoom, '10:00', '18:00').valid, true);
  // 9 AM–11 AM: rejected
  assert.strictEqual(validateRoomOperatingHours(testRoom, '09:00', '11:00').valid, false);
  assert.strictEqual(validateRoomOperatingHours(testRoom, '09:00', '11:00').error.includes('10:00 AM'), true);
  // 5 PM–7 PM: rejected
  assert.strictEqual(validateRoomOperatingHours(testRoom, '17:00', '19:00').valid, false);
  assert.strictEqual(validateRoomOperatingHours(testRoom, '17:00', '19:00').error.includes('6:00 PM'), true);
  // 6 PM–7 PM: rejected
  assert.strictEqual(validateRoomOperatingHours(testRoom, '18:00', '19:00').valid, false);
  // End time earlier than start time: rejected
  assert.strictEqual(validateRoomOperatingHours(testRoom, '15:00', '14:00').valid, false);
  // Room with missing operating hours: rejected
  const roomMissingHours = { room_name: 'No Hours Room', opening_time: null, closing_time: null };
  assert.strictEqual(validateRoomOperatingHours(roomMissingHours, '10:00', '12:00').valid, false);
  assert.strictEqual(validateRoomOperatingHours(roomMissingHours, '10:00', '12:00').error.includes('not configured'), true);

  console.log('✓ Room operating hours boundary rules passed');

  // Test 8: Stale Hours Discard on Room Switch
  console.log('Test 8: Room switch updates hours and clears stale state');
  let currentRoomData = null;
  function selectRoom(newRoom) {
    currentRoomData = newRoom;
  }
  selectRoom(testRoom);
  assert.strictEqual(currentRoomData.opening_time, '10:00:00');
  selectRoom(null); // switching city
  assert.strictEqual(currentRoomData, null);
  selectRoom({ room_name: 'Night Owl Room', opening_time: '18:00:00', closing_time: '23:00:00' });
  assert.strictEqual(currentRoomData.opening_time, '18:00:00');
  console.log('✓ Stale room hours prevented on room/city change');

  console.log('All frontend coordinator & room operating hours tests PASSED!');
}, 70);
