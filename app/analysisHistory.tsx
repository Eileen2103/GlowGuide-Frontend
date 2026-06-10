import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BASE_URL } from '../service/apiConfig';

interface ScannedProduct {
    id: number;
    productName: string;
    imageUrl: string;
    overallScore: number;
    riskLevel: string;
    createdAt: string;
    analysisResult: string;
}

export default function AnalysisHistoryScreen() {
    const localParams = useLocalSearchParams();
    const globalParams = useGlobalSearchParams();
    const userId = localParams.userId || globalParams.userId || '1';

    const [history, setHistory] = useState<ScannedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newName, setNewName] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchAnalysisHistory = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${BASE_URL}/scannedProducts/history/${userId}`);

            let data = [];
            if (response.ok && response.status !== 204) {
                const text = await response.text();
                data = text ? JSON.parse(text) : [];
            }

            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Geçmiş analizler çekilirken hata oluştu:", error);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysisHistory();
    }, [userId]);

    const updateProductName = async (productId: number) => {
        try {
            const response = await fetch(
                `${BASE_URL}/scannedProducts/${productId}/name`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productName: newName
                    })
                }
            );

            if (response.ok) {
                // 🔥 Optimistic UI update
                setHistory(prev =>
                    prev.map(item =>
                        item.id === productId
                            ? { ...item, productName: newName }
                            : item
                    )
                );

                setEditingId(null);
                setNewName('');

                Alert.alert("Başarılı", "Ürün adı güncellendi.");
            }

        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6C5CE7" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Geçmiş Analizlerim</Text>

            <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>

                        {/* PRODUCT NAME SECTION */}
                        <View style={styles.nameSection}>
                            {editingId === item.id ? (
                                <View style={styles.editBox}>

                                    <TextInput
                                        value={newName}
                                        onChangeText={setNewName}
                                        style={styles.input}
                                        placeholder="Ürün adını gir"
                                    />

                                    <View style={styles.editActions}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.saveButton]}
                                            onPress={() => updateProductName(item.id)}
                                        >
                                            <Text style={styles.buttonText}>Kaydet</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.button, styles.cancelButton]}
                                            onPress={() => {
                                                setEditingId(null);
                                                setNewName('');
                                            }}
                                        >
                                            <Text style={styles.buttonText}>İptal</Text>
                                        </TouchableOpacity>
                                    </View>

                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingId(item.id);
                                        setNewName(item.productName || '');
                                    }}
                                >
                                    <Text style={styles.productName}>
                                        {item.productName || 'İsim eklenmemiş'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.analysisSection}>

                            <TouchableOpacity
                                onPress={() =>
                                    setExpandedId(expandedId === item.id ? null : item.id)
                                }
                                style={styles.analysisHeader}
                            >
                                <Text style={styles.analysisTitle}>Analiz Sonucu</Text>

                                <Text style={styles.expandText}>
                                    {expandedId === item.id ? 'Kapat ▲' : 'Aç ▼'}
                                </Text>
                            </TouchableOpacity>

                            {expandedId === item.id && (
                                <View style={styles.analysisBox}>
                                    <Text style={styles.analysisText}>
                                        {item.analysisResult || 'Analiz sonucu bulunamadı.'}
                                    </Text>
                                </View>
                            )}

                        </View>
                        {/* BADGES */}
                        <View style={styles.badgeContainer}>
                            <View style={[
                                styles.scoreBadge,
                                { backgroundColor: item.overallScore >= 70 ? '#4CAF50' : '#FF9800' }
                            ]}>
                                <Text style={styles.badgeText}>
                                    Skor: {item.overallScore}/100
                                </Text>
                            </View>

                            <View style={[
                                styles.riskBadge,
                                { backgroundColor: item.riskLevel?.toLowerCase() === 'safe' ? '#2E7D32' : '#D32F2F' }
                            ]}>
                                <Text style={styles.badgeText}>
                                    {item.riskLevel || 'Bilinmiyor'}
                                </Text>
                            </View>
                        </View>

                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>
                            Henüz taranmış bir ürününüz yok. ✨
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20 },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 20,
        textAlign: 'center'
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40
    },

    emptyText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '500'
    },

    card: {
        backgroundColor: '#F7F7F7',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#EEE'
    },

    nameSection: {
        marginBottom: 10
    },

    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },

    editBox: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee'
    },

    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        marginBottom: 10
    },

    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
    },

    button: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8
    },

    saveButton: {
        backgroundColor: '#4CAF50'
    },

    cancelButton: {
        backgroundColor: '#B0B0B0'
    },

    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    },

    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 5
    },

    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },

    riskBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },

    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold'
    },
    analysisSection: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden'
    },

    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#F0F0F0'
    },

    analysisTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },

    expandText: {
        fontSize: 12,
        color: '#666'
    },

    analysisBox: {
        padding: 12,
        maxHeight: 200, // 🔥 çok uzamasın
    },

    analysisText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 18
    },
});