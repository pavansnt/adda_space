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

// User clicks Mysuru (slow response: 50ms), then quickly switches to Bengaluru (fast response: 10ms)
mockFetchCoordinator('Mysuru', 50, (c) => {});
mockFetchCoordinator('Bengaluru', 10, (c) => {});

setTimeout(() => {
  // After 60ms, Bengaluru must be displayed, NOT Mysuru!
  assert.strictEqual(displayedCity, 'Bengaluru');
  console.log('✓ Rapid city changes discard stale responses correctly');
  console.log('All frontend coordinator tests PASSED!');
}, 70);
