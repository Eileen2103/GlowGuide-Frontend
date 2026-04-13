import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../service/apiConfig';

interface RoutineItemData {
  id: number;
  productName: string;
  isCompleted: boolean;
}

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

  const [userName, setUserName] = useState('');
  const [morningRoutine, setMorningRoutine] = useState<RoutineState>({});
  const [eveningRoutine, setEveningRoutine] = useState<RoutineState>({});
  const [loading, setLoading] = useState(true);
  const [weeklyRoutines, setWeeklyRoutines] = useState<any>({});
  const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  const fetchData = async () => {
    try {
      setLoading(true);

      // Paralel fetch: Hem kullanıcıyı hem rutinleri çek
      const [userRes, routineRes] = await Promise.all([
        fetch(`${BASE_URL}/users/${userId}`),
        fetch(`${BASE_URL}/routines/${userId}`)
      ]);


      const userData = await userRes.json();
      console.log("Kullanıcı ve Rutin Verileri Çekildi:", userData);
      // Backend'den gelen List<RoutineResponseDto> yapısı
      const routineData: any[] = await routineRes.json();

      setUserName(userData.name);


      const morning = routineData
        .filter(item => item.type === 'MORNING')
        .reduce((acc, item) => ({
          ...acc,
          [item.description]: item.completed
        }), {});

      
      const evening = routineData
        .filter(item => item.type === 'NIGHT')
        .reduce((acc, item) => ({
          ...acc,
          [item.description]: item.completed
        }), {});

      const weekly = routineData
        .filter(item => item.type === 'WEEKLY')
        .reduce((acc: any, item: any) => {
          const dayName = DAYS[item.dayOfWeek - 1] || "Diğer"; // dayOfWeek 1-7 arası 
          if (!acc[dayName]) acc[dayName] = [];
          acc[dayName].push(item);
          return acc;
        }, {});

      setMorningRoutine(morning);
      setEveningRoutine(evening);
      setWeeklyRoutines(weekly);

    } catch (error) {
      console.error("HomeScreen Veri Çekme Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);


  const toggleRoutine = (time: 'morning' | 'evening', item: string) => {
    if (time === 'morning') {
      setMorningRoutine({ ...morningRoutine, [item]: !morningRoutine[item] });
    } else {
      setEveningRoutine({ ...eveningRoutine, [item]: !eveningRoutine[item] });
    }

  };

  const RoutineItem = ({ time, name, isChecked, label }: any) => (
    <TouchableOpacity style={styles.routineItem} onPress={() => toggleRoutine(time, name)}>
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={[styles.routineItemText, isChecked && styles.routineItemTextChecked]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.accent} style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        <View style={styles.headerSection}>
          <Text style={styles.brandTitle}>GlowGuide</Text>

          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>
              Günün Güzel{"\n"}Geçsin,{"\n"}{userName}! ✨
            </Text>

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
          <Text style={styles.sectionTitle}>GÜNLÜK RUTİNİM</Text>

          <View style={styles.routinesRow}>
            {/* Sabah Kartı */}
            <View style={styles.routineCard}>
              <Text style={styles.routineCardTitle}>Sabah Rutini</Text>
              {Object.keys(morningRoutine).map((key) => (
                <RoutineItem key={key} time="morning" name={key} isChecked={morningRoutine[key]} label={key} />
              ))}
            </View>

            {/* Akşam Kartı */}
            <View style={styles.routineCard}>
              <Text style={styles.routineCardTitle}>Akşam Rutini</Text>
              {Object.keys(eveningRoutine).map((key) => (
                <RoutineItem key={key} time="evening" name={key} isChecked={eveningRoutine[key]} label={key} />
              ))}
            </View>
          </View>
          {/* --- HAFTALIK ÖZEL BAKIM --- */}
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
                      <RoutineItem
                        key={item.id}
                        time="weekly" 
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




          {/* Uyarı Kutusu */}
          <View style={styles.alertBox}>
            <Ionicons name="time-outline" size={28} color={COLORS.alertText} style={{ marginRight: 15 }} />
            <View>
              <Text style={styles.alertTitle}>Dikkat! C Vitamini Serumunun</Text>
              <Text style={styles.alertTitle}>Süresi Doluyor.</Text>
              <Text style={styles.alertSubtitle}>PAO: 3 gün kaldı.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

//  styles sheet
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
  emptyText: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic', marginTop: 10 },
  routineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: COLORS.checked, borderColor: COLORS.checked },
  routineItemText: { fontSize: 14, color: COLORS.textSecondary },
  routineItemTextChecked: { color: '#9E9E9E', textDecorationLine: 'line-through' },
  alertBox: { backgroundColor: COLORS.alertBg, flexDirection: 'row', padding: 18, borderRadius: 15, alignItems: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '700', color: COLORS.alertText },
  alertSubtitle: { fontSize: 11, color: COLORS.alertText, marginTop: 4 },
  tabBar: { flexDirection: 'row', position: 'absolute', bottom: 0, height: 80, backgroundColor: COLORS.bgWhite, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: 20 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, marginTop: 5, color: COLORS.textSecondary },
  tabLabelFocused: { color: COLORS.accent, fontWeight: 'bold' },
  weeklyDayContainer: {
    marginBottom: 15,
  },
  dayLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 5
  },
  dayLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 6,
    textTransform: 'uppercase'
  },
  weeklyCard: {
    backgroundColor: '#FDFCFE', // Çok hafif morumsu beyaz
    padding: 15,
    borderRadius: 20,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.accent,
    // Hafif gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
});