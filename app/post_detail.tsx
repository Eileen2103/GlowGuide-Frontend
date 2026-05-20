import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BASE_URL } from '../service/apiConfig';

// Backend CommentsResponseDto ile %100 Uyumlu Interface
interface Comment {
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    authorFullName: string;
    authorAvatarUrl: string | null;
    likeCount: number;
}

export default function PostDetailScreen() {
    const router = useRouter();
    const { postId, userId } = useLocalSearchParams(); // Forum sayfasından gelen parametreler

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');



    // QA Test Logu
    console.log("PostDetail Sayfasına Gelen Parametreler -> PostID:", postId, "UserID:", userId);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    // 1. GET: Yorumları Backend'den Çekme
    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/comments/post/${postId}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Yorumlar çekilirken hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. POST: Yeni Yorum Gönderme
    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        try {
            // Backend Controller'daki `@RequestBody String content` yapısına uygun gönderim
            const response = await fetch(`${BASE_URL}/api/comments/create/${postId}/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' }, // Backend String beklediği için text/plain
                body: newComment
            });

            if (response.ok) {
                setNewComment('');
                fetchComments(); // Listeyi yenile yeni yorum anında düşsün
            }
        } catch (error) {
            console.error("Yorum gönderilirken hata oluştu:", error);
        }
    };

    // Yorum Beğenme / Beğeniyi Geri Alma (Toggle Like)
    const handleToggleLike = async (commentId: number) => {
        if (!userId || userId === 'undefined') {
            alert("Beğeni yapabilmek için oturum açmış olmanız gerekir.");
            return;
        }

        try {
            // Backend'de yazdığımız endpoint: /comments/{commentId}/like/{userId}
            const response = await fetch(`${BASE_URL}/comments/${commentId}/like/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                // Başarılıysa yorumları yeniden çek ki beğeni sayısı (+1 veya -1) anında güncelle
                fetchComments();
            } else {
                console.error("Beğeni işlemi başarısız oldu.");
            }
        } catch (error) {
            console.error("Beğeni isteği atılırken hata:", error);
        }
    };

    // Yorum Kartı Tasarımı
    const renderCommentItem = ({ item }: { item: Comment }) => (
        <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
                <Image
                    source={{ uri: item.authorAvatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                    style={styles.avatar}
                />
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{String(item.authorFullName || 'Anonim Geliştirici')}</Text>
                    <Text style={styles.timeText}>{String(item.createdAt || '')}</Text>
                </View>

                {/* BEĞENİ BUTONU GÜNCELLEMESİ */}
                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => handleToggleLike(item.id)} // Tıklanınca yorumun ID'sini gönderiyoruz
                >
                    <Ionicons name="heart-outline" size={16} color="#888" />
                    <Text style={styles.likeCountText}>{String(item.likeCount ?? 0)}</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.commentContent}>{item.content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header - Tertemiz ve Yorum Satırsız */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push({ pathname: "/(tabs)/forum", params: { userId: userId } })}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yorumlar</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Yorum Listesi */}
            {loading ? (
                <ActivityIndicator size="large" color="#5D4F8D" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Henüz yorum yapılmamış. İlk yorumu sen yap!</Text>
                    }
                />
            )}

            {/* Yorum Yazma Alanı */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Yorumunuzu yazın..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendComment}>
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1D7F2' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#E1D7F2'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        flex: 1
    },
    backButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: 50
    },
    headerRightPlaceholder: {
        width: 50 // Sol taraftaki geri butonuyla tam eşit genişlikte olup başlığı kusursuz ortalar
    },
    listContainer: { padding: 20 },
    commentCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#EEE' },
    authorInfo: { marginLeft: 10, flex: 1 },
    authorName: { fontWeight: 'bold', color: '#444', fontSize: 14 },
    timeText: { fontSize: 11, color: '#999', marginTop: 2 },
    commentContent: { color: '#555', fontSize: 14, lineHeight: 20, marginLeft: 45 },
    likeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    likeCountText: { marginLeft: 4, fontSize: 12, color: '#666' },
    emptyText: { textAlign: 'center', color: '#777', marginTop: 40, fontSize: 14 },
    inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE' },
    input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 80, fontSize: 14 },
    sendButton: { backgroundColor: '#5D4F8D', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});