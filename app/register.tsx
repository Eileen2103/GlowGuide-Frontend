import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../service/apiConfig';

export default function RegisterScreen() {
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 🎯 DOĞUM GÜNÜ STATE'LERİ
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const router = useRouter();

  // 🎯 Tarihi MySQL / Java LocalDate formatına (YYYY-MM-DD) dönüştüren QA dostu fonksiyon
  const formatDateToBackend = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Aylar 0-11 arası olduğu için +1 yapıyoruz
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Çıktı: "1998-05-15"
  };

  // Takvimde gün seçildiğinde tetiklenen mekanizma
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); // iOS/Android popup'ını kapat
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleRegister = async () => {
    // 1. Temel Kontrol (Doğum gününü de zorunlu veya isteğe bağlı yapabilirsin, buraya ekledim)
    if (!userName || !email || !password || !birthday) {
      Alert.alert('Hata', 'Lütfen doğum günü dahil tüm yıldızlı alanları doldurun!');
      return;
    }

    try {
      // Doğum gününü tam backend'in beklediği formata (YYYY-MM-DD) çeviriyoruz
      const formattedBirthday = formatDateToBackend(birthday);
      console.log("QA KONTROL: Backend'e giden doğum günü stringi:", formattedBirthday);

      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: userName,
          email: email,
          name: name, // 🎯 Backend DTO alan adın 'name' ve 'surname' olduğu için eşitledim
          surname: surname,
          password: password,
          birthday: formattedBirthday, // 🎯 Veritabanına gidecek temiz format: "1998-05-15"
          skinType: null,
          avatarUrl: null
        }),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'GlowGuide\'a hoş geldin! Giriş yapabilirsin.', [
          { text: 'Harika!', onPress: () => router.push('/') }
        ]);
      } else {
        const errorText = await response.text();
        Alert.alert('Kayıt Başarısız', errorText || 'Bir hata oluştu.');
      }
    } catch (error) {
      console.error("Bağlantı Hatası:", error);
      Alert.alert('Hata', 'Sunucuya bağlanılamadı. IP adresini kontrol et!');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FBF9' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Yeni Hesap Oluştur</Text>
        <Text style={styles.subtitle}>GlowGuide ailesine katıl</Text>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Kullanıcı Adı *" value={userName} onChangeText={setUserName} />
          <TextInput style={styles.input} placeholder="Ad" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Soyad" value={surname} onChangeText={setSurname} />
          <TextInput style={styles.input} placeholder="E-posta *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Şifre *" value={password} onChangeText={setPassword} secureTextEntry />
          
          {/* 🎯 DOĞUM GÜNÜ SEÇİM BUTONU */}
          <TouchableOpacity style={styles.datePickerInput} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.datePickerText, !birthday && { color: '#999' }]}>
              {birthday 
                ? `Doğum Günü: ${birthday.toLocaleDateString('tr-TR')}` // Ekranda şık Türkçe gösterim
                : "Doğum Günü Seçin * 📅"
              }
            </Text>
          </TouchableOpacity>

          {/* Dinamik Takvim Pop-up Penceresi */}
          {showDatePicker && (
            <DateTimePicker
              value={birthday || new Date()} // Seçili tarih yoksa bugünü aç
              mode="date"
              display="default"
              maximumDate={new Date()} // Gelecek tarihlerin seçilmesini engelle (QA Validasyonu)
              onChange={onChangeDate}
            />
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FBF9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3f0623', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  inputContainer: { width: '100%' },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },
  // 🎯 Takvim Giriş Alanı Tasarım Stili
  datePickerInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    justifyContent: 'center'
  },
  datePickerText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  button: { backgroundColor: '#cf8aa9', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  linkText: { color: '#9c4e57', marginTop: 20 },
});