import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useGlobalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL, WEATHER_URL } from '../../service/apiConfig';

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
  mainStatus: string; // Backend selamlama motoruna paslamak için (SUNNY, RAINY vb.)
}

const COLORS = {
  bgPurple: '#ffe4f0',
  bgWhite: '#FFFFFF',
  textPrimary: '#58022c',
  textSecondary: '#616161',
  accent: '#7E57C2',
  checked: '#B39DDB',
  alertBg: '#ffcdcb',
  alertText: '#b40303',
};

export default function HomeScreen() {
  const params = useGlobalSearchParams();
  const userId = params.userId || '1';

  // --- 1. TÜM STATE'LER (EN ÜSTTE) ---
  const [userName, setUserName] = useState('');
  const [morningRoutine, setMorningRoutine] = useState<any[]>([]);
  const [eveningRoutine, setEveningRoutine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyRoutines, setWeeklyRoutines] = useState<any>({});
  const [urgentProduct, setUrgentProduct] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isRoutineMenuVisible, setIsRoutineMenuVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [greeting, setGreeting] = useState<string>('Işıltınla göz kamaştırmaya hazır mısın? Hadi rutinine başlayalım! ✨');
  
  const [newRoutine, setNewRoutine] = useState({
    description: '',
    type: 'MORNING', 
    dayOfWeek: 1,    
  });

  const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  // OpenWeatherMap ana durumlarını senin backend şemana (Enum) dönüştüren QA eşleştiricisi
  const mapWeatherToBackend = (main: string): string => {
    if (!main) return 'GENERAL';
    const status = main.toUpperCase();
    if (status.includes('CLEAR') || status.includes('SUN')) return 'SUNNY';
    if (status.includes('RAIN') || status.includes('DRIZZLE') || status.includes('THUNDER')) return 'RAINY';
    if (status.includes('SNOW')) return 'SNOWY';
    return 'GENERAL';
  };

  // --- 2. TÜM HOOK'LAR VE FONKSİYONLAR ---

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("İstek atılan tam URL:", `${BASE_URL}/users/${userId}`);

      // Önce hava durumunu hızlıca öğrenelim ki selamlama isteğine parametre olarak ekleyebilelim
      let activeWeatherType = 'GENERAL';
      try {
        const weatherRes = await fetch(WEATHER_URL);
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          activeWeatherType = mapWeatherToBackend(wData.weather[0].main);
          setWeather({
            temp: Math.round(wData.main.temp),
            description: wData.weather[0].description,
            icon: wData.weather[0].icon,
            city: wData.name,
            mainStatus: activeWeatherType
          });
        }
      } catch (wErr) {
        console.error("Hava durumu ara isteğinde hata (Süreç aksatılmadı):", wErr);
      } finally {
        setWeatherLoading(false);
      }

      // Şimdi tüm backend verilerini (Kullanıcı, Rutinler, Son Kullanma Tarihi ve Yeni Selamlama Mesajı) eşzamanlı çekiyoruz
      const [userRes, routineRes, productRes, greetingRes] = await Promise.all([
        fetch(`${BASE_URL}/users/${userId}`),
        fetch(`${BASE_URL}/routines/${userId}`),
        fetch(`${BASE_URL}/products/urgent/${userId}`),
        fetch(`${BASE_URL}/greetings/user/${userId}?weather=${activeWeatherType}`)
      ]);

      // --- GÜVENLİ PARSE FONKSİYONU ---
      const getJsonData = async (res: Response) => {
        if (res.ok && res.status !== 204) {
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        }
        return null;
      };

      const userData = await getJsonData(userRes);
      const routineDataRaw = await getJsonData(routineRes);
      const routineData: any[] = Array.isArray(routineDataRaw) ? routineDataRaw : [];
      const productData = await getJsonData(productRes);

      // Selamlama mesajı düz metin (String) döndüğü için text() olarak güvenle alıyoruz
      if (greetingRes.ok) {
        const greetingText = await greetingRes.text();
        if (greetingText) setGreeting(greetingText);
      }

      // Verileri State'e Aktar
      if (userData) {
        setUserName(userData.name);
      }
      setUrgentProduct(productData);

      // Rutinleri Filtrele
      const morning = routineData.filter(item => item.type === 'MORNING');
      const evening = routineData.filter(item => item.type === 'NIGHT');

      const weekly = routineData
        .filter(item => item.type === 'WEEKLY')
        .reduce((acc: any, item: any) => {
          const dayName = DAYS[item.dayOfWeek - 1] || "Diğer";
          if (!acc[dayName]) acc[dayName] = [];
          acc[dayName].push(item);
          return acc;
        }, {});

      setMorningRoutine(morning as any);
      setEveningRoutine(evening as any);
      setWeeklyRoutines(weekly);

    } catch (error) {
      console.error("HomeScreen Veri Çekme Hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUrgentProduct = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/products/urgent/${userId}`);
      if (response.status === 200) {
        const data = await response.json();
        setUrgentProduct(data);
      } else {
        setUrgentProduct(null);
      }
    } catch (error) {
      console.error("Urgent veri çekme hatası:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchUrgentProduct();
    }, [fetchUrgentProduct])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const toggleRoutine = async (time: 'morning' | 'evening' | 'weekly', id: number) => {
    const updateList = (list: any[]) =>
      list.map(item => item.id === id ? { ...item, completed: !item.completed } : item);

    let currentItem: any = null;
    if (time === 'morning') {
      currentItem = morningRoutine.find(item => item.id === id);
      setMorningRoutine(updateList(morningRoutine));
    } else if (time === 'evening') {
      currentItem = eveningRoutine.find(item => item.id === id);
      setEveningRoutine(updateList(eveningRoutine));
    } else if (time === 'weekly') {
      Object.keys(weeklyRoutines).forEach((day) => {
        const found = weeklyRoutines[day].find((item: any) => item.id === id);
        if (found) currentItem = found;
      });

      setWeeklyRoutines((prevWeekly: any) => {
        const updatedWeekly = { ...prevWeekly };
        Object.keys(updatedWeekly).forEach((day) => {
          updatedWeekly[day] = updatedWeekly[day].map((item: any) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          );
        });
        return updatedWeekly;
      });
    }

    if (!currentItem) return;
    const newStatus = !currentItem.completed; 

    try {
      const response = await fetch(`${BASE_URL}/routines/update/${id}?completed=${newStatus}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        console.error("Backend güncelleme hatası kodu:", response.status);
        Alert.alert("Hata", "Durum veritabanına kaydedilemedi, liste yenilenecek.");
        fetchData(); 
      }
    } catch (error) {
      console.error("Rutin güncellenirken ağ hatası:", error);
      Alert.alert("Ağ Hatası", "Sunucu bağlantısı koptuğu için değişiklik kaydedilemedi.");
      fetchData();
    }
  };

  const RoutineItem = ({ time, isChecked, label, id }: any) => (
    <TouchableOpacity
      style={styles.todoStatusContainer} 
      onPress={() => toggleRoutine(time, id)} 
      onLongPress={() => id && handleDeleteRoutine(id)}
      activeOpacity={0.7}
    >
      <View style={[styles.statusCircle, isChecked && styles.statusCircleCompleted]}>
        {isChecked && (
          <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
        )}
      </View>
      <Text style={[styles.routineText, isChecked && styles.routineTextCompleted]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleDeleteRoutine = async (routineId: number) => {
    Alert.alert(
      "Rutini Sil",
      "Bu rutini kalıcı olarak silmek istediğine emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/routines/delete/${routineId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                fetchData(); 
              } else {
                Alert.alert("Hata", "Rutin silinemedi.");
              }
            } catch (error) {
              console.error("Silme hatası:", error);
            }
          }
        }
      ]
    );
  };

  const handleSaveRoutine = async () => {
    if (!newRoutine.description.trim()) {
      Alert.alert("Hata", "Lütfen rutin için bir isim girin.");
      return;
    }

    try {
      const finalDayOfWeek = newRoutine.type === 'WEEKLY' ? newRoutine.dayOfWeek : 0;

      const response = await fetch(`${BASE_URL}/routines/add/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newRoutine.description,
          type: newRoutine.type,
          dayOfWeek: finalDayOfWeek,
          completed: false
        }),
      });

      if (response.ok) {
        Alert.alert("Başarılı 🎉", "Yeni bakım adımın başarıyla eklendi!");
        setIsAddModalVisible(false); 
        setNewRoutine({ description: '', type: 'MORNING', dayOfWeek: 1 }); 
        fetchData(); 
      } else {
        Alert.alert("Hata ❌", "Rutin kaydedilemedi. Sunucu yanıt vermedi.");
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      Alert.alert("Hata ❌", "Sunucuya bağlanılamadı.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.accent} style={{ flex: 1 }} />;
  }

  // --- 4. ANA RENDER ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.brandTitle}>GlowGuide</Text>
          <View style={styles.greetingRow}>
            
            <View style={styles.weatherCard}>
              <Text style={styles.weatherCity}>
                {weather ? weather.city.toUpperCase() : 'İSTANBUL'}
              </Text>

              {weatherLoading ? (
                <ActivityIndicator size="small" color={COLORS.accent} style={{ marginVertical: 5 }} />
              ) : weather ? (
                <>
                  <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
                  <View style={styles.weatherDetailRow}>
                    <Text style={styles.weatherDesc} numberOfLines={1}>
                      {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
                    </Text>
                    <Ionicons 
                      name={weather.mainStatus === 'SUNNY' ? "sunny-outline" : weather.mainStatus === 'RAINY' ? "rainy-outline" : "cloudy-outline"} 
                      size={16} 
                      color="#757575" 
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.weatherDesc}>Veri Alınamadı</Text>
              )}
            </View>
          </View>

          {/* Dinamik Karşılama Akıllı Mesaj Kutusu */}
          <View style={styles.greetingBubbleCard}>
            <Ionicons name="sparkles" size={18} color={COLORS.accent} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.greetingBubbleText}>Merhaba {userName} ! {greeting}</Text>
          </View>
        </View>

        <View style={styles.mainSection}>
          {urgentProduct ? (
            <View style={styles.alertBox}>
              <Ionicons name="warning" size={24} color="#D32F2F" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.alertTitle}>Kullanım Süresi Doluyor!</Text>
                <Text style={styles.alertMessage}>
                  {urgentProduct.name || urgentProduct.productName} için son {urgentProduct.remainingDays} gün!
                </Text>
              </View>
              <TouchableOpacity onPress={() => {}}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noAlertBox}>
              <Text style={styles.noAlertText}>Şu an son kullanma tarihi yaklaşan ürünün yok. ✨</Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GÜNLÜK RUTİNİM</Text>
            <TouchableOpacity
              onPress={() => setIsRoutineMenuVisible(true)}
              style={styles.moreButton}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.routinesRow}>
            <View style={styles.routineCard}>
              <Text style={styles.routineCardTitle}>Sabah Rutini</Text>
              {Array.isArray(morningRoutine) && morningRoutine.map((item: any) => (
                <RoutineItem
                  key={item.id}
                  id={item.id}
                  time="morning"
                  name={item.description}
                  isChecked={item.completed}
                  label={item.description}
                />
              ))}
            </View>

            <View style={styles.routineCard}>
              <Text style={styles.routineCardTitle}>Akşam Rutini</Text>
              {Array.isArray(eveningRoutine) && eveningRoutine.map((item: any) => (
                <RoutineItem
                  key={item.id}
                  id={item.id}
                  time="evening"
                  name={item.description}
                  isChecked={item.completed}
                  label={item.description}
                />
              ))}
            </View>
          </View>

          {/* --- HAFTALIK ÖZEL BAKIM --- */}
          <View style={{ marginTop: 5, marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>HAFTALIK ÖZEL BAKIM</Text>
            {Object.keys(weeklyRoutines).length > 0 ? (
              Object.keys(weeklyRoutines).map((day) => (
                <View key={day} style={styles.weeklyDayContainer}>
                  <View style={styles.dayLabelContainer}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.accent} />
                    <Text style={styles.dayLabelText}>{day}</Text>
                  </View>

                  <View style={styles.weeklyCard}>
                    {weeklyRoutines[day].map((item: any) => (
                      <RoutineItem
                        key={item.id}
                        time="weekly"
                        id={item.id}
                        name={item.description}
                        isChecked={item.completed}
                        label={item.description}
                      />
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Bu hafta için planlanmış özel bir bakım yok.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* RUTİN YÖNETİM MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRoutineMenuVisible}
        onRequestClose={() => setIsRoutineMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>Rutin Yönetimi</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsRoutineMenuVisible(false);
                setIsAddModalVisible(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#5D4F8D" />
              <Text style={styles.modalButtonText}>Yeni Rutin Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* YENİ RUTİN EKLEME MODAL */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modernModalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modernModalTitle}>Yeni Bakım Adımı Ekle ✨</Text>

            <Text style={styles.fieldLabel}>Rutin Adı / Açıklaması</Text>
            <TextInput
              style={styles.modernInput}
              placeholder="Örn: C Vitamini Serumu, Nemlendirici..."
              placeholderTextColor="#999"
              value={newRoutine.description}
              onChangeText={(text: string) => setNewRoutine({ ...newRoutine, description: text })}
            />

            <Text style={styles.fieldLabel}>Ne Zaman Uygulanacak?</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.selectorChip, newRoutine.type === 'MORNING' && styles.selectorChipActive]}
                onPress={() => setNewRoutine({ ...newRoutine, type: 'MORNING' })}
              >
                <Text style={[styles.selectorChipText, newRoutine.type === 'MORNING' && styles.selectorChipTextActive]}>🌅 Sabah</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectorChip, newRoutine.type === 'NIGHT' && styles.selectorChipActive]}
                onPress={() => setNewRoutine({ ...newRoutine, type: 'NIGHT' })}
              >
                <Text style={[styles.selectorChipText, newRoutine.type === 'NIGHT' && styles.selectorChipTextActive]}>🌙 Akşam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectorChip, newRoutine.type === 'WEEKLY' && styles.selectorChipActive]}
                onPress={() => setNewRoutine({ ...newRoutine, type: 'WEEKLY' })}
              >
                <Text style={[styles.selectorChipText, newRoutine.type === 'WEEKLY' && styles.selectorChipTextActive]}>📅 Haftalık</Text>
              </TouchableOpacity>
            </View>

            {newRoutine.type === 'WEEKLY' && (
              <View style={styles.weeklyDaySection}>
                <Text style={styles.fieldLabel}>Hangi Gün Uygulanacak?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
                  {DAYS.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayChip, newRoutine.dayOfWeek === index + 1 && styles.dayChipActive]}
                      onPress={() => setNewRoutine({ ...newRoutine, dayOfWeek: index + 1 })}
                    >
                      <Text style={[styles.dayChipText, newRoutine.dayOfWeek === index + 1 && styles.dayChipTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.actionButtonRow}>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={styles.modernCancelBtn}>
                <Text style={styles.modernCancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveRoutine} style={styles.modernSaveButton}>
                <Ionicons name="cloud-upload-outline" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.modernSaveButtonText}>Sisteme Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgPurple },
  container: { flex: 1, backgroundColor: COLORS.bgPurple },
  contentContainer: { paddingBottom: 100 },
  headerSection: { padding: 25, paddingTop: 10 },
  brandTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 20 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { fontSize: 26, fontWeight: '600', color: COLORS.textPrimary },
  weatherCard: { backgroundColor: COLORS.bgWhite, padding: 12, borderRadius: 15, width: 115, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  weatherCity: { fontSize: 9, color: '#9E9E9E', fontWeight: '700', marginBottom: 2 },
  weatherTemp: { fontSize: 28, fontWeight: 'bold', color: COLORS.textSecondary },
  weatherDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, width: '100%', justifyContent: 'center' },
  weatherDesc: { fontSize: 9, color: COLORS.textSecondary, marginRight: 4, maxWidth: 70 },
  
  // 🎯 YENİ EKLENEN: Selamlama Baloncuğu Tasarım Stili
  greetingBubbleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 14,
    borderRadius: 16,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F5E6ED',
  },
  greetingBubbleText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    fontWeight: '500',
  },

  mainSection: { backgroundColor: COLORS.bgWhite, flex: 1, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingTop: 30, marginTop: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', marginBottom: 15, letterSpacing: 1 },
  routinesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  routineCard: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 20, width: '48%', minHeight: 120 },
  routineCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  weeklyDayContainer: { marginBottom: 15 },
  dayLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 5 },
  dayLabelText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 6, textTransform: 'uppercase' },
  weeklyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.alertBg, padding: 15, borderRadius: 15, marginTop: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ffbaba' },
  alertTitle: { fontSize: 14, fontWeight: '700', color: COLORS.alertText },
  alertMessage: { fontSize: 13, color: COLORS.alertText, marginTop: 2 },
  noAlertBox: { padding: 12, backgroundColor: '#F5F5F5', borderRadius: 15, alignItems: 'center', marginTop: 5, marginBottom: 15 },
  noAlertText: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 10, fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  moreButton: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, alignItems: 'center' },
  modalHeaderIndicator: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  modalButton: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 15 },
  modernModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 45, width: '100%' },
  modernModalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 25, letterSpacing: 0.5 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#757575', marginBottom: 10, marginTop: 5, letterSpacing: 0.3 },
  modernInput: { width: '100%', backgroundColor: '#F8F5FC', padding: 16, borderRadius: 16, fontSize: 15, color: '#333', marginBottom: 20, borderWidth: 1, borderColor: '#EFEAF5' },
  typeSelectorRow: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 20 },
  selectorChip: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  selectorChipActive: { backgroundColor: '#F4EFFB', borderColor: COLORS.accent },
  selectorChipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  selectorChipTextActive: { color: COLORS.accent, fontWeight: 'bold' },
  weeklyDaySection: { width: '100%', marginBottom: 15 },
  daysScroll: { gap: 8, paddingVertical: 4, paddingRight: 20 },
  dayChip: { backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EEEEEE' },
  dayChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  dayChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  actionButtonRow: { flexDirection: 'row', width: '100%', gap: 15, marginTop: 20, alignItems: 'center' },
  modernCancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  modernCancelBtnText: { color: '#9E9E9E', fontSize: 15, fontWeight: '600' },
  modernSaveButton: { flex: 2, backgroundColor: COLORS.accent, paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', elevation: 3 },
  modernSaveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  todoStatusContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, width: '100%', marginBottom: 4 },
  statusCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#BDBDBD', marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  statusCircleCompleted: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }, 
  routineText: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1 },
  routineTextCompleted: { textDecorationLine: 'line-through', color: '#9E9E9E', fontWeight: '400' }, 
});