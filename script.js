const API_KEY = 'd89c19439fed4fc595c101811253103'; // Replace with your WeatherAPI.com API key
const MAX_RECENT_SEARCHES = 5;
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let useMetric = true; // Default to metric

// Function to map weather conditions to Font Awesome icons
function getLocalWeatherIcon(condition) {
    // Map WeatherAPI conditions to Font Awesome icons
    const iconMap = {
        // Sunny/Clear
        'sunny': 'fas fa-sun',
        'clear': 'fas fa-sun',
        
        // Partly cloudy
        'partly cloudy': 'fas fa-cloud-sun',
        'partly': 'fas fa-cloud-sun',
        
        // Cloudy
        'cloudy': 'fas fa-cloud',
        'overcast': 'fas fa-cloud',
        'mist': 'fas fa-smog',
        'fog': 'fas fa-smog',
        
        // Rain
        'rain': 'fas fa-cloud-rain',
        'light rain': 'fas fa-cloud-rain',
        'moderate rain': 'fas fa-cloud-rain',
        'heavy rain': 'fas fa-cloud-showers-heavy',
        'drizzle': 'fas fa-cloud-rain',
        'patchy rain': 'fas fa-cloud-rain',
        
        // Snow
        'snow': 'fas fa-snowflake',
        'light snow': 'fas fa-snowflake',
        'heavy snow': 'fas fa-snowflake',
        'blizzard': 'fas fa-snowflake',
        
        // Thunderstorm
        'thunderstorm': 'fas fa-bolt',
        'thunder': 'fas fa-bolt',
        'lightning': 'fas fa-bolt',
        
        // Default
        'default': 'fas fa-cloud'
    };
    
    // Convert condition to lowercase for matching
    const conditionLower = condition.toLowerCase();
    
    // Find the matching icon or use default
    for (const [key, value] of Object.entries(iconMap)) {
        if (conditionLower.includes(key)) {
            return value;
        }
    }
    
    return iconMap.default;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Load saved unit preference from localStorage if available
    const savedMetricPreference = localStorage.getItem('useMetric');
    if (savedMetricPreference !== null) {
        useMetric = savedMetricPreference === 'true';
    }
    
    // Set toggle switch based on the loaded preference
    const unitToggle = document.getElementById('unit-toggle');
    unitToggle.checked = useMetric;
    
    updateRecentSearches();
    updateUnitLabels();
    
    // Add event listener for Enter key in search input
    document.getElementById('city').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
    
    // Add event listener for unit toggle
    unitToggle.addEventListener('change', function() {
        useMetric = this.checked;
        
        // Save preference to localStorage
        localStorage.setItem('useMetric', useMetric);
        
        updateUnitLabels();
        
        // If we already have weather data displayed, refresh it with the new unit
        const cityInput = document.getElementById('city');
        if (cityInput.value) {
            getWeather();
        }
    });
});

// Update unit labels based on selection
function updateUnitLabels() {
    const imperialLabel = document.getElementById('imperial-label');
    const metricLabel = document.getElementById('metric-label');
    
    if (useMetric) {
        imperialLabel.className = 'inactive-unit';
        metricLabel.className = 'active-unit';
    } else {
        imperialLabel.className = 'active-unit';
        metricLabel.className = 'inactive-unit';
    }
}

// Update recent searches list
function updateRecentSearches() {
    const recentCitiesList = document.getElementById('recent-cities');
    recentCitiesList.innerHTML = '';
    
    recentSearches.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => {
            document.getElementById('city').value = city;
            getWeather();
        });
        recentCitiesList.appendChild(li);
    });
}

// Add city to recent searches
function addToRecentSearches(city) {
    // Remove if already exists
    recentSearches = recentSearches.filter(item => item !== city);
    
    // Add to beginning
    recentSearches.unshift(city);
    
    // Limit the number of recent searches
    if (recentSearches.length > MAX_RECENT_SEARCHES) {
        recentSearches.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    
    // Update the UI
    updateRecentSearches();
}

async function getWeather() {
    const city = document.getElementById('city').value;
    if (!city) return alert('Please enter a city name');
    
    try {
        // Display loading state
        document.getElementById('current-weather').innerHTML = '<div class="weather-body" style="justify-content: center;"><p>Loading weather data...</p></div>';
        document.getElementById('forecast').innerHTML = '<p style="text-align: center;">Loading forecast data...</p>';
        document.getElementById('weather-details').innerHTML = '<p style="text-align: center;">Loading details...</p>';
        
        // Get weather data for current conditions and forecast from WeatherAPI.com
        // Updated to request 7 days instead of 5
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=7&aqi=yes&alerts=yes`);
        
        if (!response.ok) {
            throw new Error('City not found or API error');
        }
        
        const weatherData = await response.json();
        
        // Add to recent searches
        addToRecentSearches(city);
        
        // Display current weather
        displayCurrentWeather(weatherData.location, weatherData.current);
        
        // Display daily forecast
        displayForecast(weatherData.forecast.forecastday);
        
        // Display hourly forecast for today
        displayHourlyForecast(weatherData.forecast.forecastday[0].hour);
        
        // Display additional weather details
        displayWeatherDetails(weatherData.current, weatherData.forecast.forecastday[0].astro);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('current-weather').innerHTML = `<p class="error">An error occurred: ${error.message}</p>`;
        document.getElementById('forecast').innerHTML = '';
        document.getElementById('weather-details').innerHTML = '';
    }
}

// Modified displayCurrentWeather function
function displayCurrentWeather(location, current) {
    const cityName = location.name;
    const countryName = location.country;
    const weatherDescription = current.condition.text;
    
    // Get Font Awesome icon class instead of using the API icon URL
    const weatherIconClass = getLocalWeatherIcon(weatherDescription);
    
    // Use metric or imperial units based on selection
    const temp = Math.round(useMetric ? current.temp_c : current.temp_f);
    const feelsLike = Math.round(useMetric ? current.feelslike_c : current.feelslike_f);
    const tempUnit = useMetric ? '°C' : '°F';
    
    const isPrecipitation = current.precip_mm > 0;
    const precipitationValue = useMetric ? `${current.precip_mm} mm` : `${current.precip_in} in`;
    const precipitationClass = isPrecipitation ? 'precipitation' : '';
    
    document.getElementById('current-weather').innerHTML = `
        <div class="weather-header ${precipitationClass}">
            <h2>${cityName}, ${countryName}</h2>
            <p class="date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="weather-body">
            <div class="weather-icon">
                <i class="${weatherIconClass}"></i>
            </div>
            <div class="weather-info">
                <h3 class="temperature">${temp}${tempUnit}</h3>
                <p class="weather-text">${weatherDescription}</p>
                <p class="real-feel">Feels like: ${feelsLike}${tempUnit}</p>
                <p class="precipitation-info">${isPrecipitation ? 
                    `Precipitation: ${precipitationValue}` : 
                    'No precipitation currently'}</p>
            </div>
        </div>
    `;
}

// Modified displayForecast function
function displayForecast(forecastDays) {
    let forecastHTML = '<h3>7-Day Forecast</h3><div class="forecast-items">';
    
    forecastDays.forEach(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        const description = day.day.condition.text;
        
        // Get Font Awesome icon class instead of using the API icon URL
        const iconClass = getLocalWeatherIcon(description);
        
        // Use metric or imperial units based on selection
        const minTemp = Math.round(useMetric ? day.day.mintemp_c : day.day.mintemp_f);
        const maxTemp = Math.round(useMetric ? day.day.maxtemp_c : day.day.maxtemp_f);
        const tempUnit = useMetric ? '°C' : '°F';
        const precipValue = useMetric ? `${day.day.totalprecip_mm} mm` : `${day.day.totalprecip_in} in`;
        
        const dailyChanceOfRain = day.day.daily_chance_of_rain;
        
        forecastHTML += `
            <div class="forecast-item">
                <p class="day">${dayOfWeek}</p>
                <div class="forecast-icon">
                    <i class="${iconClass}"></i>
                </div>
                <p class="min-max">${minTemp}${tempUnit} / ${maxTemp}${tempUnit}</p>
                <p class="condition">${description}</p>
                <p class="precip-chance">Rain: ${dailyChanceOfRain}%</p>
                <p class="precip-amount">Total: ${precipValue}</p>
            </div>
        `;
    });
    
    forecastHTML += '</div>';
    document.getElementById('forecast').innerHTML = forecastHTML;
    
    // Now add hourly forecast
    const hourlyHTML = '<h3>Hourly Forecast</h3><div id="hourly-forecast" class="hourly-items"></div>';
    document.getElementById('forecast').innerHTML += hourlyHTML;
}

// Modified displayHourlyForecast function
function displayHourlyForecast(hourlyData) {
    let hourlyHTML = '';
    
    // Display hourly forecast for every hour
    hourlyData.forEach(hour => {
        // Changed to 24-hour format (metric time)
        const time = new Date(hour.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: !useMetric });
        const description = hour.condition.text;
        
        // Get Font Awesome icon class instead of using the API icon URL
        const iconClass = getLocalWeatherIcon(description);
        
        // Use metric or imperial units based on selection
        const temp = Math.round(useMetric ? hour.temp_c : hour.temp_f);
        const tempUnit = useMetric ? '°C' : '°F';
        const precipValue = useMetric ? `${hour.precip_mm} mm` : `${hour.precip_in} in`;
        
        const chanceOfRain = hour.chance_of_rain;
        
        hourlyHTML += `
            <div class="hourly-item">
                <p class="time">${time}</p>
                <div class="hourly-icon">
                    <i class="${iconClass}"></i>
                </div>
                <p class="hourly-temp">${temp}${tempUnit}</p>
                <p class="hourly-condition">${description}</p>
                <p class="hourly-precip">Rain: ${chanceOfRain}%</p>
                ${hour.precip_mm > 0 ? `<p class="hourly-rain">Precip: ${precipValue}</p>` : ''}
                ${hour.chance_of_snow > 0 ? `<p class="hourly-snow">Snow: ${hour.chance_of_snow}%</p>` : ''}
            </div>
        `;
    });
    
    document.getElementById('hourly-forecast').innerHTML = hourlyHTML;
}

function displayWeatherDetails(current, astro) {
    // For consistency, convert sunrise and sunset to 24-hour format if metric is used
    // otherwise keep in 12-hour format for imperial
    const convertTo24Hour = (timeStr) => {
        if (!useMetric) return timeStr; // Keep original format for imperial
        
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return timeStr; // Already in 24-hour format
    };
    
    const sunrise = convertTo24Hour(astro.sunrise);
    const sunset = convertTo24Hour(astro.sunset);
    
    // Use metric or imperial units based on selection
    const windSpeed = useMetric ? `${current.wind_kph} km/h` : `${current.wind_mph} mph`;
    const visibility = useMetric ? `${current.vis_km} km` : `${current.vis_miles} miles`;
    const pressure = useMetric ? `${current.pressure_mb} hPa` : `${current.pressure_in} inHg`;
    
    document.getElementById('weather-details').innerHTML = `
        <h3>Weather Details</h3>
        <div class="details-grid">
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <p>Wind</p>
                <p>${windSpeed} ${current.wind_dir}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <p>Humidity</p>
                <p>${current.humidity}%</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-eye"></i>
                <p>Visibility</p>
                <p>${visibility}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-temperature-high"></i>
                <p>Pressure</p>
                <p>${pressure}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <p>UV Index</p>
                <p>${current.uv} - ${getUVIndexText(current.uv)}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-cloud"></i>
                <p>Cloud Cover</p>
                <p>${current.cloud}%</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <p>Sunrise</p>
                <p>${sunrise}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <p>Sunset</p>
                <p>${sunset}</p>
            </div>
        </div>
    `;
}

function getUVIndexText(uvIndex) {
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
}