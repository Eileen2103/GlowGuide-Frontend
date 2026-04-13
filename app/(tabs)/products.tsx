import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../service/apiConfig';


interface Product {
  id: number;
  name: string;
  brand: string;
  productType: string; 
  openedAt: string;   
  safetyScore: number; 
  category: string;
}

export default function ProductsScreen() {
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const userId = localParams.userId || globalParams.userId || '1';
  
  console.log("Products sayfasında yakalanan ID:", userId);

  const [products, setProducts] = useState<Product[]>([]); // Orijinal liste
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Ekranda görünen liste
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('HEPSİ');

  const fetchUserProducts = async () => {
    try {
      // URL'ye /api/ eklendi
      const response = await fetch(`${BASE_URL}/products/user/${userId}`);
      const data = await response.json();
      
      console.log("Gelen Veriler:", data); 
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

  // Filtreleme mantığı
  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    if (category === 'HEPSİ') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => p.category === category);
      setFilteredProducts(filtered);
    }
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

      {/* Kategori Butonları */}
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
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === cat && styles.activeCategoryButtonText
            ]}>
              {cat === 'SKIN' ? 'Cilt' : cat === 'HAIR' ? 'Saç' : cat === 'MAKEUP' ? 'Makyaj' : 'Hepsi'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
                <Text style={styles.dateText}>Açılış: {item.openedAt || 'Tarih Yok'}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.scoreText}>Puan: {item.safetyScore}</Text>
              <Ionicons name="ellipsis-horizontal" size={20} color="black" />
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
            Bu kategoride ürün bulunamadı.
          </Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333'
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeCategoryButton: {
    backgroundColor: '#5D4F8D',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeCategoryButtonText: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  textContainer: {
    marginLeft: 15
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  brandText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C5CE7'
  }
});