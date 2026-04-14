import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert // Hata aldığın Alert burada eklendi
  ,



  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BASE_URL } from '../../service/apiConfig';

interface Product {
  id: number;
  name: string;
  brand: string;
  productType: string;
  openedAt: string;
  safetyScore: number;
  category: string;
  paoMonths?: number;
}

export default function ProductsScreen() {
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const userId = localParams.userId || globalParams.userId || '1';

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('HEPSİ');

  // Modal State'leri
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Yeni Ürün Kaydı State (Picker için category Türkçe başlatıldı)
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    productType: '',
    category: 'Cilt', 
    openedAt: new Date().toISOString().split('T')[0],
    paoMonths: 12
  });

  const mapCategoryToEnum = (label: string) => {
    switch (label) {
      case 'Saç': return 'HAIR';
      case 'Makyaj': return 'MAKEUP';
      case 'Cilt': return 'SKIN';
      default: return 'SKIN';
    }
  };

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/products/user/${userId}`);
      const data = await response.json();
      console.log("Çekilen Ürünler:", data);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Ürünler çekilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, []);

  const handleCategoryPress = (category: string) => {
  setSelectedCategory(category);
  if (category === 'HEPSİ') {
    setFilteredProducts(products);
  } else {
    // Backend'den gelen 'SKIN' ile senin 'SKIN' karşılaştırmanı yapıyoruz
    const filtered = products.filter(p => p.category.toUpperCase() === category.toUpperCase());
    setFilteredProducts(filtered);
  }
};

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.brand) {
      Alert.alert("Hata", "Lütfen ürün adı ve markasını doldurun.");
      return;
    }

    const productData = {
      ...newProduct,
      category: mapCategoryToEnum(newProduct.category),
      paoMonths: newProduct.paoMonths || 12
    };

    try {
      const response = await fetch(`${BASE_URL}/api/products/add/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Yeni ürünün GlowGuide'a eklendi! ✨");
        setIsAddModalVisible(false);
        fetchUserProducts();
      } else {
        const errorMsg = await response.text();
        Alert.alert("Hata", errorMsg || "Sunucu hatası oluştu.");
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı kurulamadı.");
    }
  };

  const calculateExpiryDate = (openedAt: string, paoMonths: number) => {
    if (!openedAt || !paoMonths) return 'Hesaplanamadı';
    const date = new Date(openedAt);
    date.setMonth(date.getMonth() + paoMonths);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCardColor = (category: string | null) => {
    if (!category) return '#F7F7F7';
    switch (category.toUpperCase()) {
      case 'SKIN': return '#FFF0F0';
      case 'HAIR': return '#F0F9FF';
      case 'MAKEUP': return '#FFF9E6';
      default: return '#F7F7F7';
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6C5CE7" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Ürünlerim</Text>

      {/* Kategori Filtreleri */}
      <View style={styles.categoryContainer}>
        {['HEPSİ', 'SKIN', 'HAIR', 'MAKEUP'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, selectedCategory === cat && styles.activeCategoryButton]}
            onPress={() => handleCategoryPress(cat)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === cat && styles.activeCategoryButtonText]}>
              {cat === 'SKIN' ? 'Cilt' : cat === 'HAIR' ? 'Saç' : cat === 'MAKEUP' ? 'Makyaj' : 'Hepsi'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>Yeni Ürün Ekle</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: getCardColor(item.category) }]}>
            <View style={styles.cardLeft}>
              <MaterialCommunityIcons name="bottle-tonic-outline" size={30} color="#555" />
              <View style={styles.textContainer}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.brandText}>Marka: {item.brand}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color="#888" />
                  <Text style={styles.dateText}> Açılış: {item.openedAt}</Text>
                </View>
                {item.paoMonths && (
                  <View style={styles.dateRow}>
                    <Ionicons name="alert-circle-outline" size={12} color="#D32F2F" />
                    <Text style={[styles.dateText, { color: '#D32F2F', fontWeight: '600' }]}>
                      {" "}S.K.T: {calculateExpiryDate(item.openedAt, item.paoMonths)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.scoreText}>Puan: {item.safetyScore}</Text>
              <TouchableOpacity onPress={() => { setSelectedProduct(item); setIsModalVisible(true); }} style={{ padding: 5 }}>
                <Ionicons name="ellipsis-horizontal" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Bu kategoride ürün bulunamadı.</Text>}
      />

      {/* MODAL: ÜRÜN İŞLEM */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.modalSubtitle}>{selectedProduct?.brand}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsModalVisible(false)}>
              <Ionicons name="pencil-sharp" size={20} color="#5D4F8D" />
              <Text style={styles.modalButtonText}>Ürünü Güncelle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsModalVisible(false)}>
              <Ionicons name="trash-outline" size={20} color="#FF5252" />
              <Text style={[styles.modalButtonText, { color: '#FF5252' }]}>Ürünü Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: YENİ ÜRÜN KAYDI */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>Yeni Ürün Kaydı</Text>

            <TextInput
              style={styles.input}
              placeholder="Ürün Adı *"
              onChangeText={(txt) => setNewProduct({ ...newProduct, name: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Marka *"
              onChangeText={(txt) => setNewProduct({ ...newProduct, brand: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Ürün Tipi (Örn: Serum)"
              onChangeText={(txt) => setNewProduct({ ...newProduct, productType: txt })}
            />

            {/* KATEGORİ SEÇİCİ (PICKER) */}
            <Text style={styles.formLabel}>Kategori Seçiniz:</Text>
            <View style={styles.categoryPickerRow}>
              {['Cilt', 'Saç', 'Makyaj'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerButton, newProduct.category === cat && styles.pickerButtonActive]}
                  onPress={() => setNewProduct({ ...newProduct, category: cat })}
                >
                  <Text style={[styles.pickerButtonText, newProduct.category === cat && styles.pickerButtonTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rowInput}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.formLabel}>PAO (Ay) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  keyboardType="numeric"
                  onChangeText={(txt) => setNewProduct({ ...newProduct, paoMonths: parseInt(txt) || 12 })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Açılış Tarihi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={newProduct.openedAt}
                  onChangeText={(txt) => setNewProduct({ ...newProduct, openedAt: txt })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>Sisteme Kaydet</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={{marginTop: 15}}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  categoryContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  activeCategoryButton: { backgroundColor: '#5D4F8D' },
  categoryButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeCategoryButtonText: { color: '#FFF' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1, // Bu çok önemli! Soldaki alanın büyümesini sağlar.
},
textContainer: {
  marginLeft: 15,
  flex: 1, // Yazıların sığmadığında alt satıra geçmesi veya alanı kaplaması için şart.
},
productName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  flexShrink: 1, // Uzun isimlerin puanın üstüne binmesini engeller.
},
  brandText: { fontSize: 13, color: '#666', marginTop: 2 },
  cardRight: {
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginLeft: 10,
  minWidth: 70, // Puan ve buton için sabit bir alan ayıralım.
},
  scoreText: { fontSize: 14, fontWeight: '600', color: '#6C5CE7' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dateText: { fontSize: 13, color: '#888' },
  addButton: { backgroundColor: '#6C5CE7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginHorizontal: 20, borderRadius: 15, marginBottom: 15 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, alignItems: 'center' },
  modalHeaderIndicator: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  modalButton: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 15 },
  closeButton: { marginTop: 20, padding: 10 },
  closeButtonText: { color: '#999', fontSize: 16, fontWeight: 'bold' },

  // Form Styles
  formLabel: { fontSize: 14, fontWeight: '600', color: '#555', alignSelf: 'flex-start', marginBottom: 8, marginTop: 10 },
  input: { width: '100%', backgroundColor: '#F7F7F7', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  rowInput: { flexDirection: 'row', width: '100%' },
  categoryPickerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  pickerButton: { flex: 1, paddingVertical: 10, backgroundColor: '#F0F0F0', borderRadius: 10, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  pickerButtonActive: { backgroundColor: '#5D4F8D', borderColor: '#5D4F8D' },
  pickerButtonText: { fontSize: 13, color: '#666', fontWeight: '600' },
  pickerButtonTextActive: { color: '#FFF' },
  saveButton: { backgroundColor: '#5D4F8D', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelText: { color: '#999', fontWeight: '600' }
});