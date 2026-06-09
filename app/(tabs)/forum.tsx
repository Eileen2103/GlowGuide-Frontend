import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../service/apiConfig';

interface ForumPost {
    id: number;
    title: string;
    content: string;
    authorFullName: string;   
    authorAvatarUrl: string | null; 
    commentCount: number;
    createdAt: string;        
}

// 🎯 Filtreleme Seçenekleri Tipi
type FilterType = 'NEWEST' | 'OLDEST';

export default function ForumScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    console.log("ForumScreen Ana Sayfasındaki userId Değeri:", userId);

    // --- 1. TÜM STATE'LER ---
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]); // 🎯 Ekrana basılacak filtrelenmiş liste
    const [loading, setLoading] = useState(true);

    const [isModalVisible, setModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false); // 🎯 Filtre penceresi kontrolü
    const [currentFilter, setCurrentFilter] = useState<FilterType>('NEWEST'); // 🎯 Varsayılan filtre: En Yeni
    
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        if (!userId || userId === 'undefined') {
            router.replace('/');
        }
    }, [userId, router]);

    useEffect(() => {
        fetchPosts();
    }, []);

    // 🎯 Filtre değiştiğinde veya post listesi güncellendiğinde tetiklenen sıralama motoru
    useEffect(() => {
        applyDateFilter(posts, currentFilter);
    }, [currentFilter, posts]);

    // --- 2. FONKSİYONLAR ---

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/posts/getAll`);

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                console.error("Backend hata kodu döndürdü:", response.status);
            }
        } catch (error) {
            console.error("Postlar yüklenirken ağ hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🎯 QA Güvenli Tarih Sıralama Algoritması
    const applyDateFilter = (allPosts: ForumPost[], filter: FilterType) => {
        let sorted = [...allPosts];
        
        sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            
            // Eğer tarihler parse edilemezse fallback olarak ID'leri kıyasla (Çökme Koruması)
            if (isNaN(dateA) || isNaN(dateB)) {
                return filter === 'NEWEST' ? b.id - a.id : a.id - b.id;
            }

            return filter === 'NEWEST' ? dateB - dateA : dateA - dateB;
        });

        setFilteredPosts(sorted);
    };

    const handleCreatePost = async () => {
        if (!userId || userId === 'undefined') {
            alert("Oturum bilginiz bulunamadı. Lütfen tekrar giriş yapın.");
            return;
        }

        if (!newTitle.trim() || !newContent.trim()) {
            alert("Lütfen tüm alanları doldurun");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/posts/add/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    content: newContent
                }),
            });

            if (response.ok) {
                setModalVisible(false);
                setNewTitle('');
                setNewContent('');
                fetchPosts();
            }
        } catch (error) {
            console.error("Post oluşturulurken hata:", error);
        }
    };

    const renderPostItem = ({ item }: { item: ForumPost }) => (
        <TouchableOpacity
            style={styles.postCard}
            onPress={() => router.push({ pathname: "/post_detail", params: { postId: item.id, userId: userId } })}
        >
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: item.authorAvatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                    style={styles.authorAvatar}
                />
                <Text style={styles.authorName}>{item.authorFullName}</Text>
                <TouchableOpacity style={styles.replyIcon}>
                    <Ionicons name="arrow-undo-outline" size={20} color="#888" />
                </TouchableOpacity>
            </View>

            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>

            <View style={styles.cardFooter}>
                <Text style={styles.timeText}>{item.createdAt}</Text>
                <Text style={styles.commentText}>{item.commentCount} yorum</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Topluluk Sayfası</Text>
            </View>

            {/* Aksiyon Barı */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.addPostButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.addPostText}>Başlık Aç</Text>
                </TouchableOpacity>

                {/* 🎯 Filtrele Butonu Tetikleyicisi */}
                <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons 
                        name={currentFilter === 'NEWEST' ? "trending-up-outline" : "trending-down-outline"} 
                        size={20} 
                        color="#5D4F8D" 
                    />
                    <Text style={[styles.filterText, { color: '#5D4F8D', fontWeight: 'bold' }]}>
                        {currentFilter === 'NEWEST' ? 'En Yeni' : 'En Eski'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Yükleniyor check'i */}
            {loading ? (
                <ActivityIndicator size="large" color="#5D4F8D" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={filteredPosts} // 🎯 Buraya artık sıralanmış listeyi besliyoruz
                    renderItem={renderPostItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Başlık Açma Modalı */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Yeni Başlık Oluştur</Text>
                        <TextInput
                            placeholder="Başlık"
                            style={styles.modalInput}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />
                        <TextInput
                            placeholder="Sorun nedir?"
                            style={[styles.modalInput, styles.textArea]}
                            multiline
                            value={newContent}
                            onChangeText={setNewContent}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreatePost} style={styles.submitBtn}>
                                <Text style={{ color: 'white' }}>Paylaş</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 🎯 YENİ EKLENEN: Tarih Filtreleme Seçim Penceresi (Modal) */}
            <Modal
                visible={isFilterModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.filterModalOverlay}>
                    <View style={styles.filterModalContent}>
                        <Text style={styles.filterModalTitle}>Sıralama Seçeneği</Text>
                        
                        <TouchableOpacity 
                            style={[styles.filterOption, currentFilter === 'NEWEST' && styles.filterOptionActive]}
                            onPress={() => {
                                setCurrentFilter('NEWEST');
                                setFilterModalVisible(false);
                            }}
                        >
                            <Ionicons name="time-outline" size={20} color={currentFilter === 'NEWEST' ? '#5D4F8D' : '#666'} />
                            <Text style={[styles.filterOptionText, currentFilter === 'NEWEST' && styles.filterOptionTextActive]}>En Yeni Başlıklar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.filterOption, currentFilter === 'OLDEST' && styles.filterOptionActive]}
                            onPress={() => {
                                setCurrentFilter('OLDEST');
                                setFilterModalVisible(false);
                            }}
                        >
                            <Ionicons name="hourglass-outline" size={20} color={currentFilter === 'OLDEST' ? '#5D4F8D' : '#666'} />
                            <Text style={[styles.filterOptionText, currentFilter === 'OLDEST' && styles.filterOptionTextActive]}>En Eski Başlıklar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.filterCloseBtn}
                            onPress={() => setFilterModalVisible(false)}
                        >
                            <Text style={styles.filterCloseBtnText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1D7F2' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    searchCircle: { backgroundColor: '#CCC', padding: 8, borderRadius: 20 },
    actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
    addPostButton: { backgroundColor: '#A594F1', flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    addPostText: { color: 'white', fontWeight: '600', marginLeft: 5 },
    filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, elevation: 2 },
    filterText: { marginLeft: 5, fontSize: 13 },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    postCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE' },
    authorName: { marginLeft: 10, fontWeight: 'bold', flex: 1, color: '#444' },
    postTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    postContent: { color: '#666', fontSize: 14, lineHeight: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
    timeText: { fontSize: 12, color: '#999' },
    commentText: { fontSize: 12, color: '#999', fontWeight: '600' },
    replyIcon: { padding: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 25, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInput: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 10 },
    textArea: { height: 100, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    cancelBtn: { padding: 12, flex: 1, alignItems: 'center' },
    submitBtn: { backgroundColor: '#5D4F8D', padding: 12, flex: 1, alignItems: 'center', borderRadius: 10 },

    // 🎯 YENİ EKLENEN: Filtre Modalı Tasarım Stilleri
    filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    filterModalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, width: '100%', elevation: 5 },
    filterModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    filterOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 10, backgroundColor: '#F8F5FC' },
    filterOptionActive: { backgroundColor: '#E1D7F2', borderWidth: 1, borderColor: '#5D4F8D' },
    filterOptionText: { marginLeft: 12, fontSize: 15, fontWeight: '500', color: '#555' },
    filterOptionTextActive: { color: '#5D4F8D', fontWeight: 'bold' },
    filterCloseBtn: { marginTop: 15, alignSelf: 'center', padding: 10 },
    filterCloseBtnText: { color: '#999', fontSize: 15, fontWeight: '600' }
});