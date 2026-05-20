import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image, Platform, StatusBar as RNStatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    const [listLoading, setListLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
  



    // QA Test Logu
    console.log("PostDetail Sayfasına Gelen Parametreler -> PostID:", postId, "UserID:", userId);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    // 1. GET: Yorumları Backend'den Çekme
    const fetchComments = async () => {
        try {
            setListLoading(true);
            const response = await fetch(`${BASE_URL}/comments/post/${postId}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Yorumlar çekilirken hata oluştu:", error);
        } finally {
            setListLoading(false);
        }
    };

    // Yeni Yorum Gönderme

    const handleSendComment = async () => {

        console.log("Yorum Gönder Butonuna Basıldı. Gönderilmek istenen metin:", newComment);

        if (!newComment || !newComment.trim()) {
            console.warn("QA Uyarısı: Boş yorum gönderilmeye çalışıldı, engellendi.");
            return;
        }

        try {
            setIsSubmitting(true); // İstek atılırken çift tıklamayı engellemek için loading'i aç

            const response = await fetch(`${BASE_URL}/comments/create/${postId}/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: newComment.trim() // Metnin başındaki ve sonundaki gereksiz boşlukları temizleyerek gönder
            });

            if (response.ok) {
                console.log("Yorum başarıyla veritabanına kaydedildi!");
                setNewComment(''); // Giriş alanını temizle
                fetchComments(); // Listeyi anında yenile
            } else {
                console.error("Yorum eklenirken backend hata döndürdü. Statü:", response.status);
            }
        } catch (error) {
            console.error("Yorum gönderilirken ağ hatası oluştu:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Yorum Beğenme / Beğeniyi Geri Alma (Toggle Like)
    const handleToggleLike = async (commentId: number) => {
        if (!userId || userId === 'undefined') {
            alert("Beğeni yapabilmek için oturum açmış olmanız gerekir.");
            return;
        }

        try {

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
            {listLoading ? (
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
         <View style={[
                styles.inputContainer,
               
            ]}>
                <Image
                    source={{ uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                    style={styles.userAvatar}
                />
                
                <View style={[
                    styles.inputWrapper,
                   
                ]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Düşüncelerinizi paylaşın..."
                        placeholderTextColor="#bbb"
                        value={newComment}
                        onChangeText={setNewComment}
                      
                        multiline
                        maxLength={500}
                        editable={!isSubmitting}
                        scrollEnabled={false}
                    />
                    {newComment.length > 0 && (
                        <Text style={styles.charCount}>{newComment.length}/500</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        newComment.trim().length > 0 && styles.sendButtonActive
                    ]}
                    onPress={handleSendComment}
                    disabled={isSubmitting || !newComment.trim()}
                    activeOpacity={0.6}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size={18} color="#fff" />
                    ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1D7F2', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0, },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#E1D7F2',
        borderBottomWidth: 1, // Header'ı içerikten ayırmak için çok hafif bir çizgi
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    headerTitle: {
        fontSize: 18,
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
    listContainer: { padding: 15 },
    commentCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2, marginHorizontal: 2 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#EEE' },
    authorInfo: { marginLeft: 10, flex: 1 },
    authorName: { fontWeight: 'bold', color: '#444', fontSize: 14 },
    timeText: { fontSize: 11, color: '#999', marginTop: 2 },
    commentContent: { color: '#555', fontSize: 14, lineHeight: 20, marginLeft: 45 },
    likeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    likeCountText: { marginLeft: 4, fontSize: 12, color: '#666' },
    emptyText: { textAlign: 'center', color: '#777', marginTop: 40, fontSize: 14 },
   inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'android' ? 24 : 16,
        backgroundColor: '#FAFAFA',
        alignItems: 'flex-end',
        borderTopWidth: 0.5,
        borderTopColor: '#E0E0E0',
        gap: 10,

    },
     inputContainerFocused: {
        backgroundColor: '#FFF',
        borderTopColor: '#5D4F8D',
        borderTopWidth: 1,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8E8E8',
    },
     inputWrapper: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        flexDirection: 'column',
    },

    inputWrapperFocused: {
        borderColor: '#5D4F8D',
        backgroundColor: '#FAFAFA',
        elevation: 4,
        shadowColor: '#5D4F8D',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
     input: {
        fontSize: 14,
        color: '#333',
        maxHeight: 80,
        paddingVertical: 0,
        lineHeight: 18,
    },

     charCount: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        alignSelf: 'flex-end',
    },

    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },

    sendButtonActive: {
        backgroundColor: '#5D4F8D',
        elevation: 4,
        shadowColor: '#5D4F8D',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
});