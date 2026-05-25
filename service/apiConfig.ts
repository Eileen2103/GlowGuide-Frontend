// Ip adresini tek noktadan kontrol etmek için.
const IP_ADDRESS = '192.168.1.103'; 
const PORT = '8080';
export const WEATHER_API_KEY = "b19b89984c6f6315d7af4e7c978ad611";
export const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?q=Istanbul&appid=${WEATHER_API_KEY}&units=metric&lang=tr`;

// BASE_URL'i tam bir adres olarak oluştur expo go içiv

export const BASE_URL = `http://${IP_ADDRESS}:${PORT}/api`;