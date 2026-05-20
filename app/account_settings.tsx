import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../service/apiConfig';

// Focus hatasını engellemek için bileşen dışında tanımlıyoruz
const AccountInfoRow = ({ label, value, field, icon, isEditing, editedData, setEditedData, isPassword }: any) => (
    <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color="#5D4F8D" />
        </View>
        <View style={styles.textGroup}>
            <Text style={styles.label}>{label}</Text>
            {isEditing ? (
                <TextInput
                    style={styles.input}
                    value={editedData[field]?.toString()}
                    onChangeText={(text) => setEditedData({ ...editedData, [field]: text })}
                    secureTextEntry={isPassword} // Şifre alanı için gizleme
                    autoCapitalize="none"
                />
            ) : (
                <Text style={styles.value}>
                    {isPassword ? "********" : (value || 'Belirtilmemiş')}
                </Text>
            )}
        </View>
    </View>
);

export default function AccountSettingsScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({ email: '', password: '' });

    useEffect(() => {
        fetchAccountDetails();
    }, [userId]);

    const fetchAccountDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setEditedData({ email: data.email, password: '' }); // Şifreyi güvenlik için boş başlatıyoruz
            }
        } catch (error) {
            console.error("Hesap bilgileri yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isEditing && editedData.password === '') {
            Alert.alert("Uyarı", "Güvenlik için şifre alanını boş bırakamazsınız.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/users/update/account/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedData),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setUser(updatedData);
                setIsEditing(false);
                Alert.alert("Başarılı", "Hesap bilgileriniz güncellendi! 🔐");
            }
        } catch (error) {
            Alert.alert("Hata", "Güncelleme yapılamadı.");
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#5D4F8D" style={{ flex: 1 }} />;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hesap Ayarları</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Text style={[styles.editText, isEditing && styles.cancelText]}>
                            {isEditing ? "Vazgeç" : "Düzenle"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.infoBox}>
                        <Ionicons name="shield-checkmark-outline" size={50} color="#5D4F8D" />
                        <Text style={styles.infoBoxTitle}>Güvenlik Bilgileri</Text>
                        <Text style={styles.infoBoxSub}>E-posta ve şifre bilgilerinizi buradan yönetebilirsiniz.</Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <AccountInfoRow
                            icon="mail-outline"
                            label="E-Posta Adresi"
                            value={user?.email}
                            field="email"
                            isEditing={isEditing}
                            editedData={editedData}
                            setEditedData={setEditedData}
                        />
                        <AccountInfoRow
                            icon="lock-closed-outline"
                            label="Yeni Şifre"
                            value="********"
                            field="password"
                            isEditing={isEditing}
                            editedData={editedData}
                            setEditedData={setEditedData}
                            isPassword={true}
                        />

                        {isEditing && (
                            <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Hesabı Güncelle</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1D7F2' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    editText: { color: '#5D4F8D', fontWeight: 'bold', fontSize: 16 },
    cancelText: { color: '#FF5252' },
    scrollContent: { paddingBottom: 40 },
    infoBox: { alignItems: 'center', marginVertical: 30, paddingHorizontal: 40 },
    infoBoxTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 10 },
    infoBoxSub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5 },
    detailsCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 25, padding: 20, elevation: 3 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E1D7F2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textGroup: { flex: 1 },
    label: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
    value: { fontSize: 16, color: '#333', fontWeight: '600' },
    input: { fontSize: 16, color: '#333', borderBottomWidth: 1, borderBottomColor: '#5D4F8D', paddingVertical: 2 },
    saveFullButton: { backgroundColor: '#5D4F8D', borderRadius: 15, padding: 15, marginTop: 25, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});