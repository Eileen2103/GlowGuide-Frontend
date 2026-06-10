import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Kamera/Galeri izni ve tetikleme için
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../service/apiConfig';



export default function AIAssistantScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const validUserId = userId && userId !== 'undefined' ? userId : '1';

    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Kamerayı Açma ve Fotoğraf Çekme Fonksiyonu
    const openCamera = async () => {
        // Kamera İzni İsteme
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("İzin Gerekli", "Ürün içerik fotoğrafı çekebilmek için kamera izni vermelisiniz.");
            return;
        }

        // Kamerayı Fırlat
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.4, //  4-5 MB'lık resmi kalitesini bozmadan 400KB'a düşürür, backend'i asla yormaz!
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            setSelectedImage(imageUri);


            handleImageAnalysis(imageUri);
        }
    };


    const handleImageAnalysis = async (uri: string) => {
        try {
            setLoading(true);



            //  Şu anki backend endpoinr sadece string prompt alıyor.
            // Fotoğrafı multipart/form-data ile göndermek için ileride backend'e @RequestParam("image") MultipartFile eklenebilir.
            // Şimdilik test amaçlı backend'e "Fotoğraf başarıyla yakalandı, içerik analizi yapılıyor" promptu simüle et
            const testPrompt = "Bir kozmetik ürününün içindekiler listesi fotoğrafı çekildi. Bana bu içeriklerin genel zararlarını özetle.";

            const formData = new FormData();
            const uriParts = uri.split('/');
            const fileName = uriParts[uriParts.length - 1];
            const fileType = fileName.split('.').pop();

            formData.append('image', {
                uri: uri,
                name: fileName,
                type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
            } as any);

            // Orkestratörün (run metodu) beklediği diğer zorunlu parametreleri form-data'ya ekliyoruz
            formData.append('productName', 'Tarayıcı Ürünü'); // Statik veya kullanıcıdan alınan bir isim paslanabilir
            formData.append('imageUrl', uri); // Cihaz lokal URI'si veya uzak sunucu linki

            console.log(`QA KONTROL - Sunucuya Resim Gönderiliyor. URL: ${BASE_URL}/analysis/${validUserId}`);

            const response = await fetch(`${BASE_URL}/analysis/${validUserId}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    // Dikkat: 'Content-Type': 'multipart/form-data' satırını fetch kullanırken el ile YAZMIYORUZ.
                    // Tarayıcı/React Native sınırları (boundary) kendisi otomatik doldurmalıdır, yoksa backend hata verir.
                },
            });

            if (response.ok) {
                // 3. 🎯 8 ADIMLI ZİNCİRİN SONUCU (AnalysisResultDto)
                const aiResultDto = await response.json();
                console.log("QA KONTROL - Pipeline Başarıyla Tamamlandı:", aiResultDto);

                Alert.alert(
                    "Analiz Tamamlandı ✨",
                    `Yapay zeka ve deterministik motor ürünü inceledi!\nGenel Skor: ${aiResultDto.overallScore}/100\nRisk: ${aiResultDto.riskLevel}`
                );

                // Başarılıysa analiz detay sayfasına DTO'dan gelen yapay zeka özetini (summary) pasla
                // router.push({ pathname: "/analysis_detail", params: { result: aiResultDto.summary, score: aiResultDto.overallScore } });
            } else {
                console.error("Backend hata kodu:", response.status);
                Alert.alert("Hata ❌", "Yapay zeka sunucusu içeriği analiz ederken bir iç hata yaşadı (500).");
            }
        } catch (error) {
            console.error("Resim analizi sırasında ağ hatası:", error);
            Alert.alert("Ağ Hatası ❌", "Backend sunucusuna bağlanılamadı. Bağlantınızı kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Üst Header Kısmı */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>GlowGuide AI Analiz</Text>
                <View style={styles.aiStatusCircle}>
                    <Ionicons name="sparkles" size={18} color="#5D4F8D" />
                </View>
            </View>

            {/* ANA İÇERİK ALANI */}
            <View style={styles.content}>

                {/* 1. F OTOĞRAF ÇEKME ALANI (Büyük Buton) */}
                <TouchableOpacity
                    style={[styles.cameraCard, loading && styles.disabledCard]}
                    onPress={openCamera}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#5D4F8D" />
                            <Text style={styles.loadingText}>Ürün İçeriği Analiz Ediliyor...</Text>
                        </View>
                    ) : selectedImage ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                            <View style={styles.reScanOverlay}>
                                <Ionicons name="camera-reverse" size={24} color="white" />
                                <Text style={styles.reScanText}>Yeniden Çek</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="camera-plus" size={40} color="#5D4F8D" />
                            </View>
                            <Text style={styles.cameraTitle}>İçindekiler Fotoğrafı Çek</Text>
                            <Text style={styles.cameraSubtitle}>
                                Ürünün arkasındaki "Ingredients" veya "İçindekiler" alanını net bir şekilde fotoğraflayın
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 2. GEÇMİŞ ANALİZLER CONTAINER'I (Yönlendirme Kartı) */}
                <TouchableOpacity
                    style={styles.historyContainer}
                   
                    onPress={() => router.push({ pathname: "/analysisHistory", params: { userId: userId } })}
                >
                    <View style={styles.historyLeft}>
                        <View style={styles.historyIconCircle}>
                            <Ionicons name="time" size={24} color="#FFF" />
                        </View>
                        <View style={styles.historyTextGroup}>
                            <Text style={styles.historyTitle}>Geçmiş Analizlerim</Text>
                            <Text style={styles.historySubtitle}>Daha önce okuttuğunuz ürünleri inceleyin</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#5D4F8D" />
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E1D7F2' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 15, paddingBottom: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    aiStatusCircle: { backgroundColor: '#FFF', padding: 8, borderRadius: 20, elevation: 3 },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'flex-start',
        paddingTop: 30,
        gap: 20                       // Bileşenler arası mesafe
    },

    // Kamera Kartı Stilleri
    cameraCard: {
        backgroundColor: '#FFF',
        borderRadius: 30,
        height: 300,
        elevation: 5,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#A594F1'
    },
    disabledCard: { opacity: 0.8, borderColor: '#5D4F8D' },
    uploadPlaceholder: { alignItems: 'center', paddingHorizontal: 30 },
    iconCircle: { backgroundColor: '#E1D7F2', padding: 20, borderRadius: 40, marginBottom: 15 },
    cameraTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
    cameraSubtitle: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 18 },

    // Resim Önizleme Stilleri
    previewContainer: { width: '100%', height: '100%', position: 'relative' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    reScanOverlay: { position: 'absolute', bottom: 15, right: 15, backgroundColor: 'rgba(93, 79, 141, 0.9)', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, alignItems: 'center', gap: 6 },
    reScanText: { color: 'white', fontSize: 12, fontWeight: '600' },

    // Yükleniyor Stilleri
    loadingContainer: { alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 15, color: '#5D4F8D', fontWeight: '600', fontStyle: 'italic' },

    // Geçmiş Container Stilleri
    historyContainer: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 15 },
    historyIconCircle: { backgroundColor: '#A594F1', padding: 12, borderRadius: 18 },
    historyTextGroup: { flex: 1 },
    historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    historySubtitle: { fontSize: 12, color: '#666', marginTop: 2 },

});