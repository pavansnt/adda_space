import {
  escapeHtml,
  isPendingEvent,
  isPastEvent,
  recapStateHtml,
  padZero,
  getCategoryClass,
  getCategoryLabel,
  formatEventTimeRange,
  formatLongDate
} from './events-utils.js';

export function createCalendarListController(ctx) {
  var state = ctx.state;

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function updateCalHeader() {
    if (ctx.dom.calMonthTitle) ctx.dom.calMonthTitle.textContent = state.monthNames[state.calMonth];
    if (ctx.dom.calYearBadge) ctx.dom.calYearBadge.textContent = state.calYear;
  }

  function fetchCalendarEvents() {
    if (ctx.dom.calLoading) ctx.dom.calLoading.style.display = 'block';
    updateCalHeader();

    var leadDays = getFirstDayOfWeek(state.calYear, state.calMonth);
    var daysInCurMonth = getDaysInMonth(state.calYear, state.calMonth);
    var totalCells = leadDays + daysInCurMonth;
    var trailDays = (7 - (totalCells % 7)) % 7;

    var prevMonthDays = getDaysInMonth(state.calYear, state.calMonth - 1);

    var startDateKey = '';
    var endDateKey = '';

    if (leadDays > 0) {
      var pYear = state.calMonth === 0 ? state.calYear - 1 : state.calYear;
      var pMonth = state.calMonth === 0 ? 11 : state.calMonth - 1;
      var pStartDay = prevMonthDays - leadDays + 1;
      startDateKey = pYear + '-' + padZero(pMonth + 1) + '-' + padZero(pStartDay);
    } else {
      startDateKey = state.calYear + '-' + padZero(state.calMonth + 1) + '-01';
    }

    if (trailDays > 0) {
      var nYear = state.calMonth === 11 ? state.calYear + 1 : state.calYear;
      var nMonth = state.calMonth === 11 ? 0 : state.calMonth + 1;
      endDateKey = nYear + '-' + padZero(nMonth + 1) + '-' + padZero(trailDays);
    } else {
      endDateKey = state.calYear + '-' + padZero(state.calMonth + 1) + '-' + padZero(daysInCurMonth);
    }

    var apiUrl = new URL('/api/method/adda_space.api.events.get_adda_events', window.location.origin);
    apiUrl.searchParams.set('start_date', startDateKey);
    apiUrl.searchParams.set('end_date', endDateKey);
    apiUrl.searchParams.set('event_type', 'all');
    apiUrl.searchParams.set('include_pending', '1');
    if (state.currentCity) {
      apiUrl.searchParams.set('city', state.currentCity);
    }
    apiUrl.searchParams.set('page_length', '100');

    fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Failed to load month gatherings');
      return res.json();
    })
    .then(function(data) {
      if (ctx.dom.calLoading) ctx.dom.calLoading.style.display = 'none';
      var payload = data.message || data;
      var events = payload.events || [];

      state.calEventsByDate = {};
      events.forEach(function(ev) {
        if (ev.start_date_time) {
          var key = String(ev.start_date_time).slice(0, 10);
          if (!state.calEventsByDate[key]) state.calEventsByDate[key] = [];
          state.calEventsByDate[key].push(ev);
        }
      });

      renderCalendarGrid(leadDays, daysInCurMonth, trailDays, prevMonthDays);
      updateDayDrawer(state.selectedDateStr);
    })
    .catch(function() {
      if (ctx.dom.calLoading) ctx.dom.calLoading.style.display = 'none';
      renderCalendarGrid(leadDays, daysInCurMonth, trailDays, prevMonthDays);
      updateDayDrawer(state.selectedDateStr);
    });
  }

  function renderCalendarGrid(leadDays, daysInCurMonth, trailDays, prevMonthDays) {
    if (!ctx.dom.calDaysGrid) return;
    ctx.dom.calDaysGrid.innerHTML = '';

    var pYear = state.calMonth === 0 ? state.calYear - 1 : state.calYear;
    var pMonth = state.calMonth === 0 ? 11 : state.calMonth - 1;
    for (var i = leadDays - 1; i >= 0; i--) {
      var pDay = prevMonthDays - i;
      var pDateKey = pYear + '-' + padZero(pMonth + 1) + '-' + padZero(pDay);
      createCalCell(pDay, pDateKey, true);
    }

    for (var d = 1; d <= daysInCurMonth; d++) {
      var curDateKey = state.calYear + '-' + padZero(state.calMonth + 1) + '-' + padZero(d);
      createCalCell(d, curDateKey, false);
    }

    var nYear = state.calMonth === 11 ? state.calYear + 1 : state.calYear;
    var nMonth = state.calMonth === 11 ? 0 : state.calMonth + 1;
    for (var t = 1; t <= trailDays; t++) {
      var nDateKey = nYear + '-' + padZero(nMonth + 1) + '-' + padZero(t);
      createCalCell(t, nDateKey, true);
    }
  }

  function createCalCell(dayNum, dateKey, isOtherMonth) {
    var cell = document.createElement('div');
    cell.className = 'adda-cal-cell';
    cell.setAttribute('data-date', dateKey);
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');

    if (isOtherMonth) cell.classList.add('is-other-month');
    if (dateKey === state.istDateStr) cell.classList.add('is-today');
    if (dateKey === state.selectedDateStr) cell.classList.add('is-selected');

    var dayEvents = state.calEventsByDate[dateKey] || [];
    cell.setAttribute('aria-label', formatLongDate(dateKey) + ', ' + dayEvents.length + (dayEvents.length === 1 ? ' gathering' : ' gatherings'));

    var topRow = document.createElement('div');
    topRow.className = 'adda-cal-cell-top';

    var numEl = document.createElement('span');
    numEl.className = 'adda-cal-day-num';
    numEl.textContent = dayNum;
    topRow.appendChild(numEl);

    if (dayEvents.length > 0) {
      var countBadge = document.createElement('span');
      countBadge.className = 'adda-cal-badge-count';
      countBadge.textContent = dayEvents.length;
      topRow.appendChild(countBadge);
    }
    cell.appendChild(topRow);

    var mobileIndicators = document.createElement('span');
    mobileIndicators.className = 'adda-cal-mobile-indicators';
    mobileIndicators.setAttribute('aria-hidden', 'true');
    dayEvents.slice(0, 3).forEach(function(ev) {
      var dot = document.createElement('span');
      dot.className = 'adda-cal-mobile-dot ' + getCategoryClass(ev.type);
      mobileIndicators.appendChild(dot);
    });
    if (dayEvents.length > 3) {
      var overflowCount = document.createElement('span');
      overflowCount.className = 'adda-cal-mobile-overflow';
      overflowCount.textContent = '+' + (dayEvents.length - 3);
      mobileIndicators.appendChild(overflowCount);
    }
    cell.appendChild(mobileIndicators);

    var pillsList = document.createElement('div');
    pillsList.className = 'adda-cal-events-list';

    var maxPills = 3;
    var displayEvents = dayEvents.slice(0, maxPills);

    displayEvents.forEach(function(ev) {
      var pill = document.createElement('a');
      var isPending = isPendingEvent(ev);
      var catClass = isPending ? 'cat-pending-event' : getCategoryClass(ev.type);
      pill.className = 'adda-cal-event-pill ' + catClass;
      if (isPending) {
        pill.classList.add('is-pending-event');
        pill.setAttribute('data-status', 'Pending Review');
      }
      pill.setAttribute('data-category', ev.type || 'Adda');
      pill.href = '#';
      pill.title = (ev.title || 'Gathering') + ' (' + (ev.city || '') + ')' + (isPending ? ' - Pending confirmation' : '');
      if (isPastEvent(ev)) {
        pill.classList.add('is-past-event');
        pill.setAttribute('aria-label', (ev.title || 'Gathering') + (ev.recap ? ' — event recap available' : ' — past gathering'));
      }

      var timeSpan = document.createElement('span');
      timeSpan.className = 'adda-cal-event-time';
      timeSpan.textContent = formatEventTimeRange(ev);

      var titleSpan = document.createElement('span');
      titleSpan.className = 'adda-cal-event-title-text';
      titleSpan.textContent = isPending ? ((ev.title || 'Gathering') + ' · Pending') : (ev.title || 'Gathering');

      pill.appendChild(timeSpan);
      pill.appendChild(titleSpan);
      if (isPastEvent(ev) && ev.recap) {
        var recapMark = document.createElement('span');
        recapMark.className = 'adda-cal-recap-mark';
        recapMark.textContent = 'Recap';
        pill.appendChild(recapMark);
      }

      pill.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        ctx.openEventDetailModal(ev);
      });

      pillsList.appendChild(pill);
    });

    if (dayEvents.length > maxPills) {
      var morePill = document.createElement('div');
      morePill.className = 'adda-cal-more-pill';
      morePill.textContent = '+' + (dayEvents.length - maxPills) + ' more';
      morePill.setAttribute('role', 'button');
      morePill.setAttribute('tabindex', '0');
      morePill.setAttribute('aria-label', '+' + (dayEvents.length - maxPills) + ' more gatherings on ' + formatLongDate(dateKey));
      morePill.addEventListener('click', function(e) {
        e.stopPropagation();
        selectCalendarDay(dateKey);
        ctx.openDayEventsPopup(dateKey);
      });
      morePill.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          selectCalendarDay(dateKey);
          ctx.openDayEventsPopup(dateKey);
        }
      });
      pillsList.appendChild(morePill);
    }

    cell.appendChild(pillsList);

    // Free date click handler -> Opens Host Modal with date pre-selected
    cell.addEventListener('click', function(e) {
      if (e.target.closest('.adda-cal-event-pill') || e.target.closest('.adda-cal-more-pill')) {
        return;
      }
      selectCalendarDay(dateKey);
      if (dateKey >= state.istDateStr) {
        ctx.openHostModal(dateKey);
      } else {
        if (window.matchMedia('(max-width: 640px)').matches) {
          openMobileDayDrawer();
        }
        ctx.showToast('This date is in the past. To host an Adda, please select an upcoming date.');
      }
    });

    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCalendarDay(dateKey);
        if (dateKey >= state.istDateStr) {
          ctx.openHostModal(dateKey);
        } else {
          if (window.matchMedia('(max-width: 640px)').matches) {
            openMobileDayDrawer();
          }
          ctx.showToast('This date is in the past. To host an Adda, please select an upcoming date.');
        }
      }
    });

    ctx.dom.calDaysGrid.appendChild(cell);
  }

  function selectCalendarDay(dateKey) {
    state.selectedDateStr = dateKey;
    var cells = ctx.dom.calDaysGrid.querySelectorAll('.adda-cal-cell');
    cells.forEach(function(c) {
      if (c.getAttribute('data-date') === dateKey) c.classList.add('is-selected');
      else c.classList.remove('is-selected');
    });
    updateDayDrawer(dateKey);
  }

  function openDayDrawer(scroll) {
    if (!ctx.dom.calDayDrawer) return;
    ctx.dom.calDayDrawer.style.display = 'block';
    ctx.dom.calDayDrawer.classList.remove('is-open');
    window.requestAnimationFrame(function() {
      ctx.dom.calDayDrawer.classList.add('is-open');
      if (scroll) {
        ctx.dom.calDayDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function openMobileDayDrawer() {
    openDayDrawer(true);
  }

  function updateDayDrawer(dateKey) {
    if (!ctx.dom.calDayDrawer) return;
    ctx.dom.calDayDrawer.style.display = 'block';
    ctx.dom.calDayDrawer.classList.remove('is-open');

    if (ctx.dom.calDrawerTitle) ctx.dom.calDrawerTitle.textContent = formatLongDate(dateKey);
    if (ctx.dom.calDrawerSubtitle) {
      var cityContext = state.currentCity ? (' in ' + state.currentCity) : ' across all Adda locations';
      ctx.dom.calDrawerSubtitle.textContent = 'Scheduled gatherings' + cityContext;
    }

    var dayEvents = state.calEventsByDate[dateKey] || [];
    if (ctx.dom.calDrawerCount) {
      ctx.dom.calDrawerCount.textContent = dayEvents.length + (dayEvents.length === 1 ? ' Gathering' : ' Gatherings');
    }

    if (ctx.dom.calDrawerCards) ctx.dom.calDrawerCards.innerHTML = '';

    if (dayEvents.length === 0) {
      if (ctx.dom.calDrawerEmpty) ctx.dom.calDrawerEmpty.style.display = 'block';
      if (ctx.dom.calDrawerCards) ctx.dom.calDrawerCards.style.display = 'none';
    } else {
      if (ctx.dom.calDrawerEmpty) ctx.dom.calDrawerEmpty.style.display = 'none';
      if (ctx.dom.calDrawerCards) {
        ctx.dom.calDrawerCards.style.display = 'grid';
        dayEvents.forEach(function(ev) {
          var safeTitle = escapeHtml(ev.title || 'Untitled Gathering');
          var timeStr = formatEventTimeRange(ev);
          var roomText = ev.room_name ? ' &bull; ' + escapeHtml(ev.room_name) : '';
          var venueText = ev.venue_details ? ' &bull; ' + escapeHtml(ev.venue_details) : '';
          var cityText = escapeHtml(ev.city || 'Neighbourhood');
          var isPending = isPendingEvent(ev);
          var catClass = isPending ? 'cat-pending-event' : getCategoryClass(ev.type);

          var isPast = isPastEvent(ev);
          var card = document.createElement('div');
          card.className = 'adda-cal-drawer-card' + (isPast ? ' is-past-event' : '');
          card.style.cursor = 'pointer';
          card.innerHTML = [
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">',
            '  <span class="adda-cat-badge ' + catClass + '">' + escapeHtml(isPending ? 'Pending Review' : getCategoryLabel(ev.type)) + '</span>',
            '  <span style="font-size: 0.75rem; font-weight: 700; color: var(--adda-green);">' + timeStr + '</span>',
            '</div>',
            '<h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--adda-navy);">' + (isPending ? (safeTitle + ' · Pending') : safeTitle) + '</h4>',
            '  ' + recapStateHtml(ev),
            '<div style="font-size: 0.8125rem; color: var(--adda-text-muted); margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">',
            '  <span>' + cityText + roomText + venueText + '</span>',
            '</div>'
          ].join('\n');

          card.addEventListener('click', function(e) {
            e.preventDefault();
            ctx.openEventDetailModal(ev);
          });

          ctx.dom.calDrawerCards.appendChild(card);
        });
      }
    }

    var calDrawerFooter = document.getElementById('cal-drawer-footer');
    if (calDrawerFooter) {
      if (dateKey >= state.istDateStr && dayEvents.length > 0) {
        calDrawerFooter.style.display = 'flex';
      } else {
        calDrawerFooter.style.display = 'none';
      }
    }
  }

  // ========================================================================
  // LIST VIEW LOGIC
  // ========================================================================

  function setListUIState(state, message) {
    if (ctx.dom.loadingState) ctx.dom.loadingState.style.display = (state === 'loading') ? 'grid' : 'none';
    if (ctx.dom.gridContainer) ctx.dom.gridContainer.style.display = (state === 'results') ? 'block' : 'none';
    if (ctx.dom.emptyState) ctx.dom.emptyState.style.display = (state === 'empty') ? 'block' : 'none';
    if (ctx.dom.errorState) ctx.dom.errorState.style.display = (state === 'error') ? 'block' : 'none';
    if (ctx.dom.statusBar) ctx.dom.statusBar.style.display = 'none';

    if (state === 'error' && message && ctx.dom.errorMessage) {
      ctx.dom.errorMessage.textContent = message;
    }
  }

  function renderListCard(event) {
    var eventIdentifier = event.unique_id || event.name;
    var safeTitle = escapeHtml(event.title || 'Untitled Gathering');
    var safeCity = escapeHtml(event.city || 'Neighbourhood');
    var plainDesc = stripHtml(event.description || '');
    var safeDesc = escapeHtml(plainDesc);
    var isPending = isPendingEvent(event);
    var catClass = isPending ? 'cat-pending-event is-pending-card' : getCategoryClass(event.type, event.title);
    var isPast = isPastEvent(event);
    var pastClass = isPast ? ' is-past-event' : '';
    var timeText = formatEventTime(event.start_date_time);

    var mediaHtml = '';
    var cardImg = event.cover_image || event.image || '';
    if (cardImg && typeof cardImg === 'string' && cardImg.trim()) {
      var cImgStr = cardImg.trim();
      var cLower = cImgStr.toLowerCase();
      if (cLower !== 'none' && cLower !== 'null' && cLower !== 'undefined') {
        if (cImgStr.startsWith('/private/files/')) {
          cImgStr = cImgStr.replace('/private/files/', '/files/');
        }
        mediaHtml = '  <div class="adda-list-card-poster" aria-hidden="true">' +
          '<img src="' + escapeHtml(cImgStr) + '" alt="' + safeTitle + '" class="adda-card-img" loading="lazy" onerror="var p=this.closest(\'.adda-list-card-poster\');if(p)p.style.display=\'none\';" />' +
          '</div>';
      }
    }

    return [
      '<article class="adda-list-card ' + catClass + pastClass + '" data-event-id="' + escapeHtml(eventIdentifier) + '" tabindex="0" role="button" aria-label="View details for ' + safeTitle + '">',
      '  <span class="adda-list-card-time">' + timeText + '</span>',
      mediaHtml,
      '  <div class="adda-list-card-content">',
      '    <h3 class="adda-list-card-title">' + (isPending ? (safeTitle + ' · Pending') : safeTitle) + '</h3>',
      '    <div class="adda-list-card-meta"><span>' + safeCity + '</span>' + (isPending ? ' · Pending Review' : '') + recapStateHtml(event) + '</div>',
      (safeDesc ? '    <p class="adda-list-card-description">' + safeDesc + '</p>' : ''),
      '  </div>',
      '  <div class="adda-list-card-action">',
      '    <span class="adda-list-card-chevron">View &rsaquo;</span>',
      '  </div>',
      '</article>'
    ].filter(Boolean).join('\n');
  }

  function getListDateKey(event) {
    var dateValue = String(event.start_date_time || '').trim().replace('T', ' ');
    return dateValue.slice(0, 10) || 'date-tbd';
  }

  function formatListDateHeading(dateKey) {
    if (!dateKey || dateKey === 'date-tbd') return 'DATE TO BE ANNOUNCED';
    if (dateKey === state.istDateStr) return 'TODAY';
    var tomorrow = new Date(state.istDateStr + 'T12:00:00+05:30');
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowKey = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (dateKey === tomorrowKey) return 'TOMORROW';
    var dateObj = new Date(dateKey + 'T12:00:00+05:30');
    if (isNaN(dateObj.getTime())) return escapeHtml(dateKey);
    var dateOptions = { timeZone: 'Asia/Kolkata' };
    var weekday = dateObj.toLocaleDateString('en-IN', Object.assign({ weekday: 'short' }, dateOptions));
    var month = dateObj.toLocaleDateString('en-IN', Object.assign({ month: 'short' }, dateOptions));
    var day = dateObj.toLocaleDateString('en-IN', Object.assign({ day: 'numeric' }, dateOptions));
    return (weekday + ' · ' + month + ' ' + day).toUpperCase();
  }

  function renderListDateGroups(events) {
    var groups = [];
    events.forEach(function(event) {
      var key = getListDateKey(event);
      var group = groups.find(function(item) { return item.key === key; });
      if (!group) {
        group = { key: key, events: [] };
        groups.push(group);
      }
      group.events.push(event);
    });

    return groups.map(function(group) {
      var eventWord = group.events.length === 1 ? 'event' : 'events';
      return [
        '<section class="adda-list-day-group" data-date="' + escapeHtml(group.key) + '" aria-label="' + formatListDateHeading(group.key) + '">',
        '  <header class="adda-list-day-heading"><h2>' + formatListDateHeading(group.key) + '</h2><span>' + group.events.length + ' ' + eventWord + '</span></header>',
        '  <div class="adda-list-day-cards">' + group.events.map(renderListCard).join('') + '</div>',
        '</section>'
      ].join('');
    }).join('');
  }

  function isCurrentListMonth() {
    return state.calYear === state.todayYear && state.calMonth === state.todayMonth;
  }

  function scrollListToDate(dateKey) {
    if (!ctx.dom.gridContainer || !dateKey) return;
    var heading = ctx.dom.gridContainer.querySelector('[data-date="' + dateKey + '"] .adda-list-day-heading');
    if (!heading) return;
    // Wait until the visible list has completed layout before measuring the heading.
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(function() {
        var headingTop = heading.getBoundingClientRect().top;
        var stickyBottom = 0;
        document.querySelectorAll('header, #cal-toolbar').forEach(function(el) {
          var style = window.getComputedStyle(el);
          if (style.position !== 'sticky' && style.position !== 'fixed') return;
          var rect = el.getBoundingClientRect();
          if (rect.height && rect.top <= 1 && rect.bottom > stickyBottom) stickyBottom = rect.bottom;
        });
        window.scrollTo({ top: window.pageYOffset + headingTop - stickyBottom - 12, behavior: 'smooth' });
      });
    });
  }

  state.showPastEvents = false;

  function fetchListEvents() {
    setListUIState('loading');

    var apiUrl = new URL('/api/method/adda_space.api.events.get_adda_events', window.location.origin);
    var monthStart = state.calYear + '-' + padZero(state.calMonth + 1) + '-01';
    var monthEnd = state.calYear + '-' + padZero(state.calMonth + 1) + '-' + padZero(getDaysInMonth(state.calYear, state.calMonth));
    apiUrl.searchParams.set('start_date', monthStart);
    apiUrl.searchParams.set('end_date', monthEnd);
    apiUrl.searchParams.set('event_type', 'all');
    apiUrl.searchParams.set('include_pending', '1');
    if (state.currentCity) {
      apiUrl.searchParams.set('city', state.currentCity);
    }
    apiUrl.searchParams.set('start', '0');
    apiUrl.searchParams.set('page_length', '100');

    fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Server returned status ' + res.status);
      return res.json();
    })
    .then(function(data) {
      var payload = data.message || data;
      var events = payload.events || [];
      var pastEvents = [];
      var visibleEvents = events;
      if (isCurrentListMonth()) {
        pastEvents = events.filter(function(ev) { return getListDateKey(ev) < state.istDateStr; });
        visibleEvents = events.filter(function(ev) { return getListDateKey(ev) >= state.istDateStr; });
      }
      if (events.length === 0) {
        var cityContext = state.currentCity ? (' in ' + state.currentCity) : '';
        ctx.dom.emptyStateTitle.textContent = 'No gatherings' + cityContext;
        ctx.dom.emptyStateDesc.textContent = 'There are currently no Adda gatherings scheduled' + (state.currentCity ? (' for ' + state.currentCity) : '') + '. Explore another city or propose a community gathering.';
        setListUIState('empty');
      } else {
        ctx.dom.gridContainer.innerHTML = renderListDateGroups(visibleEvents);
        if (isCurrentListMonth() && visibleEvents.length === 0 && pastEvents.length) {
          ctx.dom.gridContainer.insertAdjacentHTML('afterbegin', '<p class="adda-list-upcoming-empty">No upcoming gatherings this month.</p>');
        }
        if (pastEvents.length) {
          pastEvents.sort(function(a, b) {
            return String(a.start_date_time || '').localeCompare(String(b.start_date_time || ''));
          });
          var monthLabel = state.monthNames[state.calMonth];
          var pastEventCount = pastEvents.length;
          var pastCountText = pastEventCount + ' ' + (pastEventCount === 1 ? 'event' : 'events') + ' in ' + monthLabel;
          var pastSection = document.createElement('section');
          pastSection.className = 'adda-list-past-events' + (state.showPastEvents ? ' is-expanded' : '');
          pastSection.innerHTML = '<button type="button" class="adda-list-past-toggle" aria-expanded="' + (state.showPastEvents ? 'true' : 'false') + '" aria-controls="adda-list-past-content"><span class="adda-list-past-toggle-copy"><span class="adda-list-past-title">' + (state.showPastEvents ? 'Past events · ' + monthLabel : 'Explore past events') + '</span><span class="adda-list-past-summary">' + pastCountText + '</span></span><span class="adda-list-past-arrow" aria-hidden="true"></span></button><div class="adda-list-past-content" id="adda-list-past-content"><div class="adda-list-past-content-inner">' + renderListDateGroups(pastEvents) + '</div></div>';
          ctx.dom.gridContainer.insertBefore(pastSection, ctx.dom.gridContainer.firstChild);
          var pastContent = pastSection.querySelector('.adda-list-past-content');
          if (state.showPastEvents) pastContent.style.maxHeight = pastContent.scrollHeight + 'px';
          pastSection.querySelector('.adda-list-past-toggle').addEventListener('click', function() {
            state.showPastEvents = !state.showPastEvents;
            pastSection.classList.toggle('is-expanded', state.showPastEvents);
            this.setAttribute('aria-expanded', state.showPastEvents ? 'true' : 'false');
            pastSection.querySelector('.adda-list-past-title').textContent = state.showPastEvents ? 'Past events · ' + monthLabel : 'Explore past events';
            if (state.showPastEvents) {
              pastContent.style.maxHeight = pastContent.scrollHeight + 'px';
            } else {
              pastContent.style.maxHeight = pastContent.scrollHeight + 'px';
              window.requestAnimationFrame(function() { pastContent.style.maxHeight = '0px'; });
            }
          });
          pastContent.addEventListener('transitionend', function(event) {
            if (event.propertyName === 'max-height' && state.showPastEvents) pastContent.style.maxHeight = 'none';
          });
        }

        // Attach modal trigger to list cards
        ctx.dom.gridContainer.querySelectorAll('.adda-list-card').forEach(function(cardEl) {
          var eventId = cardEl.getAttribute('data-event-id');
          var ev = events.find(function(e) { return (e.unique_id || e.name) === eventId; });
          cardEl.addEventListener('click', function(e) {
            e.preventDefault();
            if (ev) ctx.openEventDetailModal(ev);
          });
          cardEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (ev) ctx.openEventDetailModal(ev);
            }
          });
        });

        var cityLabel = state.currentCity || 'all cities';
        ctx.dom.countLabel.textContent = 'Showing ' + visibleEvents.length + ' gathering' + (visibleEvents.length === 1 ? '' : 's') + ' across ' + cityLabel + '.';
        setListUIState('results');
        var targetDate = isCurrentListMonth() ? state.istDateStr : (state.calYear > state.todayYear || (state.calYear === state.todayYear && state.calMonth > state.todayMonth) ? monthStart : state.selectedDateStr);
        scrollListToDate(targetDate);
      }
    })
    .catch(function(err) {
      setListUIState('error', err.message || 'Unable to connect to Adda Space events service.');
    });
  }

  // ========================================================================
  // VIEW SWITCHING & FILTERS
  // ========================================================================

  function renderCityFilterButtons(cities) {
    if (!Array.isArray(cities)) return;

    if (ctx.dom.cityFilterSelect) {
      ctx.dom.cityFilterSelect.innerHTML = '<option value="" data-city="">All cities</option>';
      cities.forEach(function(cityName) {
        var opt = document.createElement('option');
        opt.value = cityName;
        opt.setAttribute('data-city', cityName);
        opt.textContent = cityName;
        if (state.currentCity && state.currentCity.toLowerCase() === cityName.toLowerCase()) {
          opt.selected = true;
        }
        ctx.dom.cityFilterSelect.appendChild(opt);
      });
    }

    updateFilterUI();
  }

  function updateFilterUI() {
    if (ctx.dom.cityFilterSelect) {
      ctx.dom.cityFilterSelect.value = state.currentCity || '';
    }

    if (ctx.dom.viewCalendarBtn && ctx.dom.viewListBtn) {
      var calendarNavGroup = document.querySelector('#cal-toolbar .adda-cal-nav-group');
      if (calendarNavGroup) calendarNavGroup.style.display = 'flex';
      if (ctx.dom.calTodayBtn) ctx.dom.calTodayBtn.style.display = '';
      if (state.currentView === 'calendar') {
        ctx.dom.viewCalendarBtn.classList.add('active');
        ctx.dom.viewCalendarBtn.setAttribute('aria-pressed', 'true');
        ctx.dom.viewListBtn.classList.remove('active');
        ctx.dom.viewListBtn.setAttribute('aria-pressed', 'false');
        if (ctx.dom.calendarSection) ctx.dom.calendarSection.style.display = 'block';
        if (ctx.dom.listSection) ctx.dom.listSection.style.display = 'none';
      } else {
        ctx.dom.viewListBtn.classList.add('active');
        ctx.dom.viewListBtn.setAttribute('aria-pressed', 'true');
        ctx.dom.viewCalendarBtn.classList.remove('active');
        ctx.dom.viewCalendarBtn.setAttribute('aria-pressed', 'false');
        if (ctx.dom.calendarSection) ctx.dom.calendarSection.style.display = 'none';
        if (ctx.dom.listSection) ctx.dom.listSection.style.display = 'block';
      }
    }

  }

  function syncUrlParams() {
    var url = new URL(window.location.href);
    if (state.currentCity) url.searchParams.set('city', state.currentCity);
    else url.searchParams.delete('city');

    if (state.currentView) url.searchParams.set('view', state.currentView);

    url.searchParams.delete('scope');

    window.history.replaceState({}, '', url.toString());
  }

  function switchView(viewName) {
    if (state.currentView === viewName) return;
    state.currentView = viewName;
    updateFilterUI();
    syncUrlParams();

    if (state.currentView === 'calendar') {
      fetchCalendarEvents();
    } else {
      fetchListEvents();
    }
  }

  if (ctx.dom.viewCalendarBtn) ctx.dom.viewCalendarBtn.addEventListener('click', function() { switchView('calendar'); });
  if (ctx.dom.viewListBtn) ctx.dom.viewListBtn.addEventListener('click', function() { switchView('list'); });

  if (ctx.dom.calPrevBtn) {
    ctx.dom.calPrevBtn.addEventListener('click', function() {
      if (state.calMonth === 0) { state.calMonth = 11; state.calYear--; }
      else { state.calMonth--; }
      updateCalHeader();
      if (state.currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (ctx.dom.calNextBtn) {
    ctx.dom.calNextBtn.addEventListener('click', function() {
      if (state.calMonth === 11) { state.calMonth = 0; state.calYear++; }
      else { state.calMonth++; }
      updateCalHeader();
      if (state.currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (ctx.dom.calTodayBtn) {
    ctx.dom.calTodayBtn.addEventListener('click', function() {
      state.calYear = state.todayYear;
      state.calMonth = state.todayMonth;
      state.selectedDateStr = state.istDateStr;
      state.showPastEvents = false;
      updateCalHeader();
      if (state.currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (ctx.dom.cityFilterSelect) {
    ctx.dom.cityFilterSelect.addEventListener('change', function() {
      state.currentCity = this.value;
      updateFilterUI();
      syncUrlParams();
      if (state.currentView === 'calendar') fetchCalendarEvents();
      else fetchListEvents();
    });
  }

  if (ctx.dom.resetBtn) {
    ctx.dom.resetBtn.addEventListener('click', function() {
      state.currentCity = '';
      updateFilterUI();
      syncUrlParams();
      fetchListEvents();
    });
  }

  if (ctx.dom.retryBtn) ctx.dom.retryBtn.addEventListener('click', fetchListEvents);
  return {
    fetchCalendarEvents: fetchCalendarEvents,
    fetchListEvents: fetchListEvents,
    updateFilterUI: updateFilterUI,
    renderCityFilterButtons: renderCityFilterButtons,
    syncUrlParams: syncUrlParams
  };
}
