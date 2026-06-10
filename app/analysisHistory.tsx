import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../service/apiConfig';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Renk Paleti - Home.tsx ile tutarlı
const COLORS = {
    bgPurple: '#ffe4f0',
    bgWhite: '#FFFFFF',
    textPrimary: '#58022c',
    textSecondary: '#616161',
    accent: '#7E57C2',
    accentLight: '#B39DDB',
    lightBg: '#F8F0FA',
    borderColor: '#E8D5F0',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#D32F2F',
    safe: '#2E7D32'
};

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
    const router = useRouter();
    const localParams = useLocalSearchParams();
    const globalParams = useGlobalSearchParams();
    const userId = localParams.userId || globalParams.userId || '1';

    const [history, setHistory] = useState<ScannedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newName, setNewName] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

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
                setHistory(prev =>
                    prev.map(item =>
                        item.id === productId
                            ? { ...item, productName: newName }
                            : item
                    )
                );

                setEditingId(null);
                setNewName('');
                Alert.alert("Başarılı ✨", "Ürün adı güncellendi.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Analizleri yüklüyorum...</Text>
            </View>
        );
    }

    const getRiskColor = (riskLevel: string) => {
        const level = riskLevel?.toLowerCase();
        if (level === 'safe' || level === 'güvenli') return COLORS.safe;
        if (level === 'warning' || level === 'uyarı') return COLORS.warning;
        return COLORS.danger;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return COLORS.safe;
        if (score >= 60) return COLORS.warning;
        return COLORS.danger;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>Geçmiş Analizlerim</Text>
                            <Text style={styles.subtitle}>Taradığınız tüm ürünleri göz atın</Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <MaterialCommunityIcons name="history" size={28} color={COLORS.accent} />
                        </View>
                    </View>
                }
                data={history}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
                scrollEnabled={true}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {/* Header with Date */}
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingId(item.id);
                                        setNewName(item.productName || '');
                                    }}
                                >
                                    {editingId === item.id ? (
                                        <View style={styles.editBox}>
                                            <TextInput
                                                value={newName}
                                                onChangeText={setNewName}
                                                style={styles.input}
                                                placeholder="Ürün adını gir"
                                                placeholderTextColor={COLORS.textSecondary}
                                            />
                                            <View style={styles.editActions}>
                                                <TouchableOpacity
                                                    style={[styles.button, styles.saveButton]}
                                                    onPress={() => updateProductName(item.id)}
                                                >
                                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                                    <Text style={styles.buttonText}>Kaydet</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.button, styles.cancelButton]}
                                                    onPress={() => {
                                                        setEditingId(null);
                                                        setNewName('');
                                                    }}
                                                >
                                                    <Ionicons name="close" size={16} color="#fff" />
                                                    <Text style={styles.buttonText}>İptal</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View>
                                            <Text style={styles.productName}>
                                                {item.productName || 'İsim eklenmemiş ✏️'}
                                            </Text>
                                            <Text style={styles.dateText}>
                                                {formatDate(item.createdAt)}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingId(item.id);
                                    setNewName(item.productName || '');
                                }}
                                style={styles.editIcon}
                            >
                                <MaterialCommunityIcons name="pencil" size={20} color={COLORS.accent} />
                            </TouchableOpacity>
                        </View>

                        {/* Score & Risk Badges */}
                        <View style={styles.badgeContainer}>
                            <View style={[
                                styles.badge,
                                { backgroundColor: getScoreColor(item.overallScore) + '20' }
                            ]}>
                                <Ionicons
                                    name="star"
                                    size={16}
                                    color={getScoreColor(item.overallScore)}
                                />
                                <Text style={[
                                    styles.badgeText,
                                    { color: getScoreColor(item.overallScore) }
                                ]}>
                                    {item.overallScore}/100
                                </Text>
                            </View>

                            <View style={[
                                styles.badge,
                                { backgroundColor: getRiskColor(item.riskLevel) + '20' }
                            ]}>
                                <MaterialCommunityIcons
                                    name={getRiskColor(item.riskLevel) === COLORS.safe ? "shield-check" : "alert-circle"}
                                    size={16}
                                    color={getRiskColor(item.riskLevel)}
                                />
                                <Text style={[
                                    styles.badgeText,
                                    { color: getRiskColor(item.riskLevel) }
                                ]}>
                                    {item.riskLevel || 'Bilinmiyor'}
                                </Text>
                            </View>
                        </View>

                        {/* Analysis Section */}
                        <View style={styles.analysisSection}>
                            <View style={styles.analysisTitleRow}>
                                <Ionicons name="document-text" size={18} color={COLORS.accent} />
                                <Text style={styles.analysisTitle}>Analiz Sonucu</Text>
                            </View>

                            <Text
                                style={styles.analysisText}
                                numberOfLines={expandedId === item.id ? undefined : 3}
                                ellipsizeMode="tail"
                            >
                                {item.analysisResult || 'Analiz sonucu bulunamadı.'}
                            </Text>

                            <TouchableOpacity
                                style={styles.expandBtnContainer}
                                onPress={() => toggleExpand(item.id)}
                            >
                                <Text style={styles.expandBtn}>
                                    {expandedId === item.id ? '🔼 Kapat' : '🔽 Devamını gör'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons
                            name="inbox-multiple-outline"
                            size={64}
                            color={COLORS.accentLight}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={styles.emptyTitle}>
                            Henüz taranmış ürün yok
                        </Text>
                        <Text style={styles.emptyText}>
                            AI Analiz sekmesinde ürünlerinizi taramaya başlayın ✨
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPurple,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: COLORS.bgPurple,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderColor,
        gap: 12
    },

    backButton: {
        padding: 8,
        backgroundColor: COLORS.bgWhite,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },

    title: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 2
    },

    subtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500'
    },

    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: COLORS.bgWhite,
        justifyContent: 'center',
        alignItems: 'center'
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600'
    },

    card: {
        backgroundColor: COLORS.bgWhite,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },

    productName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4
    },

    dateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500'
    },

    editIcon: {
        padding: 8,
        marginTop: -4
    },

    editBox: {
        backgroundColor: COLORS.lightBg,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.borderColor
    },

    input: {
        backgroundColor: COLORS.bgWhite,
        borderWidth: 1.5,
        borderColor: COLORS.borderColor,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: 12,
        fontWeight: '500'
    },

    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8
    },

    button: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6
    },

    saveButton: {
        backgroundColor: COLORS.accent
    },

    cancelButton: {
        backgroundColor: COLORS.textSecondary
    },

    buttonText: {
        color: COLORS.bgWhite,
        fontWeight: '700',
        fontSize: 12
    },

    badgeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14
    },

    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },

    badgeText: {
        fontSize: 13,
        fontWeight: '700'
    },

    analysisSection: {
        backgroundColor: COLORS.lightBg,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderColor
    },

    analysisTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },

    analysisTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textPrimary
    },

    analysisText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 20,
        fontWeight: '500'
    },

    expandBtnContainer: {
        marginTop: 10,
        paddingVertical: 6
    },

    expandBtn: {
        color: COLORS.accent,
        fontWeight: '700',
        fontSize: 13
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
        textAlign: 'center'
    },

    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500'
    }
});