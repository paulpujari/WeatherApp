function dateFormat(timeStamp, includeDate = false) {
    const date = new Date(timeStamp * 1000);
    if (includeDate) {
        return date.toLocaleString();
    } else {
        const options = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true
        };
        return date.toLocaleTimeString('en-US', options);
    }
}

async function fetchData() {
    try {
        let cityName = document.getElementsByClassName('inputfield')[0].value;
        if (!cityName) {
            alert("Please enter a city name");
            return;
        }

        // Fetching current weather data
        let requestData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=0e19fa61d7b59264f1636fb3185e654d&units=metric`);
        if (!requestData.ok) {
            throw new Error("City not found");
        }
        let formattedData = await requestData.json();
        
        // Update main weather info
        $('#cityName')[0].innerText = formattedData.name;
        $('#cityTemp')[0].innerText = Math.round(formattedData.main.temp);
        $('#skyDesc')[0].innerText = formattedData.weather[0].description.charAt(0).toUpperCase() + formattedData.weather[0].description.slice(1);

        // Update date and time
        let properDate = dateFormat(formattedData.dt, true);
        let date = properDate.split(',')[0];
        let time = properDate.split(',')[1];
        $('#date')[0].innerText = date;
        $('#time')[0].innerText = time;

        // Update sunrise and sunset
        $('#sunriseTime')[0].innerText = dateFormat(formattedData.sys.sunrise);
        $('#sunsetTime')[0].innerText = dateFormat(formattedData.sys.sunset);

        // Update extra metrics
        $('#windSpeed')[0].innerText = formattedData.wind.speed + ' m/s';
        $('#humidity')[0].innerText = formattedData.main.humidity + ' %';
        $('#pressure')[0].innerText = formattedData.main.pressure + ' hPa';
        $('#visibility')[0].innerText = (formattedData.visibility / 1000).toFixed(1) + ' km';

        // Fetch additional data
        let lat = formattedData.coord.lat;
        let lon = formattedData.coord.lon;
        await fetchAQIData(lat, lon);
        await nextFiveDays(lat, lon);
        await todayTemps(lat, lon);

    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error: " + error.message);
    }
}

async function fetchAQIData(lat, lon) {
    try {
        let fetchAQIData = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=0e19fa61d7b59264f1636fb3185e654d`);
        let formattedData = await fetchAQIData.json();
        let list = formattedData.list[0].components;

        $('#no2')[0].innerText = 'NO2';
        $('#no2Value')[0].innerText = list.no2.toFixed(2);
        $('#o3')[0].innerText = 'O3';
        $('#o3Value')[0].innerText = list.o3.toFixed(2);
        $('#co')[0].innerText = 'CO';
        $('#coValue')[0].innerText = list.co.toFixed(2);
        $('#so2')[0].innerText = 'SO2';
        $('#so2Value')[0].innerText = list.so2.toFixed(2);

    } catch (error) {
        console.error("Error fetching AQI data:", error);
    }
}

async function nextFiveDays(lat, lon) {
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=0e19fa61d7b59264f1636fb3185e654d&units=metric`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch forecast data");
        }
        const data = await response.json();

        let dailyForecasts = {};
        const iconMap = {
            '01d': 'sun.png', '01n': 'moon.png',
            '02d': 'partly-cloudy.png', '02n': 'partly-cloudy-night.png',
            '03d': 'cloud.png', '03n': 'cloud.png',
            '04d': 'cloudy.png', '04n': 'cloudy.png',
            '09d': 'rain.png', '09n': 'rain.png',
            '10d': 'rain.png', '10n': 'rain.png',
            '11d': 'thunderstorm.png', '11n': 'thunderstorm.png',
            '13d': 'snow.png', '13n': 'snow.png',
            '50d': 'mist.png', '50n': 'mist.png'
        };

        // Extract unique daily data
        data.list.forEach(item => {
            let date = item.dt_txt.split(" ")[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temp: Math.round(item.main.temp),
                    icon: iconMap[item.weather[0].icon] || 'cloud.png',
                    day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
                    date: new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                };
            }
        });

        // Get first 5 unique days
        let forecastHtml = "";
        Object.keys(dailyForecasts).slice(0, 5).forEach(date => {
            let forecast = dailyForecasts[date];
            forecastHtml += `
                <div class="foreCastRow d-flex align-items-center justify-content-between">
                    <div class="d-flex gap-1 align-items-center">
                        <img src="./Assets/${forecast.icon}" alt="" width="35px">
                        <h6 class="m-0">${forecast.temp} &deg;C</h6>
                    </div>
                    <h6 class="m-0">${forecast.day}</h6>
                    <h6 class="m-0">${forecast.date}</h6>
                </div>
            `;
        });

        document.getElementById("forecastContainer").innerHTML = forecastHtml;

    } catch (error) {
        console.error("Error fetching 5-day forecast:", error);
    }
}

async function todayTemps(lat, lon) {
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=0e19fa61d7b59264f1636fb3185e654d&units=metric`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch hourly data");
        }
        const data = await response.json();

        const iconMap = {
            '01d': 'sun.png', '01n': 'moon.png',
            '02d': 'partly-cloudy.png', '02n': 'partly-cloudy-night.png',
            '03d': 'cloud.png', '03n': 'cloud.png',
            '04d': 'cloudy.png', '04n': 'cloudy.png',
            '09d': 'rain.png', '09n': 'rain.png',
            '10d': 'rain.png', '10n': 'rain.png',
            '11d': 'thunderstorm.png', '11n': 'thunderstorm.png',
            '13d': 'snow.png', '13n': 'snow.png',
            '50d': 'mist.png', '50n': 'mist.png'
        };

        let todayDate = new Date().toISOString().split("T")[0];
        let todayForecasts = data.list.filter(item => item.dt_txt.startsWith(todayDate));
        let selectedHours = todayForecasts.slice(0, 6);

        let todayHtml = "";
        selectedHours.forEach(item => {
            let time = new Date(item.dt_txt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            let temp = Math.round(item.main.temp);
            let icon = iconMap[item.weather[0].icon] || 'cloud.png';

            todayHtml += `
                <div class="todayTemp">
                    <h6 class="m-0">${time}</h6>
                    <img src="./Assets/${icon}" alt="" width="35px">
                    <h5 class="m-0">${temp}&deg;C</h5>
                </div>
            `;
        });

        document.getElementById("todayTempContainer").innerHTML = todayHtml;

    } catch (error) {
        console.error("Error fetching today's temperatures:", error);
    }
}