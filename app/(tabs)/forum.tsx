import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BASE_URL } from '../../service/apiConfig';

// 1. Backend PostResponseDto ile %100 Uyumlu Interface
interface ForumPost {
    id: number;
    title: string;
    content: string;
    authorFullName: string;   // Backend'den birleşik geliyor
    authorAvatarUrl: string | null; // DTO'daki tam isim
    commentCount: number;
    createdAt: string;        // Backend'den String formatında geliyor
}

export default function ForumScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();

    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

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
    // 3. POST API İsteği (Yeni Başlık Açma)
    // 2. userId kontrolünü sadece post atarken yapıyoruz (Güvenlik Duvarı)
    const handleCreatePost = async () => {
        // Negatif Test Koruması
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

    // 4. Kart Tasarımı (Render Item)
    const renderPostItem = ({ item }: { item: ForumPost }) => (
        <TouchableOpacity
            style={styles.postCard}
            // "/forum/post-detail" yerine hata mesajında var olduğunu gördüğüm "/(tabs)/post_detail" rotasını kullan
            onPress={() => router.push({ pathname: "/post_detail", params: { postId: item.id, userId: userId } })}
        >
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: item.authorAvatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                    style={styles.authorAvatar}
                />
                {/* DTO'dan gelen düzleştirilmiş isim */}
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
                <TouchableOpacity style={styles.searchCircle}>
                    <Ionicons name="search" size={20} color="#333" />
                </TouchableOpacity>
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

                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options-outline" size={20} color="#333" />
                    <Text style={styles.filterText}>Filtrele</Text>
                </TouchableOpacity>
            </View>

            {/* Yükleniyor check'i */}
            {loading ? (
                <ActivityIndicator size="large" color="#5D4F8D" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={posts}
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
        </SafeAreaView>
    );
}

// ... (Paylaştığın stiller aynen kalıyor)

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1D7F2' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    searchCircle: { backgroundColor: '#CCC', padding: 8, borderRadius: 20 },
    actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
    addPostButton: { backgroundColor: '#A594F1', flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    addPostText: { color: 'white', fontWeight: '600', marginLeft: 5 },
    filterButton: { flexDirection: 'row', alignItems: 'center' },
    filterText: { marginLeft: 5, color: '#333', fontWeight: '500' },
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
    // Modal Stilleri
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 25, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInput: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 10 },
    textArea: { height: 100, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    cancelBtn: { padding: 12, flex: 1, alignItems: 'center' },
    submitBtn: { backgroundColor: '#5D4F8D', padding: 12, flex: 1, alignItems: 'center', borderRadius: 10 }
});