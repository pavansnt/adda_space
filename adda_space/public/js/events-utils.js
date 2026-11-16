'use strict';

  function getCsrfToken() {
    return (window.frappe && window.frappe.csrf_token) || window.csrf_token || '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function stripHtml(html) {
    if (!html) return '';
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  function isPendingEvent(event) {
    if (!event) return false;
    if (String(event.type || '').trim().toLowerCase() !== 'custom event') return false;
    var status = String(event.approval_status || '').trim().toLowerCase();
    return status === 'pending review' || status === 'pending';
  }

  function isPastEvent(event) {
    if (!event) return false;

    // 1. Prefer the backend's trustworthy past-event flag if available
    if (typeof event.is_past === 'boolean') {
      return event.is_past;
    }
    if (typeof event.is_past === 'number') {
      return event.is_past === 1;
    }
    if (typeof event.is_past === 'string') {
      var s = event.is_past.trim().toLowerCase();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0') return false;
    }

    // 2. Determine effective raw end datetime or fallback to start datetime
    var raw = event.end_date_time || event.end || event.start_date_time || event.start;
    var rawDate = event.end_date || event.date || event.start_date;
    var rawTime = event.end_time || event.start_time;

    if (!raw && rawDate) {
      raw = String(rawDate).trim() + (rawTime ? (' ' + String(rawTime).trim()) : ' 23:59:59');
    }
    if (!raw) return false;

    var str = String(raw).trim();
    // Normalize DD-MM-YYYY to YYYY-MM-DD
    var dmyMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);
    if (dmyMatch) {
      str = dmyMatch[3] + '-' + dmyMatch[2] + '-' + dmyMatch[1] + dmyMatch[4];
    }
    str = str.replace(' ', 'T');
    // Trim sub-second precision to 3 digits
    str = str.replace(/(\.\d{3})\d+/, '$1');

    // If date-only (YYYY-MM-DD), default to end of day if end date, else start of day
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      str += (event.end_date_time || event.end || event.end_date) ? 'T23:59:59' : 'T00:00:00';
    }

    // Check if timezone offset is already present after the time component (Z or [+-]HH:MM)
    var hasTz = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(str);
    if (!hasTz) {
      str += '+05:30';
    }

    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.getTime() < Date.now();
    }
    return Boolean(event.is_past);
  }

  function recapStateHtml(event) {
    if (!isPastEvent(event)) return '';
    if (event.recap) return '<span class="adda-recap-status adda-recap-status--available">Event recap available</span>';
    return '<span class="adda-recap-status adda-recap-status--pending">Recap coming soon</span>';
  }

  function padZero(num) {
    return num < 10 ? '0' + num : '' + num;
  }

  function getCategoryClass(type, title) {
    var t = String(type || '').trim().toLowerCase();
    var titleStr = String(title || '').trim().toLowerCase();
    if (t.indexOf('connection') !== -1 || titleStr.indexOf('connection corner') !== -1 || t.indexOf('workshop') !== -1) {
      return 'cat-connection-corner';
    }
    if (t.indexOf('jam') !== -1) return 'cat-solver-jam';
    if (t.indexOf('custom') !== -1) return 'cat-custom-event';
    if (t.indexOf('adda') !== -1) return 'cat-adda';
    return 'cat-default';
  }

  function getCategoryLabel(type) {
    if (!type) return 'Adda';
    var t = String(type).trim();
    if (t.toLowerCase().indexOf('jam') !== -1) return 'SolverJam';
    if (t.toLowerCase().indexOf('custom') !== -1) return 'Custom Event';
    if (t.toLowerCase().indexOf('adda') !== -1) return 'Adda';
    return t;
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    var trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    var normalized = trimmed.indexOf('T') !== -1 ? trimmed : trimmed.replace(' ', 'T');
    if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized)) {
      normalized += '+05:30';
    }
    var d = new Date(normalized);
    if (isNaN(d.getTime())) return escapeHtml(dateStr);

    var formattedDate = d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    var formattedTime = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return formattedDate + ' &bull; ' + formattedTime;
  }

  function formatShortDateTimeRange(event) {
    if (!event) return '';
    var start = formatShortDate(event.start_date_time);
    var end = formatEventTime(event.end_date_time);
    return end ? start + ' – ' + end : start;
  }

  function formatEventTime(dateStr) {
    if (!dateStr) return '';
    var trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    var normalized = trimmed.indexOf('T') !== -1 ? trimmed : trimmed.replace(' ', 'T');
    if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized)) {
      normalized += '+05:30';
    }
    var d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    var t = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return t.toUpperCase();
  }

  function formatEventTimeRange(event) {
    var start = formatEventTime(event && event.start_date_time);
    var end = formatEventTime(event && event.end_date_time);
    if (!start) return end;
    return end ? start + ' – ' + end : start;
  }

  function formatLongDate(dateKey) {
    var p = dateKey.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatDayPopupDate(dateKey) {
    if (!dateKey) return '';
    var p = dateKey.split('-');
    if (p.length < 3) return dateKey;
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

export {
  getCsrfToken,
  escapeHtml,
  stripHtml,
  isPendingEvent,
  isPastEvent,
  recapStateHtml,
  padZero,
  getCategoryClass,
  getCategoryLabel,
  formatShortDate,
  formatShortDateTimeRange,
  formatEventTime,
  formatEventTimeRange,
  formatLongDate,
  formatDayPopupDate
};
