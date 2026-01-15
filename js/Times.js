var prayerTimesData = null;

// Data fallback jika API gagal (Jakarta)
var fallbackData = {
    timings: {
        Fajr: '04:37',
        Dhuhr: '11:57',
        Asr: '15:17',
        Maghrib: '18:02',
        Isha: '19:12'
    },
    date: {
        readable: '15 Jan 2025',
        hijri: { day: '15', month: { en: 'Rajab' }, year: '1446' }
    }
};

// Console polyfill untuk IE8
if (typeof console === 'undefined') {
    window.console = { log: function () { }, error: function () { }, warn: function () { } };
}

// Helper function untuk IE8 compatibility
function setText(el, text) {
    if (!el) return;
    if ('textContent' in el) {
        el.textContent = text;
    } else {
        el.innerText = text;
    }
}

function padLeft(str, length, char) {
    str = String(str);
    while (str.length < length) {
        str = char + str;
    }
    return str;
}

function updateCurrentTime() {
    var now = new Date();
    var hours = padLeft(now.getHours(), 2, '0');
    var minutes = padLeft(now.getMinutes(), 2, '0');
    var seconds = padLeft(now.getSeconds(), 2, '0');
    setText(document.getElementById('currentTime'), hours + ':' + minutes + ':' + seconds);

    if (prayerTimesData) {
        displayAllPrayerTimes();
    }
}

setInterval(updateCurrentTime, 1000);
updateCurrentTime();

function useFallbackData(reason) {
    prayerTimesData = fallbackData;
    var date = fallbackData.date;
    setText(document.getElementById('dateDisplay'), date.readable + ' - ' + date.hijri.day + ' ' + date.hijri.month.en + ' ' + date.hijri.year + ' H (' + reason + ')');
    displayAllPrayerTimes();
}

function getPrayerTimes() {
    // Cek jika dibuka dari file:// (akan error CORS)
    if (window.location.protocol === 'file:') {
        useFallbackData('Offline mode (file://)');
        return;
    }

    var xhr = new XMLHttpRequest();
    var url = 'http://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11';

    xhr.open('GET', url, true);
    xhr.timeout = 10000; // 10 detik timeout

    xhr.onerror = function () {
        console.error('Network error');
        useFallbackData('Offline');
    };

    xhr.ontimeout = function () {
        console.error('Request timeout');
        useFallbackData('Timeout');
    };

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.code === 200) {
                        prayerTimesData = data.data;
                        var date = data.data.date;
                        setText(document.getElementById('dateDisplay'), date.readable + ' - ' + date.hijri.day + ' ' + date.hijri.month.en + ' ' + date.hijri.year + ' H');
                        displayAllPrayerTimes();
                    }
                } catch (e) {
                    console.error('Error parsing prayer times:', e);
                    useFallbackData('Parse error');
                }
            } else {
                console.error('API request failed:', xhr.status);
                useFallbackData('API error');
            }
        }
    };

    xhr.send();
}

function displayAllPrayerTimes() {
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var timings = prayerTimesData.timings;

    // Update semua waktu shalat di kotak kecil
    setText(document.getElementById('fajrTime'), timings.Fajr);
    setText(document.getElementById('dhuhrTime'), timings.Dhuhr);
    setText(document.getElementById('asrTime'), timings.Asr);
    setText(document.getElementById('maghribTime'), timings.Maghrib);
    setText(document.getElementById('ishaTime'), timings.Isha);

    var prayers = [
        { name: 'Subuh', time: timings.Fajr, boxId: 'fajrBox' },
        { name: 'Dzuhur', time: timings.Dhuhr, boxId: 'dhuhrBox' },
        { name: 'Ashar', time: timings.Asr, boxId: 'asrBox' },
        { name: 'Maghrib', time: timings.Maghrib, boxId: 'maghribBox' },
        { name: 'Isya', time: timings.Isha, boxId: 'ishaBox' }
    ];

    // Reset semua class di kotak kecil
    for (var i = 0; i < prayers.length; i++) {
        var box = document.getElementById(prayers[i].boxId);
        if (box) {
            box.className = 'prayer-item';
        }
    }

    var activePrayerIndex = -1;
    var nextPrayerIndex = -1;
    var ACTIVE_DURATION = 20; // 20 menit

    // Cari waktu shalat yang sedang aktif (dalam 20 menit pertama)
    for (var i = 0; i < prayers.length; i++) {
        var parts = prayers[i].time.split(':');
        var prayerMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        var endActiveMinutes = prayerMinutes + ACTIVE_DURATION;

        if (currentMinutes >= prayerMinutes && currentMinutes < endActiveMinutes) {
            activePrayerIndex = i;
            break;
        }
    }

    // Cari waktu shalat berikutnya
    if (activePrayerIndex !== -1) {
        if (activePrayerIndex < prayers.length - 1) {
            nextPrayerIndex = activePrayerIndex + 1;
        } else {
            nextPrayerIndex = 0;
        }
    } else {
        for (var i = 0; i < prayers.length; i++) {
            var parts = prayers[i].time.split(':');
            var prayerMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

            if (currentMinutes < prayerMinutes) {
                nextPrayerIndex = i;
                break;
            }
        }

        if (nextPrayerIndex === -1) {
            nextPrayerIndex = 0;
        }
    }

    // Update kotak besar (highlight box)
    var highlightBox = document.getElementById('highlightBox');
    var highlightStatus = document.getElementById('highlightStatus');
    var highlightName = document.getElementById('highlightName');
    var highlightTime = document.getElementById('highlightTime');

    if (activePrayerIndex !== -1) {
        // Ada shalat yang sedang berlangsung
        highlightBox.className = 'highlight-box active';
        setText(highlightStatus, 'SEDANG BERLANGSUNG');
        setText(highlightName, prayers[activePrayerIndex].name);
        setText(highlightTime, prayers[activePrayerIndex].time);

        // Tandai di kotak kecil
        var activeItem = document.getElementById(prayers[activePrayerIndex].boxId);
        if (activeItem) {
            activeItem.className = 'prayer-item active';
        }
    } else {
        // Tampilkan shalat berikutnya
        highlightBox.className = 'highlight-box';
        setText(highlightStatus, 'BERIKUTNYA');
        setText(highlightName, prayers[nextPrayerIndex].name);
        setText(highlightTime, prayers[nextPrayerIndex].time);

        // Tandai di kotak kecil
        var nextItem = document.getElementById(prayers[nextPrayerIndex].boxId);
        if (nextItem) {
            nextItem.className = 'prayer-item next';
        }
    }
}

setInterval(function () {
    getPrayerTimes();
}, 3600000);

getPrayerTimes();
