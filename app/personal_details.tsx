import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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

// BİLEŞEN DIŞINDA TANIMLANDI (Focus hatasını çözen kısım)
const EditableInfoRow = ({ label, value, field, icon, isEditing, editedUser, setEditedUser }: any) => (
    <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color="#5D4F8D" />
        </View>
        <View style={styles.textGroup}>
            <Text style={styles.label}>{label}</Text>
            {isEditing ? (
                <TextInput
                    style={styles.input}
                    value={editedUser[field]?.toString()}
                    onChangeText={(text) => setEditedUser({ ...editedUser, [field]: text })}
                    autoFocus={false}
                />
            ) : (
                <Text style={styles.value}>{value || 'Belirtilmemiş'}</Text>
            )}
        </View>
    </View>
);

export default function PersonalDetailsScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<any>(null);

    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setEditedUser(data);
            }
        } catch (error) {
            console.error("Hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`${BASE_URL}/users/update/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedUser),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setUser(updatedData);
                setIsEditing(false);
                Alert.alert("Başarılı", "Bilgilerin güncellendi! ✨");
            }
        } catch (error) {
            Alert.alert("Hata", "Güncelleme başarısız.");
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
                    <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>

                    {/* Düzenle / Vazgeç Yazısı */}
                    <TouchableOpacity
                        onPress={() => {
                            if (isEditing) setEditedUser(user); // Vazgeçilirse eski veriye dön
                            setIsEditing(!isEditing);
                        }}
                    >
                        <Text style={[styles.editText, isEditing && styles.cancelText]}>
                            {isEditing ? "Vazgeç" : "Düzenle"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.imageSection}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                                style={styles.largeAvatar}
                            />
                        </View>
                        <Text style={styles.displayName}>{user?.name} {user?.surname}</Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <EditableInfoRow icon="person-outline" label="Ad" value={user?.name} field="name" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                        <EditableInfoRow icon="person-outline" label="Soyad" value={user?.surname} field="surname" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                        <EditableInfoRow icon="at-outline" label="Kullanıcı Adı" value={user?.userName} field="userName" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                        <EditableInfoRow icon="mail-outline" label="E-posta" value={user?.email} field="email" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />
                        <EditableInfoRow icon="water-outline" label="Cilt Türü" value={user?.skinType} field="skinType" isEditing={isEditing} editedUser={editedUser} setEditedUser={setEditedUser} />

                        {/* Alt Kısımdaki Kaydet Butonu */}
                        {isEditing && (
                            <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
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
    imageSection: { alignItems: 'center', marginVertical: 20 },
    avatarWrapper: { padding: 5, backgroundColor: '#FFF', borderRadius: 60, elevation: 5 },
    largeAvatar: { width: 100, height: 100, borderRadius: 50 },
    displayName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 10 },
    detailsCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 25, padding: 20, elevation: 3 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1D7F2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    textGroup: { flex: 1 },
    label: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
    value: { fontSize: 16, color: '#333', fontWeight: '600' },
    input: { fontSize: 16, color: '#333', borderBottomWidth: 1, borderBottomColor: '#5D4F8D', paddingVertical: 2 },
    saveFullButton: { backgroundColor: '#5D4F8D', borderRadius: 15, padding: 15, marginTop: 25, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});