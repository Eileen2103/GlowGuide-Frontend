import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


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
  // 2. Başlangıçta boş state'ler (Kullanıcı girişi yapılmadığı için)
  const [morningRoutine, setMorningRoutine] = useState<RoutineState>({});
  const [eveningRoutine, setEveningRoutine] = useState<RoutineState>({});

  // İşaretleme (Check) fonksiyonu - TS uyumlu
  const toggleRoutine = (time: 'morning' | 'evening', item: string) => {
    if (time === 'morning') {
      setMorningRoutine({ ...morningRoutine, [item]: !morningRoutine[item] });
    } else {
      setEveningRoutine({ ...eveningRoutine, [item]: !eveningRoutine[item] });
    }
  };

  // Rutin maddesini çizen alt bileşen
  const RoutineItem = ({ time, name, isChecked, label }: { time: 'morning' | 'evening', name: string, isChecked: boolean, label: string }) => (
    <TouchableOpacity style={styles.routineItem} onPress={() => toggleRoutine(time, name)}>
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={[styles.routineItemText, isChecked && styles.routineItemTextChecked]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* --- ÜST KISIM (Header) --- */}
        <View style={styles.headerSection}>
          <Text style={styles.brandTitle}>GlowGuide</Text>
          
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>
              Günün Güzel{"\n"}Geçsin,{"\n"}Selin! ✨
            </Text>
            
            {/* Hava Durumu Kartı */}
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

        {/* --- ALT KISIM (Rutinler) --- */}
        <View style={styles.mainSection}>
          <Text style={styles.sectionTitle}>GÜNLÜK RUTİNİM</Text>
          
          <View style={styles.routinesRow}>
            {/* Sabah Rutini Kartı */}
            <View style={styles.routineCard}>
              <Text style={styles.routineCardTitle}>Sabah Rutini</Text>
              {Object.keys(morningRoutine).length > 0 ? (
                Object.keys(morningRoutine).map((key) => (
                  <RoutineItem key={key} time="morning" name={key} isChecked={morningRoutine[key]} label={key} />
                ))
              ) : (
                <Text style={styles.emptyText}>Henüz ürün eklenmedi</Text>
              )}
            </View>

            {/* Akşam Rutini Kartı */}
            <View style={styles.routineCard}>
              <Text style={styles.routineCardTitle}>Akşam Rutini</Text>
              {Object.keys(eveningRoutine).length > 0 ? (
                Object.keys(eveningRoutine).map((key) => (
                  <RoutineItem key={key} time="evening" name={key} isChecked={eveningRoutine[key]} label={key} />
                ))
              ) : (
                <Text style={styles.emptyText}>Henüz ürün eklenmedi</Text>
              )}
            </View>
          </View>

          {/* Uyarı Kutusu */}
          <View style={styles.alertBox}>
            <Ionicons name="time-outline" size={28} color={COLORS.alertText} style={{ marginRight: 15 }} />
            <View>
              <Text style={styles.alertTitle}>Dikkat! C Vitamini Serumunun</Text>
              <Text style={styles.alertTitle}>Süresi Doluyor.</Text>
              <Text style={styles.alertSubtitle}>Açıldıktan sonra 6 ay (PAO), 3 gün kaldı.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- ALT MENÜ (Tab Bar - Statik) --- */}
      <View style={styles.tabBar}>
        <TabItem icon="home" label="Ev" focused />
        <TabItem icon="shopping-bag" label="Ürünler" />
        <TabItem icon="brain" label="AI Analiz" />
        <TabItem icon="chatbubble-ellipses" label="Sohbet" />
        <TabItem icon="user-circle" label="Profil" />
      </View>
    </SafeAreaView>
  );
}

// Tab Item Bileşeni
const TabItem = ({ icon, label, focused }: { icon: string, label: string, focused?: boolean }) => {
  const IconComponent = (icon === 'brain' || icon === 'shopping-bag') ? FontAwesome5 : MaterialCommunityIcons;
  const iconName: any = icon === 'home' ? 'home-variant' : icon === 'chatbubble-ellipses' ? 'chatbubble-ellipses' : icon === 'user-circle' ? 'account-circle' : icon;

  return (
    <TouchableOpacity style={styles.tabItem}>
      <IconComponent name={iconName} size={24} color={focused ? COLORS.accent : COLORS.textSecondary} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </TouchableOpacity>
  );
};

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
});