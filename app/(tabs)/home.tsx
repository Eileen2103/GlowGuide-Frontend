import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useGlobalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL } from '../../service/apiConfig';

interface RoutineState {
  [key: string]: boolean;
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
  const [newRoutine, setNewRoutine] = useState({
    description: '',
    type: 'MORNING', // Varsayılan olarak SABAH
    dayOfWeek: 1,    // Pazartesi
  });

  const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  // --- 2. TÜM HOOK'LAR VE FONKSİYONLAR (EN ÜSTTE) ---
  // Hiçbir Hook (useEffect, useCallback, useFocusEffect) return ifadesinden sonra olmamalı!

  const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    console.log("İstek atılan tam URL:", `${BASE_URL}/users/${userId}`);
    const [userRes, routineRes, productRes] = await Promise.all([
      fetch(`${BASE_URL}/users/${userId}`),
      fetch(`${BASE_URL}/routines/${userId}`),
      fetch(`${BASE_URL}/products/urgent/${userId}`)
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

    // Verileri State'e Aktar
    if (userData) {
      setUserName(userData.name);
    }
    setUrgentProduct(productData);

    // Rutinleri Filtrele (Sadece routineData dizi ise işlem yap)
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
    // Hata detayını daha net görmek için:
    // Alert.alert("Hata", "Veriler yüklenirken bir sorun oluştu.");
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

 const toggleRoutine = (time: 'morning' | 'evening', id: number) => {
  const updateList = (list: any[]) =>
    list.map(item => item.id === id ? { ...item, completed: !item.completed } : item);

  if (time === 'morning') {
    setMorningRoutine(updateList(morningRoutine));
  } else {
    setEveningRoutine(updateList(eveningRoutine));
  }
};

  const RoutineItem = ({ time, name, isChecked, label, id }: any) => (
    <TouchableOpacity
      style={styles.routineItem}
      onPress={() => toggleRoutine(time, name)}
      onLongPress={() => id && handleDeleteRoutine(id)} // ID varsa silme fonksiyonunu çağır
    >
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={[styles.routineItemText, isChecked && styles.routineItemTextChecked]}>{label}</Text>
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
                fetchData(); // Listeyi yenile
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
    // boşs isimle kaydetmeyi engelle
    if (!newRoutine.description.trim()) {
      Alert.alert("Hata", "Lütfen rutin için bir isim girin.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/routines/add/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newRoutine.description,
          type: newRoutine.type,
          dayOfWeek: newRoutine.dayOfWeek,
          completed: false
        }),
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Yeni rutinin eklendi! ✨");
        setIsAddModalVisible(false); // Formu kapat
        setNewRoutine({ description: '', type: 'MORNING', dayOfWeek: 1 }); // Formu temizle
        fetchData(); // Listeyi güncelle
      } else {
        Alert.alert("Hata", "Rutin kaydedilemedi.");
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    }
  };

  // --- 3. KOŞULLU RENDER (TÜM HOOK'LARDAN SONRA OLMALI) ---
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
            <Text style={styles.greetingText}>Günün Güzel{"\n"}Geçsin,{"\n"}{userName}! ✨</Text>
            <View style={styles.weatherCard}>
              <Text style={styles.weatherCity}>İSTANBUL</Text>
              <Text style={styles.weatherTemp}>18°C</Text>
              <View style={styles.weatherDetailRow}>
                <Text style={styles.weatherDesc}>Yüksek{"\n"}Nem</Text>
                <Ionicons name="water-outline" size={20} color="#757575" />
              </View>
            </View>
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
              <TouchableOpacity onPress={() => {/* Ürüne git */ }}>
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
            {/* Bunu bul ve değiştir */}
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

          <View style={{ marginTop: 25, marginBottom: 20 }}>
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
                      <RoutineItem key={item.id} time="weekly" name={item.description} isChecked={item.completed} label={item.description} />
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
                setIsAddModalVisible(true); // Burayı güncelledik
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#5D4F8D" />
              <Text style={styles.modalButtonText}>Yeni Rutin Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* YENİ RUTİN EKLEME FORMU */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Rutin Ekle</Text>
            <TextInput
              style={styles.input}
              placeholder="Rutin Adı (Örn: Nemlendirici)"
              onChangeText={(text: string) => setNewRoutine({ ...newRoutine, description: text })}
            />
            {/* Buraya zaman seçici (Sabah/Akşam) butonları ekleyebilirsin */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoutine}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <Text style={{ marginTop: 15, color: '#999' }}>Vazgeç</Text>
            </TouchableOpacity>
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
  weatherCard: { backgroundColor: COLORS.bgWhite, padding: 15, borderRadius: 15, width: 110, alignItems: 'center', elevation: 3 },
  weatherCity: { fontSize: 10, color: '#9E9E9E', fontWeight: '700' },
  weatherTemp: { fontSize: 32, fontWeight: 'bold', color: COLORS.textSecondary },
  weatherDetailRow: { flexDirection: 'row', alignItems: 'center' },
  weatherDesc: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'right', marginRight: 5 },
  mainSection: { backgroundColor: COLORS.bgWhite, flex: 1, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingTop: 30, marginTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', marginBottom: 20, letterSpacing: 1 },
  routinesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  routineCard: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 20, width: '48%', minHeight: 120 },
  routineCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 15 },
  routineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: COLORS.checked, borderColor: COLORS.checked },
  routineItemText: { fontSize: 14, color: COLORS.textSecondary },
  routineItemTextChecked: { color: '#9E9E9E', textDecorationLine: 'line-through' },
  weeklyDayContainer: { marginBottom: 15 },
  dayLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 5 },
  dayLabelText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 6, textTransform: 'uppercase' },
  weeklyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.alertBg, padding: 15, borderRadius: 15, marginTop: 20, borderWidth: 1, borderColor: '#ffbaba' },
  alertTitle: { fontSize: 14, fontWeight: '700', color: COLORS.alertText },
  alertMessage: { fontSize: 13, color: COLORS.alertText, marginTop: 2 },
  noAlertBox: { padding: 15, backgroundColor: '#F5F5F5', borderRadius: 15, alignItems: 'center', marginTop: 10 },
  noAlertText: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 10, fontSize: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  moreButton: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    alignItems: 'center'
  },
  modalHeaderIndicator: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  modalButton: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 15 },
  closeButton: { marginTop: 20 },
  closeButtonText: { color: '#999', fontSize: 16, fontWeight: '600' },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    width: '100%'
  },
  pickerBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#EEE',
    borderRadius: 10,
    alignItems: 'center'
  },
  pickerBtnActive: { backgroundColor: COLORS.accent },
  pickerText: { fontSize: 12, color: '#666' },
  pickerTextActive: { color: '#FFF', fontWeight: 'bold' },
  saveButton: {
    backgroundColor: COLORS.accent,
    width: '100%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});