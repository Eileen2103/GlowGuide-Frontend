import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../service/apiConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();



  const handleLogin = async () => {
    try {

      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text(); // HER ZAMAN TEXT OKU!

      console.log("RAW RESPONSE:", text);

      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.log("JSON parse error:", e);
        Alert.alert("Hata", "Sunucu geçersiz cevap döndü");
        return;
      }

      if (response.ok) {
        console.log("Giriş Başarılı, Kullanıcı ID:", data.id);

        router.replace({
          pathname: '/(tabs)/home',
          params: { userId: data.id },
        } as any);

        router.push({
          pathname: "/(tabs)/forum",
          params: { userId: data.id } // Backend login response'undan gelen ID
        });

      } else {
        Alert.alert('Hata', data?.message || 'E-posta veya şifre yanlış!');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GlowGuide</Text>
      <Text style={styles.subtitle}>Cilt bakım asistanına hoş geldin</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="E-posta Adresi"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.linkText}>Hesabın yok mu? Kayıt Ol</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf9f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3f0623',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#cf8aa9',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#9c4e57',
    marginTop: 10,
  },
});