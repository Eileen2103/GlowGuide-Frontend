import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../service/apiConfig';

export default function RegisterScreen() {
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();

  const handleRegister = async () => {
    // 1. Temel Kontrol
    if (!userName || !email || !password) {
      Alert.alert('Hata', 'Lütfen yıldızlı alanları doldurun!');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: userName,
          email: email,
          firstName: name,
          lastName: surname,
          password: password,
          // Tabloda NOT NULL kısıtlaması olmadığı için bunları null gönder
          skinType: null,
          birthday: null,
          avatarUrl: null
        }),
      });

      if (response.ok) {
        const result = await response.text();
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Yeni Hesap Oluştur</Text>
      <Text style={styles.subtitle}>GlowGuide ailesine katıl</Text>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Kullanıcı Adı *" value={userName} onChangeText={setUserName} />
        <TextInput style={styles.input} placeholder="Ad" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Soyad" value={surname} onChangeText={setSurname} />
        <TextInput style={styles.input} placeholder="E-posta *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Şifre *" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Kayıt Ol</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FBF9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
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
  button: { backgroundColor: '#cf8aa9', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  linkText: { color: '#9c4e57', marginTop: 20 },
});