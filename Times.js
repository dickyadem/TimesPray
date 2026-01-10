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
        displayNextPrayer();
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
                    displayNextPrayer();
                }
            } catch (e) {
                document.getElementById('prayerCard').innerHTML = '<div class="loading">Error</div>';
            }
        }
    };

    xhr.send();
}

function displayNextPrayer() {
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var timings = prayerTimesData.timings;

    var prayers = [
        { name: 'Subuh', time: timings.Fajr },
        { name: 'Dzuhur', time: timings.Dhuhr },
        { name: 'Ashar', time: timings.Asr },
        { name: 'Maghrib', time: timings.Maghrib },
        { name: 'Isya', time: timings.Isha }
    ];

    var nextPrayer = null;

    // Cari waktu shalat berikutnya
    for (var i = 0; i < prayers.length; i++) {
        var parts = prayers[i].time.split(':');
        var prayerMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

        if (currentMinutes < prayerMinutes) {
            nextPrayer = prayers[i];
            break;
        }
    }

    // Jika semua sudah lewat, next adalah Subuh besok
    if (!nextPrayer) {
        nextPrayer = prayers[0];
    }

    // Tampilkan
    var html = '<div class="prayer-label">WAKTU BERIKUTNYA</div>' +
        '<div class="prayer-name">' + nextPrayer.name + '</div>' +
        '<div class="prayer-time">' + nextPrayer.time + '</div>';

    document.getElementById('prayerCard').innerHTML = html;
}

setInterval(function() {
    getPrayerTimes();
}, 3600000);

getPrayerTimes();
