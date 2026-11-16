(function() {
  'use strict';

  var loadingEl = document.getElementById('home-events-loading');
  var gridEl = document.getElementById('home-events-grid');
  var emptyEl = document.getElementById('home-events-empty');

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

  function getCategoryClass(type) {
    if (!type) return 'cat-adda';
    var t = String(type).trim().toLowerCase();
    if (t.indexOf('jam') !== -1) return 'cat-solver-jam';
    if (t.indexOf('custom') !== -1) return 'cat-custom-event';
    if (t.indexOf('adda') !== -1) return 'cat-adda';
    return 'cat-default';
  }

  function getCategoryLabel(type) {
    if (!type) return 'Adda';
    var t = String(type).trim();
    if (t.toLowerCase().indexOf('jam') !== -1) return 'Solver Jam';
    if (t.toLowerCase().indexOf('custom') !== -1) return 'Custom';
    return t;
  }

  function isMeaningful(val) {
    if (val === null || val === undefined) return false;
    var s = String(val).trim();
    if (!s) return false;
    var lower = s.toLowerCase();
    return lower !== 'na' && lower !== 'none' && lower !== 'null' && lower !== 'undefined';
  }

  function formatShortDate(dateStr) {
    if (!isMeaningful(dateStr)) return '';
    var trimmed = String(dateStr).trim();
    var normalized = trimmed.indexOf('T') !== -1 ? trimmed : trimmed.replace(' ', 'T');
    if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized)) {
      normalized += '+05:30';
    }
    var d = new Date(normalized);
    if (isNaN(d.getTime())) return '';

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

  function renderCard(event) {
    var eventIdentifier = event.unique_id || event.name;
    var eventUrl = '/events?event_id=' + encodeURIComponent(eventIdentifier);
    var safeTitle = escapeHtml(event.title || 'Untitled Gathering');
    var rawCity = isMeaningful(event.city) ? String(event.city).trim() : '';
    var safeCity = (rawCity && rawCity.toLowerCase() !== 'neighbourhood') ? escapeHtml(rawCity) : '';

    var coverImg = isMeaningful(event.cover_image) ? String(event.cover_image).trim() : '';
    if (coverImg && !/^https?:\/\//i.test(coverImg) && !coverImg.startsWith('/')) {
      coverImg = '/' + coverImg;
    }
    var placeholderText = safeCity ? 'Adda &bull; ' + safeCity : 'Adda Space';
    var mediaHtml = '';
    if (coverImg) {
      mediaHtml = '<img src="' + escapeHtml(coverImg) + '" alt="' + safeTitle + '" class="adda-card-img" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML=\'<div class=\\\'adda-card-placeholder\\\'>' + placeholderText + '</div>\';" />';
    } else {
      mediaHtml = '<div class="adda-card-placeholder">' + placeholderText + '</div>';
    }

    // Category badge: Strictly omit 'CUSTOM' badge and default badge from homepage cards
    var catBadgeHtml = '';
    if (isMeaningful(event.type)) {
      var rawType = String(event.type).trim();
      if (!/custom/i.test(rawType) && !/adda/i.test(rawType)) {
        var catClass = getCategoryClass(rawType);
        var catLabel = escapeHtml(getCategoryLabel(rawType));
        if (catLabel.toUpperCase() !== 'CUSTOM') {
          catBadgeHtml = '<span class="adda-cat-badge ' + catClass + '" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">' + catLabel + '</span>';
        }
      }
    }

    var metaParts = [];
    if (catBadgeHtml) metaParts.push(catBadgeHtml);
    if (safeCity) {
      metaParts.push('<span class="adda-tag adda-tag-city">' + safeCity + '</span>');
    }
    var dateText = formatShortDate(event.start_date_time);
    if (dateText) {
      metaParts.push('<span style="font-size: 0.8125rem; color: var(--adda-text-muted);">' + dateText + '</span>');
    }

    var metaRowHtml = metaParts.length > 0
      ? '<div class="adda-card-meta">\n' + metaParts.join('\n') + '\n</div>'
      : '';

    var plainDesc = stripHtml(event.description || '');
    var descHtml = isMeaningful(plainDesc)
      ? '<p class="adda-card-desc">' + escapeHtml(plainDesc) + '</p>'
      : '';

    var safeMode = isMeaningful(event.mode) ? escapeHtml(String(event.mode).trim()) : '';
    var venueDetails = isMeaningful(event.venue_details) ? escapeHtml(String(event.venue_details).trim()) : '';
    var footerTextParts = [];
    if (safeMode) footerTextParts.push(safeMode);
    if (venueDetails) footerTextParts.push(venueDetails);
    var footerText = footerTextParts.join(' &bull; ');

    var bodyParts = [
      '<div class="adda-card-body">',
      metaRowHtml,
      '  <h3 class="adda-card-title">',
      '    <a href="' + eventUrl + '">' + safeTitle + '</a>',
      '  </h3>',
      descHtml,
      '  <div class="adda-card-footer">',
      '    <span>' + footerText + '</span>',
      '    <a href="' + eventUrl + '" class="adda-card-action" aria-label="Details for ' + safeTitle + '">Details &rarr;</a>',
      '  </div>',
      '</div>'
    ].filter(Boolean);

    return [
      '<article class="adda-card" data-event-id="' + escapeHtml(eventIdentifier) + '">',
      '  <a href="' + eventUrl + '" class="adda-card-media" aria-label="' + safeTitle + '">',
      '    ' + mediaHtml,
      '  </a>',
      bodyParts.join('\n'),
      '</article>'
    ].join('\n');
  }

  fetch('/api/method/adda_space.api.events.get_adda_events?time_scope=upcoming&event_type=all&page_length=3', {
    headers: { 'Accept': 'application/json' }
  })
  .then(function(res) {
    if (!res.ok) throw new Error('Network error');
    return res.json();
  })
  .then(function(data) {
    var events = (data && data.message && Array.isArray(data.message.events)) ? data.message.events : [];
    if (loadingEl) loadingEl.style.display = 'none';

    if (events.length > 0 && gridEl) {
      gridEl.innerHTML = events.map(renderCard).join('\n');
      gridEl.style.display = 'grid';
      if (emptyEl) emptyEl.style.display = 'none';
    } else {
      if (gridEl) gridEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
    }
  })
  .catch(function(err) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl) gridEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
  });
})();
