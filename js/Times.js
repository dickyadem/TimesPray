var prayerTimesData = null;

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
    document.getElementById('currentTime').textContent = hours + ':' + minutes + ':' + seconds;

    if (prayerTimesData) {
        displayAllPrayerTimes();
    }
}

setInterval(updateCurrentTime, 1000);
updateCurrentTime();

function getPrayerTimes() {
    var xhr = new XMLHttpRequest();
    var url = 'https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11';

    xhr.open('GET', url, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                if (data.code === 200) {
                    prayerTimesData = data.data;
                    var date = data.data.date;
                    document.getElementById('dateDisplay').textContent = date.readable + ' • ' + date.hijri.day + ' ' + date.hijri.month.en + ' ' + date.hijri.year + ' H';
                    displayAllPrayerTimes();
                }
            } catch (e) {
                console.error('Error loading prayer times:', e);
            }
        }
    };

    xhr.send();
}

function displayAllPrayerTimes() {
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var timings = prayerTimesData.timings;

    // Update semua waktu shalat
    document.getElementById('fajrTime').textContent = timings.Fajr;
    document.getElementById('dhuhrTime').textContent = timings.Dhuhr;
    document.getElementById('asrTime').textContent = timings.Asr;
    document.getElementById('maghribTime').textContent = timings.Maghrib;
    document.getElementById('ishaTime').textContent = timings.Isha;

    var prayers = [
        { name: 'Subuh', time: timings.Fajr, boxId: 'fajrBox' },
        { name: 'Dzuhur', time: timings.Dhuhr, boxId: 'dhuhrBox' },
        { name: 'Ashar', time: timings.Asr, boxId: 'asrBox' },
        { name: 'Maghrib', time: timings.Maghrib, boxId: 'maghribBox' },
        { name: 'Isya', time: timings.Isha, boxId: 'ishaBox' }
    ];

    // Reset semua class dan status text
    for (var i = 0; i < prayers.length; i++) {
        var box = document.getElementById(prayers[i].boxId);
        box.className = 'prayer-box';
        var statusElement = box.querySelector('.prayer-status');
        if (statusElement) {
            statusElement.textContent = '';
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

        // Cek apakah waktu sekarang dalam range waktu shalat sampai +20 menit
        if (currentMinutes >= prayerMinutes && currentMinutes < endActiveMinutes) {
            activePrayerIndex = i;
            break;
        }
    }

    // Jika ada waktu shalat yang aktif, cari yang berikutnya untuk next
    if (activePrayerIndex !== -1) {
        // Next adalah waktu shalat setelah yang aktif
        if (activePrayerIndex < prayers.length - 1) {
            nextPrayerIndex = activePrayerIndex + 1;
        } else {
            // Jika yang aktif adalah Isya, next adalah Subuh besok
            nextPrayerIndex = 0;
        }
    } else {
        // Jika tidak ada yang aktif, cari waktu shalat berikutnya
        for (var i = 0; i < prayers.length; i++) {
            var parts = prayers[i].time.split(':');
            var prayerMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

            if (currentMinutes < prayerMinutes) {
                nextPrayerIndex = i;
                break;
            }
        }

        // Jika semua waktu sudah lewat (termasuk +20 menit dari Isya), next adalah Subuh besok
        if (nextPrayerIndex === -1) {
            nextPrayerIndex = 0;
        }
    }

    // Set active class untuk waktu shalat yang sedang berlangsung (dalam 20 menit)
    if (activePrayerIndex !== -1) {
        var activeBox = document.getElementById(prayers[activePrayerIndex].boxId);
        activeBox.className = 'prayer-box active';
        var activeStatus = activeBox.querySelector('.prayer-status');
        if (activeStatus) {
            activeStatus.textContent = 'SEDANG BERLANGSUNG';
        }
    }

    // Set next class untuk waktu shalat berikutnya (yang diperbesar)
    if (nextPrayerIndex !== -1 && activePrayerIndex === -1) {
        // Hanya tampilkan next jika tidak ada yang active
        var nextBox = document.getElementById(prayers[nextPrayerIndex].boxId);
        nextBox.className = 'prayer-box next';
        var nextStatus = nextBox.querySelector('.prayer-status');
        if (nextStatus) {
            nextStatus.textContent = 'BERIKUTNYA';
        }
    }
}

setInterval(function() {
    getPrayerTimes();
}, 3600000);

getPrayerTimes();
