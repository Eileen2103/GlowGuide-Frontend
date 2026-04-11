// Ip adresini tek noktadan kontrol etmek için.
const IP_ADDRESS = '192.168.1.104'; 
const PORT = '8080';

// BASE_URL'i tam bir adres olarak oluşturuyoruz.
// Böylece fetch içinde sadece '/users/login' gibi uç noktaları yazman yeterli olur.
export const BASE_URL = `http://${IP_ADDRESS}:${PORT}/api`;