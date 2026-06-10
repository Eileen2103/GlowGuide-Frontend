import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  // --- 1. TÜM STATE'LER ---
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('HEPSİ');

  // Modal State'leri
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); // 🎯 Güncelleme Pop-up'ı kontrolü
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Takvim State'leri
  const [openedDate, setOpenedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form State'leri (Kayıt ve Güncelleme için ortak şema)
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    productType: '',
    category: 'Cilt',
    paoMonths: 12
  });

  // --- 2. YARDIMCI FONKSİYONLAR ---
  const formatDateToBackend = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const mapCategoryToEnum = (label: string) => {
    switch (label) {
      case 'Saç': return 'HAIR';
      case 'Makyaj': return 'MAKEUP';
      case 'Cilt': return 'SKIN';
      default: return 'SKIN';
    }
  };

  const mapEnumToCategoryLabel = (enumValue: string) => {
    switch (enumValue?.toUpperCase()) {
      case 'HAIR': return 'Saç';
      case 'MAKEUP': return 'Makyaj';
      case 'SKIN': return 'Cilt';
      default: return 'Cilt';
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchUserProducts();
    setRefreshing(false);
  }, []);

  // --- 3. API OPERASYONLARI (CRUD) ---

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/products/user/${userId}`);
      let data = [];

      if (response.ok && response.status !== 204) {
        const text = await response.text();
        data = text ? JSON.parse(text) : [];
      } else {
        data = [];
      }

      const finalData = Array.isArray(data) ? data : [];
      setProducts(finalData);
      setFilteredProducts(finalData);
      setSelectedCategory('HEPSİ'); // Listeyi tazelerken filtreyi sıfırla
    } catch (error) {
      console.error("Ürünler çekilirken hata oluştu:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, []);

  // 🎯 ÜRÜN SİLME API İSTEĞİ (Kritik QA Korumalı)
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    Alert.alert(
      "Ürünü Sil",
      `"${selectedProduct.name}" ürününü kalıcı olarak silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setIsModalVisible(false);
              setLoading(true);

              const response = await fetch(`${BASE_URL}/products/delete/${selectedProduct.id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                Alert.alert("Başarılı", "Ürün sistemden tamamen silindi.");
                fetchUserProducts(); // Listeyi yenile
              } else {
                Alert.alert("Hata", "Ürün silinirken backend hata verdi.");
              }
            } catch (error) {
              console.error("Silme hatası:", error);
              Alert.alert("Hata", "Sunucu bağlantı hatası.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 🎯 ÜRÜN GÜNCELLEME MODALINI HAZIRLAMA (Veri Doldurma)
  const openEditModal = () => {
    if (!selectedProduct) return;
    setIsModalVisible(false); // İşlem modalını kapat

    // Düzenlenecek ürünün verilerini form state'ine dolduruyoruz
    setNewProduct({
      name: selectedProduct.name,
      brand: selectedProduct.brand,
      productType: selectedProduct.productType || '',
      category: mapEnumToCategoryLabel(selectedProduct.category),
      paoMonths: selectedProduct.paoMonths || 12
    });

    // Açılış tarihini takvim nesnesine parslıyoruz
    if (selectedProduct.openedAt) {
      setOpenedDate(new Date(selectedProduct.openedAt));
    } else {
      setOpenedDate(new Date());
    }

    setIsEditModalVisible(true); // Güncelleme formunu aç
  };

  // 🎯 ÜRÜN GÜNCELLEME API İSTEĞİ
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    if (!newProduct.name.trim() || !newProduct.brand.trim()) {
      Alert.alert("Hata", "Lütfen yıldızlı alanları doldurun!");
      return;
    }

    const productData = {
      name: newProduct.name,
      brand: newProduct.brand,
      productType: newProduct.productType,
      category: mapCategoryToEnum(newProduct.category),
      openedAt: formatDateToBackend(openedDate),
      paoMonths: newProduct.paoMonths
    };

    try {
      setLoading(true);
      setIsEditModalVisible(false);

      const response = await fetch(`${BASE_URL}/products/update/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        Alert.alert("Başarılı 🎉", "Ürün bilgileri başarıyla güncellendi!");
        fetchUserProducts(); // Ekranı tazele
      } else {
        Alert.alert("Hata", "Güncelleme kaydedilemedi.");
      }
    } catch (error) {
      console.error("Güncelleme ağ hatası:", error);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.brand.trim()) {
      Alert.alert("Hata", "Lütfen yıldızlı alanları doldurun!");
      return;
    }

    const productData = {
      ...newProduct,
      openedAt: formatDateToBackend(openedDate),
      category: mapCategoryToEnum(newProduct.category),
      paoMonths: newProduct.paoMonths || 12
    };

    try {
      const response = await fetch(`${BASE_URL}/products/add/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Yeni ürünün GlowGuide'a eklendi! ✨");
        setIsAddModalVisible(false);
        setNewProduct({ name: '', brand: '', productType: '', category: 'Cilt', paoMonths: 12 });
        setOpenedDate(new Date());
        fetchUserProducts();
      } else {
        Alert.alert("Hata", "Ürün kaydedilemedi. Sunucu hatası.");
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı kurulamadı.");
    }
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    if (category === 'HEPSİ') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => p.category.toUpperCase() === category.toUpperCase());
      setFilteredProducts(filtered);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setOpenedDate(selectedDate);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ürünlerim 🧴</Text>
        <Text style={styles.headerSubtitle}>Kozmetik & bakım ürünlerin</Text>
      </View>

      {/* Kategori Filtreleri */}
      <View style={styles.categoryContainer}>
       {['HEPSİ', 'SKIN', 'HAIR', 'MAKEUP'].map((cat) => (
  <TouchableOpacity
    key={cat}
    style={[
      styles.categoryButton,
      selectedCategory === cat && styles.activeCategoryButton
    ]}
    onPress={() => handleCategoryPress(cat)}
  >
    <Text
      style={[
        styles.categoryButtonText,
        selectedCategory === cat && styles.activeCategoryButtonText
      ]}
    >
      {cat === 'SKIN' ? 'Cilt' : cat === 'HAIR' ? 'Saç' : cat === 'MAKEUP' ? 'Makyaj' : 'Hepsi'}
    </Text>
  </TouchableOpacity>
))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => {
        setNewProduct({ name: '', brand: '', productType: '', category: 'Cilt', paoMonths: 12 });
        setOpenedDate(new Date());
        setIsAddModalVisible(true);
      }}>
        <Ionicons name="add-circle" size={24} color="#FFF" />
        <Text style={styles.addButtonText}>Yeni Ürün Ekle</Text>
      </TouchableOpacity>
      

      <FlatList
        data={filteredProducts}
        refreshing={refreshing}
        onRefresh={onRefresh}
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
                  <Text style={styles.dateText}>
                    {" "}Açılış: {item.openedAt ? new Date(item.openedAt).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </Text>
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

      {/* MODAL: ÜRÜN İŞLEM SEÇENEKLERİ */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.modalSubtitle}>{selectedProduct?.brand}</Text>

            {/* 🎯 Tıklanınca Güncelleme Formunu Açar */}
            <TouchableOpacity style={styles.modalButton} onPress={openEditModal}>
              <Ionicons name="pencil-sharp" size={20} color="#5D4F8D" />
              <Text style={styles.modalButtonText}>Ürünü Güncelle</Text>
            </TouchableOpacity>

            {/* 🎯 Tıklanınca Güvenli Silme Fonksiyonunu Tetikler */}
            <TouchableOpacity style={styles.modalButton} onPress={handleDeleteProduct}>
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
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>Yeni Ürün Kaydı</Text>

            <TextInput
              style={styles.input}
              placeholder="Ürün Adı *"
              value={newProduct.name}
              onChangeText={(txt) => setNewProduct({ ...newProduct, name: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Marka *"
              value={newProduct.brand}
              onChangeText={(txt) => setNewProduct({ ...newProduct, brand: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Ürün Tipi (Örn: Serum)"
              value={newProduct.productType}
              onChangeText={(txt) => setNewProduct({ ...newProduct, productType: txt })}
            />

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
                  value={newProduct.paoMonths.toString()}
                  onChangeText={(txt) => setNewProduct({ ...newProduct, paoMonths: parseInt(txt) || 12 })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Açılış Tarihi</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => setOpenedDate(new Date())}>
                    <Text style={styles.quickDateText}>Bugün</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setOpenedDate(yesterday);
                  }}>
                    <Text style={styles.quickDateText}>Dün</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.datePickerSelector} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.datePickerSelectorText}>{openedDate.toLocaleDateString('tr-TR')} 📅</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker value={openedDate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🎯 YENİ EKLENEN MODAL: ÜRÜN GÜNCELLEME FORMU */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>Ürün Bilgilerini Güncelle 📝</Text>

            <TextInput
              style={styles.input}
              placeholder="Ürün Adı *"
              value={newProduct.name}
              onChangeText={(txt) => setNewProduct({ ...newProduct, name: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Marka *"
              value={newProduct.brand}
              onChangeText={(txt) => setNewProduct({ ...newProduct, brand: txt })}
            />
            <TextInput
              style={styles.input}
              placeholder="Ürün Tipi"
              value={newProduct.productType}
              onChangeText={(txt) => setNewProduct({ ...newProduct, productType: txt })}
            />

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
                  keyboardType="numeric"
                  value={newProduct.paoMonths.toString()}
                  onChangeText={(txt) => setNewProduct({ ...newProduct, paoMonths: parseInt(txt) || 12 })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Açılış Tarihi</Text>
                <TouchableOpacity style={[styles.datePickerSelector, { marginTop: 33 }]} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.datePickerSelectorText}>{openedDate.toLocaleDateString('tr-TR')} 📅</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker value={openedDate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProduct}>
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ... Stillerin (styles) hepsi senin yazdığın haliyle aynı kalıyor, ekleme yapmaya gerek yok!
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FB',
    paddingTop: 20
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    marginLeft:10
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 6,
  letterSpacing: 0.2
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15
  },

  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEEAF7',
    marginRight: 8
  },

  activeCategoryButton: {
    backgroundColor: '#6C5CE7'
  },

  categoryButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600'
  },

  activeCategoryButtonText: {
    color: '#FFF'
  },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textContainer: { marginLeft: 15, flex: 1 },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    flexShrink: 1
  },
  brandText: { fontSize: 13, color: '#666', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', marginLeft: 10, minWidth: 70 },
  scoreText: { fontSize: 14, fontWeight: '600', color: '#6C5CE7' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dateText: { fontSize: 13, color: '#888' },
  addButton: { backgroundColor: '#6C5CE7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginHorizontal: 20, borderRadius: 15, marginBottom: 15 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, width: '100%', alignItems: 'center' },
  modalHeaderIndicator: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  modalButton: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 15 },
  closeButton: { marginTop: 20, padding: 10 },
  closeButtonText: { color: '#999', fontSize: 16, fontWeight: 'bold' },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#555', alignSelf: 'flex-start', marginBottom: 8, marginTop: 10 },
  input: { width: '100%', backgroundColor: '#F7F7F7', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  rowInput: { flexDirection: 'row', width: '100%' },
  categoryPickerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  pickerButton: { flex: 1, paddingVertical: 10, backgroundColor: '#F0F0F0', borderRadius: 10, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  pickerButtonActive: { backgroundColor: '#5D4F8D', borderColor: '#5D4F8D' },
  pickerButtonText: { fontSize: 13, color: '#666', fontWeight: '600' },
  pickerButtonTextActive: { color: '#FFF' },
  saveButton: { backgroundColor: '#5D4F8D', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelText: { color: '#999', fontWeight: '600' },
  quickDateButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F0F0F0', borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  quickDateText: { fontSize: 11, color: '#666', fontWeight: '600' },
  datePickerSelector: { backgroundColor: '#F7F7F7', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center', height: 48, width: '100%' },
  datePickerSelectorText: { fontSize: 14, color: '#333', fontWeight: '600' },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#6C5CE7',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  }
});