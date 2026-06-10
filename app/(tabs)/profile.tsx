import { Ionicons } from '@expo/vector-icons';

import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../service/apiConfig';

// Backend UserResponseDto ile birebir uyumlu interface
interface UserProfile {
  id: number;
  name: string;
  surname: string;
  userName: string;
  email: string;
  avatarUrl: string | null;
  skinType: string;
}

export default function ProfileScreen() {
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const userId = localParams.userId || globalParams.userId; // Login'den gelen ID
  console.log("Profil sayfasında yakalanan Global ID:", userId);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const SKIN_TYPE_MAP: { [key: string]: string } = {
    'DRY': 'Kuru',
    'OILY': 'Yağlı',
    'SENSITIVE': 'Hassas',
    'COMBINATION': 'Karma',
    'NORMAL': 'Normal'
  };


  // Profil verilerini çekme
  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/users/${userId}`);

      // --- GÜVENLİ PARSE 
      let data = null;

      if (response.ok && response.status !== 204) {
        const text = await response.text();
        // Metin doluysa JSON olarak parçala, boşsa null bırak
        data = text ? JSON.parse(text) : null;
      }

      console.log("Profil Sayfası Gelen Veri:", data);

      if (data) {
        setUser(data);
      } else {
        console.warn("Kullanıcı verisi boş döndü.");
        // İsteğe bağlı: Kullanıcı bulunamadıysa bir uyarı gösterilebilir
      }


    } catch (error) {
      console.error("Profil yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const handleLogout = () => {
  Alert.alert(
    "Çıkış Yap",
    "Hesabından çıkmak istiyor musun?",
    [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: () => {
          // TODO: token temizleme
          // await AsyncStorage.removeItem("token");

          router.replace("/");
        }
      }
    ]
  );
};

  const UserAvatar = ({ imageUrl }: { imageUrl: string | null | undefined }) => {
    return (
      <View style={styles.container}>
        <Image
          source={{
            uri: user?.avatarUrl
              ? user.avatarUrl
              : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
          }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const [modalVisible, setModalVisible] = useState(false);


  const updateSkinType = async (selectedENType: string) => {
    try {
      setModalVisible(false);
      setLoading(true);

      const response = await fetch(`${BASE_URL}/users/update/skinType/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skinType: selectedENType })
      });

      if (response.ok) {
        // Ekranda anlık güncellenmesi için local state'i tazele
        if (user) {
          setUser({ ...user, skinType: selectedENType });
        }
        console.log("QA KONTROL: Cilt tipi başarıyla güncellendi:", selectedENType);
      } else {
        console.error("Cilt tipi güncellenirken backend hata döndürdü.");
      }
    } catch (error) {
      console.error("Cilt tipi güncelleme ağ hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, color, onPress }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="#444" />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#5D4F8D" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100,paddingTop: 40, backgroundColor: '#ffe4f0'}}>
        {/* Header 
        <View style={styles.header}>
          <Text style={styles.headerBrand}>GlowGuide</Text>

        </View>*/}
        <Text style={styles.headerSubtitle}>Profilim ve Ayarlar</Text>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>

            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
                onLoadStart={() => console.log("Avatar yükleniyor...")}
                onError={() => console.error("Avatar yüklenemedi!")}
              />
            ) : (
              <Ionicons name="person" size={50} color="#CCC" />
            )}
          </View>


          {/* İsim + Soyisim  */}
          <Text style={styles.userName}>
            {user ? `${user.name} ${user.surname}` : 'Yükleniyor...'}
          </Text>
          <TouchableOpacity
            style={styles.tagContainer}
            onPress={() => setModalVisible(true)} // Basınca seçim modalı açılacak
          >
            <Text style={styles.tagText}>
              Cilt Tipi: {user?.skinType ? (SKIN_TYPE_MAP[user.skinType] || user.skinType) : 'Belirtilmemiş'} 📝
            </Text>
          </TouchableOpacity>

        </View>

        {/* Ayarlar Listesi */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profil Ayarları</Text>
          <View style={styles.cardGroup}>
            <SettingItem
              icon="person-outline"
              title="Kişisel Bilgiler"
              color="#E1F5FE"
              onPress={() => router.push({
                pathname: '/personal_details', // Sayfa yoluna göre ayarla
                params: { userId: userId }
              })}
            />
            <SettingItem icon="leaf-outline" title="Cilt Günlüğüm" subtitle="Before/After fotoğraflar" color="#F3E5F5" />

          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
          <View style={styles.cardGroup}>
            <SettingItem icon="time-outline" title="Bildirimler" subtitle="PAO alertleri" color="#F5F5F5" />
            <SettingItem
              icon="lock-closed-outline"
              title="Hesap Ayarları"
              color="#E8F5E9"
              onPress={() => router.push({
                pathname: "/account_settings", // Dosya isminle uyumlu olmalı
                params: { userId: userId }
              })}
            />
             <SettingItem
      icon="log-out-outline"
      title="Çıkış Yap"
      color="#FFEBEE"
      onPress={handleLogout}
    />
          </View>
        </View>
      </ScrollView>
      {/* 🎯 CİLT TİPİ SEÇİM PENCERESİ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cilt Tipinizi Seçin</Text>

            {Object.keys(SKIN_TYPE_MAP).map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.modalOption}
                onPress={() => updateSkinType(key)}
              >
                <Text style={styles.modalOptionText}>{SKIN_TYPE_MAP[key]}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: '#FFEBEE', marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalOptionText, { color: '#C62828' }]}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffe4f0'  },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 10 },
 headerBrand: {
  fontSize: 26,
  fontWeight: '900',
  color: '#5D4F8D',
  letterSpacing: 1
},
headerSubtitle: {
  fontSize: 22,
  fontWeight: '800',
  textAlign: 'center',
  color: '#450428',
  marginBottom: 20,
  letterSpacing: 0.5
},
  userCard: {
    backgroundColor: '#fff3f7',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  userName: { fontSize: 22, fontWeight: '600', color: '#333' },
  tagContainer: { backgroundColor: '#f6dbe7', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 8 },
  tagText: { color: '#7e0644', fontSize: 13, fontWeight: '600' },
  sectionContainer: { paddingHorizontal: 25, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  cardGroup: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  //iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  settingSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  avatarImage: {
    width: 80, // avatarContainer ile aynı genişlik
    height: 80, // avatarContainer ile aynı yükseklik
    borderRadius: 40, // Tam yuvarlak
  },
  // ... mevcut stillerinin altına ekle:
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 10,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5D4F8D',
  },
  iconContainer: {
  width: 40,
  height: 40,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15
},
});