import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '@/context/WorkoutContext';
import { CATEGORIES } from '@/constants/default-exercises';
import { ExerciseDefinition, ExerciseType, MuscleCategory } from '@/types/workout';

export default function CategoriesScreen() {
  const { exercises, addNewCustomExercise, deleteCustomExercise } = useWorkout();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal for new category / exercise
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MuscleCategory>('Chest');
  const [newType, setNewType] = useState<ExerciseType>('strength');

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.category.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === 'All' || ex.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [exercises, search, selectedCategory]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await addNewCustomExercise(newName.trim(), newCategory, newType);
    setNewName('');
    setModalVisible(false);
    Alert.alert('Saved', `"${newName.trim()}" added to ${newCategory}! It will now appear in your logger dropdown.`);
  };

  const confirmDelete = (exercise: ExerciseDefinition) => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${exercise.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomExercise(exercise.id),
        },
      ]
    );
  };

  // Group exercises by category
  const groupedByCategory = useMemo(() => {
    const map: Record<string, ExerciseDefinition[]> = {};
    filteredExercises.forEach((ex) => {
      if (!map[ex.category]) map[ex.category] = [];
      map[ex.category].push(ex);
    });
    return map;
  }, [filteredExercises]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categories & Exercises</Text>
          <Text style={styles.headerSubtitle}>
            Manage exercises that appear in the log dropdown
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories & exercises..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryPillsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', ...CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, isSelected && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.catPillText,
                    isSelected && styles.catPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(groupedByCategory).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={40} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <TouchableOpacity
              style={styles.createNowBtn}
              onPress={() => {
                setNewName(search);
                setModalVisible(true);
              }}
            >
              <Text style={styles.createNowBtnText}>+ Add &quot;{search}&quot;</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(groupedByCategory).map(([catName, list]) => (
            <View key={catName} style={styles.categoryCard}>
              <View style={styles.catHeader}>
                <Text style={styles.catTitle}>{catName}</Text>
                <Text style={styles.catCount}>{list.length} exercises</Text>
              </View>

              {list.map((item) => (
                <View key={item.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseLeft}>
                    <Ionicons
                      name={item.type === 'cardio' ? 'walk' : 'barbell'}
                      size={18}
                      color="#0284c7"
                    />
                    <Text style={styles.exerciseName}>{item.name}</Text>
                  </View>

                  <View style={styles.exerciseRight}>
                    {item.isCustom ? (
                      <TouchableOpacity
                        onPress={() => confirmDelete(item)}
                        style={styles.deleteExBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.systemBadge}>Default</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add New Category/Exercise Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category / Exercise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Exercise Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Bench Press, Incline Press, 5K Run..."
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Category / Muscle Group</Text>
            <View style={styles.gridCategories}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    newCategory === cat && styles.catOptionActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catOptionText,
                      newCategory === cat && styles.catOptionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newType === 'strength' && styles.typeOptionActive,
                ]}
                onPress={() => setNewType('strength')}
              >
                <Ionicons
                  name="barbell"
                  size={16}
                  color={newType === 'strength' ? '#fff' : '#475569'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    newType === 'strength' && styles.typeOptionTextActive,
                  ]}
                >
                  Strength (Weights & Sets)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newType === 'cardio' && styles.typeOptionActive,
                ]}
                onPress={() => setNewType('cardio')}
              >
                <Ionicons
                  name="walk"
                  size={16}
                  color={newType === 'cardio' ? '#fff' : '#475569'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    newType === 'cardio' && styles.typeOptionTextActive,
                  ]}
                >
                  Cardio / Running
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  !newName.trim() && styles.modalSaveBtnDisabled,
                ]}
                disabled={!newName.trim()}
                onPress={handleCreate}
              >
                <Text style={styles.modalSaveText}>Save Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  categoryPillsWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: '#0284c7',
  },
  catPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  createNowBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createNowBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  catCount: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  exerciseRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteExBtn: {
    padding: 6,
  },
  systemBadge: {
    fontSize: 10,
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  gridCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catOptionActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  catOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  catOptionTextActive: {
    color: '#ffffff',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  typeOptionActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeOptionTextActive: {
    color: '#ffffff',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
